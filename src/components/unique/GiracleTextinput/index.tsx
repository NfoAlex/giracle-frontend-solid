import { history, redo, undo } from "prosemirror-history";
import {
  EditorState,
  TextSelection,
  type Transaction,
} from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { api } from "~/api/index.ts";
import type { IUser } from "~/types/User.ts";
import MentionMenu from "./MentionMenu.tsx";
import {
  createEmptyDoc,
  getMentionQuery,
  getMessageText,
  pmSchema,
  withMentionSpacer,
} from "./pmSchema.ts";
import { urlUnderlinePlugin } from "./pmUrlUnderline.ts";

export interface IGiracleTextinputHandle {
  /** getMessageText 相当の送信文字列(@名前 → @<user-id> 変換済み) */
  getText(): string;
  /** エディタ本文クリア + mentionState リセット */
  clear(): void;
  focus(): void;
}

interface IMentionState {
  isEnabled: boolean;
  query: string;
  users: IUser[];
  selectIndex: number;
  /** 候補を検索した時点の channelId(切替検出用) */
  channelId: string | undefined;
  /** debounce 検索が未完了の間 true(Enter の誤送信防止) */
  isSearching: boolean;
}

const EMPTY_MENTION_STATE: IMentionState = {
  isEnabled: false,
  query: "",
  users: [],
  selectIndex: 0,
  channelId: undefined,
  isSearching: false,
};

/** DataTransfer から書式を落としたテキストだけを取り出す */
function plainTextFrom(dt: DataTransfer): string {
  let text = dt.getData("text/plain") || dt.getData("text/uri-list");
  // text/plain を持たないデータソース向けに text/html から
  // テキストのみ取り出す(書式・要素は落とす)
  if (text === "") {
    const html = dt.getData("text/html");
    if (html !== "") {
      text =
        new DOMParser().parseFromString(html, "text/html").body.textContent ??
        "";
    }
  }
  return text;
}

export default function GiracleTextinput(props: {
  channelId?: string;
  displayMentionAtBottom?: boolean;
  onEnter?: (text: string) => void;
  /** クリップボードからのファイル添付を親へ渡す(未指定なら無視) */
  onPasteFiles?: (files: File[]) => void;
  /** true を返す間、Enter 送信に Ctrl キーを要求する */
  sendWithCtrlKey?: () => boolean;
  /** true を返す間、本文空でも Enter を onEnter へ流す(ファイル添付時の空本文送信用) */
  canSendEmpty?: () => boolean;
  /** onMount 時にハンドルを渡す(送信ボタン等、親から本文取得/クリアする用) */
  ref?: (handle: IGiracleTextinputHandle) => void;
}) {
  let view: EditorView | undefined;
  let editorRoot: HTMLDivElement | undefined;
  let searchTimer: ReturnType<typeof setTimeout> | undefined;
  let watchdogTimer: ReturnType<typeof setTimeout> | undefined;

  const [mentionState, setMentionState] =
    createSignal<IMentionState>(EMPTY_MENTION_STATE);

  // チャンネルを跨いだ古い候補が残らないよう、切替時に即座に閉じる
  createEffect(() => {
    void props.channelId;
    setMentionState(EMPTY_MENTION_STATE);
  });

  const menuItems = createMemo(() =>
    mentionState().users.map((u) => ({
      id: u.id,
      name: u.name,
      iconUrl: `/api/user/icon/${encodeURIComponent(u.id)}`,
    })),
  );

  // 入力毎のAPI発火を避けるため200msでdebounceする
  const searchUser = (query: string, channelId: string | undefined) => {
    clearTimeout(searchTimer);
    clearTimeout(watchdogTimer);
    searchTimer = setTimeout(() => {
      // 切替後の channelId と異なる = 古いチャンネル向けの検索なので破棄
      if (props.channelId !== channelId) return;
      // 応答が永遠に来ない場合に Enter を復帰させる安全弁。
      // ハンドルはリクエスト毎に分離し、共有変数は最新分だけ保持する
      const wid = setTimeout(() => {
        const current = mentionState();
        if (
          current.query === query &&
          current.channelId === channelId &&
          current.isSearching
        ) {
          setMentionState({ ...current, isSearching: false });
        }
      }, 3000);
      watchdogTimer = wid;
      api.user
        .list({ username: query, joinedChannel: channelId })
        .then((r) => {
          clearTimeout(wid);
          if (watchdogTimer === wid) watchdogTimer = undefined;
          // 古いクエリ・古いチャンネル向けの応答で新しい結果を上書きしない
          const current = mentionState();
          if (current.query !== query || current.channelId !== channelId)
            return;
          setMentionState({
            ...current,
            users: r.data,
            selectIndex: 0,
            isSearching: false,
          });
        })
        .catch((e) => {
          clearTimeout(wid);
          if (watchdogTimer === wid) watchdogTimer = undefined;
          console.error("MENTION_USER_SEARCH :: e->", e);
          // 失敗時も isSearching を戻さないと Enter が握りつぶされ続ける
          const current = mentionState();
          if (current.query === query && current.channelId === channelId) {
            setMentionState({ ...current, isSearching: false });
          }
        });
    }, 200);
  };

  /** カーソル直前の未確定 `@query` をメニュー状態へ反映する */
  const syncMentionState = (state: EditorState) => {
    const found = getMentionQuery(state);
    const prev = mentionState();
    if (!found) {
      if (prev.isEnabled) setMentionState(EMPTY_MENTION_STATE);
      return;
    }
    const channelId = props.channelId;
    // 同じクエリかつ同一チャンネルなら検索結果や選択位置をそのまま維持する
    if (
      prev.isEnabled &&
      prev.query === found.query &&
      prev.channelId === channelId
    )
      return;
    setMentionState({
      isEnabled: true,
      query: found.query,
      users: [],
      selectIndex: 0,
      channelId,
      isSearching: true,
    });
    searchUser(found.query, channelId);
  };

  const dispatchTransaction = (tr: Transaction) => {
    if (!view) return;
    // IME 変換中にテキストノードを分割すると変換が壊れるため、スペーサー挿入は
    // 変換終了後の transaction に任せる
    const next = view.state.apply(view.composing ? tr : withMentionSpacer(tr));
    view.updateState(next);
    syncMentionState(next);
  };

  /** 本文を空段落へ置換する */
  const clearDoc = (v: EditorView) => {
    const tr = v.state.tr.replaceWith(
      0,
      v.state.doc.content.size,
      pmSchema.node("paragraph"),
    );
    tr.setSelection(TextSelection.create(tr.doc, 1));
    v.dispatch(tr);
    setMentionState(EMPTY_MENTION_STATE);
  };

  /** カーソル直前の `@query` を mention ノード + 空白へ置換する */
  const insertMention = (user: IUser) => {
    if (!view || view.composing) return;
    const found = getMentionQuery(view.state);
    if (!found) return;
    const mention = pmSchema.nodes.mention.create({
      userId: user.id,
      name: user.name,
    });
    const tr = view.state.tr.replaceWith(found.from, found.to, [
      mention,
      pmSchema.text(" "),
    ]);
    tr.setSelection(TextSelection.create(tr.doc, found.from + 2));
    view.dispatch(tr);
    setMentionState(EMPTY_MENTION_STATE);
  };

  /** Shift+Enter: 段落を分割して改行する */
  const splitParagraph = (v: EditorView): boolean => {
    const { state } = v;
    const { $from } = state.selection;
    if (!state.selection.empty || !$from.parent.isTextblock) return false;
    v.dispatch(state.tr.split($from.pos));
    return true;
  };

  const handleKeyDown = (v: EditorView, event: KeyboardEvent): boolean => {
    // IME 変換中のキーは一切横取りしない(変換確定 Enter の誤送信・誤挿入防止)
    if (v.composing) return false;
    const current = mentionState();

    if (event.key === "Enter") {
      // メニュー確定が最優先。未消費の Enter だけが送信へ流れる
      if (current.isEnabled) {
        const user = current.users[current.selectIndex];
        if (user) {
          event.preventDefault();
          insertMention(user);
          return true;
        }
        // debounce 検索が未完了の間は、確定も送信もせず Enter を消費する
        if (current.isSearching) {
          event.preventDefault();
          return true;
        }
        // 候補0件で検索も完了 → 未確定の @query を本文として送信へ流す。
        // ここで false を返すと PM が Enter を preventDefault して無反応になる
      }
      // 改行: Shift+Enter / onEnter 未指定 / Ctrl 送信モードでの素の Enter
      if (event.shiftKey || !props.onEnter) return splitParagraph(v);
      if (props.sendWithCtrlKey?.() && !event.ctrlKey) return splitParagraph(v);
      const text = getMessageText(v.state.doc);
      event.preventDefault();
      // 空行(空白のみ含む)の Enter は何もしない。改行も入れない
      // canSendEmpty が true ならファイル添付のみの送信を許可する
      if (text.trim() === "" && !props.canSendEmpty?.()) return true;
      props.onEnter(text);
      // 送信後のクリア。ChannelTextInput の sendMsg と同じく送信成否に依らず
      // 無条件に消す(API 失敗時の復元は親の責任とする)
      clearDoc(v);
      return true;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      // 未処理なら false を返し、親の ArrowUp 編集ショートカットへ流す
      if (!current.isEnabled || current.users.length === 0) return false;
      event.preventDefault();
      const next =
        event.key === "ArrowDown"
          ? Math.min(current.selectIndex + 1, current.users.length - 1)
          : Math.max(current.selectIndex - 1, 0);
      setMentionState({ ...current, selectIndex: next });
      return true;
    }

    if (event.key === "Escape") {
      if (!current.isEnabled) return false;
      event.preventDefault();
      setMentionState(EMPTY_MENTION_STATE);
      return true;
    }

    // メンション直後の半角空白にカーソルがあるとき、空白だけ消えて「何も起きない」
    // ように見えるため、メンションごと 1 回で削除する
    if (event.key === "Backspace" && v.state.selection.empty) {
      const $from = v.state.selection.$from;
      const parent = $from.parent;
      const index = $from.index();
      const before = index > 0 ? parent.child(index - 1) : null;
      const beforeMention = index > 1 ? parent.child(index - 2) : null;
      if (
        before?.isText &&
        before.text !== undefined &&
        before.text.length > 0 &&
        before.text.trim() === "" &&
        beforeMention?.type === pmSchema.nodes.mention
      ) {
        event.preventDefault();
        v.dispatch(
          v.state.tr.delete(
            $from.pos - before.nodeSize - beforeMention.nodeSize,
            $from.pos,
          ),
        );
        return true;
      }
    }

    if (event.ctrlKey || event.metaKey) {
      const key = event.key.toLowerCase();
      if (key === "z") {
        event.preventDefault();
        const action = event.shiftKey ? redo : undo;
        return action(v.state, (tr) => v.dispatch(tr));
      }
      if (key === "y") {
        event.preventDefault();
        return redo(v.state, (tr) => v.dispatch(tr));
      }
    }
    return false;
  };

  onMount(() => {
    if (!editorRoot) return;
    view = new EditorView(editorRoot, {
      state: EditorState.create({
        doc: createEmptyDoc(),
        schema: pmSchema,
        plugins: [history(), urlUnderlinePlugin()],
      }),
      dispatchTransaction,
      // 親(ChannelContents / EditMessage)は id で textContent 参照・focus する
      attributes: {
        id: "messageInput",
        class:
          "min-h-10 max-h-40 overflow-y-auto p-2 bg-background border rounded-md",
      },
      handleKeyDown,
      handleDOMEvents: {
        // PM 既定は text/html を優先し、<br> を段落内の改行文字に、<li> を区切り無しの
        // 連結にしてしまう(表示と送信文字列が食い違う)。旧実装同様 plain text 固定にする
        paste: (v, event) => {
          const dt =
            event instanceof ClipboardEvent ? event.clipboardData : null;
          if (!dt) return false;
          event.preventDefault();
          if (dt.files.length > 0) props.onPasteFiles?.([...dt.files]);
          const text = plainTextFrom(dt);
          if (text !== "") v.dispatch(v.state.tr.insertText(text));
          return true;
        },
      },
    });
    props.ref?.({
      getText: () => (view ? getMessageText(view.state.doc) : ""),
      clear: () => {
        if (view) clearDoc(view);
      },
      focus: () => view?.focus(),
    });
  });

  onCleanup(() => {
    clearTimeout(searchTimer);
    clearTimeout(watchdogTimer);
    view?.destroy();
  });

  return (
    <div class="w-full relative">
      <div ref={editorRoot} />
      <Show when={mentionState().isEnabled}>
        <MentionMenu
          items={menuItems()}
          selectIndex={mentionState().selectIndex}
          onSelect={(item) => {
            const user = mentionState().users.find((u) => u.id === item.id);
            if (user) insertMention(user);
          }}
          displayBottom={props.displayMentionAtBottom}
        />
      </Show>
    </div>
  );
}
