import { For, Show } from "solid-js";
import { Card } from "~/components/ui/card.tsx";
import type { IUser } from "~/types/User.ts";

/**
 * メンション検索結果ポップアップ。既存ChannelTextInput.tsxのCard絶対配置パターンを踏襲。
 */
export default function MentionSearchPopup(props: {
  results: IUser[];
  selectIndex: number;
  onSelect: (user: IUser) => void;
}) {
  return (
    <Card class={"absolute left-0 bottom-full border-b-0 w-full p-2 overflow-y-auto max-h-40 cursor-pointer"}>
      <Show when={props.results.length === 0}>
        <p class={"text-center"}>...</p>
      </Show>
      <For each={props.results}>
        {(user, index) => (
          <div
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => props.onSelect(user)}
            class={`flex items-center gap-2 p-2 rounded hover:bg-border ${props.selectIndex === index() ? "bg-border" : ""}`}
          >
            <img alt={user.name} src={`/api/user/icon/${user.id}`} class={"w-8 h-8 rounded-full"} />
            <div class={"flex-grow"}>
              <p>{user.name}</p>
            </div>
          </div>
        )}
      </For>
    </Card>
  );
}
