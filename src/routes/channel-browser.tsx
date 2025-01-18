import { IconArchiveFilled } from "@tabler/icons-solidjs";
import { createSignal, For, onMount, Show } from "solid-js";
import POST_CHANNEL_JOIN from "~/api/CHANNEL/CHANNEL_JOIN";
import POST_CHANNEL_LEAVE from "~/api/CHANNEL/CHANNEL_LEAVE";
import { GET_CHANNEL_LIST } from "~/api/CHANNEL/CHANNEL_LIST";
import CreateChannel from "~/components/ChannelBrowser/CreateChannel";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "~/components/ui/switch";
import { setStoreMyUserinfo, storeMyUserinfo } from "~/stores/MyUserinfo";
import type { IChannel } from "~/types/Channel";

export default function ChannelBrowser() {
  const [processing, setProcessing] = createSignal(true);
  const [channels, setChannels] = createSignal<IChannel[]>([]);
  const [displayArchived, setDisplayArchived] = createSignal(false);

  /**
   * チャンネルへ参加する
   * @param channelId 参加するチャンネルId
   */
  const joinChannel = (channelId: string) => {
    POST_CHANNEL_JOIN(channelId)
      .then((r) => {
        console.log("ChannelBrowser :: joinChannel :: r ->", r);
        //StoreにチャンネルIdを追加
        setStoreMyUserinfo((prev) => ({...prev, ChannelJoin: [...prev.ChannelJoin, {channelId: channelId}]}));
      })
      .catch((err) => console.error("ChannelBrowser :: joinChannel :: err ->", err));
  }

  /**
   * チャンネルから退出する
   * @param channelId 退出するチャンネルId
   */
  const leaveChannel = (channelId: string) => {
    POST_CHANNEL_LEAVE(channelId)
      .then((r) => {
        console.log("ChannelBrowser :: leaveChannel :: r ->", r);
        //StoreからチャンネルIdをを削除
        setStoreMyUserinfo((prev) => (
          {...prev, ChannelJoin: prev.ChannelJoin.filter((cj) => cj.channelId !== channelId)}
        ));
      })
      .catch((err) => console.error("ChannelBrowser :: leaveChannel :: err ->", err));
  }

  /**
   * チャンネル一覧を取得する
   */
  const fetchChannels = () => {
    setProcessing(true); //ローディング中
    setChannels([]); //初期化
    GET_CHANNEL_LIST()
      .then((r) => {
        setChannels(r.data);
        setProcessing(false);
      })
      .catch((err) => {
        console.error("ChannelBrowser :: fetchChannels : err ->", err);
      })
  }

  onMount(async () => {
    fetchChannels();
  });

  return (
    <div class="p-2">
      <Card class="w-full py-3 px-5 flex items-center gap-2">
        <SidebarTrigger />
        <p>チャンネルブラウザ</p>
      </Card>

      <div class="flex items-center mt-3">
        <Switch
          class="flex items-center space-x-2"
          checked={displayArchived()}
          onChange={setDisplayArchived}
        >
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
          <SwitchLabel>アーカイブされたチャンネルも表示する</SwitchLabel>
        </Switch>

        <Button onClick={fetchChannels} class="ml-auto" variant="outline">リロード</Button>
      </div>

      <hr class="my-3" />

      <div class="flex flex-col gap-2 overflow-y-auto">
        <Show when={processing()}>
          <p class="mx-auto">ロード中...</p>
        </Show>
        <For each={channels()}>
          {(channel) => (
            <Show when={!channel.isArchived || displayArchived()}>
              <Card class="w-full py-3 px-5 flex items-center gap-2">
                <p>{channel.name}</p>
                <p class="font-thin"> | </p>
                <p>{channel.description}</p>
                <div class="ml-auto flex items-center gap-2">
                  { channel.isArchived && <IconArchiveFilled color="orange" /> }

                  { 
                    storeMyUserinfo.ChannelJoin.some((cj) => cj.channelId === channel.id)
                    ?
                      <Button onclick={()=>leaveChannel(channel.id)} variant={"outline"}>退出</Button>
                    :
                      <Button onclick={()=>joinChannel(channel.id)}>参加</Button>
                  }
                </div>
              </Card>
            </Show>
          )}
        </For>

        <CreateChannel />
      </div>
    </div>
  )
}
