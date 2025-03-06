import { createEffect, createSignal, For, on, onMount } from "solid-js";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import { storeMyUserinfo } from "~/stores/MyUserinfo";
import { A, useLocation } from "@solidjs/router";
import { IconLock, IconHash } from "@tabler/icons-solidjs";
import { directGetterChannelInfo } from "~/stores/ChannelInfo";
import { storeHasNewMessage } from "~/stores/HasNewMessage";
import Sortable from 'sortablejs';

export default function ChannelButtons() {
  const loc = useLocation();
  let channelIndexes: { [channelId: string]: number } | null = null;
  const [channelListSorted, setChannelListSorted] = createSignal(storeMyUserinfo.ChannelJoin);

  createEffect(
    on(
      () => storeMyUserinfo.ChannelJoin.length,
      () => {
        const indx = channelIndexes;
        if (indx) {
          const sorted = [...channelListSorted()];
          sorted.sort((a, b) => {
            const aIndex = indx[a.channelId];
            const bIndex = indx[b.channelId];
            if (aIndex === undefined && bIndex === undefined) {
              return 0;
            } else if (aIndex === undefined) {
              return 1;
            } else if (bIndex === undefined) {
              return -1;
            } else {
              return aIndex - bIndex;
            }
          });
          console.log("ChannelButtons :: createEffect : sorted->", sorted);
          setChannelListSorted(sorted);
        }
      }
    )
  );

  onMount(() => {
    const indexString = localStorage.getItem("channelIndexes");
    if (indexString) {
      try {
        channelIndexes = JSON.parse(indexString);
      } catch(e) {
        console.error("ChannelButtons :: onMount : e->", e);
      }
    }

    const el = document.getElementById("sidebar-content");
    if (el === null) {
      console.error("Element not found");
      return;
    }

    new Sortable(el, {
      animation: 150,
      onEnd: (evt) => {
        //console.log(channelListSorted());
        const sorted = [...channelListSorted()];
        if (evt.oldIndex === undefined || evt.newIndex === undefined) return;
        const [removed] = sorted.splice(evt.oldIndex, 1);
        sorted.splice(evt.newIndex, 0, removed);
        console.log("sorted->", sorted, channelListSorted());
        //setChannelListSorted(sorted);

        //順番をLocalStorageへ保存
        const newIndexes: { [channelId: string]: number } = {};
        for (const index in sorted) {
          newIndexes[sorted[index].channelId] = Number.parseInt(index);
        }
        localStorage.setItem("channelIndexes", JSON.stringify(newIndexes));
      },
    });
  });

  return (
    <SidebarMenu>
      <div id="sidebar-content">
        <For each={channelListSorted()}>
          {(c) => (
            <SidebarMenuItem>
              <SidebarMenuButton
                as={A}
                href={`/app/channel/${c.channelId}`}
                variant={loc.pathname === `/app/channel/${c.channelId}` ? "outline" : "default"}
                class="truncate flex flex-row items-center md:p-2 p-5"
              >
                { //チャンネルの閲覧権限がある時の錠前アイコン、違うなら"#"アイコン
                  directGetterChannelInfo(c.channelId).ChannelViewableRole.length !== 0
                  ?
                    <IconLock class={"shrink-0 cursor-help"} size={"18"} />
                  :
                    <IconHash />
                }
                <p class={storeHasNewMessage[c.channelId]?"truncate":"text-muted-foreground truncate"}>{ directGetterChannelInfo(c.channelId).name }</p>
                { storeHasNewMessage[c.channelId] && <span class="text-xs ml-auto shrink-0">●</span> }
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </For>
      </div>
    </SidebarMenu>
  )
}
