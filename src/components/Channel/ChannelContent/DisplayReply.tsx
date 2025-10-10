import { createSignal, Match, onMount, Switch } from "solid-js";
import GET_MESSAGE_GET from "~/api/MESSAGE/MESSAGE_GET";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import UserinfoModalWrapper from "~/components/unique/UserinfoModalWrapper";
import { getterUserinfo } from "~/stores/Userinfo";
import { IconCornerUpRight } from "@tabler/icons-solidjs";
import type { IMessage } from "~/types/Message";
import { storeMyUserinfo } from "~/stores/MyUserinfo";

export default function DisplayReply(props: {replyingMessageId: string}) {
  const [messageData, setMessageData] = createSignal<IMessage | null>(null);
  const [flagNotFound, setFlagNotFound] = createSignal(false);

  onMount(() => {
    GET_MESSAGE_GET(props.replyingMessageId)
      .then((r) => {
        console.log("DisplayReply :: onMount : r->", r);
        setMessageData(r.data);
      })
      .catch((e) => {
        console.error(e);
        setFlagNotFound(true);
      });
  });

  return (
    <div
      class={`px-1 flex flex-row items-center w-full truncate ${storeMyUserinfo.id === messageData()?.userId && "border-2 rounded bg-border"}`}
    >
      <Switch>
        <Match when={messageData() === null && flagNotFound()}>
          <div class="italic text-sm text-muted-foreground">メッセージが見つかりません。</div>
        </Match>
        <Match when={messageData() === null && !flagNotFound()}>
          <div class="italic text-sm text-muted-foreground">読み込み中...</div>
        </Match>
        <Match when={messageData() !== null}>
          <div class="text-xs flex flex-row items-center gap-1">
            <IconCornerUpRight class="w-5 h-5" />
            <UserinfoModalWrapper userId={messageData()!.userId} class="flex flex-row items-center gap-1">
              <Avatar class="mx-auto w-5 h-5">
                <AvatarImage src={`/api/user/icon/${messageData()!.userId}`} />
                <AvatarFallback>{ messageData()!.userId.slice(0,2) }</AvatarFallback>
              </Avatar>
              <span class="font-bold">
                { getterUserinfo(messageData()!.userId).name }
              </span>
            </UserinfoModalWrapper>
            <span class="truncate">
              { messageData()?.content }
            </span>
          </div>
        </Match>
      </Switch>
    </div>
  );
}