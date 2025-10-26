import { A, useLocation } from "@solidjs/router";
import { Show } from "solid-js";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
} from "~/components/ui/sidebar";
import { getRolePower, storeMyUserinfo } from "~/stores/MyUserinfo";
import { storeUserOnline } from "~/stores/Userinfo";
import { storeServerinfo } from "~/stores/Serverinfo";
import { Avatar, AvatarImage } from "./ui/avatar";
import { storeAppStatus } from "~/stores/AppStatus";
import {IconBell, IconCircleFilled, IconDatabaseCog, IconList, IconSearch, IconSettings} from "@tabler/icons-solidjs";
import {storeInbox} from "~/stores/Inbox";
import {Badge} from "~/components/ui/badge";
import OnlineUserDisplay from "~/components/Sidebar/OnlineUserDisplay";
import ChannelButtons from "./Sidebar/ChannelButtons";

export function AppSidebar() {
  const loc = useLocation();

  return (
    <Sidebar class={"h-screen"}>
      <SidebarHeader>
        <p class=" text-xl">{storeServerinfo.name}</p>
      </SidebarHeader>

      <SidebarContent id={"sidebar-content flex flex-col"}>
        <SidebarGroup class={"shrink-0"}>
          <SidebarMenu>
            {storeAppStatus.wsConnected ?
                <span class={"w-full"}>
                  <OnlineUserDisplay />
                </span>
              :
              <Badge variant={"secondary"} class={"px-3 py-2"}>再接続中...</Badge>
            }
          </SidebarMenu>
          {
            storeAppStatus.wsConnected ?
              <span class={"w-full"}>
                <A href="/app/online-user">
                  <Badge variant={"secondary"} class={"w-full flex items-center px-3 py-2"}>
                    <p class="font-bold">online user : </p>
                    <span class={"ml-auto flex items-center gap-1"}>
                      <IconCircleFilled color={"green"} size={16} />
                      { storeUserOnline.length }
                    </span>
                  </Badge>
                </A>
              </span>
            :
              <Badge variant={"secondary"} class={"px-3 py-2"}>再接続中...</Badge>
          }
        </SidebarGroup>

        <hr />

        <div class={"flex flex-col overflow-y-auto"}>

          <SidebarGroup>
            <SidebarMenuButton as={A} href="/app/inbox" variant={loc.pathname === "/app/inbox" ? "outline" : "default"}>
              <IconBell />
              <p>通知</p>
              <p class={"ml-auto"}>{ storeInbox.length!==0?storeInbox.length:"" }</p>
            </SidebarMenuButton>
            <SidebarMenuButton as={A} href="/app/channel-browser" variant={loc.pathname === "/app/channel-browser" ? "outline" : "default"}>
              <IconList />
              チャンネル一覧
            </SidebarMenuButton>
            <SidebarMenuButton as={A} href="/app/search" variant={loc.pathname === "/app/search" ? "outline" : "default"}>
              <IconSearch />
              検索
            </SidebarMenuButton>
          </SidebarGroup>

          <hr />

          <SidebarGroup>

          <SidebarGroupLabel>参加チャンネル</SidebarGroupLabel>
            <ChannelButtons />
          </SidebarGroup>

        </div>

        <SidebarGroup />
      </SidebarContent>

      <hr class="pb-2" />
      <Show when={getRolePower("manageRole") || getRolePower("manageServer") || getRolePower("manageEmoji")}>
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
      <A href={"/app/config"}>
        <SidebarFooter class="pb-5 pt-2">
          <div class="flex items-center gap-2">
            <Avatar class="w-auto h-8">
              <AvatarImage src={`/api/user/icon/${storeMyUserinfo.id}`} />
            </Avatar>
            <p>{storeMyUserinfo.name}</p>

            <IconSettings class="ml-auto w-5" />
          </div>
        </SidebarFooter>
      </A>
    </Sidebar>
  );
}
