import { useParams } from "@solidjs/router";
import { For, Show, createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { storeHistory } from "~/stores/History";
import { setStoreMessageReadTimeBefore, storeMessageReadTime, storeMessageReadTimeBefore, updateReadTime } from "~/stores/Readtime";
import FetchHistory from "~/utils/FethchHistory";
import { Avatar, AvatarImage } from "../ui/avatar";
import MessageRender from "./ChannelContent/MessageRender";
import NewMessageLine from "./ChannelContent/NewMessageLine";
import POST_MESSAGE_UPDATE_READTIME from "~/api/MESSAGE/MESSAGE_UPDATE_READTIME";
import { setStoreHasNewMessage } from "~/stores/HasNewMessage";
import HoverMenu from "~/components/Channel/ChannelContent/HoverMenu";

export default function ChannelContents() {
  const [isFocused, setIsFocused] = createSignal(true);
  const [hoveredMsgId, setHoveredMsgId] = createSignal("");
  const param = useParams();
  let channelIdBefore = "";

  /**
   * 現在のスクロール位置を確認してから該当する履歴取得をする
   */
  const checkScrollPosAndFetchHistory = async () => {
    //console.log("checkScrollPosAndFetchHistory triggered");
    const el = document.getElementById("history");
    if (el === null) return;
    if (storeHistory[param.channelId] === undefined) return;

    const scrollPos = el.scrollTop;

    //履歴の最古到達用
    if (!storeHistory[param.channelId].atTop && Math.abs(scrollPos) + el.offsetHeight >= el.scrollHeight - 1) {
      //console.log("checkScrollPosAndFetchHistory :: 上だね");
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
    //履歴の最新到達用
    if (
      !storeHistory[param.channelId].atEnd &&
      scrollPos <= 1
      //scrollPos >= el.scrollHeight - el.offsetHeight - 1
    ) {
      //console.log("checkScrollPosAndFetchHistory :: 下です");
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

    //console.log("ChannelContent :: checkScrollPosAndFetchHistory : scrollPos->", scrollPos, " isFocused()->", isFocused());
    //履歴の最新部分に到達していたら既読時間を更新
    if (
      storeHistory[param.channelId].atEnd &&
      scrollPos <= 1 &&
      isFocused()
    ) {
      //すでに既読時間が一緒ならスルー
      if (
        storeMessageReadTime.find((c) => c.channelId === param.channelId)?.readTime
        ===
        storeHistory[param.channelId].history[0].createdAt
      ) return;

      POST_MESSAGE_UPDATE_READTIME(param.channelId, storeHistory[param.channelId].history[0].createdAt)
        .catch((e) => console.error("ChannelContent :: checkScroll... : 既読時間の更新に失敗しました", e));
      //Storeの既読時間を更新
      updateReadTime(param.channelId, storeHistory[param.channelId].history[0].createdAt);
      //新着メッセージがないことと設定
      setStoreHasNewMessage(param.channelId, false);
    }
  };

  /**
   * 一つ次のメッセージ(新しい方が)が同じ送信者であるかどうか
   * @param index
   */
  const sameSenderAsNext = (index: number): boolean => {
    if (storeHistory[param.channelId].history === undefined) return false;
    if (storeHistory[param.channelId].history.length === index + 1) return false;

    return storeHistory[param.channelId].history[index].userId ===
      storeHistory[param.channelId].history[index + 1].userId;
  };

  /**
   * チャンネル移動、あるいはマウントしてからの最初のスクロール用
   */
  const initScroll = () => {
    const msg = storeHistory[param.channelId].history.find((m) => m.createdAt === storeMessageReadTime.find((c) => c.channelId === param.channelId)?.readTime);
    if (msg !== undefined) scrollTo(msg.id);

    checkScrollPosAndFetchHistory();
  }

  /**
   * 指定のメッセージIdへスクロールする
   * @param messageId
   */
  const scrollTo = (messageId: string) => {
    //console.log("ChannelContents :: scrollTo : messageId->", messageId, document.getElementById("NEW_LINE") !== undefined);
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

  createEffect(() => {
    if (param.channelId !== channelIdBefore) {
      //console.log("ChannelContents :: createEffect : param.channelId->", param.channelId, " channelIdBefore->", channelIdBefore);
      //もし履歴の長さが０なら既読時間から取得
      if (
        storeHistory[param.channelId]?.history.length === 0 ||
        storeHistory[param.channelId] === undefined
      ) {
        const time = storeMessageReadTime.find((c) => {
          c.channelId === param.channelId
        })?.readTime;

        //履歴を取得、格納した時点でもう一度履歴取得を試す
        FetchHistory(param.channelId, { messageTimeFrom: time }, "older").then(() =>
          checkScrollPosAndFetchHistory(),
        );
      } else {
        initScroll();
      }

      //別チャンネルからの移動なら時差表示用既読時間を更新
      if (channelIdBefore !== "") {
        setStoreMessageReadTimeBefore((prev) => {
          const currentReadTime = storeMessageReadTime.find((c) => c.channelId === param.channelId)?.readTime;
          if (currentReadTime === undefined) return prev;
          const newReadTime = { channelId: channelIdBefore, readTime: currentReadTime };
          const newStore = prev.filter((c) => c.channelId !== channelIdBefore);
          newStore.push(newReadTime);
          return newStore;
        });
      }

      //最後にいたチャンネルIdを書き換える
      channelIdBefore = param.channelId;
    }
  });

  onMount(() => {
    //fetchHistory();
    const el = document.getElementById("history");
    if (el === null) return;
    el.addEventListener("scroll", handleScroll);

    window.addEventListener("focus", setWindowFocused);
    window.addEventListener("blur", unSetWindowFocused);

    //もし履歴の長さが０なら既読時間から取得
    if (
      storeHistory[param.channelId]?.history.length === 0 ||
      storeHistory[param.channelId] === undefined
    ) {
      const time = storeMessageReadTime.find((c) => {
        c.channelId === param.channelId
      })?.readTime;

      //履歴を取得、格納した時点でもう一度履歴取得を試す
      FetchHistory(param.channelId, { messageTimeFrom: time }, "older").then(() =>
        checkScrollPosAndFetchHistory(),
      );
    }
  });

  onCleanup(() => {
    document.removeEventListener("scroll", handleScroll);
    window.removeEventListener("focus", setWindowFocused);
    window.removeEventListener("blur", unSetWindowFocused);
  });

  return (
    <div class="w-full overflow-y-auto p-2 grow">
      <div id="history" class="h-full w-full overflow-y-auto flex flex-col-reverse gap-1">
        <For each={storeHistory[param.channelId]?.history}>
          {(h, index) => (
            <>
              <div
                id={`messageId::${h.id}`}
                class="flex flex-row items-start"
              >
                {
                  !h.isSystemMessage //システムメッセージかどうか
                  ?
                    <>
                      <div class="w-[40px] shrink-0">
                        <Show when={!sameSenderAsNext(index())}>
                          <Avatar class="mx-auto">
                            <AvatarImage src={`/api/user/icon/${h.userId}`} />
                          </Avatar>
                        </Show>
                      </div>
                      <div
                        class={`relative shrink-0 grow-0 rounded-md px-2 ml-auto ${hoveredMsgId()===h.id ? "bg-slate-200" : ""}`}
                        style="width:calc(100% - 45px)"
                        onmouseenter={() => setHoveredMsgId(h.id)}
                        onmouseleave={() => setHoveredMsgId("")}
                        on:touchend={() => setHoveredMsgId(h.id) /* スマホ用 */}
                      >
                        <MessageRender
                          message={h}
                          displayUserName={!sameSenderAsNext(index())}
                        />
                        { //ホバーメニュー
                          hoveredMsgId() === h.id
                          &&
                          <div class={"absolute right-1 z-50"} style={"bottom:calc(100% - 15px);"}>
                            <HoverMenu message={h} />
                          </div>
                        }
                      </div>
                    </>
                  :
                    <MessageRender
                      message={h}
                      displayUserName={false}
                    />
                }
              </div>

              {/* 新着線の表示 */}
              { (storeMessageReadTimeBefore.find((c) => c.channelId === param.channelId)?.readTime === h.createdAt && index() !== 0) && (<NewMessageLine />)}
            </>
          )}
        </For>

        <Show when={storeHistory[param.channelId]?.atTop}>
          <p>履歴の末端まで到達しました。</p>
        </Show>
      </div>
    </div>
  );
}
