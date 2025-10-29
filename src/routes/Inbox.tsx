import { Card } from "~/components/ui/card";
import { storeInbox } from "~/stores/Inbox";
import { createSignal, Show } from "solid-js";
import { IconBed } from "@tabler/icons-solidjs";
import POST_MESSAGE_INBOX_READ from "~/api/MESSAGE/MESSAGE_INBOX_READ";
import SidebarTriggerWithDot from "~/components/unique/SidebarTriggerWithDot";
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "~/components/ui/switch";
import DisplayInboxByChannel from "~/components/Inbox/DisplayInboxByChannel";
import DisplayInboxByDate from "~/components/Inbox/DisplayInboxByDate";

export default function Inbox() {
  const [groupByChannel, setGroupByChannel] = createSignal(false);

  /**
   * インボックス通知を既読にする
   * @param messageId 既読にするメッセージId
   */
  const readIt = (messageId: string) => {
    POST_MESSAGE_INBOX_READ(messageId).then((r) => {
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
      </div>
    </div>
  );
}