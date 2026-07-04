import { $getSelection, $isLineBreakNode, $isRangeSelection, $isTextNode } from "lexical";

/**
 * カーソル(collapsed selection)より手前のプレーンテキストを取得する。
 * チップ(Mention/MessageLink)ノードの中/直後にカーソルがある場合はnullを返す。
 * plain-text構成は常に単一ParagraphNodeという前提のため、数値offset計算をせず
 * anchorノードの前方兄弟を辿るだけで文書全体の「カーソルより手前」が得られる。
 */
export function $getTextBeforeCursor(): string | null {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) return null;

  const anchorNode = selection.anchor.getNode();
  if (!$isTextNode(anchorNode) || anchorNode.getType() !== "text") return null;

  const prefix = anchorNode
    .getPreviousSiblings()
    .map((n) => ($isLineBreakNode(n) ? "\n" : n.getTextContent()))
    .join("");

  return prefix + anchorNode.getTextContent().slice(0, selection.anchor.offset);
}

/**
 * カーソル手前のテキストから、直近の"@"以降をメンション検索クエリとして抽出する。
 * 既存ChannelTextInput.tsxのcheckMode(/@\S+/g)と同じく、空白/改行を跨いだら無効。
 */
export function extractMentionQuery(textBeforeCursor: string): string | null {
  const atIndex = textBeforeCursor.lastIndexOf("@");
  if (atIndex === -1) return null;

  const candidate = textBeforeCursor.slice(atIndex);
  if (/\s/.test(candidate)) return null;

  return candidate.slice(1);
}

export interface Debounced<Args extends unknown[]> {
  call: (...args: Args) => void;
  cancel: () => void;
}

export function createDebounced<Args extends unknown[]>(
  fn: (...args: Args) => void,
  wait: number,
): Debounced<Args> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    call: (...args: Args) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    },
    cancel: () => {
      if (timer) clearTimeout(timer);
      timer = undefined;
    },
  };
}
