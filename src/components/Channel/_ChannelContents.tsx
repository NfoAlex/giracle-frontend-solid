import { useParams } from "@solidjs/router";
import { Show, createEffect, createSignal, onCleanup, onMount, on, Index } from "solid-js";
import { setStoreHistory, storeHistory } from "~/stores/History.ts";
import FetchHistory from "~/utils/FethchHistory.ts";
import {IMessage} from "~/types/Message.tsx";
import {storeMyUserinfo} from "~/stores/MyUserinfo.ts";
import { storeClientConfig } from "~/stores/ClientConfig.ts";
import { Button } from "../ui/button.tsx";
import { IconArrowDown } from "@tabler/icons-solidjs";
import MessageDisplay from "./ChannelContent/MessageDisplay.tsx";
import { storeMessageReadTime, updateReadTime } from "~/stores/Readtime.ts";
import POST_MESSAGE_UPDATE_READTIME from "~/api/MESSAGE/MESSAGE_UPDATE_READTIME.ts";

export default function ExpChannelContents() {
  const [isFocused, setIsFocused] = createSignal(true);
  const [editingMsgId, setEditingMsgId] = createSignal("");
  const param = useParams();
  const [currentChannelId, setCurrentChannelId] = createSignal<string>(param.channelId ?? "");
  let stateFetchingHistory = false;
  let scrollRafId = 0;
  let lastFetchAt = 0;

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
   */
  const checkScrollPosAndFetchHistory = async () => {
    if (!isFocused()) return;
    if (stateFetchingHistory) return;

    const channelId = currentChannelId();
    if (!channelId) return;
    const historyState = storeHistory[channelId];
    if (!historyState) return;

    const el = getHistoryElement();
    if (!el) return;

    // 連打防止（スクロール監視・createEffectの両方から呼ばれるため）
    const now = Date.now();
    if (now - lastFetchAt < 100) return;

    const thresholdPx = 40;

    // 「上（古い側）」に到達 → older を追加取得
    if (!historyState.atTop && isNearVisualTop(el, thresholdPx)) {
      lastFetchAt = now;
      stateFetchingHistory = true;

      const anchor = captureScrollAnchor(el);
      const oldest = historyState.history.at(-1);
      await FetchHistory(
        channelId,
        {
          messageIdFrom: oldest?.id,
          messageTimeFrom: oldest?.createdAt,
        },
        "older",
      );
      await restoreScrollFromAnchor(el, anchor);
      await waitForDomToSettle();
      stateFetchingHistory = false;
      checkScrollPosAndFetchHistory();
      return;
    }

    // 「下（新しい側）」に到達 → newer を追加取得（必要な場合）
    if (!historyState.atEnd && isNearVisualBottom(el, thresholdPx)) {
      lastFetchAt = now;
      stateFetchingHistory = true;

      const anchor = captureScrollAnchor(el);
      const newest = historyState.history[0];
      await FetchHistory(
        channelId,
        {
          messageIdFrom: newest?.id,
        },
        "newer",
      );
      await restoreScrollFromAnchor(el, anchor);
      await waitForDomToSettle();
      stateFetchingHistory = false;
      checkScrollPosAndFetchHistory();
    }

    // 「下（新しい側）」に到達していて、かつ既読時間が最新メッセージ以降であれば、既読時間を更新する
    checkAndUpdateReadTime();
  };

  /**
   * 更新条件を確認して既読時間をサーバーに同期する
   */
  const checkAndUpdateReadTime = async () => {
    //チャンネルの末端に到達していなければ更新しない
    if (storeHistory[currentChannelId()]?.atEnd === false) return;
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
    //更新の条件確認
    if (latestMessageTime === undefined || currentReadTime === undefined) return;
    if (new Date(currentReadTime).valueOf() >= new Date(latestMessageTime).valueOf()) return;

    await POST_MESSAGE_UPDATE_READTIME(
      currentChannelId(),
      latestMessageTime,
    )
      .then((res) => {
        console.log("ChannelContents :: updateReadTime : res->", res);
      })
      .catch((err) => {
        console.error("ChannelContents :: updateReadTime : err->", err);
      });
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
      newStore[currentChannelId()].history = [];
      return newStore;
    });
    //取得して格納
    await FetchHistory(currentChannelId(), { messageTimeFrom: "" }, "older");

    //スクロールを一番下に移動
    const el = getHistoryElement();
    if (el) {
      await waitForDomToSettle();
      el.scrollTop = 0;
    }

    //履歴取得状態解除
    stateFetchingHistory = false;
  }

  /**
   * スクロールの監視用
   * @param event
   */
  const handleScroll = (event: Event) => {
    //HTMLのものであることをTSに示すため
    if (!(event.target instanceof HTMLElement)) return;

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
  }
  const unSetWindowFocused = () => {
    setIsFocused(false);
    //console.log("ChannelContents :: toggleWindowFocus : isFocused->", isFocused());
  }
  //上矢印キーハンドラ(編集モードに入るための処理)
  const handleKeyUp = (event: KeyboardEvent) => {
    if (event.key === "ArrowUp" && editingMsgId() === "") {
      //履歴要素が取得できないなら停止
      const el = document.getElementById("history");
      if (el === null) return;
      //もしテキストが入力された状態なら停止
      const inputEl = document.getElementById("messageInput") as HTMLInputElement;
      if (inputEl.value !== "") return;

      //一番近い自分のメッセージを探して編集モードにする
      for (let i = 0; i < storeHistory[currentChannelId()]?.history.length; i++) {
        if (storeHistory[currentChannelId()]?.history[i].userId === storeMyUserinfo.id) {
          setEditingMsgId(storeHistory[currentChannelId()]?.history[i].id);
          return;
        }
      }
    }
  };

  //履歴の更新監視
  createEffect(
    on(() => `${storeHistory[currentChannelId()]?.history[0]?.id}:${storeHistory[currentChannelId()]?.history.at(-1)?.id}`, () => {
      console.log("ChannelContents :: createEffect : 履歴更新された");
    })
  );

  createEffect(on(
    () => param.channelId,
    (_, prevChannelId) => {
      if (param.channelId === undefined) return;
      setCurrentChannelId(param.channelId);
      //移動前チャンネルの新着線用比較時間を更新
      if (prevChannelId !== undefined) {
        const currentReadTimeForPrevChannel = storeMessageReadTime.find((mrt) => {
          return mrt.channelId === prevChannelId;
        })?.readTime;
        if (currentReadTimeForPrevChannel === undefined) return;
        updateReadTime(prevChannelId, currentReadTimeForPrevChannel);
      }
      
      //既読時間取得
      const latestReadTime = storeMessageReadTime.find((mrt) => {
        return mrt.channelId === currentChannelId();
      });
      //履歴を取得する必要があるかどうか確認
      const noHistory = storeHistory[currentChannelId()] === undefined ||
        storeHistory[currentChannelId()]?.history === undefined ||
        storeHistory[currentChannelId()]?.history.length === 0;
      //必要無し :: その場で履歴取得条件確認
      if (!noHistory) {
        checkScrollPosAndFetchHistory();
        return;
      };
      //必要あり :: 履歴を取得して格納、その後履歴取得条件確認
      FetchHistory(currentChannelId(), { messageTimeFrom: latestReadTime?.readTime ?? "", fetchLength: 1 }, "older")
        .then(() => checkScrollPosAndFetchHistory());
    }
  ))

  onMount(() => {
    //fetchHistory();
    const el = document.getElementById("history");
    if (el === null) return;
    el.addEventListener("scroll", handleScroll);

    window.addEventListener("focus", setWindowFocused);
    window.addEventListener("blur", unSetWindowFocused);
    window.addEventListener("keyup", handleKeyUp);
  });

  onCleanup(() => {
    const el = getHistoryElement();
    if (el) el.removeEventListener("scroll", handleScroll);

    window.removeEventListener("focus", setWindowFocused);
    window.removeEventListener("blur", unSetWindowFocused);
    window.removeEventListener("keyup", handleKeyUp);
  });

  return (
    <div class="relative w-full overflow-y-auto grow">
      <div
        id="history"
        class={`h-full w-full overflow-y-auto flex flex-col-reverse gap-${storeClientConfig.display.messageGapLevel}`}
      >
        <Index each={storeHistory[currentChannelId()]?.history}>
          {(h, index) => (
            <MessageDisplay
              message={h()}
              messageArrayIndex={index}
              displayAvatar={!sameSenderAsNext(index)}
            />
          )}
        </Index>

        <Show when={storeHistory[currentChannelId()]?.atTop}>
          <p>履歴の末端まで到達しました。</p>
        </Show>
      </div>

      { !storeHistory[currentChannelId()]?.atEnd &&
        <div class="absolute bottom-10 right-10 z-10">
          <Button onClick={moveToNewest} class="w-16 h-16"><IconArrowDown style="height:28px; width:28px;" /></Button>
        </div>
      }
    </div>
  );
}
