import { createSignal } from "solid-js";
import ManageCommunity from "~/components/ManageServer/manage-community";
import ManageRole from "~/components/ManageServer/manage-role";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { SidebarTrigger } from "~/components/ui/sidebar";

export default function ManageServer() {
  const [displayMode, setDisplayMode] = createSignal<"community" | "role" | "invite">("community");

  return (
    <div class="p-2 flex flex-col h-full">
      <Card class="w-full py-3 px-5 mb-2 flex md:flex-col md:items-center flex-row gap-2">
        <div class="flex items-center gap-2">
          <SidebarTrigger />
          <p>サーバー管理</p>
        </div>
        <hr class="hidden md:flex" />
        <div class="md:flex items-center gap-2 hidden">
          <Button onclick={()=>setDisplayMode("community")} variant={ displayMode()==="community" ? "default" : "outline" }>コミュニティ設定</Button>
          <Button onclick={()=>setDisplayMode("role")} variant={ displayMode()==="role" ? "default" : "outline" }>ロール</Button>
          <Button onclick={()=>setDisplayMode("invite")} variant={ displayMode()==="invite" ? "default" : "outline" }>招待</Button>
        </div>

        {/* スマホ用 */}
        <div class="ml-auto w-1/3">
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
              </SelectItem>
            }
          >
            <SelectTrigger aria-label="manage-display-mode">
              <SelectValue<"community" | "role" | "invite">>
                {
                  (state) =>
                  <span class="flex items-center">
                    { state.selectedOption() === "community" && <p>コミュニティ設定</p> }
                    { state.selectedOption() === "role" && <p>ロール設定</p> }
                    { state.selectedOption() === "invite" && <p>招待</p> }
                  </span>
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
        </div>
      </Card>
      
      { displayMode() === "community" && <ManageCommunity /> }
      { displayMode() === "role" && <ManageRole /> }
    </div>
  );
}
