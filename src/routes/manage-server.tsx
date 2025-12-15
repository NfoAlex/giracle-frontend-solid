import { createSignal } from "solid-js";
import ManageCommunity from "~/components/ManageServer/manage-community.tsx";
import ManageInvite from "~/components/ManageServer/manage-invite.tsx";
import ManageRole from "~/components/ManageServer/manage-role.tsx";
import { Button } from "~/components/ui/button.tsx";
import { Card } from "~/components/ui/card.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select.tsx";
import { getRolePower } from "~/stores/MyUserinfo.ts";
import SidebarTriggerWithDot from "~/components/unique/SidebarTriggerWithDot.tsx";
import ManageEmoji from "~/components/ManageServer/manage-emoji.tsx";

export default function ManageServer() {
  const [displayMode, setDisplayMode] = createSignal<"community" | "role" | "invite" | "customEmoji">("community");

  return (
    <div class="p-2 flex flex-col h-full">
      <Card class="w-full py-3 px-5 mb-2 flex md:flex-col flex-row gap-2">
        <div class="flex items-center gap-2">
          <SidebarTriggerWithDot />
          <p>サーバー管理</p>
        </div>
        <hr class="hidden md:inline" />
        <div class="md:flex items-center gap-2 hidden">
          <Button onclick={()=>setDisplayMode("community")} variant={ displayMode()==="community" ? "default" : "outline" }>コミュニティ設定</Button>
          <Button onclick={()=>setDisplayMode("role")} variant={ displayMode()==="role" ? "default" : "outline" }>ロール</Button>
          <Button onclick={()=>setDisplayMode("invite")} variant={ displayMode()==="invite" ? "default" : "outline" }>招待</Button>
          <Button onclick={()=>setDisplayMode("customEmoji")} variant={ displayMode()==="customEmoji" ? "default" : "outline" }>カスタム絵文字</Button>
        </div>

        {/* スマホ用 */}
        <div class="ml-auto w-1/3 md:hidden">
          <Select
            value={displayMode()}
            defaultValue={"community"}
            onChange={setDisplayMode}
            options={["community", "role", "invite"]}
            itemComponent={(props) =>
              <SelectItem item={props.item}>
                {props.item.textValue === "community" && "コミュニティ設定"}
                {props.item.textValue === "role" && "ロール"}
                {props.item.textValue === "invite" && "招待"}
                {props.item.textValue === "customEmoji" && "カスタム絵文字"}
              </SelectItem>
            }
          >
            <SelectTrigger aria-label="manage-display-mode">
              <SelectValue<"community" | "role" | "invite" | "customEmoji">>
                {
                  (state) =>
                  <span class="flex items-center">
                    { state.selectedOption() === "community" && <p>コミュニティ設定</p> }
                    { state.selectedOption() === "role" && <p>ロール設定</p> }
                    { state.selectedOption() === "invite" && <p>招待</p> }
                    { state.selectedOption() === "customEmoji" && <p>カスタム絵文字</p> }
                  </span>
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
        </div>
      </Card>
      
      { displayMode() === "community" && (getRolePower("manageServer") ? <ManageCommunity /> : <p>サーバーの管理権限がありません</p>) }
      { displayMode() === "role" && (getRolePower("manageRole") ? <ManageRole /> : <p>ロールの管理権限がありません</p>) }
      { displayMode() === "invite" && (getRolePower("manageServer") ? <ManageInvite /> : <p>サーバーの管理権限がありません</p>) }
      { displayMode() === "customEmoji" && (getRolePower("manageEmoji") ? <ManageEmoji /> : <p>カスタム絵文字の管理権限がありません</p>) }
    </div>
  );
}
