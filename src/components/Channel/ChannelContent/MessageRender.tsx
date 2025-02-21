import {For, Show} from "solid-js";
import type { IMessage } from "~/types/Message";
import MessageTextRender from "./MessageRender/MessageTextRender";
import URLPreview from "~/components/Channel/ChannelContent/MessageRender/URLPreview";
import SystemMessageRender from "~/components/Channel/ChannelContent/MessageRender/SystemMessageRender";
import FilePreview from "~/components/Channel/ChannelContent/MessageRender/FilePreview";
import {getterUserinfo} from "~/stores/Userinfo";
import UserinfoModalWrapper from "~/components/unique/UserinfoModalWrapper";

export default function MessageRender(props: {
  message: IMessage;
  displayUserName: boolean;
}) {

  /**
   * メッセージの作成日時を優しく(同じ日付なら省くなど)表示する
   * @param createdAt
   */
  const displayDate = (createdAt: string) => {
    const timeObj = new Date(createdAt);
    const now = new Date();

    // 1年以上前のメッセージはすべて表示
    if (timeObj.getFullYear() !== now.getFullYear()) {
      return timeObj.toLocaleString();
    }
    // 1ヶ月以上あるいは１日前のメッセージはすべて表示
    if (timeObj.getMonth() !== now.getMonth() || timeObj.getDate() !== now.getDate()) {
      return timeObj.toLocaleString();
    }
    //時間のみ返す
    return timeObj.toLocaleTimeString();
  }

  return (
    <div class="w-full">
      <Show when={props.displayUserName}>
        <UserinfoModalWrapper userId={props.message.userId}>
          <span class={"flex items-center gap-2"}>
            <p class="font-bold hover:underline">{getterUserinfo(props.message.userId).name}</p>
            <p class="text-sm text-muted-foreground">{displayDate(props.message.createdAt)}</p>
          </span>
        </UserinfoModalWrapper>
      </Show>
      <div class="flex flex-col">
        {
          props.message.isSystemMessage
            ?
            <SystemMessageRender content={props.message.content} />
          :
            <MessageTextRender content={props.message.content} />
        }

        { (props.message.MessageUrlPreview?.length > 0) && <URLPreview MessageUrlPreview={props.message.MessageUrlPreview} />}
        {
          props.message.MessageFileAttached?.length > 0
          &&
          (
            <For each={props.message.MessageFileAttached}>
              {(f) => <FilePreview file={f} />}
            </For>
          )
        }

        {/* 編集済み表示 */}
        <Show when={props.message.isEdited}>
          <p class={"text-muted-foreground text-xs"}>編集済み</p>
        </Show>
      </div>
    </div>
  );
}
