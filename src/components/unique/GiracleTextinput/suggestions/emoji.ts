import { TextSelection } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import { storeCustomEmoji } from "~/stores/CustomEmoji.store.ts";
import type { IMentionMenuItem } from "../MentionMenu.tsx";
import { getTriggerQuery } from "../pmSchema.ts";
import type { ISearchContext } from "./common.ts";

/** カスタム絵文字候補を state へ反映する(コード部分一致・大小無視・同期のみ) */
export const searchEmojiCodes = (query: string, ctx: ISearchContext): void => {
  const lower = query.toLowerCase();
  ctx.apply("emoji", query, {
    emojiCodes: storeCustomEmoji
      .filter((e) => e.code.toLowerCase().includes(lower))
      .map((e) => e.code),
    selectIndex: 0,
    isSearching: false,
  });
};

export const emojiMenuItem = (code: string): IMentionMenuItem => ({
  id: code,
  name: `:${code}:`,
  fallbackGlyph: ":",
});

/**
 * カーソル直前の `:query` を `:code:` + 空白の素テキストへ置換する
 * (受信側にインライン絵文字描画が無いためチップ化しない)
 */
export const insertEmoji = (view: EditorView, code: string): void => {
  if (view.composing) return;
  const found = getTriggerQuery(view.state);
  if (!found) return;
  const text = `:${code}: `;
  const tr = view.state.tr.insertText(text, found.from, found.to);
  tr.setSelection(TextSelection.create(tr.doc, found.from + text.length));
  view.dispatch(tr);
};
