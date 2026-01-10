import { useParams } from "@solidjs/router";
import { Show, createEffect, createSignal, onCleanup, onMount, on, For } from "solid-js";
import { setStoreHistory, storeHistory } from "~/stores/History.ts";
import FetchHistory from "~/utils/FethchHistory.ts";
import {IMessage} from "~/types/Message.tsx";
import { storeClientConfig } from "~/stores/ClientConfig.ts";
import { Button } from "../ui/button.tsx";
import { IconArrowDown } from "@tabler/icons-solidjs";
import MessageDisplay from "./ChannelContent/MessageDisplay.tsx";
import { storeMessageReadTime, updateReadTime } from "~/stores/Readtime.ts";
import POST_MESSAGE_UPDATE_READTIME from "~/api/MESSAGE/MESSAGE_UPDATE_READTIME.ts";

const channelScrollPos: Map<string, number> = new Map();

export default function ChannelContents() {
  const param = useParams();
  const [isFocused, setIsFocused] = createSignal(true);
  const [currentChannelId, setCurrentChannelId] = createSignal<string>(param.channelId ?? "");
  //const [editingMsgId, setEditingMsgId] = createSignal("");
  let stateFetchingHistory = false;
  let scrollRafId = 0;

  const historyElementId = "history";
  const getHistoryElement = () => document.getElementById(historyElementId) as HTMLElement | null;

  const waitForDomToSettle = async () => {
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await new Promise((r) => requestAnimationFrame(() => r(null)));
  };

  //スクロール位置のアンカーを取得する
  const captureScrollAnchor = (container: HTMLElement): { id: string; offsetTopInContainer: number } | null => {
    const containerRect = container.getBoundingClientRect();
    const candidates = container.querySelectorAll<HTMLElement>("[id^='messageId::']");
    if (candidates.length === 0) return null;

    let bestEl: HTMLElement | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      const intersects = rect.bottom > containerRect.top && rect.top < containerRect.bottom;
      if (!intersects) continue;

      const distance = Math.abs(rect.top - containerRect.top);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestEl = el;
      }
    }

    if (!bestEl) return null;
    const bestRect = bestEl.getBoundingClientRect();
    return { id: bestEl.id, offsetTopInContainer: bestRect.top - containerRect.top };
  };

  //スクロール位置をアンカーから復元する
  const restoreScrollFromAnchor = async (
    container: HTMLElement,
    anchor: { id: string; offsetTopInContainer: number } | null,
  ) => {
    if (!anchor) return;
    await waitForDomToSettle();

    const anchorEl = document.getElementById(anchor.id) as HTMLElement | null;
    if (!anchorEl) return;

    const containerRect = container.getBoundingClientRect();
    const anchorRect = anchorEl.getBoundingClientRect();
    const newOffset = anchorRect.top - containerRect.top;
    const delta = newOffset - anchor.offsetTopInContainer;
    container.scrollTop += delta;
  };

  const isNearVisualTop = (container: HTMLElement, thresholdPx: number) => {
    // flex-col-reverse 前提: scrollTop=0 が「下（最新側）」、最大が「上（古い側）」
    const maxScrollTop = container.scrollHeight - container.clientHeight;
    const distanceToVisualTop = maxScrollTop - Math.abs(container.scrollTop);
    return distanceToVisualTop <= thresholdPx;
  };

  const isNearVisualBottom = (container: HTMLElement, thresholdPx: number) => {
    // flex-col-reverse 前提: scrollTop=0 が「下（最新側）」
    const distanceToVisualBottom = Math.abs(container.scrollTop);
    return distanceToVisualBottom <= thresholdPx;
  };

  /**
   * 現在のスクロール位置を確認してから該当する履歴取得をする
   * @param optionalRetry 再試行状態での実行するかどうか。基本的に履歴取得時に最新あるいは最古のメッセージIdが参照できなかったときのリトライに使う。
   */
  const checkScrollPosAndFetchHistory = async (optionalRetry = false) => {
    //console.log("_ChannelContents :: checkScrollPosAndFetchHistory : ", { stateFetchingHistory, isFocused: isFocused(), optionalRetry });
    //履歴の取得処理中、または再試行状態でないなら停止
    if (stateFetchingHistory && !optionalRetry) return;

    const channelId = currentChannelId();
    if (!channelId) return;
    const historyState = { ...storeHistory[channelId] };
    if (!historyState) return;

    //console.log("_ChannelContents :: checkScrollPosAndFetchHistory : historyState->", { atTop: historyState.atTop, atEnd: historyState.atEnd, history: historyState.history });

    const el = getHistoryElement();
    if (!el) return;

    const thresholdPx = 40;

    // 「上（古い側）」に到達 → older を追加取得
    if (!historyState.atTop && isNearVisualTop(el, thresholdPx)) {
      stateFetchingHistory = true;

      const anchor = captureScrollAnchor(el);
      const oldest = historyState?.history?.at(-1);
      await FetchHistory(
        channelId,
        {
          messageIdFrom: oldest?.id,
        },
        "older",
      );
      await restoreScrollFromAnchor(el, anchor);
      await waitForDomToSettle();
      stateFetchingHistory = false;
    }

    // 「下（新しい側）」に到達 → newer を追加取得（必要な場合）
    if (!historyState.atEnd && isNearVisualBottom(el, thresholdPx)) {
      stateFetchingHistory = true;

      const anchor = captureScrollAnchor(el);
      const newest = historyState?.history !== undefined ? historyState?.history[0] : undefined;
      //console.log("_ChannelContents :: checkScrollPosAndFetchHistory : newest", newest);
      if (newest === undefined) {
        stateFetchingHistory = false;
        //もし再試行での実行「でない」なら再試行状態で実行、これは遅延を置いた履歴取得トリガーのための措置（未来方向のみ）
        if (!optionalRetry) setTimeout(() => checkScrollPosAndFetchHistory(true), 0);
        return;
      }
      await FetchHistory(
        channelId,
        {
          messageIdFrom: newest.id,
        },
        "newer",
      );
      await restoreScrollFromAnchor(el, anchor);
      await waitForDomToSettle();
      stateFetchingHistory = false;
    }

    // 既読時間更新確認処理へ
    await checkAndUpdateReadTime();
  };

  let statusUpdatingReadTime = false;

  /**
   * 更新条件を確認して既読時間をサーバーに同期する
   */
  const checkAndUpdateReadTime = async () => {
    //もし既読時間更新中なら停止
    if (statusUpdatingReadTime) return;

    //チャンネルの末端に到達していなければ更新しない
    if (storeHistory[currentChannelId()]?.atEnd === false) return;
    //フォーカスしているか
    if (!isFocused()) return;
    //下にスクロールできているかどうか
    const el = getHistoryElement();
    if (!el) return;
    if (isNearVisualBottom(el, 40) === false) return;

    //最新メッセージの時間
    const latestMessageTime = storeHistory[currentChannelId()]?.history[0]?.createdAt;
    //現在の既読時間
    const currentReadTime = storeMessageReadTime.find((mrt) => {
      return mrt.channelId === currentChannelId();
    })?.readTime;
    //console.log("ChannelContents :: checkAndUpdateReadTime : latestMessageTime, currentReadTime->", latestMessageTime, currentReadTime);
    //更新の条件確認
    if (latestMessageTime === undefined) return;
    //現在の既読時間があるなら、最新メッセージ時間と比較して更新の必要があるかどうか調べる
    if (currentReadTime !== undefined) {
      if (new Date(currentReadTime).valueOf() >= new Date(latestMessageTime).valueOf()) return;
    }
    
    //既読時間更新中フラグを立てる
    statusUpdatingReadTime = true;
    
    //Storeでの既読時間を先に更新
    updateReadTime(currentChannelId(), latestMessageTime);
    //サーバーに同期
    await POST_MESSAGE_UPDATE_READTIME(
      currentChannelId(),
      latestMessageTime,
    )
      .catch((err) => {
        console.error("ChannelContents :: updateReadTime : err->", err);
      })
    statusUpdatingReadTime = false;
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
    const miliSecFiveMin = 1000 * 60 * 5;

    if (msgBehind === undefined) return false; //次のメッセージがない場合
    if (new Date(msgHere.createdAt).valueOf() - new Date(msgBehind.createdAt).valueOf() > miliSecFiveMin) return false; //5分以上の差がある場合
    if (storeHistory[currentChannelId()].history === undefined) return false; //履歴がない場合(一応のエラーcatch)
    if (storeHistory[currentChannelId()].history.length === index + 1) return false; //最後のメッセージの場合

    //最後に送信者が同じかどうか
    return storeHistory[currentChannelId()].history[index].userId ===
      storeHistory[currentChannelId()].history[index + 1].userId;
  };

  /**
   * 最新の履歴を取得して、移動する
   */
  const moveToNewest = async () => {
    //履歴取得状態を設定
    stateFetchingHistory = true;

    //履歴をStoreから削除
    setStoreHistory((prev) => {
      const newStore = { ...prev };
      newStore[currentChannelId()] = {
        atEnd: false,
        atTop: false,
        history: [],
      };
      return newStore;
    });
    await waitForDomToSettle();
    //取得して格納
    await FetchHistory(currentChannelId(), { messageTimeFrom: "", fetchLength: 15 }, "older");

    //スクロールを一番下に移動
    const el = getHistoryElement();
    if (el) {
      el.scrollTop = 0;
    }
    await waitForDomToSettle();

    //履歴取得状態解除
    stateFetchingHistory = false;
    //履歴取得処理
    checkScrollPosAndFetchHistory();
  };

  /**
   * 最新の既読時間にあたるメッセージへスクロールする
   * @returns
   */
  const scrollToLatestRead = () => new Promise((resolve) => {
    const targetEl = document.getElementById("NEW_LINE");
    if (targetEl === null) {
      resolve(void 0);
      return;
    };

    targetEl.scrollIntoView({ block: "center" });
    resolve(void 0);
    return;
  });

  /**
   * スクロールの監視用
   * @param event
   */
  const handleScroll = (event: Event) => {
    //HTMLのものであることをTSに示すため
    if (!(event.target instanceof HTMLElement)) return;
    //スクロール位置を保存
    channelScrollPos.set(currentChannelId(), event.target.scrollTop);

    //console.log("ChannelContents :: handleScroll : event->", event.target.scrollTop, event.target.scrollHeight - event.target.offsetHeight);
    if (scrollRafId) cancelAnimationFrame(scrollRafId);
    checkAndUpdateReadTime();
    scrollRafId = requestAnimationFrame(() => {
      scrollRafId = 0;
      checkScrollPosAndFetchHistory();
    });
  };

  //ウィンドウのフォーカス状態の切り替え用
  const setWindowFocused = () => {
    //もしフォーカスされていたらスクロール位置を確認して履歴を取得させる
    let flagWasFocused = false;
    if (!isFocused()) flagWasFocused = true;

    setIsFocused(true);
    //console.log("ChannelContents :: toggleWindowFocus : isFocused->", isFocused());

    if (flagWasFocused) checkScrollPosAndFetchHistory();
  };
  const unSetWindowFocused = () => {
    setIsFocused(false);
    //console.log("ChannelContents :: toggleWindowFocus : isFocused->", isFocused());
  };
  //上矢印キーハンドラ(編集モードに入るための処理)
  // const handleKeyUp = (event: KeyboardEvent) => {
  //   if (event.key === "ArrowUp" && editingMsgId() === "") {
  //     //履歴要素が取得できないなら停止
  //     const el = document.getElementById("history");
  //     if (el === null) return;
  //     //もしテキストが入力された状態なら停止
  //     const inputEl = document.getElementById("messageInput") as HTMLInputElement;
  //     if (inputEl.value !== "") return;

  //     //一番近い自分のメッセージを探して編集モードにする
  //     for (let i = 0; i < storeHistory[currentChannelId()]?.history.length; i++) {
  //       if (storeHistory[currentChannelId()]?.history[i].userId === storeMyUserinfo.id) {
  //         setEditingMsgId(storeHistory[currentChannelId()]?.history[i].id);
  //         return;
  //       }
  //     }
  //   }
  // };

  //履歴の更新監視
  createEffect(on(
    () => `${storeHistory[currentChannelId()]?.history.at(-1)?.id}`,
    () => {
      //console.log("ChannelContents :: createEffect : 履歴更新された", storeHistory[currentChannelId()]?.history);
      //既読時間を更新
      checkAndUpdateReadTime();

      //もしチャンネルの先端あるいは末端に到達していないならもう一度調べる
      if (!storeHistory[currentChannelId()]?.atEnd || !storeHistory[currentChannelId()]?.atTop) {
        checkScrollPosAndFetchHistory();
      }
    })
  );

  createEffect(on(
    () => param.channelId,
    async (_, prevChannelId) => {
      if (param.channelId === undefined) return;
      setCurrentChannelId(param.channelId);
      //移動前チャンネルの新着線用比較時間を更新
      if (prevChannelId !== undefined) {
        const currentReadTimeForPrevChannel = storeMessageReadTime.find((mrt) => {
          return mrt.channelId === prevChannelId;
        })?.readTime;

        if (currentReadTimeForPrevChannel !== undefined) {
          updateReadTime(prevChannelId, currentReadTimeForPrevChannel);
        }
      }

      //既読時間取得
      const latestReadTime = storeMessageReadTime.find((mrt) => {
        return mrt.channelId === currentChannelId();
      });

      //履歴を取得する必要があるかどうか確認
      const historyNeeded = storeHistory[currentChannelId()] === undefined ||
        storeHistory[currentChannelId()]?.history === undefined ||
        storeHistory[currentChannelId()]?.history.length === 0;

      //必要無し :: その場で履歴取得条件確認
      if (!historyNeeded) {
        const el = getHistoryElement();
        //スクロール位置復元、無いなら最新既読位置へ
        if (channelScrollPos.has(currentChannelId()) && el !== null) {
          await waitForDomToSettle();
          el.scrollTop = channelScrollPos.get(currentChannelId()) ?? 0;
        } else {
          await scrollToLatestRead();
        }
        checkScrollPosAndFetchHistory();
        return;
      }

      //必要あり :: 履歴を取得して格納、その後履歴取得条件確認
      stateFetchingHistory = true;
      await FetchHistory(currentChannelId(), { messageTimeFrom: latestReadTime?.readTime, fetchLength: 3 }, "newer");
      const el = getHistoryElement();
      //スクロール位置復元、無いなら最新既読位置へ
      if (channelScrollPos.has(currentChannelId()) && el !== null) {
        await waitForDomToSettle();
        el.scrollTop = channelScrollPos.get(currentChannelId()) ?? 0;
      } else {
        await scrollToLatestRead();
      }
      stateFetchingHistory = false;
      checkScrollPosAndFetchHistory();
    }
  ));

  onMount(() => {
    //fetchHistory();
    const el = document.getElementById("history");
    if (el === null) return;
    el.addEventListener("scroll", handleScroll);

    window.addEventListener("focus", setWindowFocused);
    window.addEventListener("blur", unSetWindowFocused);
    //window.addEventListener("keyup", handleKeyUp);
  });

  onCleanup(() => {
    const el = getHistoryElement();
    if (el) el.removeEventListener("scroll", handleScroll);

    window.removeEventListener("focus", setWindowFocused);
    window.removeEventListener("blur", unSetWindowFocused);
    //window.removeEventListener("keyup", handleKeyUp);
  });

  return (
    <div class="relative w-full overflow-y-auto grow">
      <div
        id="history"
        class={`h-full w-full overflow-y-auto flex flex-col-reverse gap-${storeClientConfig.display.messageGapLevel}`}
      >
        <For each={storeHistory[currentChannelId()]?.history}>
          {(h, index) => (
            <MessageDisplay
              message={h}
              messageArrayIndex={index()}
              displayAvatar={!sameSenderAsNext(index())}
            />
          )}
        </For>

        <Show when={storeHistory[currentChannelId()]?.atTop}>
          <p>履歴の末端まで到達しました。</p>
        </Show>
      </div>

      {
        !storeHistory[currentChannelId()]?.atEnd
        &&
        <div class="absolute bottom-10 right-10 z-10">
          <Button onClick={moveToNewest} class="w-16 h-16"><IconArrowDown style="height:28px; width:28px;" /></Button>
        </div>
      }
    </div>
  );
}
