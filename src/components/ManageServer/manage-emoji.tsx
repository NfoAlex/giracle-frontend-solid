import {Card} from "~/components/ui/card";
import {For, Show} from "solid-js";
import {storeCustomEmoji} from "~/stores/CustomEmoji";
import CreateCustomEmoji from "~/components/ManageServer/ManageEmoji/CreateCustomEmoji";

export default function ManageEmoji() {
  return (
    <div class="flex flex-col overflow-y-auto h-full gap-2">

      <Card class={"p-2 max-h-full overflow-y-auto"}>
        <Show when={storeCustomEmoji.length === 0}>
          <div class={"text-center py-5"}>
            <p>カスタム絵文字がありません。</p>
          </div>
        </Show>

        <For each={storeCustomEmoji}>
          {
            (emoji) => (
              <div class={"flex items-center gap-2"}>
                <p>{ emoji.code}</p>
                <img src={"/api/server/custom-emoji/" + emoji.code} alt={emoji.code} class={"w-8 h-8"} />
              </div>
            )
          }
        </For>
      </Card>

      <CreateCustomEmoji />
    </div>
  );
}