import { IconBell, IconEye, IconHash, IconUser } from "@tabler/icons-solidjs";
import { createEffect, createSignal, on } from "solid-js";
import ConfigChat from "~/components/Config/ConfigChat";
import ConfigDisplay from "~/components/Config/ConfigDisplay";
import ConfigNotification from "~/components/Config/ConfigNotification";
import ConfigProfile from "~/components/Config/ConfigProfile";
import { Card } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { SidebarMenuButton } from "~/components/ui/sidebar";
import SidebarTriggerWithDot from "~/components/unique/SidebarTriggerWithDot";
import { storeClientConfig } from "~/stores/ClientConfig";

export default function Config() {
  const [displayMode, setDisplayMode] = createSignal<"profile" | "chat" | "notification" | "display">("profile");

  //設定の変更を監視してLocalStorageに保存する
  createEffect(on(
    () => JSON.stringify(storeClientConfig),
    () => {
      localStorage.setItem("clientConfig", JSON.stringify(storeClientConfig));
    }
  ));

  return (
    <div class="p-2 h-full flex flex-col">

      {/* ヘッダー */}
      <Card class="w-full py-3 px-5 mb-2 flex md:flex-col flex-row gap-2">
        <div class="flex items-center gap-2">
          <SidebarTriggerWithDot />
          <p>設定</p>
        </div>
      </Card>

      <div class="grow flex flex-col md:flex-row gap-1">

        {/* スマホ用設定ページ選択 */}
        <div class="w-full md:hidden h-fit">
          <Select
            value={displayMode()}
            defaultValue={"profile"}
            onChange={setDisplayMode}
            options={["profile", "chat", "notification", "display"]}
            itemComponent={(props) =>
              <SelectItem item={props.item}>
                {props.item.textValue === "profile" && "プロフィール"}
                {props.item.textValue === "chat" && "会話"}
                {props.item.textValue === "notification" && "通知"}
                {props.item.textValue === "display" && "表示"}
              </SelectItem>
            }
          >
            <SelectTrigger aria-label="manage-display-mode">
              <SelectValue<"profile" | "chat" | "notification" | "display">>
                {
                  (state) =>
                  <span class="flex items-center">
                    { state.selectedOption() === "profile" && <p>プロフィール</p> }
                    { state.selectedOption() === "chat" && <p>会話</p> }
                    { state.selectedOption() === "notification" && <p>通知</p> }
                    { state.selectedOption() === "display" && <p>表示</p> }
                  </span>
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
        </div>
          
        {/* デスクトップ用設定ページ選択 */}
        <Card class="shrink-0 p-2 h-full w-64 hidden md:flex flex-col gap-1 overflow-y-auto text-left">
          <SidebarMenuButton
            onClick={()=>setDisplayMode("profile")}
            variant={displayMode()==="profile"?"outline":"default"}
            size={"lg"}
          >
            <IconUser />
            プロフィール
          </SidebarMenuButton>
          <SidebarMenuButton
            onClick={()=>setDisplayMode("chat")}
            variant={displayMode()==="chat"?"outline":"default"}
            size={"lg"}
          >
            <IconHash />
            会話
          </SidebarMenuButton>
          <SidebarMenuButton
            onClick={()=>setDisplayMode("notification")}
            variant={displayMode()==="notification"?"outline":"default"}
            size={"lg"}
          >
            <IconBell />
            通知
          </SidebarMenuButton>
          <SidebarMenuButton
            onClick={()=>setDisplayMode("display")}
            variant={displayMode()==="display"?"outline":"default"}
            size={"lg"}
          >
            <IconEye />
            表示
          </SidebarMenuButton>
        </Card>

        <div class="overflow-y-auto grow md:px-2 md:pt-0 pt-4">
          { displayMode()==="profile" && <ConfigProfile /> }
          { displayMode()==="chat" && <ConfigChat /> }
          { displayMode()==="display" && <ConfigDisplay /> }
          { displayMode()==="notification" && <ConfigNotification /> }
        </div>

      </div>
    </div>
  )
}