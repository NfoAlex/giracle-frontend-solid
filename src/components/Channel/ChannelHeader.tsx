import { useParams } from "@solidjs/router";
import { createEffect, createSignal } from "solid-js";
import {directGetterChannelInfo} from "~/stores/ChannelInfo";
import { Card } from "../ui/card";
import ChannelManage from "~/components/Channel/ChannelHeader/ChannelManage";
import {getRolePower} from "~/stores/MyUserinfo";
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
      <span class={"shrink truncate"}>
        <p class={"truncate"}>{ directGetterChannelInfo(params.channelId).name }</p>
      </span>
      <p class="text-gray-400 mx-1"> | </p>
      <span class={"shrink grow-0 truncate"}>
        <p class={"truncate"}>{ directGetterChannelInfo(params.channelId).description }</p>
      </span>

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
