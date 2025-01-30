import { A, useLocation } from "@solidjs/router";
import { For, Show } from "solid-js";
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
import { getRolePower, storeMyUserinfo } from "~/stores/MyUserinfo";
import { storeServerinfo } from "~/stores/Serverinfo";
import { Avatar, AvatarImage } from "./ui/avatar";
import { storeAppStatus } from "~/stores/AppStatus";
import { storeHasNewMessage } from "~/stores/HasNewMessage";
import { IconDatabaseCog } from "@tabler/icons-solidjs";
import {directGetterChannelInfo} from "~/stores/ChannelInfo";
import {storeUserOnline} from "~/stores/Userinfo";

export function AppSidebar() {
  const loc = useLocation();

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
                <span class={"flex items-center pr-3"}>
                  <p>オンラインユーザー : </p> <p class={"ml-auto"}>{ storeUserOnline.length }</p>
                </span>
                :
                <p class="italic">再接続中...</p>
              }
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarMenuButton as={A} href="/app/channel-browser" variant={loc.pathname === "/app/channel-browser" ? "outline" : "default"}>
            チャンネル一覧
          </SidebarMenuButton>
          <SidebarGroupLabel>参加チャンネル</SidebarGroupLabel>
          <SidebarMenu>
            <For each={storeMyUserinfo.ChannelJoin}>
              {(c) => (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    as={A}
                    href={`/app/channel/${c.channelId}`}
                    variant={loc.pathname === `/app/channel/${c.channelId}` ? "outline" : "default"}
                    class="truncate flex flex-row items-center"
                  >
                    <p>{ directGetterChannelInfo(c.channelId).name }</p>
                    { storeHasNewMessage[c.channelId] && <span class="text-xs ml-auto">●</span> }
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </For>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup />
      </SidebarContent>

      <hr class="pb-2" />
      <Show when={getRolePower("manageRole") || getRolePower("manageServer")}>
        <SidebarFooter class="py-2">
          <SidebarMenuButton
            as={A}
            href="/app/manage-server"
            variant={loc.pathname === "/app/manage-server" ? "outline" : "default"}
          >
            <IconDatabaseCog />
            サーバー管理
          </SidebarMenuButton>
        </SidebarFooter>
      </Show>
      <A href={"/app/profile"}>
        <SidebarFooter class="pb-5 pt-2">
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
