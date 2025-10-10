import { createMemo, createSignal, For, onMount } from "solid-js";
import { Card } from "../ui/card";
import { directGetterChannelInfo } from "~/stores/ChannelInfo";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { getterUserinfo } from "~/stores/Userinfo";
import MessageRender from "../Channel/ChannelContent/MessageRender";
import { Button } from "../ui/button";
import { IconCheck } from "@tabler/icons-solidjs";
import { storeInbox } from "~/stores/Inbox";
import type { IInbox } from "~/types/Message";

export default function DisplayInboxByChannel(props: { onReadIt: (messageId: string) => void }) {
  const [groupedInbox, setGroupedInbox] = createSignal<ArrayIterator<[number, IInbox]>>();

  const inboxEntries = createMemo(() => Object.entries(storeInbox));

  return (
    <>
    {
      inboxEntries().map ((inboxByChannel) => (
        <p>{ inboxByChannel[0] }</p>
      ))
    }

    <For each={storeInbox}>
      {(inboxItem) =>
        <Card class={"p-2 flex flex-col gap-2"}>
          <span class={"flex items-center gap-1"}>
            <p class={"font-bold text-xl"}>#</p>
            <p>{ directGetterChannelInfo(inboxItem.Message.channelId).name }</p>
            <Badge variant={"secondary"} class={"ml-auto"}>
              <p>{ new Date(inboxItem.happendAt).toLocaleString() }</p>
            </Badge>
          </span>
          <hr />
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
            <Button onClick={()=>props.onReadIt(inboxItem.messageId)} class={"self-end w-10 h-10 shrink-0"}><IconCheck /></Button>
          </span>
        </Card>
      }
    </For>
    </>
  );
}