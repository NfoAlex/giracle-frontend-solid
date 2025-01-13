import { useParams } from "@solidjs/router";
import { For, Show, createEffect, onCleanup, onMount } from "solid-js";
import { storeHistory } from "~/stores/History";
import { storeMessageReadTime } from "~/stores/Readtime";
import FetchHistory from "~/utils/FethchHistory";
import { Avatar, AvatarImage } from "../ui/avatar";
import MessageRender from "./ChannelContent/MessageRender";

export default function ChannelContents() {
  const param = useParams();

  /**
   * 現在のスクロール位置を確認してから該当する履歴取得をする
   */
  const checkScrollPosAndFetchHistory = async () => {
    //console.log("checkScrollPosAndFetchHistory triggered");
    const el = document.getElementById("history");
    if (el === null) return;
    if (storeHistory[param.channelId] === undefined) return;

    const scrollPos = el.scrollTop;

    if (!storeHistory[param.channelId].atTop && scrollPos <= 1) {
      //console.log("上だね");
      //最後のメッセージIdを取得
      const messageIdLast = storeHistory[param.channelId].history.at(-1)?.id;
      if (messageIdLast === undefined) {
        console.error(
          "ChannelContent :: checkScrollPosAndFetchHistory : 最古のメッセIdを取得できなかった",
        );
        return;
      }
      //履歴を取得、格納
      await FetchHistory(param.channelId, { messageIdFrom: messageIdLast }, "older");
      scrollTo(messageIdLast);
    }
    if (
      !storeHistory[param.channelId].atEnd &&
      scrollPos >= el.scrollHeight - el.offsetHeight - 1
    ) {
      //console.log("一番下だね");

      //最後のメッセージIdを取得
      const messageIdNewest = storeHistory[param.channelId].history[0]?.id;
      if (messageIdNewest === undefined)
        console.error(
          "ChannelContent :: checkScrollPosAndFetchHistory : 最新のメッセIdを取得できなかった",
        );
      //履歴を取得、格納
      await FetchHistory(param.channelId, { messageIdFrom: messageIdNewest }, "newer");
      scrollTo(messageIdNewest);
    }
  };

  /**
   * 一つ次のメッセージ(新しい方が)が同じ送信者であるかどうか
   * @param index
   */
  const sameSenderAsNext = (index: number): boolean => {
    if (storeHistory[param.channelId].history === undefined) return false;
    if (storeHistory[param.channelId].history.length === index + 1) return false;

    if (
      storeHistory[param.channelId].history[index].userId ===
      storeHistory[param.channelId].history[index + 1].userId
    )
      return true;

    return false;
  };

  /**
   * 指定のメッセージIdへスクロールする
   * @param messageId
   */
  const scrollTo = (messageId: string) => {
    const el = document.getElementById(`messageId::${messageId}`);
    if (el === null) return;

    el.scrollIntoView();
  };

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

  createEffect(() => {
    if (param.channelId) {
      //console.log("ChannelContents :: createEffect : param.channelId->", param.channelId);
      //もし履歴の長さが０なら既読時間から取得
      if (
        storeHistory[param.channelId]?.history.length === 0 ||
        storeHistory[param.channelId] === undefined
      ) {
        const time = storeMessageReadTime.find((c) => {
          c.channelId === param.channelId;
        })?.readTime;

        //履歴を取得、格納した時点でもう一度履歴取得を試す
        FetchHistory(param.channelId, { messageTimeFrom: time }, "older").then(() =>
          checkScrollPosAndFetchHistory(),
        );
      }
    }
  });

  onMount(() => {
    //fetchHistory();
    const el = document.getElementById("history");
    if (el === null) return;
    el.addEventListener("scroll", handleScroll);

    /*
    console.log(
      "ChannelContent :: onMount : storeHistory[param.channelId]?.history.length->",
      storeHistory[param.channelId]?.history.length,
    );
    */
    //もし履歴の長さが０なら既読時間から取得
    if (
      storeHistory[param.channelId]?.history.length === 0 ||
      storeHistory[param.channelId] === undefined
    ) {
      const time = storeMessageReadTime.find((c) => {
        c.channelId === param.channelId;
      })?.readTime;

      //履歴を取得、格納した時点でもう一度履歴取得を試す
      FetchHistory(param.channelId, { messageTimeFrom: time }, "older").then(() =>
        checkScrollPosAndFetchHistory(),
      );
    }
  });

  onCleanup(() => {
    document.removeEventListener("scroll", handleScroll);
  });

  return (
    <div id="history" class="w-full overflow-y-auto p-2 grow flex flex-col">
      <p class="font-bold">
        atTop:{storeHistory[param.channelId]?.atTop.toString()} atEnd:
        {storeHistory[param.channelId]?.atEnd.toString()}
      </p>
      <div class="grow flex flex-col-reverse gap-1">
        <For each={storeHistory[param.channelId]?.history}>
          {(h, index) => (
            <div
              id={`messageId::${h.id}`}
              class="flex flex-row items-start"
            >
              <div class="w-[40px] shrink-0">
                <Show when={!sameSenderAsNext(index())}>
                  <Avatar class="mx-auto">
                    <AvatarImage src={`/api/user/icon/${h.userId}`} />
                  </Avatar>
                </Show>
              </div>
              <div class="shrink-0 hover:bg-slate-200 rounded-md px-2 ml-auto" style="width:calc(100% - 45px)">
                <MessageRender
                  message={h}
                  displayUserName={!sameSenderAsNext(index())}
                />
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
