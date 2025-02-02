import { useParams } from "@solidjs/router";
import { createEffect, createSignal } from "solid-js";
import {directGetterChannelInfo} from "~/stores/ChannelInfo";
import { Card } from "../ui/card";
import { SidebarTrigger } from "../ui/sidebar";
import ChannelManage from "~/components/Channel/ChannelHeader/ChannelManage";
import {getRolePower} from "~/stores/MyUserinfo";
import {HasAnythingNew} from "~/stores/HasNewMessage";
import {IconCircleFilled} from "@tabler/icons-solidjs";
import SidebarTriggerWithDot from "~/components/unique/SidebarTriggerWithDot";

export default function ChannelHeader() {
  const params = useParams();
  const [currentChannelId, setCurrentChannelId] = createSignal(params.id);

  createEffect(() => {
    setCurrentChannelId(params.channelId);
  });

  return (
    <Card class="w-full py-3 px-5 flex items-center gap-2">
      <SidebarTriggerWithDot />
      <p>{ directGetterChannelInfo(params.channelId).name }</p>
      <p class="text-gray-400 mx-1"> | </p>
      <p>{ directGetterChannelInfo(params.channelId).description }</p>

      {
        getRolePower("manageChannel")
        &&
        <span class={"ml-auto"}>
          <ChannelManage channelId={currentChannelId()} />
        </span>
      }
    </Card>
  );
}
