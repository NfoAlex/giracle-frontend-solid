import { createStore, produce } from "solid-js/store";
import type { IMessage } from "~/types/Message.ts";

export const [storeHistory, setStoreHistory] = createStore<{
  [key: string]: {
    history: IMessage[];
    atTop: boolean;
    atEnd: boolean;
  };
}>({});

const [storeImageDimensions, setStoreImageDimensions] = createStore<{
  [fileId: string]: {
    width: number;
    height: number;
  };
}>({});

export { storeImageDimensions };

//総メッセージ数の上限。超過分は訪問順が古いチャンネルから削除し、表示中チャンネルを保護する
const MAX_TOTAL_HISTORY = 750;

//訪問順管理。ストア外変数で良く、反応性は不要
const visitOrder = new Set<string>();

/** 表示中チャンネルが削除対象にならないよう末尾へ移動 */
export const recordVisit = (channelId: string) => {
  visitOrder.delete(channelId);
  visitOrder.add(channelId);
};

/**
 * 総メッセージ数が上限を超えている間、訪問順の古いチャンネルからエントリごと削除
 * @param target 書き換え対象(ストアのコピー / produceのドラフト)
 */
const trimToCap = (target: {
  [key: string]: { history: IMessage[]; atTop: boolean; atEnd: boolean };
}) => {
  let total = Object.values(target).reduce(
    (sum, e) => sum + e.history.length,
    0,
  );

  //visitOrderに無いチャンネルも削除対象に含める
  for (const id of [...visitOrder, ...Object.keys(target)]) {
    if (total < MAX_TOTAL_HISTORY) return;
    const entry = target[id];
    if (entry === undefined) continue;
    total -= entry.history.length;
    delete target[id];
  }
};

const MAX_IMAGE_DIMENSIONS = 300;
const imageDimOrder = new Set<string>();

export const putImageDimensions = (batchImageDims: {
  [fileId: string]: { width: number; height: number };
}) => {
  //バックエンドのフィールド欠損対策(Object.keysがundefinedで落ちるため)
  if (!batchImageDims) return;

  setStoreImageDimensions(produce((prev) => Object.assign(prev, batchImageDims)));
  for (const fileId of Object.keys(batchImageDims)) imageDimOrder.add(fileId);

  const expired: string[] = [];
  while (imageDimOrder.size + expired.length > MAX_IMAGE_DIMENSIONS) {
    const oldest = imageDimOrder.values().next().value as string;
    imageDimOrder.delete(oldest);
    expired.push(oldest);
  }
  if (expired.length > 0) {
    setStoreImageDimensions(
      produce((prev) => {
        for (const fileId of expired) delete prev[fileId];
      }),
    );
  }
};

/**
 * 履歴Storeに挿入する
 * @param history
 */
export const insertHistory = (history: IMessage[]) => {
  if (history.length === 0) return;

  const currentHistory = { ...storeHistory };

  //挿入方向(挿入する履歴が現在保持するものより新しいかどうかで順序を選ぶ
  const insertDirection =
    history[0].createdAt.valueOf() > //受け取った履歴の最初の時間
    (currentHistory[history[0].channelId]?.history
      .at(-1)
      ?.createdAt.valueOf() || 0) //現在の履歴最古の時間
      ? "newer"
      : "older";

  if (currentHistory[history[0].channelId] === undefined) {
    currentHistory[history[0].channelId] = {
      atEnd: true,
      atTop: true,
      history: history,
    };
  } else if (currentHistory[history[0].channelId].history.length === 0) {
    currentHistory[history[0].channelId] = {
      ...currentHistory[history[0].channelId],
      history: history,
    };
  } else {
    if (insertDirection === "newer") {
      //console.log("History :: insertHistory : 新しい方向に挿入");
      //最後だけ切る
      const trimmedHistory = history.slice(0, -1);
      currentHistory[history[0].channelId] = {
        ...currentHistory[history[0].channelId],
        history: [
          ...trimmedHistory,
          ...currentHistory[history[0].channelId].history,
        ],
      };
    } else {
      //console.log("History :: insertHistory : 古い方向に挿入");
      //先頭だけ切る
      const trimmedHistory = history.slice(1);
      currentHistory[history[0].channelId] = {
        ...currentHistory[history[0].channelId],
        history: [
          ...currentHistory[history[0].channelId].history,
          ...trimmedHistory,
        ],
      };
    }
  }

  //setStoreHistory(currentHistory);

  if (insertDirection === "newer") {
    //古い履歴を削る
    //console.log("History :: insertHistory : 古い方向に削る", currentHistory[history[0].channelId].history.length);
    if (currentHistory[history[0].channelId].history.length >= 120) {
      currentHistory[history[0].channelId].history = currentHistory[
        history[0].channelId
      ].history.slice(0, 90);
      currentHistory[history[0].channelId].atTop = false;
    }
  } else {
    //新しい方の履歴を削る
    //console.log("History :: insertHistory : 新しい方向に削る", currentHistory[history[0].channelId].history.length);
    if (currentHistory[history[0].channelId].history.length >= 120) {
      currentHistory[history[0].channelId].history =
        currentHistory[history[0].channelId].history.slice(30);
      currentHistory[history[0].channelId].atEnd = false;
    }
  }

  setTimeout(() => {
    trimToCap(currentHistory);
    setStoreHistory(currentHistory);
  }, 0);

  //console.log("History :: insertHistory : current store->", storeHistory);
};

/**
 * メッセージ単体の追加
 * @param message 挿入するメッセージ
 * @returns
 */
export const addMessage = (message: IMessage) => {
  //メッセージひな形(バックエンドとバージョン違う時のデータ不足対策用)
  const messageTemplate: IMessage = {
    channelId: "",
    content: "",
    isEdited: false,
    createdAt: "",
    id: "",
    isSystemMessage: false,
    userId: "",
    MessageUrlPreview: [],
    MessageFileAttached: [],
    reactionSummary: [],
    replyingMessageId: null,
  };

  if (message === undefined)
    console.error("History :: addMessage : message is undefined");
  if (storeHistory[message.channelId] === undefined) return;
  if (storeHistory[message.channelId].atEnd === false) return;

  //格納(//メッセージひな形にマージする形で格納する)
  setStoreHistory(
    produce((history) => {
      history[message.channelId].history.unshift({
        ...messageTemplate,
        ...message,
      });
      trimToCap(history);
    }),
  );
};

/**
 * 履歴上の位置情報を更新する
 * @param _channelId 更新する履歴位置のチャンネルid
 * @param dat
 */
export const updateHistoryPosition = (
  _channelId: string,
  dat: { atEnd: boolean; atTop: boolean },
) => {
  const currentHistory = { ...storeHistory };
  if (currentHistory[_channelId] === undefined) {
    currentHistory[_channelId] = {
      atTop: dat.atTop,
      atEnd: dat.atEnd,
      history: [],
    };
  } else {
    currentHistory[_channelId] = {
      atTop: !currentHistory[_channelId].atTop
        ? dat.atTop
        : currentHistory[_channelId].atTop,
      atEnd: !currentHistory[_channelId].atEnd
        ? dat.atEnd
        : currentHistory[_channelId].atEnd,
      history: [...currentHistory[_channelId].history],
    };
  }

  setStoreHistory(currentHistory);
};
