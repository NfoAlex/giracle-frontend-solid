import { For, Show } from "solid-js";
import { Card } from "~/components/ui/card.tsx";
import type { IUser } from "~/types/User.ts";
import type { MentionState } from "./MentionExtension.ts";

export default function MentionMenu(props: {
  state: MentionState;
  onSelect: (user: IUser) => void;
}) {
  return (
    <div class="absolute left-0 bottom-full w-full z-10">
      <Card
        class={"border-b-0 w-full p-2 overflow-y-auto max-h-40 cursor-pointer"}
      >
        <Show when={props.state.users.length === 0}>
          <p class={"text-center"}>...</p>
        </Show>
        <For each={props.state.users}>
          {(user, index) => (
            <button
              type="button"
              onClick={() => props.onSelect(user)}
              class={`flex items-center gap-2 p-2 rounded hover:bg-border w-full text-left ${
                props.state.selectIndex === index() ? "bg-border" : ""
              }`}
            >
              <img
                alt={user.name}
                src={`/api/user/icon/${user.id}`}
                class={"w-8 h-8 rounded-full"}
              />
              <div class={"flex-grow"}>
                <p>{user.name}</p>
              </div>
            </button>
          )}
        </For>
      </Card>
    </div>
  );
}
