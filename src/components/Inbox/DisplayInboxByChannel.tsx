import { createMemo, For } from "solid-js";
import { Card } from "../ui/card.tsx";
import { directGetterChannelInfo } from "~/stores/ChannelInfo.ts";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar.tsx";
import { getterUserinfo } from "~/stores/Userinfo.ts";
import { Button } from "../ui/button.tsx";
import { IconCheck } from "@tabler/icons-solidjs";
import { storeInbox } from "~/stores/Inbox.ts";
import type { IInbox } from "~/types/Message.ts";
import MessageRender from "../Channel/ChannelContent/MessageDisplay/MessageRender.tsx";
import DisplayReply from "../Channel/ChannelContent/MessageDisplay/DisplayReply.tsx";

export default function DisplayInboxByChannel(props: { onReadIt: (messageId: string) => void }) {
  //チャンネルごとに通知データをグループ化
  const groupedInbox = createMemo(() => {
    const grouped: { [key: string]: IInbox[] } = {};
    storeInbox.forEach((inboxItem) => {
      const channelId = inboxItem.Message.channelId;
      if (!grouped[channelId]) {
        grouped[channelId] = [];
      }
      grouped[channelId].push(inboxItem);
    });
    return Object.entries(grouped);
  });

  console.log("DisplayInboxByChannel :: groupedInbox ->", groupedInbox());

  return (
    <For each={groupedInbox()}>
      {(inboxGroup) =>
        <span>
          <span class="truncate text-xl flex items-center gap-1 mt-4 mb-2">
            <p># { directGetterChannelInfo(inboxGroup[0]).name }</p>
          </span>
          <For each={inboxGroup[1]} fallback={<p>No messages</p>}>
            {(inboxItem) =>
              <Card class={"p-2 flex flex-col gap-2 mt-1"}>
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
        </span>
      }
    </For>
  );
}