import { useParams } from "@solidjs/router";
import { createSignal } from "solid-js";
import Display from "~/components/Config/Display";
import Profile from "~/components/Config/Profile";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import SidebarTriggerWithDot from "~/components/unique/SidebarTriggerWithDot";

export default function Config() {
  const param = useParams();
  const [displayMode, setDisplayMode] = createSignal<"profile" | "notification" | "display">("profile");

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
            options={["profile", "notification", "display"]}
            itemComponent={(props) =>
              <SelectItem item={props.item}>
                {props.item.textValue === "profile" && "プロフィール"}
                {props.item.textValue === "notification" && "通知"}
                {props.item.textValue === "display" && "表示"}
              </SelectItem>
            }
          >
            <SelectTrigger aria-label="manage-display-mode">
              <SelectValue<"profile" | "notification" | "display">>
                {
                  (state) =>
                  <span class="flex items-center">
                    { state.selectedOption() === "profile" && <p>プロフィール</p> }
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
        <Card class="p-2 h-full w-64 hidden md:flex flex-col gap-1 overflow-y-auto text-left">
          <Button
            onClick={()=>setDisplayMode("profile")}
            variant={displayMode()==="profile" ? "secondary" : "ghost"}
          >プロフィール</Button>
          <Button
            onClick={()=>setDisplayMode("notification")}
            variant={displayMode()==="notification" ? "secondary" : "ghost"}
          >通知</Button>
          <Button
            onClick={()=>setDisplayMode("display")}
            variant={displayMode()==="display" ? "secondary" : "ghost"}
          >表示</Button>
        </Card>

        <div class="overflow-y-auto grow p-2">
          { displayMode()==="profile" && <Profile /> }
          { displayMode()==="display" && <Display /> }
        </div>

      </div>
    </div>
  )
}