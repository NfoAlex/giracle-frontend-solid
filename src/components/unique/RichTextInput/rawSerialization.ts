import {
  $createLineBreakNode,
  $createTextNode,
  $getRoot,
  $isElementNode,
  $isLineBreakNode,
  type LexicalNode,
} from "lexical";
import { $createMentionNode } from "./nodes/MentionNode.ts";
import { $createMessageLinkNode } from "./nodes/MessageLinkNode.ts";

// messagePatterns.ts の messageLinkPattern / mentionPattern と同じUUID形式を使う。
// URLはここでは処理しない: 挿入直後の同一トランザクション内でtransforms.tsのNode Transformが
// 自然に発火し下線装飾が適用されるため、判定ロジックの重複を避けている。
const rawStructurePattern = /(&<([a-f0-9-]+):([a-f0-9-]+)>)|(@<([a-f0-9-]+)>)|(\n)/g;

/**
 * raw記法文字列をLexicalノード列に変換する。
 * editor.update() コンテキスト内で呼び出すこと。
 */
export function $rawToLexicalNodes(raw: string): LexicalNode[] {
  const nodes: LexicalNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  rawStructurePattern.lastIndex = 0;
  while ((match = rawStructurePattern.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      nodes.push($createTextNode(raw.slice(lastIndex, match.index)));
    }

    if (match[1]) {
      // &<channelId:messageId>
      nodes.push($createMessageLinkNode(match[2], match[3]));
    } else if (match[4]) {
      // @<userId>
      nodes.push($createMentionNode(match[5]));
    } else if (match[6]) {
      // \n
      nodes.push($createLineBreakNode());
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < raw.length) {
    nodes.push($createTextNode(raw.slice(lastIndex)));
  }

  return nodes;
}

/**
 * 現在のエディタ状態からraw記法文字列を取得する。
 * editor.getEditorState().read() コンテキスト内で呼び出すこと。
 * plain-text構成は常に単一ParagraphNodeという前提。
 */
export function $getRawFromEditorState(): string {
  const paragraph = $getRoot().getFirstChild();
  if (!$isElementNode(paragraph)) return "";

  return paragraph
    .getChildren()
    .map((n) => ($isLineBreakNode(n) ? "\n" : n.getTextContent()))
    .join("");
}
