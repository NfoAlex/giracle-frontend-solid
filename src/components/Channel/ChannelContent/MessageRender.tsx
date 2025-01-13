import { Show } from "solid-js";
import { Card, CardContent } from "~/components/ui/card";
import UserName from "~/components/unique/UserName";
import type { IMessage } from "~/types/Message";
import MessageTextRender from "./MessageRender/MessageTextRender";

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
      </div>
    </div>
  );
}
