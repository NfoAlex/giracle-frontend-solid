import { A } from "@solidjs/router";
import { For } from "solid-js";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { storeMyUserinfo } from "~/stores/MyUserinfo";
import { storeServerinfo } from "~/stores/Serverinfo";
import { Avatar, AvatarImage } from "./ui/avatar";
import ChannelName from "./unique/ChannelName";
import { storeAppStatus } from "~/stores/AppStatus";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <p class=" text-xl">{storeServerinfo.name}</p>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              {storeAppStatus.wsConnected ? 
                <p>
                  オンラインユーザー : todo...
                </p>
                :
                <p class="italic">再接続中...</p>
              }
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>チャンネル</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <A href="/app/channel/1234">
                <SidebarMenuButton>test</SidebarMenuButton>
              </A>
            </SidebarMenuItem>
            <For each={storeMyUserinfo.ChannelJoin}>
              {(c) => (
                <SidebarMenuItem>
                  <A href={`/app/channel/${c.channelId}`}>
                    <SidebarMenuButton class="truncate">
                      <ChannelName channelId={c.channelId} />
                    </SidebarMenuButton>
                  </A>
                </SidebarMenuItem>
              )}
            </For>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup />
      </SidebarContent>

      <A href="/profile">
        <SidebarFooter class="py-5">
          <div class="flex items-center gap-2">
            <Avatar class="w-auto h-8">
              <AvatarImage src={`/api/user/icon/${storeMyUserinfo.id}`} />
            </Avatar>
            <p>{storeMyUserinfo.name}</p>
          </div>
        </SidebarFooter>
      </A>
    </Sidebar>
  );
}
