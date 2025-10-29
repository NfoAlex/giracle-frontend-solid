import { useParams } from "@solidjs/router";
import { Show, createEffect, createSignal, onCleanup, onMount, on, Index } from "solid-js";
import { setStoreHistory, storeHistory } from "~/stores/History";
import { setStoreMessageReadTimeBefore, storeMessageReadTime, storeMessageReadTimeBefore, updateReadTime } from "~/stores/Readtime";
import FetchHistory from "~/utils/FethchHistory";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import MessageRender from "./ChannelContent/MessageRender";
import NewMessageLine from "./ChannelContent/NewMessageLine";
import POST_MESSAGE_UPDATE_READTIME from "~/api/MESSAGE/MESSAGE_UPDATE_READTIME";
import { setStoreHasNewMessage } from "~/stores/HasNewMessage";
import HoverMenu from "~/components/Channel/ChannelContent/HoverMenu";
import MentionReadWrapper from "~/components/Channel/ChannelContent/MentionReadWrapper";
import {Badge} from "~/components/ui/badge";
import {IMessage} from "~/types/Message";
import UserinfoModalWrapper from "~/components/unique/UserinfoModalWrapper";
import EditMessage from "~/components/Channel/ChannelContent/EditMessage";
import {storeMyUserinfo} from "~/stores/MyUserinfo";
import { storeClientConfig } from "~/stores/ClientConfig";
import { Button } from "../ui/button";
import { IconArrowDown } from "@tabler/icons-solidjs";
import DisplayReply from "./ChannelContent/DisplayReply";

export default function ChannelContents() {
  const [isFocused, setIsFocused] = createSignal(true);
  const [hoveredMsgId, setHoveredMsgId] = createSignal("");
  const [reactingMsgId, setReactingMsgId] = createSignal("");
  const [editingMsgId, setEditingMsgId] = createSignal("");
  const param = useParams();
  let channelIdBefore = "";
  let stateFetchingHistory = false;

  /**
   * 現在のスクロール位置を確認してから該当する履歴取得をする
   */
  const checkScrollPosAndFetchHistory = async () => {
    const el = document.getElementById("history");
    //履歴要素が見つからない、履歴取得中、チャンネルが変わった直後ならスルー
    if (el === null || stateFetchingHistory || param.channelId !== channelIdBefore) return;
    //履歴配列が存在しないならスルー
    if (storeHistory[param.channelId] === undefined) return;

    const scrollPos = el.scrollTop;
    //console.log("ChannelContent :: checkScrollPosAndFetchHistory : scrollPos->", scrollPos);

    //スクロール位置の計算
    const scrollAtTop = Math.abs(scrollPos) + el.offsetHeight >= el.scrollHeight - 1;
    const scrollAtBottom = Math.abs(scrollPos) <= 1; //paddingに合わせて1pxの誤差を許容

    //履歴の状況によってデータを使い分けて取得
    if (                                                                                        //履歴がStoreに無いケース
      storeHistory[param.channelId]?.history.length === 0 ||
      storeHistory[param.channelId] === undefined
    ) {
      const time = storeMessageReadTime.find((c) =>
        c.channelId === param.channelId
      )?.readTime;

      //履歴を取得
      FetchHistory(param.channelId, { messageTimeFrom: time, fetchLength: 1 }, "older");
    } else {                                                                                    //履歴がStoreにあるケース、上か下にスクロールしてるかで履歴取得方法を変える
      const messageIdLast = storeHistory[param.channelId].history.at(-1)?.id;
      const messageIdNewest = storeHistory[param.channelId].history[0]?.id;
      
      //履歴の最古到達用
      if (!storeHistory[param.channelId].atTop && scrollAtTop && messageIdLast !== undefined) {
        //履歴を取得、格納
        stateFetchingHistory = true;
        await FetchHistory(param.channelId, { messageIdFrom: messageIdLast }, "older");
        setTimeout(() => scrollTo(messageIdLast));
      }
      //履歴の最新到達用
      if (
        !storeHistory[param.channelId].atEnd && scrollAtBottom && messageIdNewest !== undefined
      ) {
        //履歴を取得、格納
        stateFetchingHistory = true;
        await FetchHistory(param.channelId, { messageIdFrom: messageIdNewest }, "newer");
        setTimeout(() => scrollTo(messageIdNewest, "start", true));
      }
    }

    //履歴取得中状態を解除
    stateFetchingHistory = false;

    //console.log("ChannelContent :: checkScrollPosAndFetchHistory : 既読ちぇっく scrollAtBottom->", scrollAtBottom, " isFocused()->", isFocused());
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
    //メッセオブジェクト取得
    const msgHere = storeHistory[param.channelId].history[index];
    const msgBehind: IMessage | undefined = storeHistory[param.channelId].history[index + 1];
    //5分を比較するための変数(ミリ秒)
    const miliSecFiveMin = 1000 * 60 * 5;

    if (msgBehind === undefined) return false; //次のメッセージがない場合
    if (new Date(msgHere.createdAt).valueOf() - new Date(msgBehind.createdAt).valueOf() > miliSecFiveMin) return false; //5分以上の差がある場合
    if (storeHistory[param.channelId].history === undefined) return false; //履歴がない場合(一応のエラーcatch)
    if (storeHistory[param.channelId].history.length === index + 1) return false; //最後のメッセージの場合

    //最後に送信者が同じかどうか
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
      scrollTo(msg.id, "start", true);
    } else {
      const msgBefore = storeHistory[param.channelId].history[msgIndex];
      if (msgBefore !== undefined)
        scrollTo(msgBefore.id, "start", true);
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
   * 最新の履歴を取得して、移動する
   */
  const moveToNewest = async () => {
    //履歴取得状態を設定
    stateFetchingHistory = true;
    
    //履歴をStoreから削除
    setStoreHistory((prev) => {
      const newStore = { ...prev };
      newStore[param.channelId].history = [];
      return newStore;
    });
    //取得して格納
    await FetchHistory(param.channelId, { messageTimeFrom: "" }, "older").then(()=>
      scrollTo(storeHistory[param.channelId].history[0].id, "start", true)
    );

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
      for (let i = 0; i < storeHistory[param.channelId]?.history.length; i++) {
        if (storeHistory[param.channelId]?.history[i].userId === storeMyUserinfo.id) {
          setEditingMsgId(storeHistory[param.channelId]?.history[i].id);
          return;
        }
      }
    }
  };

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
        const time = storeMessageReadTime.find((c) =>
          c.channelId === param.channelId
        )?.readTime;

        //履歴を取得
        FetchHistory(param.channelId, { messageTimeFrom: time, fetchLength: 1 }, "older");
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
        <Index each={storeHistory[param.channelId]?.history}>
          {(h, index) => (
            <div data-index={h().id} id={`messageId::${h().id}`} class={"w-full"}>

              {/* 日付線 */}
              <Show when={
                index !== 0
                &&
                (
                  new Date(h().createdAt).getDay()
                    !==
                  new Date(storeHistory[param.channelId]?.history[index + 1]?.createdAt).getDay()
                )
                ||
                (
                  new Date(h().createdAt).getDate()
                    !==
                  new Date(storeHistory[param.channelId]?.history[index + 1]?.createdAt).getDate()
                )
              }>
                <div class="flex justify-center items-center gap-3 py-1">
                  <hr class={"grow"} />
                  <Badge class={"shrink-0"} variant={"secondary"}>{ new Date(h().createdAt).toLocaleDateString() }</Badge>
                  <hr class={"grow"} />
                </div>
              </Show>

              { //返信先の表示
                h().replyingMessageId !== null
                &&
                <div class="ml-auto mt-1" style={"width: calc(100% - 45px);"}>
                  <DisplayReply replyingMessageId={h().replyingMessageId} />
                </div>
              }

              <div
                class="flex flex-row items-start"
              >
                { //メッセージ表示
                  !h().isSystemMessage //システムメッセージかどうか
                  ?

                    <>
                      {/* アイコン表示部分 */}
                      <div class="w-[40px] shrink-0">
                        <Show when={!sameSenderAsNext(index)}>
                          <UserinfoModalWrapper userId={h().userId} >
                            <Avatar class="mx-auto">
                              <AvatarImage src={`/api/user/icon/${h().userId}`} />
                              <AvatarFallback>{ h().userId.slice(0,2) }</AvatarFallback>
                            </Avatar>
                          </UserinfoModalWrapper>
                        </Show>
                      </div>

                      {/* ホバー判定部分 */}
                      <div
                        class={
                          `relative shrink-0 grow-0 rounded-md px-2 ml-auto ${hoveredMsgId()===h().id ? "hover:bg-accent" : ""} ${h().content.includes("@<" + storeMyUserinfo.id + ">") && "border-2"}`
                        }
                        style="width:calc(100% - 45px)"
                        onmouseenter={() => editingMsgId()!==h().id && setHoveredMsgId(h().id)}
                        onmouseleave={() => setHoveredMsgId("")}
                        on:touchend={() => setHoveredMsgId(h().id) /* スマホ用 */}
                      >
                        { //メッセージ表示部分。編集モードか否かで表示を変える
                          editingMsgId() === h().id
                          ?
                            <EditMessage
                              messageId={h().id}
                              content={h().content}
                              onCancelEdit={() => setEditingMsgId("")}
                            />
                          :
                            <MentionReadWrapper messageId={h().id}>
                              <MessageRender
                                message={h()}
                                displayUserName={!sameSenderAsNext(index)}
                              />
                            </MentionReadWrapper>
                        }
                        { //ホバーメニュー(リアクション用の絵文字選択途中も表示を残す)
                          (hoveredMsgId() === h().id || reactingMsgId() === h().id)
                          &&
                          <div class={"absolute right-1 z-50"} style={"bottom:calc(100% - 15px);"}>
                            <HoverMenu
                              message={h()}
                              onEditMode={(msgId)=>{ setEditingMsgId(msgId); setHoveredMsgId(""); }}
                              onReacting={(msgId) => { setReactingMsgId(msgId); }}
                            />
                          </div>
                        }
                      </div>
                    </>

                  :

                    <MessageRender
                      message={h()}
                      displayUserName={false}
                    />
                }
              </div>

              {/* 新着線の表示 */}
              { (
                  (
                    storeMessageReadTimeBefore.find(
                      (c) => c.channelId === useParams().channelId
                    )?.readTime.valueOf() //一つ古い既読時間
                      ===
                    h().createdAt.valueOf() //メッセージの時間
                  )
                    &&
                  index !== 0 //最新メッセージ以外条件
                )
                  &&
                (<NewMessageLine />)
              }
            </div>
          )}
        </Index>

        <Show when={storeHistory[param.channelId]?.atTop}>
          <p>履歴の末端まで到達しました。</p>
        </Show>
      </div>

      { !storeHistory[param.channelId]?.atEnd &&
        <div class="absolute bottom-10 right-10">
          <Button onClick={moveToNewest} class="w-16 h-16 z-50"><IconArrowDown style="height:28px; width:28px;" /></Button>
        </div>
      }
    </div>
  );
}
