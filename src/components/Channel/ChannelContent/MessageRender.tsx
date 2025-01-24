import { Show } from "solid-js";
import UserName from "~/components/unique/UserName";
import type { IMessage } from "~/types/Message";
import MessageTextRender from "./MessageRender/MessageTextRender";
import URLPreview from "~/components/Channel/ChannelContent/MessageRender/URLPreview";
import SystemMessageRender from "~/components/Channel/ChannelContent/MessageRender/SystemMessageRender";

export default function MessageRender(props: {
  message: IMessage;
  displayUserName: boolean;
}) {
  return (
    <div class="w-full">
      <Show when={props.displayUserName}>
        <UserName userId={props.message.userId} />
      </Show>
      <div class="flex flex-col">
        {
          props.message.isSystemMessage
          ?
            <SystemMessageRender content={props.message.content} />
          :
            <MessageTextRender content={props.message.content} />
        }

        { (props.message.MessageUrlPreview.length > 0) && <URLPreview MessageUrlPreview={props.message.MessageUrlPreview} />}
      </div>
    </div>
  );
}
