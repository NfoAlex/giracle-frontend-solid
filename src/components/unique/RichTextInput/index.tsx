import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $nodesOfType,
  COMMAND_PRIORITY_HIGH,
  createEditor,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  type LexicalEditor,
  HISTORY_MERGE_TAG,
  TextNode,
} from "lexical";
import { registerPlainText } from "@lexical/plain-text";
import { createEmptyHistoryState, registerHistory } from "@lexical/history";
import { mergeRegister } from "@lexical/utils";
import { $trimTextContentFromAnchor } from "@lexical/selection";
import type { IUser } from "~/types/User.ts";
import { storeUserinfo } from "~/stores/Userinfo.ts";
import { storeMyUserinfo } from "~/stores/MyUserinfo.ts";
import { storeChannelInfo } from "~/stores/ChannelInfo.ts";
import { MentionNode, $createMentionNode } from "./nodes/MentionNode.ts";
import { MessageLinkNode } from "./nodes/MessageLinkNode.ts";
import { $textNodeTransform } from "./transforms.ts";
import { $getRawFromEditorState, $rawToLexicalNodes } from "./rawSerialization.ts";
import { createDebounced, extractMentionQuery, $getTextBeforeCursor } from "./mentionQuery.ts";
import MentionSearchPopup from "./MentionSearchPopup.tsx";
import type { RichTextInputApi, RichTextInputProps } from "./types.ts";

interface SearchState {
  isEnabled: boolean;
  query: string;
  results: IUser[];
  selectIndex: number;
}

const emptySearchState: SearchState = { isEnabled: false, query: "", results: [], selectIndex: 0 };

export default function RichTextInput(props: RichTextInputProps) {
  let rootRef: HTMLDivElement | undefined;
  let editor: LexicalEditor | undefined;
  // Escapeで一時的に閉じた際のクエリ。同一クエリの間は再オープンを抑止する
  let escapeDismissedQuery: string | null = null;

  const [isEmpty, setIsEmpty] = createSignal(true);
  const [searchState, setSearchState] = createSignal<SearchState>(emptySearchState);

  const closeSearch = () => setSearchState(emptySearchState);

  const mentionSearchDebounced = createDebounced((query: string) => {
    if (!props.mentionSearch) return;
    props.mentionSearch(query)
      .then((results) => {
        // 応答が返ってきた時点でクエリが変わっていたら破棄(古い応答の競合防止)
        setSearchState((s) => (s.query === query ? { ...s, results } : s));
      })
      .catch((e) => console.error("RichTextInput :: mentionSearch : e->", e));
  }, 200);

  const openOrUpdateSearch = (query: string) => {
    if (!props.mentionSearch) return;
    setSearchState((s) => ({ ...s, isEnabled: true, query, selectIndex: 0 }));
    if (query.length >= 2) {
      mentionSearchDebounced.call(query);
    } else {
      setSearchState((s) => ({ ...s, results: [] }));
    }
  };

  const getRaw = (): string => {
    if (!editor) return "";
    let raw = "";
    editor.getEditorState().read(() => {
      raw = $getRawFromEditorState();
    });
    return raw;
  };

  const confirmMention = (user?: IUser) => {
    const state = searchState();
    const target = user ?? state.results[state.selectIndex];
    closeSearch();
    if (!editor || !target) return;

    const query = state.query;
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      $trimTextContentFromAnchor(editor!, selection.anchor, query.length + 1);
      const mentionNode = $createMentionNode(target.id);
      const spaceNode = $createTextNode(" ");
      selection.insertNodes([mentionNode, spaceNode]);
      spaceNode.selectEnd();
    });
    editor.focus();
  };

  const handleEnter = (e: KeyboardEvent | null): boolean => {
    // IME変換確定Enterで誤送信しない(Mac)
    if (e && /Mac/.test(navigator.userAgent) && e.isComposing) return false;

    if (searchState().isEnabled) {
      e?.preventDefault();
      confirmMention();
      return true;
    }

    const submit = props.shouldSubmit ? props.shouldSubmit(e as KeyboardEvent) : !e?.shiftKey;
    if (submit) {
      e?.preventDefault();
      props.onEnter?.(getRaw());
      return true;
    }
    return false;
  };

  const handleArrowUp = (e: KeyboardEvent): boolean => {
    if (!searchState().isEnabled) return false;
    e.preventDefault();
    setSearchState((s) => ({ ...s, selectIndex: Math.max(0, s.selectIndex - 1) }));
    return true;
  };

  const handleArrowDown = (e: KeyboardEvent): boolean => {
    if (!searchState().isEnabled) return false;
    e.preventDefault();
    setSearchState((s) => {
      if (s.results.length === 0) return s;
      return { ...s, selectIndex: Math.min(s.results.length - 1, s.selectIndex + 1) };
    });
    return true;
  };

  const handleEscape = (e: KeyboardEvent): boolean => {
    if (!searchState().isEnabled) return false;
    e.preventDefault();
    escapeDismissedQuery = searchState().query;
    closeSearch();
    return true;
  };

  onMount(() => {
    const nextEditor = createEditor({
      namespace: "RichTextInput",
      nodes: [MentionNode, MessageLinkNode],
      theme: { text: { underline: "underline" } },
      onError: (e) => console.error("RichTextInput :: editor : e->", e),
    });
    editor = nextEditor;
    nextEditor.setRootElement(rootRef!);

    const unregister = mergeRegister(
      registerPlainText(nextEditor),
      registerHistory(nextEditor, createEmptyHistoryState(), 300),
      nextEditor.registerNodeTransform(TextNode, $textNodeTransform),
      nextEditor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const raw = $getRawFromEditorState();
          setIsEmpty(raw.length === 0);
          props.onInput?.(raw);

          const textBeforeCursor = $getTextBeforeCursor();
          if (textBeforeCursor === null) {
            escapeDismissedQuery = null;
            closeSearch();
            return;
          }
          const query = extractMentionQuery(textBeforeCursor);
          if (query === null) {
            escapeDismissedQuery = null;
            closeSearch();
            return;
          }
          if (escapeDismissedQuery === query) return;
          escapeDismissedQuery = null;
          openOrUpdateSearch(query);
        });
      }),
      nextEditor.registerCommand(KEY_ENTER_COMMAND, handleEnter, COMMAND_PRIORITY_HIGH),
      nextEditor.registerCommand(KEY_ARROW_UP_COMMAND, handleArrowUp, COMMAND_PRIORITY_HIGH),
      nextEditor.registerCommand(KEY_ARROW_DOWN_COMMAND, handleArrowDown, COMMAND_PRIORITY_HIGH),
      nextEditor.registerCommand(KEY_ESCAPE_COMMAND, handleEscape, COMMAND_PRIORITY_HIGH),
    );

    nextEditor.update(() => {
      if ($getRoot().getFirstChild() === null) {
        $getRoot().append($createParagraphNode());
      }
    });

    // ストア(ユーザー名/チャンネル名)の変化に合わせてチップ表示を再描画する
    createEffect(() => {
      const _u = { ...storeUserinfo };
      const _me = storeMyUserinfo.id;
      const _c = { ...storeChannelInfo };
      nextEditor.update(
        () => {
          for (const n of $nodesOfType(MentionNode)) n.markDirty();
          for (const n of $nodesOfType(MessageLinkNode)) n.markDirty();
        },
        { tag: HISTORY_MERGE_TAG },
      );
    });

    const api: RichTextInputApi = {
      clear: () => {
        nextEditor.update(() => {
          $getRoot().clear();
          $getRoot().append($createParagraphNode());
        });
        closeSearch();
      },
      focus: () => nextEditor.focus(),
      getRaw,
      insertText: (raw: string) => {
        nextEditor.update(() => {
          const selection = $getSelection();
          const nodes = $rawToLexicalNodes(raw);
          if ($isRangeSelection(selection)) {
            selection.insertNodes(nodes);
            return;
          }
          const paragraph = $getRoot().getFirstChild();
          if ($isElementNode(paragraph)) {
            paragraph.append(...nodes);
          }
        });
      },
    };
    props.ref?.(api);

    onCleanup(() => {
      mentionSearchDebounced.cancel();
      unregister();
      nextEditor.setRootElement(null);
    });
  });

  return (
    <div class={"shrink min-w-0 grow relative"}>
      <div
        ref={rootRef}
        contentEditable={true}
        class={"p-2 bg-background border rounded-md break-all whitespace-pre-wrap max-h-40 overflow-y-auto outline-none"}
        onPaste={(e) => props.onPaste?.(e)}
      />
      <Show when={isEmpty()}>
        <div class={"pointer-events-none absolute left-2 top-2 text-muted-foreground select-none"}>
          {props.placeholder}
        </div>
      </Show>
      <Show when={searchState().isEnabled}>
        <MentionSearchPopup
          results={searchState().results}
          selectIndex={searchState().selectIndex}
          onSelect={(user) => confirmMention(user)}
        />
      </Show>
    </div>
  );
}
