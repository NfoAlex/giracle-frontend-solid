import { useParams } from "@solidjs/router";
import { createEffect, createSignal, Show, Switch, Match } from "solid-js";
import { IconLock } from "@tabler/icons-solidjs";
import SidebarTriggerWithDot from "../unique/SidebarTriggerWithDot.tsx";
import { Card } from "../ui/card.tsx";
import { directGetterChannelInfo, storeChannelFetchStatus } from "~/stores/ChannelInfo.ts";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card.tsx";
import ChannelManage from "./ChannelHeader/ChannelManage.tsx";
import type { IChannel } from "~/types/Channel.ts";

export default function ChannelHeader() {
  const params = useParams();
  const [currentChannelId, setCurrentChannelId] = createSignal<string>(params.channelId ?? params.id ?? "");
  const [currentChannelInfo, setCurrentChannelInfo] = createSignal<IChannel | null>(null);

  createEffect(() => {
    if (params.channelId !== undefined) {
      setCurrentChannelId(params.channelId);
      setCurrentChannelInfo(directGetterChannelInfo(params.channelId));
    }
  });

  return (
    <Switch fallback={<div>{storeChannelFetchStatus[currentChannelId()]}</div>}>
      <div>{storeChannelFetchStatus[currentChannelId()]}</div>

      <Match when={storeChannelFetchStatus[currentChannelId()] === "LOADING"}>
        <Card class="py-3 px-5 flex items-center w-full gap-2">
          <SidebarTriggerWithDot />
          <span class={"shrink line-clamp-1"}>
            <p>ロード中...</p>
          </span>
        </Card>
      </Match>

      <Match when={storeChannelFetchStatus[currentChannelId()] === "AVAILABLE"}>
        <Card class="py-3 px-5 flex items-center w-full gap-2">
          <SidebarTriggerWithDot />

          {/* チャンネルの閲覧権限がある時の錠前アイコン */}
          <Show when={currentChannelInfo()?.ChannelViewableRole.length !== 0}>
            <HoverCard>
              <HoverCardTrigger>
                <IconLock class={"shrink-0 cursor-help"} size={"18"} />
              </HoverCardTrigger>
              <HoverCardContent>
                ロールによる閲覧制限がかかっているチャンネルです
              </HoverCardContent>
            </HoverCard>
          </Show>

          <span class={"shrink max-w-1/3 line-clamp-1"}>
            <p class={"truncate"}>{currentChannelInfo()?.name}</p>
          </span>
          <p class="text-gray-400 mx-1"> | </p>
          <span class={"shrink-[2] md:shrink max-w-1/2 line-clamp-1 md:max-w-full"}>
            <p class={"truncate"}>{currentChannelInfo()?.description}</p>
          </span>

          <span class={"ml-auto"}>
            <ChannelManage channelId={currentChannelId()} />
          </span>
        </Card>
      </Match>

      <Match when={storeChannelFetchStatus[currentChannelId()] === "NOT_FOUND"}>
        <Card class="py-3 px-5 flex items-center w-full gap-2">
          <SidebarTriggerWithDot />
          <span class={"shrink line-clamp-1"}>
            <p class="italic">チャンネルが見つかりません</p>
          </span>
        </Card>
      </Match>
    </Switch>
  );
}
