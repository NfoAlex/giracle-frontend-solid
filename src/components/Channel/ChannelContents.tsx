import { useParams } from "@solidjs/router";
import {For, Show, createEffect, createSignal, onCleanup, onMount, on} from "solid-js";
import { storeHistory } from "~/stores/History";
import { setStoreMessageReadTimeBefore, storeMessageReadTime, storeMessageReadTimeBefore, updateReadTime } from "~/stores/Readtime";
import FetchHistory from "~/utils/FethchHistory";
import { Avatar, AvatarImage } from "../ui/avatar";
import MessageRender from "./ChannelContent/MessageRender";
import NewMessageLine from "./ChannelContent/NewMessageLine";
import POST_MESSAGE_UPDATE_READTIME from "~/api/MESSAGE/MESSAGE_UPDATE_READTIME";
import { setStoreHasNewMessage } from "~/stores/HasNewMessage";
import HoverMenu from "~/components/Channel/ChannelContent/HoverMenu";
import MentionReadWrapper from "~/components/Channel/ChannelContent/MentionReadWrapper";

export default function ChannelContents() {
  const [isFocused, setIsFocused] = createSignal(true);
  const [hoveredMsgId, setHoveredMsgId] = createSignal("");
  const param = useParams();
  let channelIdBefore = "";
  let stateFetchingHistory = false;

  /**
   * 現在のスクロール位置を確認してから該当する履歴取得をする
   */
  const checkScrollPosAndFetchHistory = async () => {
    const el = document.getElementById("history");
    if (el === null || stateFetchingHistory) return;
    if (storeHistory[param.channelId] === undefined) return;

    const scrollPos = el.scrollTop;
    //console.log("ChannelContent :: checkScrollPosAndFetchHistory : scrollPos->", scrollPos);

    //スクロール位置の計算
    const scrollAtTop = Math.abs(scrollPos) + el.offsetHeight >= el.scrollHeight - 1;
    const scrollAtBottom = Math.abs(scrollPos) <= 0;

    //履歴の最古到達用
    if (!storeHistory[param.channelId].atTop && scrollAtTop) {
      //最後のメッセージIdを取得
      const messageIdLast = storeHistory[param.channelId].history.at(-1)?.id;
      if (messageIdLast === undefined) {
        console.error(
          "ChannelContent :: checkScrollPosAndFetchHistory : 最古のメッセIdを取得できなかった",
        );
        return;
      }
      //履歴を取得、格納
      stateFetchingHistory = true;
      await FetchHistory(param.channelId, { messageIdFrom: messageIdLast }, "older");
      setTimeout(() => scrollTo(messageIdLast));
    }
    //履歴の最新到達用
    if (
      !storeHistory[param.channelId].atEnd && scrollAtBottom
    ) {
      //最後のメッセージIdを取得
      const messageIdNewest = storeHistory[param.channelId].history[0]?.id;
      if (messageIdNewest === undefined) {
        console.error(
          "ChannelContent :: checkScrollPosAndFetchHistory : 最新のメッセIdを取得できなかった",
        );
        return;
      }
      //履歴を取得、格納
      stateFetchingHistory = true;
      await FetchHistory(param.channelId, { messageIdFrom: messageIdNewest }, "newer");
      setTimeout(() => scrollTo(messageIdNewest, "start", true));
    }

    //履歴取得中状態を解除
    stateFetchingHistory = false;

    //履歴の最新部分に到達していたら既読時間を更新
    if (
      storeHistory[param.channelId].atEnd &&
      scrollAtBottom &&
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
    const readTimeBefore = storeMessageReadTimeBefore.find((c) => c.channelId === param.channelId)?.readTime;
    const msgIndex = storeHistory[param.channelId].history.findIndex(
      (m) => m.createdAt === readTimeBefore
    );
    //既読位置の次に設定することで(index - 1)、新着線が画面内に表示される
    const msg = storeHistory[param.channelId].history[msgIndex - 1];
    if (msg !== undefined) {
      scrollTo(msg.id);
    } else {
      const msgBefore = storeHistory[param.channelId].history[msgIndex];
      if (msgBefore !== undefined)
        scrollTo(msgBefore.id);
    }

    checkScrollPosAndFetchHistory();
  }

  /**
   * 指定のメッセージIdへスクロールする
   * @param messageId メッセージId
   * @param block スクロール位置オプション
   * @param scrollingToFuture 未来方向へのスクロールかどうか
   */
  const scrollTo = (messageId: string, block: "nearest"|"start" = "nearest", scrollingToFuture = false) => {
    //console.log("ChannelContents :: scrollTo : messageId->", messageId, document.getElementById("NEW_LINE") !== undefined);
    const el = document.getElementById(`messageId::${messageId}`);
    if (el === null) {
      console.error("ChannelContents :: scrollTo : メッセージIdが見つかりませんでした el->", el);
      return;
    }

    //スクロールするとき時間方向に合わせてやり方を改善して精度を高める
      //仕組みとしては一旦スクロールしたい方向から真逆へスクロールしきってからscrollIntoView、これで綺麗に見える
    if (scrollingToFuture) { //新しい方向
      el.scrollTo(0, 0);
      el.scrollIntoView(false);
    } else {                 //古い方向
      el.scrollTo(0, el.scrollHeight);
      el.scrollIntoView({block});
    }
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

  //履歴の更新監視
  createEffect(
    on(() => `${storeHistory[param.channelId]?.history[0]?.id}:${storeHistory[param.channelId]?.history.at(-1)?.id}`, () => {
      //console.log("ChannelContents :: createEffect : 履歴更新された");
      checkScrollPosAndFetchHistory();
    })
  );

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
        FetchHistory(param.channelId, { messageTimeFrom: time }, "older");
      } else {
        initScroll();
      }

      //別チャンネルからの移動なら時差表示用既読時間を更新
      if (channelIdBefore !== "") {
        setStoreMessageReadTimeBefore((prev) => {
          const currentReadTime = storeMessageReadTime.find((c) => c.channelId === channelIdBefore)?.readTime;
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
            <div id={`messageId::${h.id}`}>
              {/* 新着線の表示 */}
              { (
                  (
                    storeMessageReadTimeBefore.find(
                      (c) => c.channelId === useParams().channelId
                    )?.readTime.valueOf() //一つ古い既読時間
                      ===
                    h.createdAt.valueOf() //メッセージの時間
                  )
                    &&
                  index() !== 0 //最新メッセージ以外条件
                )
                  &&
                (<NewMessageLine />)
              }
              <div
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
                        class={`relative shrink-0 grow-0 rounded-md px-2 ml-auto ${hoveredMsgId()===h.id ? "hover:bg-accent" : ""}`}
                        style="width:calc(100% - 45px)"
                        onmouseenter={() => setHoveredMsgId(h.id)}
                        onmouseleave={() => setHoveredMsgId("")}
                        on:touchend={() => setHoveredMsgId(h.id) /* スマホ用 */}
                      >
                        <MentionReadWrapper messageId={h.id}>
                          <MessageRender
                            message={h}
                            displayUserName={!sameSenderAsNext(index())}
                          />
                        </MentionReadWrapper>
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
            </div>
          )}
        </For>

        <Show when={storeHistory[param.channelId]?.atTop}>
          <p>履歴の末端まで到達しました。</p>
        </Show>
      </div>
    </div>
  );
}
