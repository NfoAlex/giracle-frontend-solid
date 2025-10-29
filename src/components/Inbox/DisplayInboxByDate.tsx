import { For } from "solid-js";
import { Card } from "../ui/card";
import { directGetterChannelInfo } from "~/stores/ChannelInfo";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { getterUserinfo } from "~/stores/Userinfo";
import MessageRender from "../Channel/ChannelContent/MessageRender";
import { Button } from "../ui/button";
import { IconCheck, IconCornerUpRight, IconAt } from "@tabler/icons-solidjs";
import { storeInbox } from "~/stores/Inbox";
import { Badge } from "../ui/badge";
import DisplayReply from "../Channel/ChannelContent/DisplayReply";

export default function DisplayInboxByDate(props: { onReadIt: (messageId: string) => void }) {
  return (
    <For each={storeInbox} fallback={<p>No messages</p>}>
      {(inboxItem) =>
        <Card class={"p-2 flex flex-col gap-2 mt-1"}>
          <span class={"flex items-center gap-1"}>
            <p class={"font-bold text-xl"}>#</p>
            <p>{ directGetterChannelInfo(inboxItem.Message.channelId).name }</p>
            { inboxItem.type === "mention" && <IconAt class="ml-auto w-4 h-4" /> }
            { inboxItem.type === "reply" && <IconCornerUpRight class="ml-auto w-4 h-4" /> }
          </span>
          <hr />
          { //返信表示
            inboxItem.Message.replyingMessageId !== null
            &&
            <DisplayReply replyingMessageId={inboxItem.Message.replyingMessageId} />
          }
          <span class={"flex gap-4"}>
            <Avatar>
              <AvatarImage src={"/api/user/icon/" + inboxItem.Message.userId} />
              <AvatarFallback>
                { getterUserinfo(inboxItem.Message.userId).name.slice(0,1) }
              </AvatarFallback>
            </Avatar>
            <span class={"grow border-e-2"}>
              <MessageRender message={inboxItem.Message} displayUserName={true} />
            </span>
            <Button onClick={()=>props.onReadIt(inboxItem.messageId)} class={"self-end w-10 h-10 md:w-fit shrink-0"}>
              <IconCheck />
              <p class="hidden md:inline">既読にする</p>
            </Button>
          </span>
        </Card>
      }
    </For>
  );
}