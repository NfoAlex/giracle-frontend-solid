import { IconBell, IconBellX, IconMessage2Exclamation } from "@tabler/icons-solidjs";
import { Card } from "../ui/card.tsx";
import { Switch, SwitchControl, SwitchThumb } from "../ui/switch";
import { storeClientConfig } from "~/stores/ClientConfig.ts";
import { createSignal } from "solid-js";
import { Button } from "../ui/button.tsx";

export default function ConfigNotification() {
  const [notifyOk, setNotifyOk] = createSignal(false);

  //通知権限の確認
  if (Notification.permission === "granted") {
    setNotifyOk(true);
  } else if (Notification.permission === "denied") {
    setNotifyOk(false);
  }

  /**
   * 通知権限の取得
   */
  const getNotifyPermission = () => {
    if (Notification.permission === "granted") {
      return;
    }

    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        setNotifyOk(true);
      } else {
        setNotifyOk(false);
      }
    });
  }

  return (
    <div class="flex flex-col gap-6">
      
      {/* 通知権限確認・取得用枠 */}
      <div class="flex flex-col items-center justify-center p-4 gap-2">
        {
          notifyOk()
          ?
            <>
              <IconBell />
              <p>ブラウザによるプッシュ通知が有効です。</p>
            </>
          :
            <>
              <IconBellX />
              <p>通知が有効化されていません。</p>
              <Button onClick={getNotifyPermission}>通知許可を取得する</Button>
            </>
        }
      </div>

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