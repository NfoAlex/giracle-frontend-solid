import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  DROP_COMMAND,
  defineExtension,
  FORMAT_TEXT_COMMAND,
  mergeRegister,
  PASTE_COMMAND,
  SET_TEXT_FORMAT_COMMAND,
} from "lexical";

/** DataTransfer から書式を落としたテキストだけを取り出す */
function $insertPlainText(dt: DataTransfer): void {
  const selection = $getSelection();
  if (selection === null) return;
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
  if (text !== "") selection.insertRawText(text);
}

/**
 * リッチ書式を無効化する拡張。
 * ペースト・ドロップは plain text のみ挿入し、format コマンド
 * (Ctrl+B/I/U/S 等) を消費して何もしない。表示はメンションと
 * URL 下線のみという仕様の担保。
 */
export function definePlainTextOnlyExtension() {
  return defineExtension({
    name: "@giracle/plain-text-only",
    register(editor) {
      return mergeRegister(
        editor.registerCommand(
          PASTE_COMMAND,
          (event) => {
            // PASTE_COMMAND は ClipboardEvent 以外(InputEvent)でも発火する
            const dt =
              event instanceof ClipboardEvent ? event.clipboardData : null;
            if (dt === null) return false;
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return false;
            event.preventDefault();
            editor.update(() => $insertPlainText(dt));
            return true;
          },
          COMMAND_PRIORITY_HIGH,
        ),
        // Lexical 外からのドロップは $handlePlainTextDrop が false を返し、
        // 既定の insertFromDrop がリッチ書式を取り込むため自前で挿入する。
        // shortcut: 挿入位置は現在のキャレット(ドロップ座標ではない)、
        // 位置合わせが必要になったらドロップ座標からのキャレット解決を実装する
        editor.registerCommand(
          DROP_COMMAND,
          (event) => {
            const dt = event.dataTransfer;
            if (dt === null) return false;
            event.preventDefault();
            editor.update(() => $insertPlainText(dt));
            return true;
          },
          COMMAND_PRIORITY_HIGH,
        ),
        // コアのショートカット(Ctrl+B/I/U/S)やその他の format 適用を無効化
        editor.registerCommand(
          FORMAT_TEXT_COMMAND,
          () => true,
          COMMAND_PRIORITY_HIGH,
        ),
        editor.registerCommand(
          SET_TEXT_FORMAT_COMMAND,
          () => true,
          COMMAND_PRIORITY_HIGH,
        ),
      );
    },
  });
}
