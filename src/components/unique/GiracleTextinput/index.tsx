import { buildEditorFromExtensions, HMRExtension } from "@lexical/extension";
import { HistoryExtension } from "@lexical/history";
import { configExtension, type LexicalEditorWithDispose } from "lexical";
import { createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";
import type { IUser } from "~/types/User.ts";
import {
  $insertMention,
  defineMentionExtension,
  EMPTY_MENTION_STATE,
  type MentionState,
} from "./MentionExtension.ts";
import MentionMenu from "./MentionMenu.tsx";

export default function GiracleTextinput(props: { channelId?: string }) {
  let editor: LexicalEditorWithDispose | undefined;
  let editorRoot: HTMLDivElement | undefined;

  const [mentionState, setMentionState] =
    createSignal<MentionState>(EMPTY_MENTION_STATE);

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
      MentionExtension,
      // Undo/Redo (Ctrl+Z / Ctrl+Shift+Z)。maxDepthで履歴の肥大化を防ぐ
      configExtension(HistoryExtension, { maxDepth: 100 }),
      configExtension(HMRExtension, { hot: import.meta.hot ?? null }),
    );
    editor.setRootElement(editorRoot ?? null);

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
        />
      </Show>
    </div>
  );
}
