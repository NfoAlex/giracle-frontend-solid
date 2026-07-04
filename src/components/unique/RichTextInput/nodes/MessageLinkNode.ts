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
import { directGetterChannelInfo } from "~/stores/ChannelInfo.ts";

export type SerializedMessageLinkNode = Spread<
  {
    channelId: string;
    messageId: string;
  },
  SerializedTextNode
>;

/**
 * メッセージリンクチップノード。内部テキスト(__text)は raw記法 `&<channelId:messageId>` そのもの。
 */
export class MessageLinkNode extends TextNode {
  __channelId: string;
  __messageId: string;

  static getType(): string {
    return "message-link";
  }

  static clone(node: MessageLinkNode): MessageLinkNode {
    return new MessageLinkNode(node.__channelId, node.__messageId, node.__key);
  }

  constructor(channelId: string, messageId: string, key?: NodeKey) {
    super(`&<${channelId}:${messageId}>`, key);
    this.__channelId = channelId;
    this.__messageId = messageId;
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
    const info = directGetterChannelInfo(this.__channelId);
    const name = info.name.length > 18 ? `${info.name.slice(0, 18)}...` : info.name;
    dom.className = "bg-border hover:underline my-auto mx-px align-baseline inline-flex rounded px-1";
    dom.textContent = `🔗 ${name}`;
  }

  exportJSON(): SerializedMessageLinkNode {
    return {
      ...super.exportJSON(),
      type: "message-link",
      channelId: this.__channelId,
      messageId: this.__messageId,
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedMessageLinkNode): MessageLinkNode {
    return $createMessageLinkNode(serializedNode.channelId, serializedNode.messageId).updateFromJSON(serializedNode);
  }

  updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedMessageLinkNode>): this {
    return super.updateFromJSON(serializedNode);
  }

  isTextEntity(): boolean {
    return true;
  }
}

export function $createMessageLinkNode(channelId: string, messageId: string): MessageLinkNode {
  return $applyNodeReplacement(new MessageLinkNode(channelId, messageId));
}

export function $isMessageLinkNode(
  node: LexicalNode | null | undefined,
): node is MessageLinkNode {
  return node instanceof MessageLinkNode;
}
