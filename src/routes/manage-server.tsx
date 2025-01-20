import { createSignal, onMount } from "solid-js";
import POST_SERVER_CHANGE_CONFIG from "~/api/SERVER/SERVER_CHANGE_CONFIG";
import POST_SERVER_CHANGE_INFO from "~/api/SERVER/SERVER_CHANGE_INFO";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { NumberField, NumberFieldDecrementTrigger, NumberFieldErrorMessage, NumberFieldGroup, NumberFieldIncrementTrigger, NumberFieldInput } from "~/components/ui/number-field";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "~/components/ui/switch";
import { TextFieldInput, TextField } from "~/components/ui/text-field";
import { setStoreServerinfo, storeServerinfo } from "~/stores/Serverinfo";
import type { IServer } from "~/types/Server";

export default function ManageServer() {
  const [processing, setProcessing] = createSignal(true);
  const [serverConfig, setServerConfig] = createSignal<IServer>({
    name: "",
    introduction: "",
    RegisterAvailable: false,
    RegisterInviteOnly: false,
    RegisterAnnounceChannelId: "",
    MessageMaxLength: 0,
    defaultJoinChannel: []
  });
  const configChanged = () => {
    return JSON.stringify(serverConfig()) !== JSON.stringify(storeServerinfo);
  };

  /**
   * サーバー設定を変更する
   */
  const changeServerConfig = () => {
    //サーバー情報更新
    POST_SERVER_CHANGE_INFO(serverConfig().name, serverConfig().introduction)
      .then((r) => {
        setStoreServerinfo(r.data);
        setServerConfig({...storeServerinfo});
      })
      .catch((err) => console.error("ManageServer :: changeServerConfig :: err->", err));

    //サーバー設定更新
    POST_SERVER_CHANGE_CONFIG(serverConfig())
      .then((r) => {
        setStoreServerinfo(r.data);
        setServerConfig({...storeServerinfo});
      })
      .catch((err) => console.error("ManageServer :: changeServerConfig :: err->", err));
  }

  onMount(() => {
    storeServerinfo
    setServerConfig({...storeServerinfo});
  });

  return (
    <div class="p-2 flex flex-col h-full">
      <Card class="w-full py-3 px-5 flex items-center gap-2">
        <SidebarTrigger />
        <p>サーバー管理
        </p>
      </Card>
      
      <Card class="fixed py-3 px-5 bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
        <Button onClick={changeServerConfig} disabled={!configChanged()}>変更を適用</Button>
        <Button onClick={()=>setServerConfig({...storeServerinfo})} disabled={!configChanged()} variant={"outline"}>復元</Button>
      </Card>

      <div class="overflow-y-auto mx-auto grow w-full max-w-[950px] pt-3 pb-10 flex flex-col gap-2">
        <Card>
          <CardHeader>
            <CardTitle>コミュニティについて</CardTitle>
          </CardHeader>
          <CardContent class="flex flex-col gap-4">
            <TextField>
              <Label>名前</Label>
              <TextFieldInput
                type="text"
                value={serverConfig().name}
                onChange={(e) => setServerConfig({...serverConfig(), name: e.currentTarget.value})}
              />
            </TextField>

            <TextField>
              <Label>概要</Label>
              <TextFieldInput
                type="text"
                value={serverConfig().introduction}
                onChange={(e) => setServerConfig({...serverConfig(), introduction: e.currentTarget.value})}
              />
            </TextField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>コミュミティカバー</CardTitle>
          </CardHeader>
          <CardContent>
            <TextField>
              <TextFieldInput type="file" />
            </TextField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>各種設定</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="font-bold mb-2">アカウント登録</p>
            <span class="flex flex-col gap-2">
              <Switch
                checked={serverConfig().RegisterAvailable}
                onChange={(e) => setServerConfig({...serverConfig(), RegisterAvailable: e.valueOf()})}
                class="flex items-center space-x-2"
              >
                <SwitchControl>
                  <SwitchThumb />
                </SwitchControl>
                <SwitchLabel>新規登録を有効化</SwitchLabel>
              </Switch>
              <Switch
                checked={serverConfig().RegisterInviteOnly}
                onChange={(e) => setServerConfig({...serverConfig(), RegisterInviteOnly: e.valueOf()})}
                class="flex items-center space-x-2"
              >
                <SwitchControl>
                  <SwitchThumb />
                </SwitchControl>
                <SwitchLabel>招待制にする</SwitchLabel>
              </Switch>
            </span>

            <hr class="my-6" />

            <p class="font-bold mb-2">メッセージ</p>
            <span class="flex flex-col gap-2">
              <p>メッセージの文字数制限</p>
              <NumberField
                class="w-36"
                value={serverConfig().MessageMaxLength}
                defaultValue={3000}
                onRawValueChange={(e) => setServerConfig({...serverConfig(), MessageMaxLength: e})}
                validationState={serverConfig().MessageMaxLength <= 0 ? "invalid" : "valid"}
              >
                <NumberFieldGroup>
                  <NumberFieldInput />
                  <NumberFieldIncrementTrigger />
                  <NumberFieldDecrementTrigger />
                </NumberFieldGroup>
                <NumberFieldErrorMessage>発言できません。</NumberFieldErrorMessage>
              </NumberField>
            </span>

            <hr class="my-6" />

            <p class="font-bold mb-2">デフォルトで参加するチャンネル</p>
            <p class="italic">todo...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
