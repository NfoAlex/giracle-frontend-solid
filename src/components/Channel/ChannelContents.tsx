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
    console.log("checkScrollPosAndFetchHistory triggered");
    const el = document.getElementById("history");
    if (el === null) return;
    if (storeHistory[param.id] === undefined) return;

    const scrollPos = el.scrollTop;
    //console.log("checkScrollPosAndFetchHistory scrollPos->", scrollPos, storeHistory[param.id].atEnd, storeHistory[param.id].atTop);

    if (!storeHistory[param.id].atTop && scrollPos <= 1) {
      //console.log("上だね");
      //最後のメッセージIdを取得
      const messageIdLast = storeHistory[param.id].history.at(-1)?.id;
      if (messageIdLast === undefined) {
        console.error(
          "ChannelContent :: checkScrollPosAndFetchHistory : 最古のメッセIdを取得できなかった",
        );
        return;
      }
      //履歴を取得、格納
      await FetchHistory(param.id, { messageIdFrom: messageIdLast }, "older");
      scrollTo(messageIdLast);
    }
    if (
      !storeHistory[param.id].atEnd &&
      scrollPos >= el.scrollHeight - el.offsetHeight - 1
    ) {
      //console.log("一番下だね");

      //最後のメッセージIdを取得
      const messageIdNewest = storeHistory[param.id].history[0].id;
      if (messageIdNewest === undefined)
        console.error(
          "ChannelContent :: checkScrollPosAndFetchHistory : 最新のメッセIdを取得できなかった",
        );
      //履歴を取得、格納
      await FetchHistory(param.id, { messageIdFrom: messageIdNewest }, "newer");
      scrollTo(messageIdNewest);
    }
  };

  /**
   * 一つ次のメッセージ(新しい方が)が同じ送信者であるかどうか
   * @param index
   */
  const sameSenderAsNext = (index: number): boolean => {
    if (storeHistory[param.id].history === undefined) return false;
    if (storeHistory[param.id].history.length === index + 1) return false;

    if (
      storeHistory[param.id].history[index].userId ===
      storeHistory[param.id].history[index + 1].userId
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
    if (param.id) {
      console.log("ChannelContents :: createEffect : param.id->", param.id);
      //もし履歴の長さが０なら既読時間から取得
      if (
        storeHistory[param.id]?.history.length === 0 ||
        storeHistory[param.id] === undefined
      ) {
        const time = storeMessageReadTime.find((c) => {
          c.channelId === param.id;
        })?.readTime;

        //履歴を取得、格納した時点でもう一度履歴取得を試す
        FetchHistory(param.id, { messageTimeFrom: time }, "older").then(() =>
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

    console.log(
      "ChannelContent :: onMount : storeHistory[param.id]?.history.length->",
      storeHistory[param.id]?.history.length,
    );
    //もし履歴の長さが０なら既読時間から取得
    if (
      storeHistory[param.id]?.history.length === 0 ||
      storeHistory[param.id] === undefined
    ) {
      const time = storeMessageReadTime.find((c) => {
        c.channelId === param.id;
      })?.readTime;

      //履歴を取得、格納した時点でもう一度履歴取得を試す
      FetchHistory(param.id, { messageTimeFrom: time }, "older").then(() =>
        checkScrollPosAndFetchHistory(),
      );
    }
  });

  onCleanup(() => {
    document.removeEventListener("scroll", handleScroll);
  });

  return (
    <div id="history" class="w-full overflow-y-auto p-2 grow">
      <p>ここで履歴</p>
      <p class="font-bold">
        atTop:{storeHistory[param.id]?.atTop.toString()} atEnd:
        {storeHistory[param.id]?.atEnd.toString()}
      </p>
      <div class="flex flex-col-reverse">
        <For each={storeHistory[param.id]?.history}>
          {(h, index) => (
            <div
              id={`messageId::${h.id}`}
              class="flex flex-row items-start gap-3"
            >
              <div class="w-[40px] shrink-0">
                <Show when={!sameSenderAsNext(index())}>
                  <Avatar class="mx-auto">
                    <AvatarImage src={`/api/user/icon/${h.userId}`} />
                  </Avatar>
                </Show>
              </div>
              <div class="shrink-0 hover:bg-slate-200 rounded-md px-2" style="width:calc(100% - 40px)">
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
