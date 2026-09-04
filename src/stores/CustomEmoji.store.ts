import { Database } from "emoji-picker-element";
import type { CustomEmoji } from "emoji-picker-element/shared.js";
import { createStore } from "solid-js/store";
import type { ICustomEmoji } from "~/types/Message.ts";

export const [storeCustomEmoji, setStoreCustomEmoji] = createStore<
  ICustomEmoji[]
>([]);
export const emojiDB = new Database();

/**
 * emojiDBへカスタム絵文字データセットを差分適用する
 * （new Database()での全件インデックス再構築を避ける）
 */
const applyEmojiDataset = () => {
  emojiDB.customEmoji = useStoreCustomEmoji.getEmojiDatasetWithCustomEmoji();
};

export namespace useStoreCustomEmoji {
  /**
   * カスタム絵文字を丸ごとバインドする
   * @param emojis
   */
  export const bindCustomEmoji = (emojis: ICustomEmoji[]) => {
    setStoreCustomEmoji(emojis);

    //emojiDBを更新
    applyEmojiDataset();
  };

  /**
   * 単一のカスタム絵文字を更新する
   * @param emoji
   */
  export const updateCustomEmoji = (emoji: ICustomEmoji) => {
    setStoreCustomEmoji([...storeCustomEmoji, emoji]);

    //emojiDBを更新
    applyEmojiDataset();
  };

  /**
   * カスタム絵文字をデータセットとStoreから削除する
   * @param emojiCode - 削除する絵文字コード
   */
  export const deleteCustomEmojiData = (emojiCode: string) => {
    setStoreCustomEmoji(
      storeCustomEmoji.filter((emoji) => emoji.code !== emojiCode),
    );

    //emojiDBを更新
    applyEmojiDataset();
  };

  /**
   * emoji-picker-element用にカスタム絵文字データセットをパース、渡す
   */
  export const getEmojiDatasetWithCustomEmoji = () => {
    const dataset: CustomEmoji[] = [];
    for (const emoji of storeCustomEmoji) {
      dataset.push({
        name: emoji.code,
        url: `/api/server/custom-emoji/${emoji.code}`,
        shortcodes: [emoji.code],
      });
    }

    return dataset;
  };
}
