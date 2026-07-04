import {
  $applyNodeReplacement,
  type EditorConfig,
  type LexicalNode,
  type LexicalUpdateJSON,
  type NodeKey,
  type SerializedTextNode,
  type Spread,
  TextNode,
} from "lexical";
import { getterUserinfo } from "~/stores/Userinfo.ts";
import { storeMyUserinfo } from "~/stores/MyUserinfo.ts";

export type SerializedMentionNode = Spread<
  {
    userId: string;
  },
  SerializedTextNode
>;

/**
 * メンションチップノード。内部テキスト(__text)は raw記法 `@<userId>` そのもの。
 * 画面表示(`@ユーザー名`)は createDOM/updateDOM 内でのみ上書きする。
 */
export class MentionNode extends TextNode {
  __userId: string;

  static getType(): string {
    return "mention";
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__userId, node.__key);
  }

  constructor(userId: string, key?: NodeKey) {
    super(`@<${userId}>`, key);
    this.__userId = userId;
    this.setMode("token");
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    this.$applyDisplay(dom);
    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    const needsRecreate = super.updateDOM(prevNode, dom, config);
    this.$applyDisplay(dom);
    return needsRecreate;
  }

  private $applyDisplay(dom: HTMLElement) {
    const isMe = storeMyUserinfo.id === this.__userId;
    const info = getterUserinfo(this.__userId);
    dom.className = `${isMe ? "bg-primary text-primary-foreground" : "bg-border"} hover:underline my-auto mx-px align-baseline inline-flex rounded px-1`;
    dom.textContent = `@${info?.name ?? this.__userId}`;
  }

  exportJSON(): SerializedMentionNode {
    return {
      ...super.exportJSON(),
      type: "mention",
      userId: this.__userId,
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    return $createMentionNode(serializedNode.userId).updateFromJSON(serializedNode);
  }

  updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedMentionNode>): this {
    return super.updateFromJSON(serializedNode);
  }

  isTextEntity(): boolean {
    return true;
  }
}

export function $createMentionNode(userId: string): MentionNode {
  return $applyNodeReplacement(new MentionNode(userId));
}

export function $isMentionNode(
  node: LexicalNode | null | undefined,
): node is MentionNode {
  return node instanceof MentionNode;
}
