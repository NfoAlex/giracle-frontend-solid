import {Card} from "~/components/ui/card";
import {SidebarTrigger} from "~/components/ui/sidebar";
import {storeInbox} from "~/stores/Inbox";
import {For} from "solid-js";
import MessageRender from "~/components/Channel/ChannelContent/MessageRender";
import {Badge} from "~/components/ui/badge";
import {directGetterChannelInfo} from "~/stores/ChannelInfo";
import {Avatar, AvatarFallback, AvatarImage} from "~/components/ui/avatar";
import {getterUserinfo} from "~/stores/Userinfo";

export default function Inbox() {
  return (
    <div class={"p-2 flex flex-col gap-2"}>
      <Card class="w-full py-3 px-5 flex items-center gap-2">
        <SidebarTrigger />
        <p>通知</p>
      </Card>

      <div class={"flex flex-col-reverse gap-1"}>
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
              <span class={"flex gap-2"}>
                <Avatar>
                  <AvatarImage src={"/api/user/icon/" + inboxItem.Message.userId} />
                  <AvatarFallback>
                    { getterUserinfo(inboxItem.Message.userId).name.slice(0,1) }
                  </AvatarFallback>
                </Avatar>
                <MessageRender message={inboxItem.Message} displayUserName={true} />
              </span>
            </Card>
          }
        </For>
      </div>
    </div>
  );
}