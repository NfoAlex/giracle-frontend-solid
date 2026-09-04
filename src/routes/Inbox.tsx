import { Card } from "~/components/ui/card.tsx";
import { storeInbox } from "~/stores/Inbox.store.ts";
import { createSignal, Show } from "solid-js";
import { IconBed } from "@tabler/icons-solidjs";
import { api } from "~/api/index.ts";
import SidebarTriggerWithDot from "~/components/unique/SidebarTriggerWithDot.tsx";
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "~/components/ui/switch.tsx";
import DisplayInboxByChannel from "~/components/Inbox/DisplayInboxByChannel";
import DisplayInboxByDate from "~/components/Inbox/DisplayInboxByDate";

export default function Inbox() {
  const [groupByChannel, setGroupByChannel] = createSignal(false);

  /**
   * インボックス通知を既読にする
   * @param messageId 既読にするメッセージId
   */
  const readIt = (messageId: string) => {
    api.message.inboxRead({ messageId }).then((r) => {
      //console.log("Inbox :: readIt : r->", r);
    }).catch((e) => console.error("Inbox :: readIt : e->", e));
  }

  return (
    <div class={"p-2 flex flex-col gap-2"}>
      <Card class="w-full py-3 px-5 flex items-center gap-2">
        <SidebarTriggerWithDot />
        <p>通知</p>
      </Card>

      <div class={"flex flex-col gap-1"}>
        <Show when={storeInbox.length === 0}>
          <span class={"p-2 text-center flex flex-col items-center"}>
            <IconBed size={44} />
            <p>通知はありません</p>
          </span>
        </Show>

        <Show when={storeInbox.length !== 0}>
          <Card class="py-3 px-5 flex items-center">
            <p>{storeInbox.length}件のお知らせがあります。</p>
            <Switch
              class="flex items-center space-x-2 ml-auto"
              checked={groupByChannel()}
              onChange={setGroupByChannel}
            >
              <SwitchControl>
                <SwitchThumb />
              </SwitchControl>
              <SwitchLabel>チャンネルで分ける</SwitchLabel>
            </Switch>
          </Card>

          <Show when={groupByChannel()}>
            <DisplayInboxByChannel onReadIt={readIt} />
          </Show>
          <Show when={!groupByChannel()}>
            <DisplayInboxByDate onReadIt={readIt} />
          </Show>
        </Show>
      </div>
    </div>
  );
}