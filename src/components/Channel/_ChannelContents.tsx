import { useParams } from "@solidjs/router";
import { Show, createEffect, createSignal, onCleanup, onMount, on, Index } from "solid-js";
import { setStoreHistory, storeHistory } from "~/stores/History";
import FetchHistory from "~/utils/FethchHistory";
import {IMessage} from "~/types/Message";
import {storeMyUserinfo} from "~/stores/MyUserinfo";
import { storeClientConfig } from "~/stores/ClientConfig";
import { Button } from "../ui/button";
import { IconArrowDown } from "@tabler/icons-solidjs";
import MessageDisplay from "./ChannelContent/MessageDisplay";

export default function ExpChannelContents() {
  const [isFocused, setIsFocused] = createSignal(true);
  const [editingMsgId, setEditingMsgId] = createSignal("");
  const param = useParams();
  const [currentChannelId, setCurrentChannelId] = createSignal<string>(param.channelId ?? "");
  let stateFetchingHistory = false;

  /**
   * 現在のスクロール位置を確認してから該当する履歴取得をする
   */
  const checkScrollPosAndFetchHistory = async () => {
    // todo
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

    //履歴取得状態解除
    stateFetchingHistory = false;
  }

  /**
   * スクロールの監視用
   * @param event
   */
  const handleScroll = (event: Event) => {
    //HTMLのものであることをTSに示すため
    if (event.target instanceof HTMLElement)
      //console.log("ChannelContents :: handleScroll : event->", event.target.scrollTop, event.target.scrollHeight - event.target.offsetHeight);

      checkScrollPosAndFetchHistory();
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
      //setCurrentChannelId(currentChannelId());
      checkScrollPosAndFetchHistory();
    })
  );

  createEffect(on(
    () => param.channelId,
    () => {
      if (param.channelId === undefined) return;
      setCurrentChannelId(param.channelId);
      console.log("ChannelContents :: createEffect : チャンネル切り替え検知", currentChannelId());
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
    document.removeEventListener("scroll", handleScroll);

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
        <div class="absolute bottom-10 right-10">
          <Button onClick={moveToNewest} class="w-16 h-16 z-50"><IconArrowDown style="height:28px; width:28px;" /></Button>
        </div>
      }
    </div>
  );
}
