import { createSignal, Show } from "solid-js";
import { storeHistory } from "~/stores/History";
import { IMessage } from "~/types/Message";
import { Badge } from "../../ui/badge";
import UserinfoModalWrapper from "../../unique/UserinfoModalWrapper";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { storeMyUserinfo } from "~/stores/MyUserinfo";
import { storeMessageReadTimeBefore } from "~/stores/Readtime";
import DisplayReply from "./MessageDisplay/DisplayReply";
import EditMessage from "./MessageDisplay/EditMessage";
import MentionReadWrapper from "./MessageDisplay/MentionReadWrapper";
import MessageRender from "./MessageDisplay/MessageRender";
import HoverMenu from "./MessageDisplay/HoverMenu";
import NewMessageLine from "./MessageDisplay/NewMessageLine";

export default function MessageDisplay(props: {
  messageArrayIndex: number,
  message: IMessage,
  displayAvatar: boolean,
}) {
  const staticChannelId = props.message.channelId;
  const [hovered, setHovered] = createSignal(false);
  const [reacting, setReacting] = createSignal(false);
  const [editing, setEditing] = createSignal(false);

  return (
    <div data-index={props.message.id} id={`messageId::${props.message.id}`} class={"w-full"}>
      {/* 日付線 */}
      <Show when={
        props.messageArrayIndex !== 0
        &&
        (
          new Date(props.message.createdAt).getDay()
            !==
          new Date(storeHistory[staticChannelId]?.history[props.messageArrayIndex + 1]?.createdAt).getDay()
        )
        ||
        (
          new Date(props.message.createdAt).getDate()
            !==
          new Date(storeHistory[staticChannelId]?.history[props.messageArrayIndex + 1]?.createdAt).getDate()
        )
      }>
        <div class="flex justify-center items-center gap-3 py-1">
          <hr class={"grow"} />
          <Badge class={"shrink-0"} variant={"secondary"}>{ new Date(props.message.createdAt).toLocaleDateString() }</Badge>
          <hr class={"grow"} />
        </div>
      </Show>

      { //返信先の表示
        props.message.replyingMessageId !== null
        &&
        <div class="ml-auto mt-1" style={"width: calc(100% - 45px);"}>
          <DisplayReply replyingMessageId={props.message.replyingMessageId} />
        </div>
      }

      <div
        class="flex flex-row items-start"
      >
        { //メッセージ表示
          !props.message.isSystemMessage //システムメッセージかどうか
          ?

            <>
              {/* アイコン表示部分 */}
              <div class="w-[40px] shrink-0">
                <Show when={props.displayAvatar}>
                  <UserinfoModalWrapper userId={props.message.userId} >
                    <Avatar class="mx-auto">
                      <AvatarImage src={`/api/user/icon/${props.message.userId}`} />
                      <AvatarFallback>{ props.message.userId.slice(0,2) }</AvatarFallback>
                    </Avatar>
                  </UserinfoModalWrapper>
                </Show>
              </div>

              {/* ホバー判定部分 */}
              <div
                class={
                  `relative shrink-0 grow-0 rounded-md px-2 ml-auto ${hovered() ? "hover:bg-accent" : ""} ${props.message.content.includes("@<" + storeMyUserinfo.id + ">") && "border-2"}`
                }
                style="width:calc(100% - 45px)"
                onmouseenter={() => setHovered(true)}
                onmouseleave={() => setHovered(false)}
                on:touchend={() => setHovered(true) /* スマホ用 */}
              >
                { //メッセージ表示部分。編集モードか否かで表示を変える
                  editing()
                  ?
                    <EditMessage
                      messageId={props.message.id}
                      content={props.message.content}
                      onCancelEdit={() => setEditing(false)}
                    />
                  :
                    <MentionReadWrapper messageId={props.message.id}>
                      <MessageRender
                        message={props.message}
                        displayUserName={props.displayAvatar}
                      />
                    </MentionReadWrapper>
                }
                { //ホバーメニュー(リアクション用の絵文字選択途中も表示を残す)
                  (hovered() || reacting())
                  &&
                  <div class={"absolute right-1 z-50"} style={"bottom:calc(100% - 15px);"}>
                    <HoverMenu
                      message={props.message}
                      onEditMode={()=>{ setEditing(true); setHovered(false); }}
                      onReacting={() => { setReacting(true); }}
                    />
                  </div>
                }
              </div>
            </>

          :

            <MessageRender
              message={props.message}
              displayUserName={false}
            />
        }
      </div>

      {/* 新着線の表示 */}
      { (
          (
            storeMessageReadTimeBefore.find(
              (c) => c.channelId === staticChannelId
            )?.readTime.valueOf() //一つ古い既読時間
              ===
            props.message.createdAt.valueOf() //メッセージの時間
          )
            &&
          props.messageArrayIndex !== 0 //最新メッセージ以外条件
        )
          &&
        (<NewMessageLine />)
      }
    </div>
  );
}