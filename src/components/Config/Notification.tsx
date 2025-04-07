import { IconBell, IconMessage2Exclamation } from "@tabler/icons-solidjs";
import { Card } from "../ui/card";
import { Switch, SwitchControl, SwitchThumb } from "../ui/switch";
import { storeClientConfig } from "~/stores/ClientConfig";

export default function Notification() {
  return (
    <div class="flex flex-col gap-6">
      
      {/* メンション通知の有効化 */}
      <Card class="p-4 flex flex-col gap-4">
        <span class="flex items-center">
          <span class="font-bold flex items-center gap-2">
            <IconBell />
            メンションによる通知を有効化
          </span>
          <div class={"ml-auto flex items-center gap-2"}>
            <Switch
              onChange={(v) => storeClientConfig.notification.notifyInbox = v}
              defaultChecked={storeClientConfig.notification.notifyInbox}
            >
              <SwitchControl>
                <SwitchThumb />
              </SwitchControl>
            </Switch>
          </div>
        </span>

        <hr />

        <div>
          メンションを受けた際の通知を有効化するかどうかを設定します。
        </div>
      </Card>

      {/* すべてのメッセージ受信による通知の有効化 */}
      <Card class="p-4 flex flex-col gap-4">
        <span class="flex items-center">
          <span class="font-bold flex items-center gap-2">
            <IconMessage2Exclamation />
            全てのメッセージ通知を有効化
          </span>
          <div class={"ml-auto flex items-center gap-2"}>
            <Switch
              onChange={(v) => storeClientConfig.notification.notifyAll = v}
              defaultChecked={storeClientConfig.notification.notifyAll}
            >
              <SwitchControl>
                <SwitchThumb />
              </SwitchControl>
            </Switch>
          </div>
        </span>

        <hr />

        <div>
          メンションにかかわらず、すべてのメッセージを受信した際に通知します。
        </div>
      </Card>

    </div>
  )
}