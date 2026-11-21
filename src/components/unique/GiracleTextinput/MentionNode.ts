import {
  $isTextNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedTextNode,
  TextNode,
} from "lexical";

/** サーバ保存フォーマット(@<user-id>)に合わせたシリアライズ型 */
export type SerializedMentionNode = SerializedTextNode & { userId: string };

/**
 * メンションユーザーを表すテキストノード
 * getTextContent() は既存レンダラ(MessageTextRender)が解釈する `@<user-id>` 形式になる
 */
export class MentionNode extends TextNode {
  __userId: string;

  constructor(userId: string, key?: NodeKey) {
    super(`@<${userId}>`, key);
    this.__userId = userId;
  }

  static getType(): "mention" {
    return "mention";
  }

  // format/style/modeはTextNode.afterCloneFromが引き継ぐ
  static clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__userId, node.__key);
  }

  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    return $createMentionNode(serializedNode.userId)
      .setFormat(serializedNode.format)
      .setStyle(serializedNode.style);
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        const userId = domNode.getAttribute("data-mention-user-id");
        if (!userId) return null;
        return {
          conversion: (): DOMConversionOutput => ({
            node: $createMentionNode(userId),
          }),
          priority: 1,
        };
      },
    };
  }

  exportJSON(): SerializedMentionNode {
    return {
      ...(super.exportJSON() as SerializedTextNode),
      type: "mention",
      version: 1,
      userId: this.__userId,
    };
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const output = super.exportDOM(editor);
    if (output.element instanceof HTMLElement) {
      output.element.setAttribute("data-mention-user-id", this.__userId);
    }
    return output;
  }

  createDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const dom = super.createDOM(config, editor);
    dom.classList.add("mention-node");
    return dom;
  }

  isTextEntity(): true {
    return true;
  }
}

/** tokenモードなので @<user-id> 全体が1単位として扱われる */
export function $createMentionNode(userId: string): MentionNode {
  return new MentionNode(userId).setMode("token");
}

export function $isMentionNode(
  node: LexicalNode | null | undefined,
): node is MentionNode {
  return $isTextNode(node) && node.getType() === "mention";
}
