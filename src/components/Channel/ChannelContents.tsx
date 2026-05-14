import { useParams } from "@solidjs/router";
import { Show, createEffect, createSignal, onCleanup, onMount, on, For } from "solid-js";
import { insertHistory, setStoreHistory, setStoreImageDimensions, storeHistory, updateHistoryPosition } from "~/stores/History.ts";
import FetchHistory from "~/utils/FethchHistory.ts";
import type { IMessage } from "~/types/Message.tsx";
import { storeClientConfig } from "~/stores/ClientConfig.ts";
import { Button } from "../ui/button.tsx";
import { IconArrowDown } from "@tabler/icons-solidjs";
import MessageDisplay from "./ChannelContent/MessageDisplay.tsx";
import { storeMessageReadTime, updateReadTime } from "~/stores/Readtime.ts";
import POST_MESSAGE_UPDATE_READTIME from "~/api/MESSAGE/MESSAGE_UPDATE_READTIME.ts";
import { storeMyUserinfo } from "~/stores/MyUserinfo.ts";
import POST_CHANNEL_GET_HISTORY from "~/api/CHANNEL/CHANNEL_GET_HISTORY.ts";
import { produce } from "solid-js/store";

const channelScrollPos: Map<string, number> = new Map();

export default function ChannelContents() {
  const param = useParams();
  const [isWindowFocused, setIsWindowFocused] = createSignal(true);
  const [currentChannelId, setCurrentChannelId] = createSignal<string>(param.channelId ?? "");
  const [editingMsgId, setEditingMsgId] = createSignal("");
  let stateFetchingHistory = false;
  let scrollRafId = 0;

  const historyElementId = "history";
  const getHistoryElement = () => document.getElementById(historyElementId) as HTMLElement | null;

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
      await POST_CHANNEL_GET_HISTORY(
        _channelId,
        _dat.messageIdFrom,
        _dat.messageTimeFrom,
        _dat.fetchLength,
        _direction,
      )
        .then((r) => {
          //console.log("ChannelContent :: fetchHistory : r->", r);
          //if (r.data.history.length === 0) { console.log("ChannelContent :: fetchHistory : 履歴がありません"); return; }
          updateHistoryPosition(_channelId, {
            atEnd: r.data.atEnd,
            atTop: r.data.atTop,
          });
          setStoreImageDimensions(produce(prev => (Object.assign(prev, r.data.ImageDimensions))));
          insertHistory(r.data.history);
        })
        .catch((e) =>
          console.error("ChannelContent :: FnHistoryControllers.fetchHistory : エラー->", e),
        );
    },

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

    Scroll: (event: Event) => {
      //TODo :: 履歴取得からの既読チェック
    },

    /**
     * Windowのフォーカス操作
     */
    windowFocusFns: {
      setTrue: () => {
        //もしフォーカスされていたらスクロール位置を確認して履歴を取得させる
        let flagWasFocused = false;
        if (!isWindowFocused()) flagWasFocused = true;

        setIsWindowFocused(true);
        //console.log("ChannelContents :: toggleWindowFocus : isFocused->", isFocused());

        //if (flagWasFocused) JHistoryController.checkScrollPosAndFetchHistory();
      },
      setFalse: () => {
        setIsWindowFocused(false);
        //console.log("ChannelContents :: toggleWindowFocus : isFocused->", isFocused());
      }
    }
  };

  //チャンネル移動監視
  createEffect(on(
    () => [param.channelId, param.messageId],
    async ([currentChId, currentMsgId], prevArgs) => {

    }
  ));

  onMount(() => {
    //fetchHistory();
    const el = document.getElementById("history");
    if (el === null) return;
    //el.addEventListener("scroll", JBrowserApis.handleScroll);

    window.addEventListener("focus", BrowserEventHandlers.windowFocusFns.setTrue);
    window.addEventListener("blur", BrowserEventHandlers.windowFocusFns.setFalse);
    window.addEventListener("keydown", BrowserEventHandlers.KeyArrowUp);
  });

  onCleanup(() => {
    const el = getHistoryElement();
    //if (el) el.removeEventListener("scroll", JBrowserApis.handleScroll);

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

        <Show when={storeHistory[currentChannelId()]?.atTop}>
          <p>履歴の末端まで到達しました。</p>
        </Show>
      </div>

      { //TODO :: 最新に戻るボタン
        !storeHistory[currentChannelId()]?.atEnd
        &&
        <div class="absolute bottom-10 right-10 z-10">
          <Button onClick={undefined} class="w-16 h-16"><IconArrowDown style="height:28px; width:28px;" /></Button>
        </div>
      }
    </div>
  );
}
