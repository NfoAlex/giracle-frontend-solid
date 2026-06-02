import { useBeforeLeave, useParams } from "@solidjs/router";
import { Show, createEffect, createSignal, onCleanup, onMount, on, For } from "solid-js";
import { insertHistory, setStoreHistory, setStoreImageDimensions, storeHistory, updateHistoryPosition } from "~/stores/History.ts";
import type { IMessage } from "~/types/Message.tsx";
import { storeClientConfig } from "~/stores/ClientConfig.ts";
import { Button } from "../ui/button.tsx";
import { IconArrowDown } from "@tabler/icons-solidjs";
import MessageDisplay from "./ChannelContent/MessageDisplay.tsx";
import { setStoreMessageReadTime, storeMessageReadTime } from "~/stores/Readtime.ts";
import POST_MESSAGE_UPDATE_READTIME from "~/api/MESSAGE/MESSAGE_UPDATE_READTIME.ts";
import { storeMyUserinfo } from "~/stores/MyUserinfo.ts";
import POST_CHANNEL_GET_HISTORY from "~/api/CHANNEL/CHANNEL_GET_HISTORY.ts";
import { produce } from "solid-js/store";
import SkeletonLoader from "./ChannelContent/SkeletonLoader.tsx";

const channelScrollPos: Map<string, number> = new Map();

export default function ChannelContents() {
  const param = useParams();
  const [isWindowFocused, setIsWindowFocused] = createSignal(true);
  const [currentChannelId, setCurrentChannelId] = createSignal<string>(param.channelId ?? "");
  const [editingMsgId, setEditingMsgId] = createSignal("");

  const historyElementId = "history";
  let globalStateFetchingHistory = false;

  const FnBrowserApis = {

    getHistoryElement: () => {
      const container = document.getElementById(historyElementId) as HTMLElement | null;
      if (!container) return null;

      return container;
    },

    /**
     * 履歴表示上で画面上部に近いかどうか
     * @param container 履歴表示要素
     * @param thresholdPx 画面上部からの距離
     * @returns
     */
    isScrolledToNearTop: (thresholdPx: number = 350) => {
      const container = FnBrowserApis.getHistoryElement();
      if (!container) return null;

      // flex-col-reverse 前提: scrollTop=0 が「下（最新側）」、最大が「上（古い側）」
      const maxScrollTop = container.scrollHeight - container.clientHeight;
      const distanceToVisualTop = maxScrollTop - Math.abs(container.scrollTop);
      return distanceToVisualTop <= thresholdPx;
    },

    /**
     * 履歴表示上で画面下部に近いかどうか
     * @param container 履歴表示要素
     * @param thresholdPx 画面下部からの距離
     * @returns
     */
    isScrolledToVisualBottom: (thresholdPx: number = 350) => {
      const container = FnBrowserApis.getHistoryElement();
      if (!container) return null;

      // flex-col-reverse 前提: scrollTop=0 が「下（最新側）」
      const distanceToVisualBottom = Math.abs(container.scrollTop);
      return distanceToVisualBottom <= thresholdPx;
    },

    waitForDomToSettle: async () => {
      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    },

    /**
     * 履歴スクロール前のメッセージIdと移動量をアンカーとして書き出す
     */
    captureScrollAnchor: (): { id: string; offsetTopInContainer: number } | null => {
      const container = FnBrowserApis.getHistoryElement();
      if (!container) return null;

      const containerRect = container.getBoundingClientRect();
      const candidates = container.querySelectorAll<HTMLElement>("[id^='messageId::']");
      if (candidates.length === 0) return null;

      let bestMessageEl: HTMLElement | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (const el of candidates) {
        const rect = el.getBoundingClientRect();
        const intersects = rect.bottom > containerRect.top && rect.top < containerRect.bottom;
        if (!intersects) continue;

        const distance = Math.abs(rect.top - containerRect.top);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestMessageEl = el;
        }
      }

      if (!bestMessageEl) return null;
      const bestRect = bestMessageEl.getBoundingClientRect();
      return { id: bestMessageEl.id, offsetTopInContainer: bestRect.top - containerRect.top };
    },

    /**
     * 履歴表示コンテナ上のスクロール位置を指定メッセージIdと移動量をもとにスクロールさせる
     */
    restoreScrollFromAnchor: async (
      anchor: { id: string; offsetTopInContainer: number } | null,
    ) => {
      if (!anchor) return;
      //await FnBrowserApis.waitForDomToSettle();

      const container = FnBrowserApis.getHistoryElement();
      if (!container) return;
      const anchorEl = document.getElementById(anchor.id) as HTMLElement | null;
      if (!anchorEl) return;

      const containerRect = container.getBoundingClientRect();
      const anchorRect = anchorEl.getBoundingClientRect();
      const newOffset = anchorRect.top - containerRect.top;
      const delta = newOffset - anchor.offsetTopInContainer;
      container.scrollTop += delta;
    },

  }

  const FnHistoryControllers = {

    /**
     * 履歴の取得、挿入
     */
    fetchHistory: async (
      _channelId: string,
      _dat: {
        messageIdFrom?: string | undefined;
        messageTimeFrom?: string | undefined;
        fetchLength?: number | undefined;
      },
      _direction: "older" | "newer" = "older",
    ) => {
      if (globalStateFetchingHistory) return;
      globalStateFetchingHistory = true;

      //下向きにスクロールを自動化するためのもの（履歴配列表示がflex-reverseで下基準なので）
      let anchor = null;
      anchor = FnBrowserApis.captureScrollAnchor();

      await POST_CHANNEL_GET_HISTORY(
        _channelId,
        _dat.messageIdFrom,
        _dat.messageTimeFrom,
        _dat.fetchLength,
        _direction,
      )
        .then(async (r) => {
          //console.log("ChannelContent :: FnHistoryController.fetchHistory : r->", r);
          //if (r.data.history.length === 0) { console.log("ChannelContent :: fetchHistory : 履歴がありません"); return; }
          updateHistoryPosition(_channelId, {
            atEnd: r.data.atEnd,
            atTop: r.data.atTop,
          });
          setStoreImageDimensions(produce(prev => (Object.assign(prev, r.data.ImageDimensions))));
          insertHistory(r.data.history);

          await FnBrowserApis.waitForDomToSettle();
          FnBrowserApis.restoreScrollFromAnchor(anchor);
        })
        .catch((e) =>
          console.error("ChannelContent :: FnHistoryControllers.fetchHistory : エラー->", _dat, e),
        )
        .finally(() => {
          globalStateFetchingHistory = false;
        });
    },

    /**
     * 画面内にメッセージがあればそこにスクロールする
     */
    scrollToMessage: (messageId: string) => {
      const messageElement = document.getElementById(`message-${messageId}`);
      if (!messageElement) return;
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }

  };

  const FnGiracleServices = {

    /**
     * 既読時間を更新する
     */
    tryUpdateReadTime: async () => {
      if (storeHistory[currentChannelId()]?.atEnd === false) return;
      if (!isWindowFocused()) return;

      //既読時間Storeの時間と最新メッセージの時間を比較
      const latestMessageTime = storeHistory[currentChannelId()]?.history[0]?.createdAt;
      if (latestMessageTime === undefined) return;
      const currentReadTime = storeMessageReadTime.find((readTimeJson) => {
        return readTimeJson.channelId === currentChannelId();
      })?.readTime;
      //既読時間がそもそも無い場合は最新メッセージ時間を既読時間として保存する
      if (currentReadTime === undefined) {
        await POST_MESSAGE_UPDATE_READTIME(
          currentChannelId(),
          latestMessageTime,
        )
          .then(() => {
            setStoreMessageReadTime((prev) => {
              const newReadTime = {
                channelId: currentChannelId(),
                readTime: latestMessageTime,
                readTimeBefore: latestMessageTime
              };
              const newStore = prev.filter((c) => c.channelId !== currentChannelId());
              newStore.push({ ...newReadTime });
              return newStore;
            });
          })
          .catch((err) => {
            console.error("ChannelContents :: FnGiracleServices.tryUpdateReadTime : err->", err);
          });

        return;
      }

      if (new Date(currentReadTime).valueOf() >= new Date(latestMessageTime).valueOf()) return;

      //Store更新してからサーバーに同期
      setStoreMessageReadTime((prev) => {
        const newReadTime = {
          channelId: currentChannelId(),
          readTime: latestMessageTime,
          readTimeBefore: currentReadTime
        };
        const newStore = prev.filter((c) => c.channelId !== currentChannelId());
        newStore.push({ ...newReadTime });
        return newStore;
      });
      //サーバーに同期してStore更新
      await POST_MESSAGE_UPDATE_READTIME(
        currentChannelId(),
        latestMessageTime,
      )
        .catch((err) => {
          console.error("ChannelContents :: FnGiracleServices.tryUpdateReadTime : err->", err);
        });
    },

  };

  interface IExecutorOptionInput {
    tryUpdateReadTime: Parameters<typeof FnGiracleServices.tryUpdateReadTime>,
    fetchHistory: Parameters<typeof FnHistoryControllers.fetchHistory>,
    scrollToMessage: Parameters<typeof FnHistoryControllers.scrollToMessage>,
    waitToDraw: []
  };
  type TExecutorQueueItem = {
    [K in keyof IExecutorOptionInput]: {
      action: K;
      option?: IExecutorOptionInput[K];
    };
  }[keyof IExecutorOptionInput];

  const FnExecutor = {

    execute: async (queue: TExecutorQueueItem[]) => {
      //コンテナ上のスクロール制御用
      const stateAnchor: {
        isRegistered: boolean;
        data: {
          id: string;
          offsetTopInContainer: number;
        } | null
      } = {
        isRegistered: false,
        data: {
          id: "",
          offsetTopInContainer: 0,
        }
      };

      for (const q of queue) {
        switch (q.action) {
          case "tryUpdateReadTime":
            await FnGiracleServices.tryUpdateReadTime();
            break;

          case "fetchHistory":
            if (q.option === undefined) {
              console.error("ChannelContent :: FnExecutor(fetchHistory) : エラー[optionが関数にあっていません]", q);
              break;
            };
            await FnHistoryControllers.fetchHistory(
              q.option[0], //channelId
              q.option[1], //dat
              q.option[2], //direction
            );
            break;

          case "scrollToMessage":
            if (q.option === undefined) {
              console.error("ChannelContent :: FnExecutor(scrollToMessage) : エラー[optionが関数にあっていません]", q);
              break;
            };
            FnHistoryControllers.scrollToMessage(
              q.option[0], //messageId
            );
            break;

          case "waitToDraw":
            await FnBrowserApis.waitForDomToSettle();
            break;
        };
      }
    },

    checkConditionToFecthHistory: async () => {
      if (!globalStateChannelMoveDone) return;

      const currentChannelIdNow = currentChannelId();

      const isHistoryAtEnd = storeHistory[currentChannelIdNow]?.atEnd;
      const isHistoryAtTop = storeHistory[currentChannelIdNow]?.atTop;
      const containerAtTop = FnBrowserApis.isScrolledToNearTop();
      const containerAtBottom = FnBrowserApis.isScrolledToVisualBottom();

      const historyState = { ...storeHistory[currentChannelIdNow] };
      if (!historyState) return;

      //console.log("ChannelContent :: checkConditionToFetchHistory : トリガー");

      let checkCanFetchForOlder = () => !isHistoryAtTop && containerAtTop;
      let checkCanFetchForNewer = () => !isHistoryAtEnd && containerAtBottom;
      let flagFetchedHistory = false;

      if (checkCanFetchForOlder()) {
        const oldest = historyState?.history?.at(-1);
        //console.log("ChannelContent :: FnExecutor.checkConditionToFetchHistory : 古い方向に取得🔷", { isHistoryAtEnd, isHistoryAtTop, containerAtTop, containerAtBottom });
        await FnExecutor.execute([
          { action: "fetchHistory", option: [currentChannelIdNow, { messageIdFrom: oldest?.id }, "older"] },
          { action: "waitToDraw" }
        ]);
        flagFetchedHistory = true;
      }
      if (checkCanFetchForNewer()) {
        const newest = historyState?.history !== undefined ? historyState?.history[0] : undefined;
        //console.log("ChannelContent :: FnExecutor.checkConditionToFetchHistory : 新しい方向に取得🔶", { isHistoryAtEnd, isHistoryAtTop, containerAtTop, containerAtBottom });
        await FnExecutor.execute([
          { action: "fetchHistory", option: [currentChannelIdNow, { messageIdFrom: newest?.id }, "newer"] },
          { action: "waitToDraw" },
          { action: "tryUpdateReadTime" }
        ]);
        flagFetchedHistory = true;
      }

      if (flagFetchedHistory) FnExecutor.checkConditionToFecthHistory();
    },

    executePreset: {
      /**
       * 最新位置へ表示履歴を移動
       */
      moveToNewest: () => {
        setStoreHistory((prev) => {
          const newStore = { ...prev };
          newStore[currentChannelId()] = {
            atEnd: false,
            atTop: false,
            history: [],
          };
          return newStore;
        });

        FnExecutor.execute([
          { action: "fetchHistory", option: [currentChannelId(), { messageIdFrom: "", fetchLength: 20 }, "older"] }
        ]);
      },

      /**
       * 特定のメッセージへ履歴を移動してスクロールする
       *
       * @param messageId 移動先のメッセージID
       */
      moveToTargetMessage: (messageId: string) => {
        setStoreHistory((prev) => {
          const newStore = { ...prev };
          newStore[currentChannelId()] = {
            atEnd: false,
            atTop: false,
            history: [],
          };
          return newStore;
        });

        FnExecutor.execute([
          { action: "fetchHistory", option: [currentChannelId(), { messageIdFrom: messageId }, "older"] },
          { action: "waitToDraw" },
          { action: "fetchHistory", option: [currentChannelId(), { messageIdFrom: messageId }, "newer"] },
          { action: "waitToDraw" },
          { action: "scrollToMessage", option: [messageId] },
        ])
      }
    }

  };

  /**
   * 一つ次のメッセージ(新しい方が)が同じ送信者であるかどうか
   * @param index
   */
  const sameSenderAsNext = (index: number): boolean => {
    //メッセオブジェクト取得
    const msgHere = storeHistory[currentChannelId()].history[index];
    const msgBehind: IMessage | undefined = storeHistory[currentChannelId()].history[index + 1];
    //5分を比較するための変数(ミリ秒)
    const msFiveMin = 1000 * 60 * 5;

    if (msgBehind === undefined) return false; //次のメッセージがない場合
    if (new Date(msgHere.createdAt).valueOf() - new Date(msgBehind.createdAt).valueOf() > msFiveMin) //5分以上の差がある場合
      return false;
    if (storeHistory[currentChannelId()].history === undefined) return false; //履歴がない場合(一応のエラーcatch)
    if (storeHistory[currentChannelId()].history.length === index + 1) return false; //最後のメッセージの場合

    //最後に送信者が同じかどうか
    return storeHistory[currentChannelId()].history[index].userId ===
      storeHistory[currentChannelId()].history[index + 1].userId;
  };

  /**
   * ブラウザでの入力系のEventListener用関数群
   */
  const BrowserEventHandlers = {
    /**
     * 上矢印キーリスナー。編集モードショートカット
     */
    KeyArrowUp: (event: KeyboardEvent) => {
      if (event.key === "ArrowUp" && editingMsgId() === "") {
        //もしテキストが入力された状態なら停止
        const inputEl = document.getElementById("messageInput") as HTMLInputElement | null;
        if (inputEl && inputEl.value !== "") return;

        //一番近い自分のメッセージを探して編集モードにする
        const history = storeHistory[currentChannelId()]?.history;
        if (!history) return;
        for (let i = 0; i < history.length; i++) {
          if (history[i].userId === storeMyUserinfo.id) {
            event.preventDefault(); // スクロールを防ぐ
            setEditingMsgId(history[i].id);
            return;
          }
        }
      }
    },

    ScrollFns: {
      handler: (event: Event) => {
        FnExecutor.checkConditionToFecthHistory();
      },
    },

    /**
     * Windowのフォーカス操作
     */
    windowFocusFns: {
      setTrue: () => {
        //もしフォーカスされていたらスクロール位置を確認して履歴を取得させる
        //let flagWasFocused = false;
        //if (!isWindowFocused()) flagWasFocused = true;

        setIsWindowFocused(true);
        //console.log("ChannelContents :: toggleWindowFocus : isFocused->", isFocused());

        //if (flagWasFocused) FnExecutor.checkConditionToFecthHistory();
        //FnExecutor.checkConditionToFecthHistory();
        FnExecutor.execute([{ action: "waitToDraw" }, { action: "tryUpdateReadTime" }]);
      },
      setFalse: () => {
        setIsWindowFocused(false);
        //console.log("ChannelContents :: toggleWindowFocus : isFocused->", isFocused());
      }
    }
  };

  //履歴の最新部分更新監視
  createEffect(on(
    () => `${storeHistory[currentChannelId()]?.history.at(-1)?.id}`,
    async () => {
      if (globalStateFetchingHistory) return;
      await FnGiracleServices.tryUpdateReadTime();
    })
  );

  let globalStateChannelMoveDone = false;
  useBeforeLeave(() => {
    globalStateChannelMoveDone = false;

    const target = FnBrowserApis.getHistoryElement();
    if (target) {
      channelScrollPos.set(currentChannelId(), target.scrollTop);
    }
  });

  //チャンネル移動監視
  createEffect(on(
    () => [param.channelId, param.messageId],
    async ([currentChId, currentMsgId], prevArgs) => {
      console.log("ChannelContent :: createEffect : currentChId", currentChId);
      if (currentChId === undefined) return;

      setCurrentChannelId(currentChId);

      const el = FnBrowserApis.getHistoryElement();
      //スクロール位置復元、無いなら最新既読位置へ
      if (channelScrollPos.has(currentChannelId()) && el !== null) {
        await FnExecutor.execute([{ action: "waitToDraw" }]);
        el.scrollTop = channelScrollPos.get(currentChannelId()) ?? 0;
      } else {
        //await JHistoryController.scrollToLatestRead();
      }

      const readTime = storeMessageReadTime.find((readTimeObj) => {
        return readTimeObj.channelId === currentChId;
      })?.readTime;

      //履歴がStoreにそもそも無いとき
      if (storeHistory[currentChannelId()] === undefined) {
        await FnExecutor.execute([
          { action: "fetchHistory", option: [currentChannelId(), { messageTimeFrom: readTime, fetchLength: 20 }, "older"] },
          { action: "waitToDraw" }
        ]);
      }

      globalStateChannelMoveDone = true;
      FnExecutor.checkConditionToFecthHistory();
    }
  ));

  onMount(() => {
    const el = FnBrowserApis.getHistoryElement();
    if (el === null) return;
    el.addEventListener("scroll", BrowserEventHandlers.ScrollFns.handler);

    window.addEventListener("focus", BrowserEventHandlers.windowFocusFns.setTrue);
    window.addEventListener("blur", BrowserEventHandlers.windowFocusFns.setFalse);
    window.addEventListener("keydown", BrowserEventHandlers.KeyArrowUp);
  });

  onCleanup(() => {
    const el = FnBrowserApis.getHistoryElement();
    if (el) el.removeEventListener("scroll", BrowserEventHandlers.ScrollFns.handler);

    window.removeEventListener("focus", BrowserEventHandlers.windowFocusFns.setTrue);
    window.removeEventListener("blur", BrowserEventHandlers.windowFocusFns.setFalse);
    window.removeEventListener("keydown", BrowserEventHandlers.KeyArrowUp);
  });

  return (
    <div class="relative w-full overflow-y-auto grow">
      <div
        id="history"
        class={`h-full w-full overflow-y-auto flex flex-col-reverse gap-${storeClientConfig.display.messageGapLevel}`}
      >
        <Show when={!storeHistory[currentChannelId()]?.atEnd}>
          <div class="flex flex-col gap-4">
            <SkeletonLoader />
            <SkeletonLoader />
            <SkeletonLoader />
          </div>
        </Show>

        <For each={storeHistory[currentChannelId()]?.history}>
          {(h, index) => (
            <MessageDisplay
              message={h}
              messageArrayIndex={index()}
              displayAvatar={!sameSenderAsNext(index())}
              triggerEdit={() => editingMsgId() === h.id}
              onExitEdit={() => setEditingMsgId("")}
            />
          )}
        </For>

        <Show when={!storeHistory[currentChannelId()]?.atTop}>
          <div class="flex flex-col gap-4">
            <SkeletonLoader />
            <SkeletonLoader />
            <SkeletonLoader />
          </div>
        </Show>

        <Show when={storeHistory[currentChannelId()]?.atTop}>
          <p>履歴の末端まで到達しました。</p>
        </Show>
      </div>

      { //TODO :: 最新に戻るボタン
        !storeHistory[currentChannelId()]?.atEnd
        &&
        <div class="absolute bottom-10 right-10 z-10">
          <Button onClick={FnExecutor.executePreset.moveToNewest} class="w-16 h-16"><IconArrowDown style="height:28px; width:28px;" /></Button>
        </div>
      }
    </div>
  );
}
