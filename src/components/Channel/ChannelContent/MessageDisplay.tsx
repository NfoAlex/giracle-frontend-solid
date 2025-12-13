import { createSignal, Show } from "solid-js";
import { storeHistory } from "~/stores/History.ts";
import { IMessage } from "~/types/Message.ts";
import { Badge } from "../../ui/badge.tsx";
import UserinfoModalWrapper from "../../unique/UserinfoModalWrapper.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar.tsx";
import { storeMyUserinfo } from "~/stores/MyUserinfo.ts";
import { storeMessageReadTimeBefore } from "~/stores/Readtime.ts";
import DisplayReply from "./MessageDisplay/DisplayReply.tsx";
import EditMessage from "./MessageDisplay/EditMessage.tsx";
import MentionReadWrapper from "./MessageDisplay/MentionReadWrapper.tsx";
import MessageRender from "./MessageDisplay/MessageRender.tsx";
import HoverMenu from "./MessageDisplay/HoverMenu.tsx";
import NewMessageLine from "./MessageDisplay/NewMessageLine.tsx";

export default function MessageDisplay(props: {
  messageArrayIndex: number,
  message: IMessage,
  displayAvatar: boolean,
}) {
  const staticChannelId = props.message.channelId;
  const [hovered, setHovered] = createSignal(false);
  const [reacting, setReacting] = createSignal(false);
  const [editing, setEditing] = createSignal(false);

  const displayDateLine = () => {
    if (props.messageArrayIndex === 0) return false;

    const previousMessage = storeHistory[staticChannelId]?.history[props.messageArrayIndex + 1];
    if (!previousMessage) return true;

    const prevDate = new Date(previousMessage.createdAt);
    const currDate = new Date(props.message.createdAt);
    return prevDate.getDate() !== currDate.getDate() || prevDate.getDay() !== currDate.getDay();
  };

  return (
    <div data-index={props.message.id} id={`messageId::${props.message.id}`} class={"w-full"}>
      {/* 日付線 */}
      <Show when={displayDateLine()}>
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
                      onReacting={(mode) => { setReacting(mode); }}
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