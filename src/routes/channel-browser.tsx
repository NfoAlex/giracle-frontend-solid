import { createSignal, For, onMount } from "solid-js";
import { GET_CHANNEL_LIST } from "~/api/CHANNEL/CHANNEL_LIST";
import { Card } from "~/components/ui/card";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { storeMyUserinfo } from "~/stores/MyUserinfo";
import type { IChannel } from "~/types/Channel";

export default function ChannelBrowser() {
  const [channels, setChannels] = createSignal<IChannel[]>([]);

  onMount(async () => {
    GET_CHANNEL_LIST()
      .then((r) => {
        setChannels(r.data);
      })
      .catch((err) => {
        console.error("ChannelBrowser :: err ->", err);
      })
  });

  return (
    <div class="p-2">
      <Card class="w-full py-3 px-5 flex items-center gap-2">
        <SidebarTrigger />
        <p>チャンネルブラウザ</p>
      </Card>

      <div class="flex flex-col gap-2 py-3 overflow-y-auto">
        <For each={channels()}>
          {(channel) => (
            <Card class="w-full py-3 px-5 flex items-center gap-2">
              <p>{channel.name}</p>
              <p class="ml-auto">{ storeMyUserinfo.ChannelJoin.some((cj) => cj.channelId === channel.id) ? "参加済み" : "未参加" }</p>
            </Card>
          )}
        </For>
      </div>
    </div>
  )
}
