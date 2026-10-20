import {
  IconAlertCircle,
  IconArrowLeft,
  IconCheck,
  IconCircleX,
  IconCopy,
  IconEye,
  IconEyeOff,
  IconPencil,
} from "@tabler/icons-solidjs";
import { createSignal, onMount, Show } from "solid-js";
import { api } from "~/api";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { TextField, TextFieldInput, TextFieldTextArea } from "~/components/ui/text-field";
import type { IBot, TBotListItem } from "~/types/Server";
import { useStoreUserinfo } from "~/stores/Userinfo.store";
import DialogConfirmDeleteBot from "./ConfigBotDetail/DialogConfirmDeleteBot";
import BotApprovalBadge from "~/components/unique/BotApprovalBadge";

export default function ConfigBotDetail(props: { returnToListProxy: () => void; bot?: TBotListItem }) {
  const [tokenVisible, setTokenVisible] = createSignal(false);
  const [tokenCopied, setTokenCopied] = createSignal(false);
  // 承認状態は管理者操作で変わり得るため、一覧行の値とは別に取り直して優先する
  const [remoteBot, setRemoteBot] = createSignal<IBot>();
  // 改名直後の表示値。一覧行の値(props.bot.remoteUserName)は更新されないため上書きする
  const [updatedBotName, setUpdatedBotName] = createSignal<string>();
  // 編集中の項目と入力値。同時に開けるのは1項目のみ
  const [editing, setEditing] = createSignal<"name" | "intro" | null>(null);
  const [draft, setDraft] = createSignal("");
  const [processing, setProcessing] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  if (props.bot === undefined) {
    return (
      <p class="text-center">Bot情報が見つかりません。</p>
    )
  }
  // 選択済みの一覧行をそのまま表示する（tokenCodeとBot名はこの応答にしか含まれない）
  const bot = props.bot;

  // 承認状態は管理者操作や改名で変わり得るため、表示前に取り直す（失敗時は一覧行の値で続行）
  const fetchRemoteBot = () => {
    api.bot.getByRemoteUserId({ remoteUserId: bot.remoteUserId })
      .then((res) => setRemoteBot(res.data))
      .catch((e) => console.error("ConfigBotDetail :: fetchBot : ", e));
  };

  onMount(fetchRemoteBot);

  /** ヘッダー・基本情報・削除ダイアログで共通に使う現在のBot名 */
  const displayName = () =>
    updatedBotName() ?? bot.remoteUserName ?? "(名称未設定)";

  /** 更新結果をユーザー情報Storeへ反映する（概要の表示はこのStoreを参照している） */
  const applyUpdatedUser = (data: {
    name?: string | null;
    selfIntroduction?: string;
  }) => {
    const current = useStoreUserinfo.getterUserinfo(bot.remoteUserId);
    useStoreUserinfo.updateUserinfo({
      ...current,
      name: data.name ?? current.name,
      selfIntroduction: data.selfIntroduction ?? current.selfIntroduction,
    });
  };

  const enterEdit = (target: "name" | "intro") => {
    setError(null);
    setDraft(
      target === "name"
        ? displayName()
        : useStoreUserinfo.getterUserinfo(bot.remoteUserId).selfIntroduction,
    );
    setEditing(target);
  };

  /** 編集中の項目を保存する。name未指定ならバックエンドは改名扱いにしないため、対象の項目だけを送る */
  const save = () => {
    const target = editing();
    if (target === null || processing()) return;
    // 名前はバックエンドの最小長(2)に合わせる。概要は空文字可（クリア）
    if (target === "name" && draft().length < 2) return;
    setProcessing(true);
    setError(null);
    api.bot.update(
      target === "name"
        ? { botId: bot.id, name: draft() }
        : { botId: bot.id, selfIntroduction: draft() },
    )
      .then((res) => {
        if (target === "name") {
          setUpdatedBotName(res.data.name ?? draft());
          // 改名するとバックエンドで承認が取り消されるため、承認状態を取り直す
          fetchRemoteBot();
        }
        applyUpdatedUser(res.data);
        setEditing(null);
      })
      .catch((e) => {
        console.error("ConfigBotDetail :: save : ", e);
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => setProcessing(false));
  };

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
          <p class="truncate">{displayName()}</p>
          <BotApprovalBadge
            isApproved={remoteBot()?.isApproved ?? bot.isApproved}
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
            Bot名を変更すると承認が取り消され、管理者による再承認が必要になります
          </p>
          <Show when={error()}>
            <Alert variant="destructive">
              <IconAlertCircle class="size-6" />
              <AlertTitle>エラー</AlertTitle>
              <AlertDescription>内容: {error()}</AlertDescription>
            </Alert>
          </Show>
          <div class="flex items-center w-full gap-2">
            <p class="shrink-0">Bot名</p>
            <Show
              when={editing() === "name"}
              fallback={
                <span class="ml-auto min-w-0 flex items-center gap-1">
                  <p class="truncate">{displayName()}</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => enterEdit("name")}
                    aria-label="Bot名を変更"
                  >
                    <IconPencil />
                  </Button>
                </span>
              }
            >
              <span class="ml-auto min-w-0 flex items-center gap-1">
                <TextField class="grow min-w-0">
                  <TextFieldInput
                    maxLength={32}
                    placeholder="新しいBot名"
                    value={draft()}
                    onInput={(e) => setDraft(e.currentTarget.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") save();
                    }}
                  />
                </TextField>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={save}
                  disabled={draft().length < 2 || processing()}
                  aria-label="Bot名の変更を保存"
                >
                  <IconCheck />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditing(null)}
                  disabled={processing()}
                  aria-label="Bot名の変更をキャンセル"
                >
                  <IconCircleX />
                </Button>
              </span>
            </Show>
          </div>
          <hr />
          <div class="flex items-center w-full gap-2">
            <p class="shrink-0">概要</p>
            <Show
              when={editing() === "intro"}
              fallback={
                <span class="ml-auto min-w-0 flex items-center gap-1">
                  <p class="whitespace-pre-wrap break-all text-right">
                    {useStoreUserinfo.getterUserinfo(bot.remoteUserId).selfIntroduction}
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => enterEdit("intro")}
                    aria-label="自己紹介を変更"
                  >
                    <IconPencil />
                  </Button>
                </span>
              }
            >
              <span class="ml-auto min-w-0 flex items-center gap-1">
                <TextField class="grow min-w-0">
                  <TextFieldTextArea
                    maxLength={128}
                    placeholder="新しい自己紹介文"
                    value={draft()}
                    onInput={(e) => setDraft(e.currentTarget.value)}
                  />
                </TextField>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={save}
                  disabled={processing()}
                  aria-label="自己紹介の変更を保存"
                >
                  <IconCheck />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditing(null)}
                  disabled={processing()}
                  aria-label="自己紹介の変更をキャンセル"
                >
                  <IconCircleX />
                </Button>
              </span>
            </Show>
          </div>
          <hr />
          <div class="flex items-center w-full gap-2">
            <p class="shrink-0">作成日時</p>
            <p class="ml-auto">{new Date(bot.createdAt).toLocaleString()}</p>
          </div>
          <hr />
          <div class="flex items-center w-full gap-2">
            <p class="shrink-0">作成者</p>
            <p class="ml-auto">{useStoreUserinfo.getterUserinfo(bot.createdBy).name}</p>
          </div>
        </Card>

        <Card class="mt-4 shrink-0 p-4 flex flex-col gap-4">
          <DialogConfirmDeleteBot
            botId={bot.id}
            botName={displayName()}
            onDeleted={props.returnToListProxy}
          />
        </Card>
      </div>
    </div>
  );
}
