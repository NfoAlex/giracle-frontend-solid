import {createStore} from "solid-js/store";
import {ICustomEmoji} from "~/types/Message";
import {Database} from "emoji-picker-element";
import type {CustomEmoji} from "emoji-picker-element/shared";

export const [storeCustomEmoji, setStoreCustomEmoji] = createStore<ICustomEmoji[]>([]);
export const emojiDB = new Database();

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