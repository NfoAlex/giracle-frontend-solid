import { IconBell, IconMessage2Exclamation } from "@tabler/icons-solidjs";
import { Card } from "../ui/card";
import { Switch, SwitchControl, SwitchThumb } from "../ui/switch";
import { storeClientConfig } from "~/stores/ClientConfig";

export default function Notification() {
  return (
    <div class="flex flex-col gap-6">
      
      {/* 通知の有効化 */}
      <Card class="p-4 flex flex-col gap-4">
        <span class="flex items-center">
          <span class="font-bold flex items-center gap-2">
            <IconBell />
            通知を有効化
          </span>
          <div class={"ml-auto flex items-center gap-2"}>
            <Switch
              onChange={(v) => storeClientConfig.notification.enabled = v}
              defaultChecked={storeClientConfig.notification.enabled}
            >
              <SwitchControl>
                <SwitchThumb />
              </SwitchControl>
            </Switch>
          </div>
        </span>

        <hr />

        <div>
          Giracleによる通知を有効/無効を設定します。
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