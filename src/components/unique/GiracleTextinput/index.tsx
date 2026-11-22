import { buildEditorFromExtensions, HMRExtension } from "@lexical/extension";
import { HistoryExtension } from "@lexical/history";
import {
  $createParagraphNode,
  $getRoot,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_NORMAL,
  configExtension,
  KEY_ENTER_COMMAND,
  PASTE_COMMAND,
  type LexicalEditorWithDispose,
} from "lexical";
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import type { IUser } from "~/types/User.ts";
import {
  $insertMention,
  defineMentionExtension,
  EMPTY_MENTION_STATE,
  getMessageText,
  type MentionState,
} from "./MentionExtension.ts";
import MentionMenu from "./MentionMenu.tsx";
import { definePlainTextOnlyExtension } from "./PlainTextOnlyExtension.ts";
import { defineUrlUnderlineExtension } from "./UrlUnderlineExtension.ts";

export interface IGiracleTextinputHandle {
  /** getMessageText(ed) 相当の送信文字列(@名前 → @<user-id> 変換済み) */
  getText(): string;
  /** エディタ本文クリア + mentionState リセット */
  clear(): void;
  focus(): void;
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
  let editor: LexicalEditorWithDispose | undefined;
  let editorRoot: HTMLDivElement | undefined;

  const [mentionState, setMentionState] =
    createSignal<MentionState>(EMPTY_MENTION_STATE);

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

  const insertMention = (user: IUser) => {
    if (!editor) return;
    $insertMention(editor, user);
    setMentionState(EMPTY_MENTION_STATE);
  };

  onMount(() => {
    const MentionExtension = defineMentionExtension(
      { channelId: () => props.channelId },
      { signal: mentionState, set: setMentionState },
    );

    editor = buildEditorFromExtensions(
      definePlainTextOnlyExtension(),
      MentionExtension,
      defineUrlUnderlineExtension(),
      // Undo/Redo (Ctrl+Z / Ctrl+Shift+Z)。maxDepthで履歴の肥大化を防ぐ
      configExtension(HistoryExtension, { maxDepth: 100 }),
      configExtension(HMRExtension, { hot: import.meta.hot ?? null }),
    );
    const ed = editor;
    ed.setRootElement(editorRoot ?? null);
    // メンション確定(HIGH)が先に処理され、未消費の Enter だけがここに届く
    ed.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (!props.onEnter) return false;
        if (ed.isComposing()) return false;
        if (event?.shiftKey) return false;
        // event が null(プログラム発火)の場合も送信しない側に倒す
        if (props.sendWithCtrlKey?.() && !event?.ctrlKey) return false;
        const text = getMessageText(ed);
        event?.preventDefault();
        // 空行(空白のみ含む)の Enter は何もしない。改行も入れない
        // canSendEmpty が true ならファイル添付のみの送信を許可する
        if (text.trim() === "" && !props.canSendEmpty?.()) return true;
        props.onEnter(text);
        // 送信後のクリア。ChannelTextInput の sendMsg と同じく送信成否に依らず
        // 無条件に消す(API 失敗時の復元は親の責任とする)
        ed.update(() => {
          const root = $getRoot();
          root.clear();
          root.append($createParagraphNode());
        });
        setMentionState(EMPTY_MENTION_STATE);
        return true;
      },
      COMMAND_PRIORITY_NORMAL,
    );
    // PlainTextOnlyExtension(HIGH) より先に走らせ、ファイルだけ横取りする
    ed.registerCommand(
      PASTE_COMMAND,
      (event) => {
        const dt = event instanceof ClipboardEvent ? event.clipboardData : null;
        if (dt && dt.files.length > 0) props.onPasteFiles?.([...dt.files]);
        // 消費しない: テキスト挿入は PlainTextOnlyExtension に任せる
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
    props.ref?.({
      getText: () => getMessageText(ed),
      clear: () => {
        ed.update(() => {
          const root = $getRoot();
          root.clear();
          root.append($createParagraphNode());
        });
        setMentionState(EMPTY_MENTION_STATE);
      },
      focus: () => ed.focus(),
    });
    if (import.meta.hot && editor !== undefined) {
      import.meta.hot.accept();
      import.meta.hot.dispose(() => editor?.dispose());
    }
  });

  onCleanup(() => {
    editor?.dispose();
  });

  return (
    <div class="w-full relative">
      <div
        id="messageInput"
        class="min-h-10 max-h-40 overflow-y-auto p-2 bg-background border rounded-md"
        ref={editorRoot}
        contentEditable
      />
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
