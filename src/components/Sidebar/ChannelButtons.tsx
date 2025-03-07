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

  //チャンネルのソート順を保持する変数
  let channelIndexes: { [channelId: string]: number } | null = null;
  //内部ソート計算用のチャンネルリスト
  let virtualList = [] as { channelId: string }[];
  //表示に使うチャンネルリスト
  const [channelListSorted, setChannelListSorted] = createSignal([...storeMyUserinfo.ChannelJoin]);

  /**
   * チャンネル表示をソートする
   */
  const sortIt = () => {
    //ソート順番を取得して確認してからソートする
    const indx = channelIndexes;
    if (indx) {
      //参加チャンネルデータを取得しなおす
      const sorted = [...storeMyUserinfo.ChannelJoin];
      sorted.sort((a, b) => {
        const aIndex = indx[a.channelId];
        const bIndex = indx[b.channelId];
        if (aIndex === undefined && bIndex === undefined) {
          return 0;
        }
        if (aIndex === undefined) {
          return 1;
        }
        if (bIndex === undefined) {
          return -1;
        }
        
        return aIndex - bIndex;
      });
      //console.log("ChannelButtons :: createEffect : sorted->", sorted);
      //ソート後のリストを仮想と表示用どっちもセット
      setChannelListSorted(sorted);
      virtualList = sorted;
    } else {
      //ソート順がない場合はそのまま表示、仮想リストも格納
      setChannelListSorted([...storeMyUserinfo.ChannelJoin]);
      virtualList = [...storeMyUserinfo.ChannelJoin];
    }
  }

  //チャンネルの入退出を監視してそのたびにソートする
  createEffect(
    on(
      () => storeMyUserinfo.ChannelJoin,
      () => sortIt()
    )
  );

  onMount(() => {
    //ソート順をLocalStorageから取得
    const indexString = localStorage.getItem("channelIndexes");
    if (indexString) {
      try {
        channelIndexes = JSON.parse(indexString);
      } catch(e) {
        console.error("ChannelButtons :: onMount : e->", e);
      }
    }

    //Sortable用の要素取得
    const el = document.getElementById("channelButtonDisplay");
    if (el === null) {
      console.error("Element not found");
      return;
    }

    new Sortable(el, {
      animation: 150,
      draggable: ".draggable",
      handle: ".drag-handler",
      onEnd: (evt) => {
        //console.log("ChannelButons :: ", evt);
        if (evt.newIndex === undefined || evt.oldIndex === undefined) return;

        //ソートした方向に合わせてvirtualListを更新
        if (evt.newIndex > evt.oldIndex) {
          const oldPosItem = virtualList[evt.oldIndex];
          for (let i=evt.oldIndex; i<evt.newIndex; i++) {
            virtualList[i] = virtualList[i+1];
          }
          virtualList[evt.newIndex] = oldPosItem;
        } else {
          const oldPosItem = virtualList[evt.oldIndex];
          for (let i=evt.oldIndex; i>evt.newIndex; i--) {
            virtualList[i] = virtualList[i-1];
          }
          virtualList[evt.newIndex] = oldPosItem;
        }
        //console.log("ChannelButtons :: onMount : sorted->", virtualList, evt.oldIndex, evt.newIndex);

        //順番をLocalStorageへ保存
        const newIndexes: { [channelId: string]: number } = {};
        for (const index in virtualList) {
          newIndexes[virtualList[index].channelId] = Number.parseInt(index);
        }
        localStorage.setItem("channelIndexes", JSON.stringify(newIndexes));
        //Index用の変数を更新
        channelIndexes = newIndexes;
      },
    });

    //初回表示用のチャンネルソート
    sortIt();
  });

  return (
    <SidebarMenu id="channelButtonDisplay">
      <For each={channelListSorted()}>
        {(c) => (
          <SidebarMenuItem class="draggable">
            <SidebarMenuButton
              as={A}
              href={`/app/channel/${c.channelId}`}
              variant={loc.pathname === `/app/channel/${c.channelId}` ? "outline" : "default"}
              class="truncate flex flex-row items-center md:p-2 p-5"
            >
              { //チャンネルの閲覧権限がある時の錠前アイコン、違うなら"#"アイコン
                directGetterChannelInfo(c.channelId).ChannelViewableRole.length !== 0
                ?
                  <IconLock class={"shrink-0 cursor-help drag-handler"} size={"18"} />
                :
                  <IconHash class={"drag-handler"} />
              }
              <p class={storeHasNewMessage[c.channelId]?"truncate":"text-muted-foreground truncate"}>{ directGetterChannelInfo(c.channelId).name }</p>
              { storeHasNewMessage[c.channelId] && <span class="text-xs ml-auto shrink-0">●</span> }
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </For>
    </SidebarMenu>
  )
}
