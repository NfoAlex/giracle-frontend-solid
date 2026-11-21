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
export type SerializedMentionNode = SerializedTextNode & {
  userId: string;
  name: string;
};

/**
 * メンションユーザーを表すテキストノード
 * ノードのテキスト(=エディタ上の表示)は `@ユーザー名`。
 * `@<user-id>` 形式への変換は getMessageText(MentionExtension.ts) が担う
 */
export class MentionNode extends TextNode {
  __userId: string;
  __name: string;

  constructor(userId: string, name: string, key?: NodeKey) {
    super(`@${name}`, key);
    this.__userId = userId;
    this.__name = name;
  }

  static getType(): "mention" {
    return "mention";
  }

  // format/style/modeはTextNode.afterCloneFromが引き継ぐ
  static clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__userId, node.__name, node.__key);
  }

  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    return $createMentionNode(
      serializedNode.userId,
      // 旧形式でnameが無い場合はuserIdで代替(表示崩れ回避)
      serializedNode.name ?? serializedNode.userId,
    )
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
            node: $createMentionNode(
              userId,
              domNode.getAttribute("data-mention-name") ?? userId,
            ),
          }),
          priority: 1,
        };
      },
    };
  }

  getUserId(): string {
    return this.__userId;
  }

  exportJSON(): SerializedMentionNode {
    return {
      ...(super.exportJSON() as SerializedTextNode),
      type: "mention",
      version: 1,
      userId: this.__userId,
      name: this.__name,
    };
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const output = super.exportDOM(editor);
    if (output.element instanceof HTMLElement) {
      output.element.setAttribute("data-mention-user-id", this.__userId);
      output.element.setAttribute("data-mention-name", this.__name);
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

/** tokenモードなので `@名前` 全体が1単位として扱われる */
export function $createMentionNode(userId: string, name: string): MentionNode {
  return new MentionNode(userId, name).setMode("token");
}

export function $isMentionNode(
  node: LexicalNode | null | undefined,
): node is MentionNode {
  return $isTextNode(node) && node.getType() === "mention";
}
