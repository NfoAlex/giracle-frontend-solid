import { Match, onMount, Switch } from "solid-js";
import GET_MESSAGE_GET from "~/api/MESSAGE/MESSAGE_GET";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import UserinfoModalWrapper from "~/components/unique/UserinfoModalWrapper";
import { getterUserinfo } from "~/stores/Userinfo";
import { IconCornerUpRight } from "@tabler/icons-solidjs";
import { storeMyUserinfo } from "~/stores/MyUserinfo";
import { storeReplyDisplayCache } from "~/stores/ReplyDisplayCache";

export default function DisplayReply(props: {replyingMessageId?: string | null}) {
  if (props.replyingMessageId === null || props.replyingMessageId === undefined) {
    return <></>;
  }

  onMount(() => {
    if (!props.replyingMessageId) {
      return;
    }
    //キャッシュから取得を試みる
    if (storeReplyDisplayCache.cache[props.replyingMessageId]) {
      return;
    }
    //削除済みフラグがCacheに立っている場合も取得しない
    if (storeReplyDisplayCache.isDeleted[props.replyingMessageId]) {
      return;
    }
    GET_MESSAGE_GET(props.replyingMessageId)
      .then((r) => {
        console.log("DisplayReply :: onMount : r->", r);
        //キャッシュに保存
        storeReplyDisplayCache.cache[props.replyingMessageId!] = r.data;
      })
      .catch((e) => {
        console.error(e);
        storeReplyDisplayCache.isDeleted[props.replyingMessageId!] = true;
      });
  });

  return (
    <div
      class={`px-1 flex flex-row items-center w-full truncate ${storeMyUserinfo.id === storeReplyDisplayCache.cache[props.replyingMessageId]?.userId && "border-2 rounded bg-border"}`}
    >
      <Switch>
        <Match when={storeReplyDisplayCache.cache[props.replyingMessageId] === undefined && storeReplyDisplayCache.isDeleted[props.replyingMessageId]}>
          <IconCornerUpRight class="w-5 h-5 mr-1" />
          <div class="italic text-sm text-muted-foreground">メッセージが見つかりません。</div>
        </Match>
        <Match when={storeReplyDisplayCache.cache[props.replyingMessageId] === undefined && !storeReplyDisplayCache.isDeleted[props.replyingMessageId]}>
          <IconCornerUpRight class="w-5 h-5 mr-1" />
          <div class="italic text-sm text-muted-foreground">読み込み中...</div>
        </Match>
        <Match when={storeReplyDisplayCache.cache[props.replyingMessageId] !== null}>
          <div class="text-xs flex flex-row items-center gap-1">
            <IconCornerUpRight class="w-5 h-5" />
            <UserinfoModalWrapper userId={storeReplyDisplayCache.cache[props.replyingMessageId]!.userId} class="flex flex-row items-center gap-1">
              <Avatar class="mx-auto w-5 h-5">
                <AvatarImage src={`/api/user/icon/${storeReplyDisplayCache.cache[props.replyingMessageId]!.userId}`} />
                <AvatarFallback>{ storeReplyDisplayCache.cache[props.replyingMessageId]!.userId.slice(0,2) }</AvatarFallback>
              </Avatar>
              <span class="font-bold">
                { getterUserinfo(storeReplyDisplayCache.cache[props.replyingMessageId]!.userId).name }
              </span>
            </UserinfoModalWrapper>
            <span class="truncate">
              { storeReplyDisplayCache.cache[props.replyingMessageId]!.content }
            </span>
          </div>
        </Match>
      </Switch>
    </div>
  );
}