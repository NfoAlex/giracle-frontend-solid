import { IconArrowLeft, IconCheck, IconCopy, IconEye, IconEyeOff } from "@tabler/icons-solidjs";
import { createSignal, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import type { TBotListItem } from "~/types/Server";
import { useStoreUserinfo } from "~/stores/Userinfo.store";
import DialogConfirmDeleteBot from "./ConfigBotDetail/DialogConfirmDeleteBot";
import BotApprovalBadge from "~/components/unique/BotApprovalBadge";

export default function ConfigBotDetail(props: { returnToListProxy: () => void; bot?: TBotListItem }) {
  const [tokenVisible, setTokenVisible] = createSignal(false);
  const [tokenCopied, setTokenCopied] = createSignal(false);

  if (props.bot === undefined) {
    return (
      <p class="text-center">Bot情報が見つかりません。</p>
    )
  }
  // 選択済みの一覧行をそのまま表示する(編集APIが無いため再取得しない)
  const bot = props.bot;

  const copyToken = () => {
    // トークンコードは GET /bot/list の応答にのみ含まれる
    if (bot.tokenCode === undefined) return;
    navigator.clipboard.writeText(bot.tokenCode).then(() => {
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    });
  };

  return (
    <div class="grow h-full w-full flex flex-col overflow-y-hidden">
      <div class="flex items-center gap-2 w-full">
        <Button onClick={props.returnToListProxy} variant={"ghost"}>
          <IconArrowLeft /> 戻る
        </Button>

        <div class="shrink min-w-0 ml-auto flex items-center gap-2 w-fit md:max-w-[75%]">
          <p class="truncate">{ bot.remoteUserName ?? "(名称未設定)" }</p>
          <BotApprovalBadge
            isApproved={bot.isApproved}
            class="shrink-0"
          />
        </div>
      </div>

      <hr class="mt-2" />

      <div class="grow overflow-y-auto flex flex-col gap-2 py-2">
        <p class="mt-4 font-medium">トークンコード</p>
        <Card class="shrink-0 p-4 flex flex-col gap-2">
          <p class="text-sm">
            Bot API の認証に使う秘密コードです。他人に共有しないでください
          </p>
          <div class="flex items-center gap-1">
            <code class="grow min-w-0 break-all text-sm bg-muted rounded-md px-3 py-2">
              <Show when={bot.tokenCode} fallback="取得できませんでした">
                {tokenVisible() ? bot.tokenCode : "••••••••••••••••"}
              </Show>
            </code>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setTokenVisible(v => !v)}
              aria-label={tokenVisible() ? "トークンを隠す" : "トークンを表示"}
              disabled={bot.tokenCode === undefined}
            >
              {tokenVisible() ? <IconEyeOff /> : <IconEye />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={copyToken}
              aria-label="トークンをコピー"
              disabled={bot.tokenCode === undefined}
            >
              {tokenCopied() ? <IconCheck class="text-success" /> : <IconCopy />}
            </Button>
          </div>
        </Card>

        <p class="mt-4 font-medium">基本情報</p>
        <Card class="shrink-0 p-4 flex flex-col gap-4">
          <p class="text-xs text-muted-foreground">
            Botの名前・概要はこの画面からは変更できません
          </p>
          <div class="flex items-center w-full gap-2">
            <p class="shrink-0">Bot名</p>
            <p class="ml-auto truncate">{bot.remoteUserName ?? "(名称未設定)"}</p>
          </div>
          <hr />
          <div class="flex w-full gap-2">
            <p class="shrink-0">概要</p>
            <p class="ml-auto whitespace-pre-wrap break-all text-right">
              {useStoreUserinfo.getterUserinfo(bot.remoteUserId).selfIntroduction}
            </p>
          </div>
          <hr />
          <div class="flex items-center w-full gap-2">
            <p class="shrink-0">作成日時</p>
            <p class="ml-auto">{new Date(bot.createdAt).toLocaleString()}</p>
          </div>
        </Card>

        <Card class="mt-4 shrink-0 p-4 flex flex-col gap-4">
          <DialogConfirmDeleteBot
            botId={bot.id}
            botName={bot.remoteUserName ?? "(名称未設定)"}
            onDeleted={props.returnToListProxy}
          />
        </Card>
      </div>
    </div>
  );
}
