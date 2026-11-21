import { buildEditorFromExtensions, HMRExtension } from "@lexical/extension";
import { HistoryExtension } from "@lexical/history";
import {
  $createParagraphNode,
  $getRoot,
  COMMAND_PRIORITY_NORMAL,
  configExtension,
  KEY_ENTER_COMMAND,
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

export default function GiracleTextinput(props: {
  channelId?: string;
  displayMentionAtBottom?: boolean;
  onEnter?: (text: string) => void;
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
        const text = getMessageText(ed);
        event?.preventDefault();
        // 空行(空白のみ含む)の Enter は何もしない。改行も入れない
        if (text.trim() === "") return true;
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
