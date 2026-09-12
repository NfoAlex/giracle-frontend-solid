import { storeClientConfig } from "~/stores/ClientConfig.store.ts";
import { Card } from "../ui/card.tsx";
import { IconKeyboard, IconReload } from "@tabler/icons-solidjs";
import { Switch, SwitchControl, SwitchThumb } from "../ui/switch";
import { Button } from "../ui/button.tsx";

export default function ConfigBot() {
  return (
    <div class="flex flex-col gap-6">

    <span class="flex flex-row items-center gap-2">
      <p class="font-bold text-2xl my-2">Bot管理</p>
      <Button
        class="ml-auto"
        size={"icon"}
        variant={"secondary"}
      >
        <IconReload />
      </Button>
    </span>

      {/* メッセージ送信にCtrlキーを必要に設定する */}
      <Card class="p-4 flex flex-col gap-4">
        <span class="flex items-center">
          <span class="font-bold flex items-center gap-2">
            <IconKeyboard />
            メッセージ送信をCtrl+Enterキーに設定する
          </span>
          <div class={"ml-auto flex items-center gap-2"}>
            <Switch
              onChange={(v) => storeClientConfig.chat.sendWithCtrlKey = v}
              defaultChecked={storeClientConfig.chat.sendWithCtrlKey}
            >
              <SwitchControl>
                <SwitchThumb />
              </SwitchControl>
            </Switch>
          </div>
        </span>

        <hr />

        <div>
          メッセージを送信する際に、Enterキーと同時にCtrlキーを押す必要があるように設定します。(無効だとEnterキーのみで送信されます。)
        </div>
      </Card>

    </div>
  )
}
