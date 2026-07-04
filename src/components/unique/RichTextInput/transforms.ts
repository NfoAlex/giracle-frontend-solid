import type { LexicalNode, TextNode } from "lexical";
import { messageLinkPattern, mentionPattern, urlPattern } from "~/lib/messagePatterns.ts";
import { $createMentionNode } from "./nodes/MentionNode.ts";
import { $createMessageLinkNode } from "./nodes/MessageLinkNode.ts";

function resetLastIndex(regex: RegExp) {
  regex.lastIndex = 0;
}

/**
 * node内の[start, start+length)範囲だけを独立したTextNodeへ分離して返す
 */
function $isolateMatchRange(node: TextNode, start: number, length: number): TextNode {
  let targetNode: TextNode = node;
  if (start > 0) {
    const parts = targetNode.splitText(start);
    targetNode = parts[parts.length - 1];
  }
  if (length < targetNode.getTextContent().length) {
    const parts = targetNode.splitText(length);
    targetNode = parts[0];
  }
  return targetNode;
}

function $replaceMatchWithNode(
  node: TextNode,
  match: RegExpExecArray,
  createReplacement: () => LexicalNode,
): void {
  const targetNode = $isolateMatchRange(node, match.index, match[0].length);
  targetNode.replace(createReplacement());
}

/**
 * 通常のTextNodeに対して、メンション/メッセージリンク記法の自動チップ化と
 * URLのアンダーライン装飾/解除を行うtransform。
 * MentionNode/MessageLinkNodeはisSimpleText()===falseのため対象外(早期return)。
 */
export function $textNodeTransform(node: TextNode): void {
  if (!node.isSimpleText()) return;
  const text = node.getTextContent();
  if (text.length === 0) return;

  resetLastIndex(messageLinkPattern);
  const messageLinkMatch = messageLinkPattern.exec(text);
  if (messageLinkMatch) {
    const channelId = messageLinkMatch[1];
    const messageId = messageLinkMatch[2];
    $replaceMatchWithNode(node, messageLinkMatch, () => $createMessageLinkNode(channelId, messageId));
    return;
  }

  resetLastIndex(mentionPattern);
  const mentionMatch = mentionPattern.exec(text);
  if (mentionMatch) {
    const userId = mentionMatch[1];
    $replaceMatchWithNode(node, mentionMatch, () => $createMentionNode(userId));
    return;
  }

  resetLastIndex(urlPattern);
  const urlMatch = urlPattern.exec(text);
  if (urlMatch) {
    const isFullMatch = urlMatch.index === 0 && urlMatch[0].length === text.length;
    if (isFullMatch) {
      if (!node.hasFormat("underline")) node.toggleFormat("underline");
      return;
    }
    $isolateMatchRange(node, urlMatch.index, urlMatch[0].length);
    return;
  }

  // どのパターンにも一致しない場合、過去に付けたunderlineが残っていれば剥がす
  // (例: URLの途中を編集して非URL文字列になったケース)
  if (node.hasFormat("underline")) node.toggleFormat("underline");
}
