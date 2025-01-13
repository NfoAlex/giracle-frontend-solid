import { createStore, produce } from "solid-js/store";
import type { IMessage } from "~/types/Message";

export const [storeHistory, setStoreHistory] = createStore<{
  [key: string]: {
    history: IMessage[];
    atTop: boolean;
    atEnd: boolean;
  };
}>({});

/**
 * 履歴Storeに挿入する
 * @param history
 */
export const insertHistory = (history: IMessage[]) => {
  if (history.length === 0) return;

  const currentHistory = { ...storeHistory };
  if (currentHistory[history[0].channelId] === undefined) {
    currentHistory[history[0].channelId] = {
      atEnd: true,
      atTop: true,
      history: history,
    };
  } else {
    //挿入する履歴が現在保持するものより新しいかどうかで順序を選ぶ
    if (
      history[0].createdAt.valueOf() >
      (currentHistory[history[0].channelId].history
        .at(-1)
        ?.createdAt.valueOf() || 0)
    ) {
      //最後だけ切る
      const trimmedHistory = history.slice(0,-1);
      currentHistory[history[0].channelId] = {
        ...currentHistory[history[0].channelId],
        history: [...trimmedHistory, ...currentHistory[history[0].channelId].history],
      };
    } else {
      //先頭だけ切る
      const trimmedHistory = history.slice(1);
      currentHistory[history[0].channelId] = {
        ...currentHistory[history[0].channelId],
        history: [...currentHistory[history[0].channelId].history, ...trimmedHistory],
      };
    }
  }

  setStoreHistory(currentHistory);

  //console.log("History :: insertHistory : current store->", storeHistory);
};

/**
 * メッセージ単体の追加
 * @param message 挿入するメッセージ
 * @returns 
 */
export const addMessage = (message: IMessage) => {
  if (message === undefined) console.error("History :: addMessage : message is undefined");
  if (storeHistory[message.channelId] === undefined) return;

  //格納
  setStoreHistory(produce((history) => {
    history[message.channelId].history.unshift(message);
  }));
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
