import {
  IconBell,
  IconBellOff,
  IconBellRinging,
  IconBellX,
  IconVolumeOff,
} from "@tabler/icons-solidjs";
import { Card } from "../ui/card.tsx";
import { Switch, SwitchControl, SwitchThumb } from "../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select.tsx";
import { Button } from "../ui/button.tsx";
import { showToast } from "../ui/toast.tsx";
import { For, Show, createSignal, onMount } from "solid-js";
import { directGetterChannelInfo, storeChannelInfo } from "~/stores/ChannelInfo.ts";
import {
  setStoreMutedChannels,
  setStoreNotificationConfig,
  storeMutedChannels,
  storeNotificationConfig,
} from "~/stores/Notification.ts";
import POST_NOTIFICATION_CONFIG_UPDATE from "~/api/NOTIFICATION/NOTIFICATION_CONFIG_UPDATE.ts";
import POST_NOTIFICATION_UNMUTE_CHANNEL from "~/api/NOTIFICATION/NOTIFICATION_UNMUTE_CHANNEL.ts";
import {
  getCurrentPushSubscription,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "~/utils/PushSubscription.ts";

type Mode = "off" | "mention" | "all";
const MODE_OPTIONS: Mode[] = ["off", "mention", "all"];
const MODE_LABEL: Record<Mode, string> = {
  off: "オフ",
  mention: "メンションのみ",
  all: "全ての通知",
};

export default function ConfigNotification() {
  const [notifyOk, setNotifyOk] = createSignal(false);
  const [pushSupported, setPushSupported] = createSignal(false);
  const [pushSubscribed, setPushSubscribed] = createSignal(false);
  const [busy, setBusy] = createSignal(false);

  if (typeof Notification !== "undefined") {
    if (Notification.permission === "granted") setNotifyOk(true);
    else if (Notification.permission === "denied") setNotifyOk(false);
  }

  onMount(async () => {
    const supported = isPushSupported();
    setPushSupported(supported);
    if (!supported) return;
    const current = await getCurrentPushSubscription().catch(() => null);
    setPushSubscribed(current !== null);
  });

  const getNotifyPermission = () => {
    if (Notification.permission === "granted") return;
    Notification.requestPermission().then((permission) => {
      setNotifyOk(permission === "granted");
    });
  };

  const updateEnabled = async (enabled: boolean) => {
    setStoreNotificationConfig("enabled", enabled);
    try {
      const r = await POST_NOTIFICATION_CONFIG_UPDATE({ enabled });
      setStoreNotificationConfig(r.data);
    } catch (e) {
      showToast({
        title: "通知設定の更新に失敗しました",
        variant: "destructive",
      });
      console.error(e);
    }
  };

  const updateMode = async (mode: Mode) => {
    setStoreNotificationConfig("mode", mode);
    try {
      const r = await POST_NOTIFICATION_CONFIG_UPDATE({ mode });
      setStoreNotificationConfig(r.data);
    } catch (e) {
      showToast({
        title: "通知モードの更新に失敗しました",
        variant: "destructive",
      });
      console.error(e);
    }
  };

  const togglePush = async (enable: boolean) => {
    if (busy()) return;
    setBusy(true);
    try {
      if (enable) {
        await subscribeToPush();
        setPushSubscribed(true);
        setNotifyOk(true);
        showToast({ title: "プッシュ通知を有効にしました", variant: "success" });
      } else {
        await unsubscribeFromPush();
        setPushSubscribed(false);
        showToast({ title: "プッシュ通知を無効にしました" });
      }
    } catch (e) {
      showToast({
        title: "プッシュ通知の設定に失敗しました",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const unmuteChannel = async (channelId: string) => {
    try {
      await POST_NOTIFICATION_UNMUTE_CHANNEL(channelId);
      setStoreMutedChannels("ids", (prev) => prev.filter((id) => id !== channelId));
    } catch (e) {
      showToast({
        title: "ミュート解除に失敗しました",
        variant: "destructive",
      });
      console.error(e);
    }
  };

  return (
    <div class="flex flex-col gap-6">
      {/* 通知権限確認・取得用枠 */}
      <div class="flex flex-col items-center justify-center p-4 gap-2">
        <Show
          when={notifyOk()}
          fallback={
            <>
              <IconBellX />
              <p>通知が有効化されていません。</p>
              <Button onClick={getNotifyPermission}>通知許可を取得する</Button>
            </>
          }
        >
          <IconBell />
          <p>ブラウザによるプッシュ通知が有効です。</p>
        </Show>
      </div>

      {/* バックグラウンドプッシュ通知 */}
      <Card class="p-4 flex flex-col gap-4">
        <span class="flex items-center">
          <span class="font-bold flex items-center gap-2">
            <IconBellRinging />
            バックグラウンドプッシュ通知
          </span>
          <div class="ml-auto flex items-center gap-2">
            <Show
              when={pushSupported()}
              fallback={<span class="text-sm text-muted-foreground">未対応</span>}
            >
              <Switch
                checked={pushSubscribed()}
                onChange={(v) => togglePush(v)}
                disabled={busy()}
              >
                <SwitchControl>
                  <SwitchThumb />
                </SwitchControl>
              </Switch>
            </Show>
          </div>
        </span>
        <hr />
        <div class="text-sm">
          アプリを閉じているときや別タブでもOSレベルで通知を受け取ります。有効化するとブラウザから通知許可を求められます。
        </div>
      </Card>

      {/* 通知全体オン/オフ */}
      <Card class="p-4 flex flex-col gap-4">
        <span class="flex items-center">
          <span class="font-bold flex items-center gap-2">
            <IconBell />
            通知を有効にする
          </span>
          <div class="ml-auto flex items-center gap-2">
            <Switch
              checked={storeNotificationConfig.enabled}
              onChange={(v) => updateEnabled(v)}
            >
              <SwitchControl>
                <SwitchThumb />
              </SwitchControl>
            </Switch>
          </div>
        </span>
        <hr />
        <div class="text-sm">
          オフにすると全ての通知が届かなくなります。
        </div>
      </Card>

      {/* 通知モード */}
      <Card class="p-4 flex flex-col gap-4">
        <span class="flex items-center">
          <span class="font-bold flex items-center gap-2">
            <IconBellRinging />
            通知モード
          </span>
          <div class="ml-auto flex items-center gap-2">
            <Select<Mode>
              value={storeNotificationConfig.mode}
              onChange={(v) => v && updateMode(v)}
              options={MODE_OPTIONS}
              itemComponent={(props) => (
                <SelectItem item={props.item}>
                  {MODE_LABEL[props.item.rawValue]}
                </SelectItem>
              )}
              disabled={!storeNotificationConfig.enabled}
            >
              <SelectTrigger>
                <SelectValue<Mode>>
                  {(state) => MODE_LABEL[state.selectedOption()]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          </div>
        </span>
        <hr />
        <div class="text-sm">
          <div><strong>メンションのみ</strong>: 自分宛のメンションと返信のみ通知します。</div>
          <div><strong>全ての通知</strong>: 参加中の全チャンネルの新規メッセージも通知します。</div>
        </div>
      </Card>

      {/* ミュート済みチャンネル */}
      <Card class="p-4 flex flex-col gap-4">
        <span class="flex items-center">
          <span class="font-bold flex items-center gap-2">
            <IconVolumeOff />
            ミュート中のチャンネル
          </span>
          <span class="ml-auto text-sm text-muted-foreground">
            {storeMutedChannels.ids.length} 件
          </span>
        </span>
        <hr />
        <Show
          when={storeMutedChannels.ids.length > 0}
          fallback={
            <div class="text-sm text-muted-foreground">
              ミュートしているチャンネルはありません。
            </div>
          }
        >
          <div class="flex flex-col gap-2">
            <For each={storeMutedChannels.ids}>
              {(channelId) => {
                const info = directGetterChannelInfo(channelId);
                return (
                  <div class="flex items-center justify-between gap-2 py-1">
                    <span class="flex items-center gap-2">
                      <IconBellOff class="w-4 h-4" />
                      <span>{storeChannelInfo[channelId]?.name ?? info.name}</span>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => unmuteChannel(channelId)}
                    >
                      解除
                    </Button>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      </Card>
    </div>
  );
}
