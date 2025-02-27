import {Card} from "~/components/ui/card";
import {For} from "solid-js";
import {storeCustomEmoji} from "~/stores/CustomEmoji";
import {Button} from "~/components/ui/button";
import {IconPlus} from "@tabler/icons-solidjs";
import CreateCustomEmoji from "~/components/ManageServer/ManageEmoji/CreateCustomEmoji";

export default function ManageEmoji() {
  return (
    <div class="flex flex-col overflow-y-auto h-full gap-2">

      <Card class={"p-2 max-h-full overflow-y-auto"}>
        <For each={storeCustomEmoji}>
          {
            (emoji) => (
              <div class={"flex items-center gap-2"}>
                <p>{ emoji.code}</p>
                <img src={"/api/server/custom-emoji/" + emoji.id} alt={emoji.code} class={"w-8 h-8"} />
              </div>
            )
          }
        </For>
      </Card>

      <CreateCustomEmoji />
    </div>
  );
}