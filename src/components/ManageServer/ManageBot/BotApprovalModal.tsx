import { IconAlertCircle } from "@tabler/icons-solidjs";
import { createEffect, createSignal, For, on, Show } from "solid-js";
import { api } from "~/api/index.ts";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert.tsx";
import { Badge, type BadgeProps } from "~/components/ui/badge.tsx";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "~/components/ui/dialog.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select.tsx";
import { useStoreUserinfo } from "~/stores/Userinfo.store.ts";
import type { IBot } from "~/types/Server.ts";

type TApproveStatus = IBot["approveStatus"];

// 選択できる審査状態。危険な操作を先、主要操作(承認)を最後に置く
const APPROVAL_STATUSES: TApproveStatus[] = [
  "DENIED",
  "PENDING",
  "BLOCKED",
  "APPROVED",
];

export default function BotApprovalModal(props: {
  /** 審査対象のBot。undefined なら閉じている。表示に必要な項目だけを受け取る */
  bot: {
    id: string;
    botName: string;
    approveStatus: TApproveStatus;
    useAllChannel: boolean;
    createdAt: Date;
    createdBy: string;
  } | undefined;
  /** 現在の承認状態の表示ラベル。一覧と同じ定義を使うため親から受け取る */
  status: Record<
    TApproveStatus,
    { label: string; variant: BadgeProps["variant"] }
  >;
  /** 要求されている権限の表示ラベル。親で判定済みのものを渡す */
  permissionLabels: string[];
  onOpenChange: (open: boolean) => void;
  /** 承認状態の変更が成功したときに新しい状態を親へ伝える */
  approvalChanged: (botId: string, approveStatus: TApproveStatus) => void;
}) {
  const [processing, setProcessing] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // 別のBotを開いたとき(および閉じて開き直したとき)に前回のエラーを残さない
  createEffect(on(() => props.bot?.id, () => setError(null), { defer: true }));

  /** 承認状態を変更し、成功したら親の一覧へ反映する */
  const changeApproval = (next: TApproveStatus) => {
    const bot = props.bot;
    if (bot === undefined || processing()) return;
    setProcessing(true);
    setError(null);

    api.server.patchBotApproval({ botId: bot.id, approvalStatus: next })
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
                <span class="min-w-0 truncate">{bot().botName}</span>
                <Badge
                  class="shrink-0"
                  variant={props.status[bot().approveStatus].variant}
                >
                  {props.status[bot().approveStatus].label}
                </Badge>
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

              <div class="flex flex-col gap-2">
                <p class="text-sm text-muted-foreground">要求権限</p>
                <span class="flex flex-wrap items-center gap-1">
                  <Badge variant={bot().useAllChannel ? "secondary" : "outline"}>
                    {bot().useAllChannel ? "全チャンネル" : "指定チャンネルのみ"}
                  </Badge>
                  <For
                    each={props.permissionLabels}
                    fallback={<Badge variant="outline">追加権限なし</Badge>}
                  >
                    {(label) => <Badge variant="secondary">{label}</Badge>}
                  </For>
                </span>
              </div>

              <DialogFooter class="flex flex-wrap items-center justify-end gap-2">
                <Select<TApproveStatus>
                  options={APPROVAL_STATUSES}
                  value={bot().approveStatus}
                  disabled={processing()}
                  onChange={(next) => next && changeApproval(next)}
                  itemComponent={(itemProps) => (
                    <SelectItem item={itemProps.item}>
                      {props.status[itemProps.item.rawValue].label}
                    </SelectItem>
                  )}
                >
                  <SelectTrigger
                    class="w-52"
                    aria-label="bot-approval-status"
                  >
                    <SelectValue<TApproveStatus>>
                      {(state) => (
                        <p>
                          {props.status[state.selectedOption() ?? bot().approveStatus].label}
                        </p>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              </DialogFooter>
            </>
          )}
        </Show>
      </DialogContent>
    </Dialog>
  );
}
