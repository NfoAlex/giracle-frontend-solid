import { baseKeymap } from "prosemirror-commands";
import { history, redo, undo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
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
import MentionMenu from "./MentionMenu.tsx";
import {
  createEmptyDoc,
  getMessageText,
  getTriggerQuery,
  pmSchema,
} from "./pmSchema.ts";
import { urlUnderlinePlugin } from "./pmUrlUnderline.ts";
import {
  channelMenuItem,
  insertChannelMention,
  searchChannels,
} from "./suggestions/channel.ts";
import {
  candidateCount,
  EMPTY_SUGGESTION_STATE,
  type ISearchContext,
  type ISuggestionState,
} from "./suggestions/common.ts";
import {
  emojiMenuItem,
  insertEmoji,
  searchEmojiCodes,
} from "./suggestions/emoji.ts";
import {
  createUserSearch,
  insertUserMention,
  userMenuItem,
} from "./suggestions/user.ts";

export interface IGiracleTextinputHandle {
  /** getMessageText 相当の送信文字列(@名前 → @<user-id> 変換済み) */
  getText(): string;
  /** エディタ本文クリア + suggestionState リセット */
  clear(): void;
  focus(): void;
}

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

  const [suggestionState, setSuggestionState] =
    createSignal<ISuggestionState>(EMPTY_SUGGESTION_STATE);

  // チャンネルを跨いだ古い候補が残らないよう、切替時に即座に閉じる
  createEffect(() => {
    void props.channelId;
    setSuggestionState(EMPTY_SUGGESTION_STATE);
  });

  const menuItems = createMemo(() => {
    const current = suggestionState();
    if (current.kind === "channel")
      return current.channels.map(channelMenuItem);
    if (current.kind === "emoji") return current.emojiCodes.map(emojiMenuItem);
    return current.users.map(userMenuItem);
  });

  /** ドメイン検索が結果を反映する口。古い結果・切替後の結果はここで捨てる */
  const searchContext: ISearchContext = {
    channelId: () => props.channelId,
    apply: (kind, query, patch) => {
      const current = suggestionState();
      if (
        !current.isEnabled ||
        current.kind !== kind ||
        current.query !== query ||
        current.channelId !== props.channelId
      )
        return;
      setSuggestionState({ ...current, ...patch });
    },
  };

  // debounce/watchdog のタイマーはインスタンスごとに持つ
  const userSearch = createUserSearch(searchContext);

  /** カーソル直前の未確定トリガーをメニュー状態へ反映する */
  const syncSuggestionState = (state: EditorState) => {
    const found = getTriggerQuery(state);
    const prev = suggestionState();
    if (!found) {
      if (prev.isEnabled) setSuggestionState(EMPTY_SUGGESTION_STATE);
      return;
    }
    const channelId = props.channelId;
    // 同じトリガー・同じクエリかつ同一チャンネルなら検索結果や選択位置を維持する
    if (
      prev.isEnabled &&
      prev.kind === found.kind &&
      prev.query === found.query &&
      prev.channelId === channelId
    )
      return;
    setSuggestionState({
      isEnabled: true,
      kind: found.kind,
      query: found.query,
      users: [],
      channels: [],
      emojiCodes: [],
      selectIndex: 0,
      channelId,
      // 非同期検索が走るのは user だけ(Enter 消費の判定に使う)
      isSearching: found.kind === "user",
    });
    if (found.kind === "user") userSearch.search(found.query, channelId);
    else if (found.kind === "channel")
      searchChannels(found.query, searchContext);
    else searchEmojiCodes(found.query, searchContext);
  };

  const dispatchTransaction = (tr: Transaction) => {
    if (!view) return;
    const applied = view.state.apply(tr);
    // IME 変換中はテキストノードを触らず、変換を壊さない
    const next = applied;
    view.updateState(next);
    syncSuggestionState(next);
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
    setSuggestionState(EMPTY_SUGGESTION_STATE);
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
    const current = suggestionState();

    if (event.key === "Enter") {
      // メニュー確定が最優先。未消費の Enter だけが送信へ流れる
      if (current.isEnabled) {
        const index = current.selectIndex;
        let inserted = false;
        if (current.kind === "user") {
          const user = current.users[index];
          if (user) {
            insertUserMention(v, user);
            inserted = true;
          }
        } else if (current.kind === "channel") {
          const channel = current.channels[index];
          if (channel) {
            insertChannelMention(v, channel);
            inserted = true;
          }
        } else if (current.kind === "emoji") {
          const code = current.emojiCodes[index];
          if (code) {
            insertEmoji(v, code);
            inserted = true;
          }
        }
        if (inserted) {
          event.preventDefault();
          setSuggestionState(EMPTY_SUGGESTION_STATE);
          return true;
        }
        // user の debounce 検索が未完了の間は、確定も送信もせず Enter を消費する。
        // channel/emoji は同期候補のみなので候補0件はそのまま送信へ流す
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
      const count = candidateCount(current);
      if (!current.isEnabled || count === 0) return false;
      event.preventDefault();
      const next =
        event.key === "ArrowDown"
          ? Math.min(current.selectIndex + 1, count - 1)
          : Math.max(current.selectIndex - 1, 0);
      setSuggestionState({ ...current, selectIndex: next });
      return true;
    }

    if (event.key === "Escape") {
      if (!current.isEnabled) return false;
      event.preventDefault();
      setSuggestionState(EMPTY_SUGGESTION_STATE);
      return true;
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
        plugins: [history(), keymap(baseKeymap), urlUnderlinePlugin()],
      }),
      dispatchTransaction,
      // 親(ChannelContents / EditMessage)は id で textContent 参照・focus する
      attributes: {
        id: "messageInput",
        class:
          "min-h-10 max-h-40 overflow-y-auto p-2 bg-background border rounded-md whitespace-pre-wrap",
      },
      handleKeyDown,
      // PM 既定のテキスト化は atom を空文字にするため、コピーしたチップが
      // 消える。移行前(Lexical)同様、名前でコピーする
      clipboardTextSerializer: (slice) =>
        slice.content.textBetween(0, slice.content.size, "\n", (node) => {
          if (node.type === pmSchema.nodes.mention)
            return `@${node.attrs.name}`;
          if (node.type === pmSchema.nodes.channelMention)
            return `#${node.attrs.name}`;
          return "";
        }),
      handleDOMEvents: {
        // PM 既定は text/html を優先し、<br> を段落内の改行文字、<li> を区切り無しの
        // 連結にしてしまう(表示と送信文字列が食い違う)。メンションを含まない HTML は
        // 旧実装同様 plain text 固定にする
        paste: (v, event) => {
          const clipboardData =
            event instanceof ClipboardEvent ? event.clipboardData : null;
          if (!clipboardData) return false;
          if (clipboardData.files.length > 0) props.onPasteFiles?.([...clipboardData.files]);
          // 自前のチップ入り HTML だけは PM に解釈させる(parseDOM でチップへ戻る)
          const html = clipboardData.getData("text/html");
          if (
            html.includes("data-mention-user-id") ||
            html.includes("data-channel-id")
          )
            return false;
          event.preventDefault();
          const text = plainTextFrom(clipboardData);
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
    userSearch.dispose();
    view?.destroy();
  });

  return (
    <div class="w-full relative">
      <div ref={editorRoot} />
      <Show when={suggestionState().isEnabled}>
        <MentionMenu
          items={menuItems()}
          selectIndex={suggestionState().selectIndex}
          onSelect={(item) => {
            if (!view) return;
            const current = suggestionState();
            if (current.kind === "channel") {
              const channel = current.channels.find((c) => c.id === item.id);
              if (channel) insertChannelMention(view, channel);
            } else if (current.kind === "emoji") {
              insertEmoji(view, item.id);
            } else {
              const user = current.users.find((u) => u.id === item.id);
              if (user) insertUserMention(view, user);
            }
            setSuggestionState(EMPTY_SUGGESTION_STATE);
          }}
          displayBottom={props.displayMentionAtBottom}
        />
      </Show>
    </div>
  );
}
