import { useParams } from "@solidjs/router";
import {createEffect, createSignal, Show} from "solid-js";
import {IconLock} from "@tabler/icons-solidjs";
import SidebarTriggerWithDot from "../unique/SidebarTriggerWithDot.tsx";
import { Card } from "../ui/card.tsx";
import { directGetterChannelInfo } from "~/stores/ChannelInfo.ts";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card.tsx";
import ChannelManage from "./ChannelHeader/ChannelManage.tsx";

export default function ChannelHeader() {
  const params = useParams();
  const [currentChannelId, setCurrentChannelId] = createSignal<string>(params.id ?? "");

  createEffect(() => {
    if (params.channelId !== undefined) {
      setCurrentChannelId(params.channelId);
    }
  });

  return (
    <Card class="py-3 px-5 flex items-center w-full gap-2">
      <SidebarTriggerWithDot />

      {/* チャンネルの閲覧権限がある時の錠前アイコン */}
      <Show when={directGetterChannelInfo(currentChannelId()).ChannelViewableRole.length !== 0}>
        <HoverCard>
          <HoverCardTrigger>
            <IconLock class={"shrink-0 cursor-help"} size={"18"} />
          </HoverCardTrigger>
          <HoverCardContent>
            ロールによる閲覧制限がかかっているチャンネルです
          </HoverCardContent>
        </HoverCard>
      </Show>

      <span class={"shrink line-clamp-1"}>
        <p>{ directGetterChannelInfo(currentChannelId()).name }</p>
      </span>
      <p class="text-gray-400 mx-1"> | </p>
      <span class={"shrink-[2] grow-0 line-clamp-1 max-w-[50%] md:max-w-full"}>
        <p>{ directGetterChannelInfo(currentChannelId()).description }</p>
      </span>

      <span class={"ml-auto"}>
        <ChannelManage channelId={currentChannelId()} />
      </span>
    </Card>
  );
}
