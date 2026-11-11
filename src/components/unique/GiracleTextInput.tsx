import { ClipboardDOMImportExtension } from "@lexical/clipboard";
import { buildEditorFromExtensions, HMRExtension } from "@lexical/extension";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_HIGH,
  configExtension,
  defineExtension,
  KEY_SPACE_COMMAND,
  type LexicalEditorWithDispose,
  mergeRegister,
} from "lexical";
import { onCleanup, onMount } from "solid-js";

export default function GiracleTextInput() {
  let editor: LexicalEditorWithDispose | undefined;
  let editorRoot: HTMLDivElement | undefined;

  onMount(() => {
    const AppExtension = defineExtension({
      $initialEditorState() {
        $getRoot().append(
          $createParagraphNode().append(
            $createTextNode("こんにちは @ でメンション、:smile: で絵文字。"),
          ),
        );
      },
      dependencies: [ClipboardDOMImportExtension],
      name: "@lexical/examples/vanilla-js",
      namespace: "Vanilla JS Demo",
      register(editor) {
        return mergeRegister(
          // スペース入力でフォーマット解除
          editor.registerCommand(
            KEY_SPACE_COMMAND,
            (event) => {
              // 修飾キー付きの Space は除外
              if (event.ctrlKey || event.metaKey || event.altKey) {
                return false;
              }

              const selection = $getSelection();
              if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
                return false;
              }
              console.log("GiracleTextInput :: onMount : selection ", { selection });

              const anchorNode = selection.anchor.getNode();
              if (
                !$isTextNode(anchorNode) ||
                !anchorNode.hasFormat("bold") ||
                selection.anchor.offset !== anchorNode.getTextContentSize()
              ) {
                return false;
              }
              console.log("GiracleTextInput :: onMount : anchorNode ", { anchorNode });

              // 太字の末尾ではスペースを通常テキストとして挿入する
              const spaceNode = $createTextNode(" ");
              anchorNode.insertAfter(spaceNode);
              spaceNode.select(1, 1);
              event.preventDefault();
              return true;
            },
            COMMAND_PRIORITY_HIGH,
          ),
          editor.registerUpdateListener(({ editorState }) => {
            console.log("GiracleTextInput :: onMount : ", { editorState });
          }),
        );
      },
      theme: {
        paragraph: "editor-paragraph",
        text: {
          bold: "editor-text-bold",
          italic: "editor-text-italic",
        },
      },
    });

    //ここから下は開発用
    editor = buildEditorFromExtensions(
      AppExtension,
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

  return <div ref={editorRoot} contentEditable></div>;
}
