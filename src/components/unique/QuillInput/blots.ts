import Quill, { Parchment } from "quill";
import type { IQuillInputTriggerItem } from "./types.ts";

export interface IMentionValue extends IQuillInputTriggerItem {
  trigger: string;
}

/**
 * Quill の Inline を継承しないと Block.allowedChildren に含まれず、
 * optimize 時に装飾 span が剥がれる。
 */
const QuillInline = Quill.import("blots/inline") as typeof Parchment.InlineBlot;

/** URL 用の装飾専用 inline blot。テキストを保持し、属性のみ付く */
export class UrlBlot extends QuillInline {
  static blotName = "url";
  static tagName = "span";
  static className = "quill-input-url";

  /**
   * 基底の InlineBlot.formats は「汎用 inline blot と同じ tagName」だと
   * undefined を返し、optimize で装飾 span が剥がされる。URL は常に有効扱いにする。
   */
  static formats() {
    return true;
  }
}

export class MentionBlot extends Parchment.EmbedBlot {
  static blotName = "mention";
  static tagName = "span";
  static className = "quill-input-mention";

  static create(value: IMentionValue): HTMLElement {
    const node = document.createElement("span");
    node.className = "quill-input-mention";
    node.setAttribute("contenteditable", "false");
    node.dataset.trigger = value.trigger;
    node.dataset.id = value.id;
    node.dataset.name = value.name;
    if (value.avatarUrl) {
      node.dataset.avatarUrl = value.avatarUrl;
      const img = document.createElement("img");
      img.src = value.avatarUrl;
      img.alt = "";
      node.append(img);
    }
    const label = document.createElement("span");
    // 名前はユーザー入力なので textContent で挿入する（innerHTML 禁止）
    label.textContent = `${value.trigger}${value.name}`;
    node.append(label);
    return node;
  }

  static value(node: HTMLElement): IMentionValue {
    return {
      trigger: node.dataset.trigger ?? "@",
      id: node.dataset.id ?? "",
      name: node.dataset.name ?? "",
      avatarUrl: node.dataset.avatarUrl || undefined,
    };
  }
}

export const registerQuillInputFormats = (QuillClass: typeof Quill) => {
  // true で HMR 時の再登録警告を抑止する
  QuillClass.register(UrlBlot, true);
  QuillClass.register(MentionBlot, true);
};
