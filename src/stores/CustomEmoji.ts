import {createStore} from "solid-js/store";
import {ICustomEmoji} from "~/types/Message";
import {Database} from "emoji-picker-element";
import type {CustomEmoji} from "emoji-picker-element/shared";

export const [storeCustomEmoji, setStoreCustomEmoji] = createStore<ICustomEmoji[]>([]);
export let emojiDB = new Database();

/**
 * カスタム絵文字を丸ごとバインドする
 * @param emojis
 */
export const bindCustomEmoji = (emojis: ICustomEmoji[]) => {
  setStoreCustomEmoji(emojis);
  const customEmojiDataset = getEmojiDatasetWithCustomEmoji();

  //emojiDBを更新
  emojiDB = new Database({customEmoji: customEmojiDataset});
}

/**
 * 単一のカスタム絵文字を更新する
 * @param emoji
 */
export const updateCustomEmoji = (emoji: ICustomEmoji) => {
  setStoreCustomEmoji([...storeCustomEmoji, emoji]);
  const customEmojiDataset = getEmojiDatasetWithCustomEmoji();

  //emojiDBを更新
  emojiDB = new Database({customEmoji: customEmojiDataset});
}

/**
 * カスタム絵文字をデータセットとStoreから削除する
 * @param emojiCode - 削除する絵文字コード
 */
export const deleteCustomEmojiData = (emojiCode: string) => {
  setStoreCustomEmoji(storeCustomEmoji.filter((emoji) => emoji.code !== emojiCode));
  const customEmojiDataset = getEmojiDatasetWithCustomEmoji();

  //emojiDBを更新
  emojiDB = new Database({customEmoji: customEmojiDataset});
}

/**
 * emoji-picker-element用にカスタム絵文字データセットをパース、渡す
 */
export const getEmojiDatasetWithCustomEmoji = () => {
  const dataset: CustomEmoji[] = [];
  for (const emoji of storeCustomEmoji) {
    dataset.push({
      name: emoji.code,
      url: "/api/server/custom-emoji/" + emoji.code,
      shortcodes: [emoji.code]
    });
  }

  return dataset;
}