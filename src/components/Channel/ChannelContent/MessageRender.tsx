import { Show } from "solid-js";
import UserName from "~/components/unique/UserName";
import type { IMessage } from "~/types/Message";
import MessageTextRender from "./MessageRender/MessageTextRender";
import URLPreview from "~/components/Channel/ChannelContent/MessageRender/URLPreview";

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
        <MessageTextRender content={props.message.content} />
        { (props.message.MessageUrlPreview.length > 0) && <URLPreview MessageUrlPreview={props.message.MessageUrlPreview} />}
      </div>
    </div>
  );
}
