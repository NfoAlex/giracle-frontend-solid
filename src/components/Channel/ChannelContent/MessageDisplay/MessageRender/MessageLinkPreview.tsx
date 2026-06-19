import { createMemo, Show } from "solid-js";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card } from "~/components/ui/card";
import UserinfoModalWrapper from "~/components/unique/UserinfoModalWrapper";
import { directGetterChannelInfo } from "~/stores/ChannelInfo";
import { fnMessageFetchCache } from "~/stores/MessageFetchCache";
import { getterUserinfo } from "~/stores/Userinfo";
import MessageTextRender from "./MessageTextRender";

export default function MessageLinkPreview(props: { channelId: string, messageId: string }) {
  const message = createMemo(() => fnMessageFetchCache.getMessage(props.channelId, props.messageId));

  return (
    <Show when={!fnMessageFetchCache.getIsDeleted(props.messageId)}>
      <Card class="p-2 flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <UserinfoModalWrapper userId={message()!.userId} class="flex flex-row items-center gap-2 hover:underline">
            <Avatar class="w-6 h-6">
              <AvatarImage src={"/api/user/icon/" + message()!.userId} />
              <AvatarFallback>{getterUserinfo(message()!.userId).name[0]}</AvatarFallback>
            </Avatar>
            <p>{getterUserinfo(message()!.userId).name}</p>
          </UserinfoModalWrapper>
          <p>・</p>
          <span class="shrink text-sm text-gray-500 truncate">#{directGetterChannelInfo(message().channelId).name}</span>
        </div>
        <hr />
        <MessageTextRender content={message().content.length > 150 ? message().content.slice(0, 150) + "..." : message().content} />
        <p class="text-gray-500 text-sm">{new Date(message().createdAt).toLocaleString()}</p>
      </Card>
    </Show>
  )
}
