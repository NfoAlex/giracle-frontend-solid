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
import { storeServerinfo } from "~/stores/Serverinfo";
import { Avatar, AvatarImage } from "./ui/avatar";
import { storeAppStatus } from "~/stores/AppStatus";
import {IconBell, IconDatabaseCog, IconList, IconSettings} from "@tabler/icons-solidjs";
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
