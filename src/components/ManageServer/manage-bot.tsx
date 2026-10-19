import { useSearchParams } from "@solidjs/router";
import { IconAlertCircle, IconSearch } from "@tabler/icons-solidjs";
import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { api } from "~/api/index.ts";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert.tsx";
import { Button } from "~/components/ui/button.tsx";
import { Card } from "~/components/ui/card.tsx";
import { TextField, TextFieldInput } from "~/components/ui/text-field.tsx";
import { useStoreUserinfo } from "~/stores/Userinfo.store.ts";
import type { TBotListItem } from "~/types/Server.ts";
import BotApprovalBadge from "~/components/unique/BotApprovalBadge.tsx";
import BotApprovalModal from "./ManageBot/BotApprovalModal.tsx";

// 1回の取得で読み込むボット数。APIは上限まで返すと続きがある可能性がある
const PAGE_LENGTH = 50;

export default function ManageBot() {
  // URLクエリ（?botName=xxx）で初期検索ワードを指定できる
  const [searchParams] = useSearchParams();
  const [bots, setBots] = createSignal<TBotListItem[]>([]);
  const [processing, setProcessing] = createSignal(false);
  const [query, setQuery] = createSignal("");
  const [hasMoreBots, setHasMoreBots] = createSignal(false);
  const [cursorBotId, setCursorBotId] = createSignal<string | undefined>();
  // 続き読みの追記先が現在の検索条件と一致するかを判定するため保持
  const [latestSearchedQuery, setLatestSearchedQuery] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);
  // 審査モーダルで開いているBotのID。undefined なら閉じている
  const [reviewingBotId, setReviewingBotId] = createSignal<string>();
  // 一覧の行を唯一の情報源にして、承認後の表示が古い値を指さないようにする
  const reviewingBot = createMemo(() =>
    bots().find((b) => b.id === reviewingBotId())
  );

  /**
   * ボット一覧を取得する
   * @param continuous true なら既存一覧の末尾へ追記する
   */
  const fetchList = async (continuous: boolean = false) => {
    if (processing()) return;
    setProcessing(true);
    setError(null);

    // 空文字を渡すとバックエンドがエラーを返すため、未検索時は undefined にする
    const trimmedQuery = query().trim();
    // 続き読みは「同じ検索条件」かつ「カーソル取得済み」のときだけ成立させる
    const useCursor =
      continuous &&
      latestSearchedQuery() === trimmedQuery &&
      cursorBotId() !== undefined;

    try {
      const res = await api.bot.listAll({
        length: PAGE_LENGTH,
        query: trimmedQuery || undefined,
        cursorBotId: useCursor ? cursorBotId() : undefined,
      });

      if (useCursor) {
        setBots((prev) => [...prev, ...res.data]);
      } else {
        setBots(res.data);
      }

      // 1ページ分返ってきたら続きがあるとみなす
      setHasMoreBots(res.data.length === PAGE_LENGTH);
      const lastBot = res.data[res.data.length - 1];
      if (lastBot) setCursorBotId(lastBot.id);
      setLatestSearchedQuery(trimmedQuery);
    } catch (e) {
      console.error("ManageBot :: fetchList : ", e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setProcessing(false);
    }
  };

  // 先頭から取り直す（検索条件の変更・再取得時）
  const search = () => {
    // 処理中に cursorBotId だけ消すと、in-flight な取得が失敗した場合に
    // カーソルが復元されず、以降の続き読みが先頭ページ重複になる
    if (processing()) return;
    setCursorBotId(undefined);
    fetchList();
  };

  /** モーダルでの承認状態変更を一覧の該当行へ反映する */
  const applyApproval = (botId: string, isApproved: boolean) => {
    setBots((prev) =>
      prev.map((b) => (b.id === botId ? { ...b, isApproved } : b)),
    );
  };

  onMount(() => {
    // クエリの botName を初期検索ワードとして設定してから一覧を取得する
    const botNameFromQuery = searchParams.botName;
    if (typeof botNameFromQuery === "string" && botNameFromQuery !== "") {
      setQuery(botNameFromQuery);
    }
    fetchList();
  });

  return (
    <div class="grow h-full flex flex-col gap-2">
      <Show when={error()}>
        <Alert variant="destructive">
          <IconAlertCircle class="size-6" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>内容: {error()}</AlertDescription>
        </Alert>
      </Show>

      <TextField class="shrink-0">
        <span class="flex items-center gap-2">
          <TextFieldInput
            placeholder="Bot名で検索"
            value={query()}
            onInput={(e) => setQuery(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") search();
            }}
          />
          <Button
            onClick={search}
            disabled={processing()}
            size="icon"
            class="shrink-0"
          >
            <IconSearch />
          </Button>
        </span>
      </TextField>

      <Card class="grow overflow-y-auto p-2 flex flex-col gap-1">
        {/* 取得中表示 */}
        {processing() && bots().length === 0 && (
          <div class="mt-5 text-center">取得中...</div>
        )}
        {/* ボットが無いときの表示。エラー時は空一覧と区別できるよう出さない */}
        {bots().length === 0 && !processing() && !error() && (
          <div class="mt-5 text-center">ボットがありません。</div>
        )}

        <For each={bots()}>
          {(bot) => (
            <button
              type="button"
              onClick={() => setReviewingBotId(bot.id)}
              class="p-2 rounded-md flex flex-wrap items-center gap-3 text-left hover:bg-accent cursor-pointer"
            >
              <div class="flex flex-col min-w-0 grow basis-0">
                <p class="truncate font-semibold">
                  {bot.remoteUserName ?? "(名称未設定)"}
                </p>
                <p class="truncate text-sm text-muted-foreground">
                  {useStoreUserinfo.getterUserinfo(bot.createdBy).name}
                </p>
              </div>

              <span class="ml-auto flex items-center gap-2 shrink-0">
                <BotApprovalBadge isApproved={bot.isApproved} />
                <span class="text-sm text-muted-foreground">
                  {new Date(bot.createdAt).toLocaleString()}
                </span>
              </span>
            </button>
          )}
        </For>

        <Show when={hasMoreBots() && !processing()}>
          <Button
            onClick={() => fetchList(true)}
            variant="secondary"
            class="w-full mt-2"
          >
            さらに読み込む
          </Button>
        </Show>
      </Card>

      <BotApprovalModal
        bot={reviewingBot()}
        onOpenChange={(open) => !open && setReviewingBotId(undefined)}
        approvalChanged={applyApproval}
      />
    </div>
  );
}
