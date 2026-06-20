import { createMemo, Match, Switch } from "solid-js";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar.tsx";
import UserinfoModalWrapper from "~/components/unique/UserinfoModalWrapper.tsx";
import { getterUserinfo } from "~/stores/Userinfo.ts";
import { IconCornerUpRight } from "@tabler/icons-solidjs";
import { storeMyUserinfo } from "~/stores/MyUserinfo.ts";
import MessageTextRender from "./MessageRender/MessageTextRender.tsx";
import { useLocation, useNavigate } from "@solidjs/router";
import { fnMessageFetchCache } from "~/stores/MessageFetchCache.ts";

export default function DisplayReply(props: { replyingMessageId?: string | null, channelId?: string | null }) {
  if (props.replyingMessageId === null || props.replyingMessageId === undefined || !props.channelId) {
    return <></>;
  }
  const nav = useNavigate();
  const loc = useLocation();

  const message = createMemo(() => {
    if (props.channelId && props.replyingMessageId) return fnMessageFetchCache.getMessage(props.channelId, props.replyingMessageId)
  });
  const isDeleted = createMemo(() => props.replyingMessageId ? fnMessageFetchCache.getIsDeleted(props.replyingMessageId) : false);

  const jumpToMessage = () => {
    if (props.replyingMessageId === null || props.replyingMessageId === undefined) return;

    const channelId = props.channelId;
    const messageId = props.replyingMessageId;

    if (loc.pathname.endsWith(`${channelId}/${messageId}`)) {
      nav(`/app/channel/${channelId}`);
      setTimeout(() => {
        nav(`/app/channel/${channelId}/${messageId}`);
      }, 0);
      return;
    }
    nav(`/app/channel/${channelId}/${messageId}`);
  };

  return (
    <div
      class={`px-1 flex flex-row items-center w-full truncate ${storeMyUserinfo.id === message()?.userId && "border-2 rounded bg-border"}`}
    >
      <Switch>
        <Match when={isDeleted()}>
          <IconCornerUpRight class="w-5 h-5 mr-1" />
          <div class="italic text-sm text-muted-foreground">メッセージが見つかりません。</div>
        </Match>

        <Match when={message() !== undefined}>
          <div class="text-xs flex flex-row items-center gap-1">
            <IconCornerUpRight class="shrink-0 w-5 h-5" />
            <UserinfoModalWrapper userId={message()!.userId} class="shrink-0 flex flex-row items-center gap-1">
              <Avatar class="mx-auto w-5 h-5">
                <AvatarImage src={`/api/user/icon/${message()!.userId}`} />
                <AvatarFallback class="w-5 h-5">{message()!.userId.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span class="font-bold">
                {getterUserinfo(message()!.userId).name}
              </span>
            </UserinfoModalWrapper>
            <span onClick={jumpToMessage} class="shrink truncate line-clamp-1 cursor-pointer">
              <span class="pointer-events-none">
                <MessageTextRender content={message()!.content} />
              </span>
            </span>
          </div>
        </Match>
      </Switch>
    </div>
  );
}
