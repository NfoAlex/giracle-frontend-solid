import { IconAlertCircle } from "@tabler/icons-solidjs";
import { createEffect, createSignal, on, Show } from "solid-js";
import { api } from "~/api/index.ts";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert.tsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "~/components/ui/dialog.tsx";
import { Switch, SwitchControl, SwitchThumb } from "~/components/ui/switch.tsx";
import { useStoreUserinfo } from "~/stores/Userinfo.store.ts";
import type { TBotListItem } from "~/types/Server.ts";
import BotApprovalBadge from "~/components/unique/BotApprovalBadge.tsx";

export default function BotApprovalModal(props: {
  /** 審査対象のBot。undefined なら閉じている */
  bot: TBotListItem | undefined;
  onOpenChange: (open: boolean) => void;
  /** 承認状態の変更が成功したときに新しい状態を親へ伝える */
  approvalChanged: (botId: string, isApproved: boolean) => void;
}) {
  const [processing, setProcessing] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // 別のBotを開いたとき(および閉じて開き直したとき)に前回のエラーを残さない
  createEffect(on(() => props.bot?.id, () => setError(null), { defer: true }));

  /** 承認状態を変更し、成功したら親の一覧へ反映する */
  const changeApproval = (next: boolean) => {
    const bot = props.bot;
    if (bot === undefined || processing()) return;
    setProcessing(true);
    setError(null);

    api.server.setBotApproved({ botId: bot.id, isApproved: next })
      .then(() => props.approvalChanged(bot.id, next))
      .catch((e) => {
        console.error("BotApprovalModal :: changeApproval : ", e);
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => setProcessing(false));
  };

  return (
    <Dialog open={props.bot !== undefined} onOpenChange={props.onOpenChange}>
      <DialogContent class="max-w-2xl">
        <Show when={props.bot}>
          {(bot) => (
            <>
              {/* DialogContent の grid 直下のため min-w-0 を付けないと min-content で列幅が伸びる */}
              <DialogTitle class="flex items-center gap-2 min-w-0">
                {/* min-w-0 が無いと flex 子の min-width:auto で長い名前が縮まずダイアログが横に広がる */}
                <span class="min-w-0 truncate">
                  {bot().remoteUserName ?? "(名称未設定)"}
                </span>
                <BotApprovalBadge isApproved={bot().isApproved} class="shrink-0" />
              </DialogTitle>

              <Show when={error()}>
                <Alert variant="destructive">
                  <IconAlertCircle class="size-6" />
                  <AlertTitle>エラー</AlertTitle>
                  <AlertDescription>内容: {error()}</AlertDescription>
                </Alert>
              </Show>

              <div class="flex flex-col gap-1 text-sm">
                <span class="flex gap-2">
                  <p class="w-24 shrink-0 text-muted-foreground">作成者</p>
                  {/* ユーザー名は文字種によっては折返されないため min-w-0 + break-all で収める */}
                  <p class="min-w-0 break-all">
                    {useStoreUserinfo.getterUserinfo(bot().createdBy).name}
                  </p>
                </span>
                <span class="flex gap-2">
                  <p class="w-24 shrink-0 text-muted-foreground">作成日時</p>
                  <p>{new Date(bot().createdAt).toLocaleString()}</p>
                </span>
                <span class="flex gap-2">
                  <p class="w-24 shrink-0 text-muted-foreground">BotのID</p>
                  <p class="break-all">{bot().id}</p>
                </span>
              </div>

              <hr />

              <DialogFooter class="flex flex-wrap items-center justify-end gap-2">
                <span class="flex items-center gap-2">
                  <p>承認する</p>
                  <Switch
                    checked={bot().isApproved}
                    onChange={changeApproval}
                    disabled={processing()}
                  >
                    <SwitchControl>
                      <SwitchThumb />
                    </SwitchControl>
                  </Switch>
                </span>
              </DialogFooter>
            </>
          )}
        </Show>
      </DialogContent>
    </Dialog>
  );
}
