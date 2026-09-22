import { IconAlertCircle, IconArrowLeft, IconHash } from "@tabler/icons-solidjs";
import { createEffect, createMemo, createSignal, For, on, Show } from "solid-js";
import { api } from "~/api";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Switch, SwitchControl, SwitchThumb } from "~/components/ui/switch";
import { TextField, TextFieldInput, TextFieldTextArea } from "~/components/ui/text-field";
import type { IBot } from "~/types/Server";
import DialogSearchChannels from "./ConfigBotDetail/DialogSearchChannels";
import DialogConfirmDeleteBot from "./ConfigBotDetail/DialogConfirmDeleteBot";
import type { IChannel } from "~/types/Channel";
import { useStoreChannelInfo } from "~/stores/ChannelInfo.store";
import { Badge } from "~/components/ui/badge";
import BotApprovalBadge from "~/components/unique/BotApprovalBadge";
import { Separator } from "~/components/ui/separator";

export default function ConfigBotDetail(props: { returnToListProxy: () => void; botId?: string }) {
  const [bot, setBot] = createSignal<IBot | undefined>();
  const [usingChannelIds, setUsingChannelIds] = createSignal<IChannel["id"][]>([]);
  const [processing, setProcessing] = createSignal(false);
  const [currentBot, setCurrentBot] = createSignal<IBot | undefined>();
  const [currentUsingChannelIds, setCurrentUsingChannelIds] = createSignal<IChannel["id"][]>([]);
  const [error, setError] = createSignal<string | null>(null);

  // 変更検知: 比較元 (currentBot) と編集値 (bot) を毎回文字列化して比較
  const botInfoChanged = createMemo(() => JSON.stringify(currentBot()) !== JSON.stringify(bot()));
  const usingChannelsChanged = createMemo(() => JSON.stringify(currentUsingChannelIds()) !== JSON.stringify(usingChannelIds()));

  if (props.botId === undefined) {
    return (
      <p class="text-center">Bot情報が見つかりません。</p>
    )
  }

  const fetchBot = () => {
    if (props.botId === undefined) return;
    setProcessing(true);
    setError(null);
    api.server.getBotById({ botId: props.botId })
      .then((res) => {
        setBot(res.data);
        setCurrentBot({ ...res.data });
        setUsingChannelIds(res.data.channelPermissions.map(c => c.channelId));
        setCurrentUsingChannelIds(res.data.channelPermissions.map(c => c.channelId));
      })
      .catch((e) => {
        console.error("ConfigBotDetail :: fetchBot : e", e);
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        setProcessing(false);
      });
  };

  const updateBot = () => {
    const botNow = bot();
    if (botNow === undefined || props.botId === undefined) return;
    setProcessing(true);
    setError(null);

    api.server.patchBot({
      botId: props.botId,
      botName: botNow.botName,
      // 概要が未入力(Null/空文字)のときはキーごと送らない。
      // バックエンドは指定時に1文字以上を要求するため、そのまま送ると422で更新全体が失敗する
      botDescription: botNow.botDescription || undefined,
      permissionChannelIds: usingChannelIds(),
      useAllChannel: botNow.useAllChannel,
      canFetchUserinfo: botNow.canFetchUserinfo,
      canFetchRoleinfo: botNow.canFetchRoleinfo,
      canManageUser: botNow.canManageUser,
      canManageServerConfig: botNow.canManageServerConfig,
      canReadMessage: botNow.canReadMessage,
      canSendMessage: botNow.canSendMessage,
    })
      .then((res) => {
        setBot(res.data);
        setCurrentBot({ ...res.data });
        //保存できたので現在値もサーバー応答に合わせて更新(未保存差分を消す)
        const savedChannelIds = res.data.channelPermissions.map(c => c.channelId) ?? [];
        setUsingChannelIds(savedChannelIds);
        setCurrentUsingChannelIds([...savedChannelIds]);
      })
      .catch((e) => {
        console.error("ConfigBotDetail :: updateBot : e", e);
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        setProcessing(false);
      });
  };

  const restore = () => {
    const currentBotNow = currentBot();
    if (currentBotNow === undefined) return;
    setBot({ ...currentBotNow });
    setUsingChannelIds([...currentUsingChannelIds()]);
  };

  // botId が同一インスタンス内で変わっても再取得する
  createEffect(on(() => props.botId, fetchBot));

  return (
    <div class="grow h-full w-full flex flex-col overflow-y-hidden">
      <div class="flex items-center gap-2 w-full">
        <Button onClick={props.returnToListProxy} variant={"ghost"}>
          <IconArrowLeft /> 戻る
        </Button>

        <div class="shrink min-w-0 ml-auto flex items-center gap-2 w-fit md:max-w-[75%]">
          <p class="truncate">{ currentBot()?.botName ?? "..." }</p>
          <BotApprovalBadge
            approveStatus={currentBot()?.approveStatus ?? "PENDING"}
            class="shrink-0"
          />
        </div>
      </div>

      <hr class="mt-2" />

      <Show when={error()}>
        <Alert variant="destructive" class="mt-2 shrink-0">
          <IconAlertCircle class="size-6" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>内容: {error()}</AlertDescription>
        </Alert>
      </Show>

      <div class="grow overflow-y-auto flex flex-col gap-2 py-2">
        <Show
          when={bot()}
          fallback={
            <p class="text-center">
              {processing() ? "Bot取得中..." : "Bot情報を取得できませんでした。"}
            </p>
          }
        >
          <p class="mt-4 font-medium">基本情報</p>
          <Card class="shrink-0 p-4 flex flex-col gap-4">
            <div class="flex items-center w-full">
              <p>Bot名</p>
              <TextField class="ml-auto text-lg max-w-[50%]">
                <TextFieldInput
                  value={bot()!.botName}
                  onInput={e => setBot({...bot()!, botName: e.currentTarget.value })}
                />
              </TextField>
            </div>
            <hr />
            <div class="flex items-center w-full">
              <p>概要</p>
              <TextField class="ml-auto text-lg max-w-[50%]">
                <TextFieldTextArea
                  value={bot()!.botDescription ?? ""}
                  onInput={(e) => setBot({ ...bot()!, botDescription: e.currentTarget.value })}
                  rows={3}
                />
              </TextField>
            </div>
          </Card>

          <p class="mt-4 font-medium">権限</p>
          <Card class="shrink-0 p-4 flex flex-col gap-4">
            <div class="flex items-center w-full">
              <p>他人・自分のメッセージを取得できる</p>
              <Switch
                checked={bot()!.canReadMessage ?? false}
                onChange={(v) => setBot(b => ({ ...b!, canReadMessage: v }))}
                class="ml-auto"
              >
                <SwitchControl>
                  <SwitchThumb />
                </SwitchControl>
              </Switch>
            </div>
            <hr />
            <div class="flex items-center w-full">
              <p>自分のメッセージを送信・編集できる</p>
              <Switch
                checked={bot()!.canSendMessage ?? false}
                onChange={(v) => setBot(b => ({ ...b!, canSendMessage: v }))}
                class="ml-auto"
              >
                <SwitchControl>
                  <SwitchThumb />
                </SwitchControl>
              </Switch>
            </div>
          </Card>

          <p class="mt-4 font-medium">使用可能チャンネル</p>
          <Card class="shrink-0 p-4 flex flex-col gap-2">
            <div class="flex items-center">
              <p>すべてのチャンネルを利用する</p>
              <Switch
                checked={bot()!.useAllChannel ?? false}
                onChange={(v) => setBot(b => ({ ...b!, useAllChannel: v }))}
                class="ml-auto"
              >
                <SwitchControl>
                  <SwitchThumb />
                </SwitchControl>
              </Switch>
            </div>
            <Separator />
            <div class="flex flex-col-reverse gap-2 md:flex-row md:gap-0 items-start">
              <div class="w-full flex flex-wrap gap-1">
                <For
                  each={usingChannelIds()}
                  fallback={<p class="text-secondary mx-auto">チャンネルがありません</p>}
                >
                  {
                    (channelId) => (
                      <Badge class="flex items-center" variant={"secondary"}>
                        <IconHash size={14} />
                        { useStoreChannelInfo.directGetterChannelInfo(channelId).name }
                      </Badge>
                    )
                  }
                </For>
              </div>
              <hr class="hidden md:inline md:mx-2 w-full md:w-fit md:h-full border-r-2" />
              <DialogSearchChannels
                currentChannelIdsSignal={usingChannelIds}
                applyChannelIds={
                  (channels) => setUsingChannelIds(channels)
                }
                disabled={bot()?.useAllChannel}
              />
            </div>
          </Card>

          <Card class="mt-4 shrink-0 p-4 flex flex-col gap-4">
            <DialogConfirmDeleteBot
              botId={props.botId}
              botName={currentBot()?.botName ?? "..."}
              onDeleted={props.returnToListProxy}
            />
          </Card>
        </Show>
      </div>

      <Card class="flex flex-col md:flex-row items-center justify-end gap-2 shrink-0 mb-0 w-full p-4 sticky bottom-0 mx-auto">
        {
          (botInfoChanged() || usingChannelsChanged())
          &&
          <div class="mr-auto text-sm">
            <p>* 設定を変更するとBotの承諾状況が初期化されます</p>
          </div>
        }

        <Button
          onClick={updateBot}
          class="px-8 w-full md:w-fit"
          disabled={(!botInfoChanged() && !usingChannelsChanged()) || processing()}
        >適用する</Button>
        <Button
          onClick={restore}
          variant={"ghost"}
          class="px-8 w-full md:w-fit"
          disabled={(!botInfoChanged() && !usingChannelsChanged()) || processing()}
        >復元する</Button>
      </Card>
    </div>
  );
}
