import { useParams } from "@solidjs/router";
import { createSignal } from "solid-js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

export default function Config() {
  const param = useParams();
  const [displayMode, setDisplayMode] = createSignal<"profile" | "notification" | "display">("profile");

  return (
    <div class="flex flex-col md:flex-row">
      {/* スマホ用 */}
      <div class="w-full md:w-64 h-32 md:h-full">
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

      <div>
        ここで設定ページ
      </div>
    </div>
  )
}