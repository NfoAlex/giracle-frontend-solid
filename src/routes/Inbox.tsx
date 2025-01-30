import {Card} from "~/components/ui/card";
import {SidebarTrigger} from "~/components/ui/sidebar";
import {storeInbox} from "~/stores/Inbox";
import {For, Show} from "solid-js";
import MessageRender from "~/components/Channel/ChannelContent/MessageRender";
import {Badge} from "~/components/ui/badge";
import {directGetterChannelInfo} from "~/stores/ChannelInfo";
import {Avatar, AvatarFallback, AvatarImage} from "~/components/ui/avatar";
import {getterUserinfo} from "~/stores/Userinfo";
import {IconBed, IconCheck} from "@tabler/icons-solidjs";
import {Button} from "~/components/ui/button";
import POST_MESSAGE_INBOX_READ from "~/api/MESSAGE/MESSAGE_INBOX_READ";

export default function Inbox() {

  /**
   * インボックス通知を既読にする
   * @param messageId 既読にするメッセージId
   */
  const readIt = (messageId: string) => {
    POST_MESSAGE_INBOX_READ(messageId).then((r) => {
      console.log("Inbox :: readIt : r->", r);
    }).catch((e) => console.error("Inbox :: readIt : e->", e));
  }

  return (
    <div class={"p-2 flex flex-col gap-2"}>
      <Card class="w-full py-3 px-5 flex items-center gap-2">
        <SidebarTrigger />
        <p>通知</p>
      </Card>

      <div class={"flex flex-col-reverse gap-1"}>
        <Show when={storeInbox.length === 0}>
          <span class={"p-2 text-center flex flex-col items-center"}>
            <IconBed size={44} />
            <p>通知はありません</p>
          </span>
        </Show>

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
                <Button onClick={()=>readIt(inboxItem.messageId)} class={"self-end w-10 h-10 shrink-0"}><IconCheck /></Button>
              </span>
            </Card>
          }
        </For>
      </div>
    </div>
  );
}