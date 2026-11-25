import { Database } from "emoji-picker-element";
import type { CustomEmoji, Emoji } from "emoji-picker-element/shared.js";
import { createStore } from "solid-js/store";
import type { ICustomEmoji } from "~/types/Message.ts";

export const [storeCustomEmoji, setStoreCustomEmoji] = createStore<
  ICustomEmoji[]
>([]);
export const emojiDB = new Database();

// 同一絵文字コードの検索を1つのPromiseに集約するキャッシュ(挿入順=LRU順)
const EMOJI_REQUEST_CACHE_MAX_ENTRIES = 256;
const emojiRequestCache = new Map<string, Promise<Emoji | null>>();

/**
 * emojiDBへカスタム絵文字データセットを差分適用する
 * （new Database()での全件インデックス再構築を避ける）
 */
const applyEmojiDataset = () => {
  //カスタム絵文字は標準ショートコードを上書きできるため、古いキャッシュを捨てる
  emojiRequestCache.clear();
  emojiDB.customEmoji = useStoreCustomEmoji.getEmojiDatasetWithCustomEmoji();
};

export namespace useStoreCustomEmoji {
  /**
   * 絵文字コードから絵文字データを取得する（同時実行は1回に集約）
   * 完了した絵文字のみ長期キャッシュし、null・失敗は再試行可能にする
   */
  export const getEmoji = (emojiCode: string): Promise<Emoji | null> => {
    const cached = emojiRequestCache.get(emojiCode);
    if (cached !== undefined) {
      //ヒットしたエントリを挿入順の末尾(=最新)へ移す
      emojiRequestCache.delete(emojiCode);
      emojiRequestCache.set(emojiCode, cached);
      return cached;
    }

    const request: Promise<Emoji | null> = emojiDB
      .getEmojiByShortcode(emojiCode)
      .then((emoji) => {
        // 未検出(null)は次回再取得できるようキャッシュから外す
        if (emoji === null) {
          if (emojiRequestCache.get(emojiCode) === request) {
            emojiRequestCache.delete(emojiCode);
          }
        }
        return emoji;
      });

    emojiRequestCache.set(emojiCode, request);

    // 上限超過時は最も古いエントリを追い出す(実行中のPromiseは自分を再登録しない)
    if (emojiRequestCache.size > EMOJI_REQUEST_CACHE_MAX_ENTRIES) {
      const oldest = emojiRequestCache.keys().next();
      if (!oldest.done) emojiRequestCache.delete(oldest.value);
    }

    // 失敗時は再試行できるようキャッシュから外す（呼び出し側のrejectは維持）
    request.catch(() => {
      if (emojiRequestCache.get(emojiCode) === request) {
        emojiRequestCache.delete(emojiCode);
      }
    });

    return request;
  };

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
