import { For, Show } from "solid-js";
import { Card } from "~/components/ui/card.tsx";

export interface IMentionMenuItem {
  id: string;
  name: string;
  iconUrl?: string;
  /** アイコン画像が無い項目の丸バッジ文字(既定 `#`) */
  fallbackGlyph?: string;
}

export default function MentionMenu(props: {
  items: IMentionMenuItem[];
  selectIndex: number;
  onSelect: (item: IMentionMenuItem) => void;
  displayBottom?: boolean;
}) {
  return (
    <div
      class={`absolute left-0 ${props.displayBottom ? "top-full" : "bottom-full"} w-full z-10`}
    >
      <Card
        class={"border-b-0 w-full p-2 overflow-y-auto max-h-40 cursor-pointer"}
      >
        <Show when={props.items.length === 0}>
          <p class={"text-center"}>...</p>
        </Show>
        <For each={props.items}>
          {(item, index) => (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => props.onSelect(item)}
              class={`flex items-center gap-2 p-2 rounded hover:bg-border w-full text-left ${
                props.selectIndex === index() ? "bg-border" : ""
              }`}
            >
              <Show
                when={item.iconUrl}
                fallback={
                  <span class="w-8 h-8 rounded-full bg-border flex items-center justify-center text-sm shrink-0">
                    {item.fallbackGlyph ?? "#"}
                  </span>
                }
              >
                <img
                  alt={item.name}
                  src={item.iconUrl}
                  class={"w-8 h-8 rounded-full"}
                />
              </Show>
              <div class={"flex-grow"}>
                <p>{item.name}</p>
              </div>
            </button>
          )}
        </For>
      </Card>
    </div>
  );
}
