import { useParams } from "@solidjs/router";
import { createEffect, createSignal, Show, Switch, Match } from "solid-js";
import { IconLock } from "@tabler/icons-solidjs";
import SidebarTriggerWithDot from "../unique/SidebarTriggerWithDot.tsx";
import { Card } from "../ui/card.tsx";
import { directGetterChannelInfo, storeChannelFetchStatus } from "~/stores/ChannelInfo.ts";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card.tsx";
import type { IChannel } from "~/types/Channel.ts";
import { Dialog, DialogContent, DialogDescription, DialogHeader } from "../ui/dialog.tsx";
import { TabsList, TabsTrigger, TabsContent, Tabs } from "../ui/tabs.tsx";
import ChannelInfo from "./ChannelHeader/ChannelManage/ChannelInfos.tsx";
import ChannelMembers from "./ChannelHeader/ChannelManage/ChannelMembers.tsx";

export default function ChannelHeader() {
  const params = useParams();
  const [currentChannelId, setCurrentChannelId] = createSignal<string>(params.channelId ?? params.id ?? "");
  const [currentChannelInfo, setCurrentChannelInfo] = createSignal<IChannel | null>(null);
  const [modalManageOpen, setModalManageOpen] = createSignal(false);

  createEffect(() => {
    if (params.channelId !== undefined) {
      setCurrentChannelId(params.channelId);
      setCurrentChannelInfo(directGetterChannelInfo(params.channelId));
    }
  });

  return (
    <>
      {/* チャンネル情報モーダル */}
      <Dialog open={modalManageOpen()} onOpenChange={setModalManageOpen}>
        <DialogContent class={"flex flex-col gap-0 pt-10 w-full h-5/6 md:h-3/4"}>
          <DialogHeader>
            <p class={"ml-2"}>チャンネル情報</p>
          </DialogHeader>
          <DialogDescription class={"overflow-x-hidden mt-2 px-2 w-full h-full shrink"}>

            <Tabs defaultValue="info" class="w-full">
              <TabsList class="w-fit">
                <TabsTrigger value="info">概要</TabsTrigger>
                <TabsTrigger value="users">参加者</TabsTrigger>
              </TabsList>

              <TabsContent value="info">
                <ChannelInfo channelId={currentChannelId()} />
              </TabsContent>
              <TabsContent value="users">
                <ChannelMembers channelId={currentChannelId()} />
              </TabsContent>
            </Tabs>

          </DialogDescription>
        </DialogContent>
      </Dialog>

      {/* チャンネルヘッダー */}
      <Switch fallback={<div>{storeChannelFetchStatus[currentChannelId()]}</div>}>
        <Match when={storeChannelFetchStatus[currentChannelId()] === "LOADING"}>
          <Card class="py-3 px-5 flex items-center w-full gap-2">
            <SidebarTriggerWithDot />
            <span class={"shrink line-clamp-1"}>
              <p>ロード中...</p>
            </span>
          </Card>
        </Match>

        <Match when={storeChannelFetchStatus[currentChannelId()] === "AVAILABLE"}>
          <Card
            onClick={() => setModalManageOpen(true)}
            class="py-3 px-5 flex items-center w-full gap-2 cursor-pointer hover:bg-muted has-[button:hover]:bg-transparent has-[button:hover]:dark:bg-transparent"
          >
            <span class="shrink-0" onClick={(e) => e.stopPropagation()}>
              <SidebarTriggerWithDot />
            </span>

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
    </>
  );
}
