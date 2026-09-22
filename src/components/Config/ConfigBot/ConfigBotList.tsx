import { IconAlertCircle, IconReload, IconSearch } from "@tabler/icons-solidjs";
import { createSignal, For, onMount, Show } from "solid-js";
import { api } from "~/api";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { TextField, TextFieldInput } from "~/components/ui/text-field";
import type { IBot } from "~/types/Server";
import SubmitBotCreation from "./ConfigBotList/SubmitBotCreation";
import BotApprovalBadge from "~/components/unique/BotApprovalBadge";

// 1回の取得で読み込むボット数。APIは上限まで返すと続きがある可能性がある
const PAGE_LENGTH = 50;

type TBotListItem = Pick<
  IBot,
  "id" | "botName" | "approveStatus" | "createdAt" | "createdBy"
>;

export default function ConfigBotList(props: {
  setActiveBot: (botId: string) => void;
}) {
  const [myBots, setMyBots] = createSignal<TBotListItem[]>([]);
  const [processing, setProcessing] = createSignal(false);
  const [query, setQuery] = createSignal("");
  const [hasMoreBots, setHasMoreBots] = createSignal(false);
  const [cursorBotId, setCursorBotId] = createSignal<string | undefined>();
  // 続き読みの追記先が現在の検索条件と一致するかを判定するため保持
  const [latestSearchedQuery, setLatestSearchedQuery] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);

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
    // 続き読みは「同じ検索条件」かつ「カーソル取得済み」のときだけ成立させる。
    // 条件が食い違っていたらカーソル無しの先頭ページ取得へフォールバックする
    const useCursor =
      continuous &&
      latestSearchedQuery() === trimmedQuery &&
      cursorBotId() !== undefined;

    try {
      const res = await api.server.getBot({
        query: trimmedQuery || undefined,
        cursorBotId: useCursor ? cursorBotId() : undefined,
      });

      if (useCursor) {
        setMyBots((prev) => [...prev, ...res.data]);
      } else {
        setMyBots(res.data);
      }

      // 1ページ分返ってきたら続きがあるとみなす
      setHasMoreBots(res.data.length === PAGE_LENGTH);
      const lastBot = res.data[res.data.length - 1];
      if (lastBot) setCursorBotId(lastBot.id);
      setLatestSearchedQuery(trimmedQuery);
    } catch (e) {
      console.error("ConfigBotList :: fetchList : ", e);
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

  /**
   * 作ったBotを一覧に追加するためだけのもの
   * @param botCreated
   */
  const myBotsBinder = (botCreated: IBot) => {
    setMyBots((b) => [botCreated, ...b]);
  };

  onMount(() => {
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

      <div class="flex items-center justify-end gap-2">
        <Button
          variant={"outline"}
          size="icon"
          onClick={search}
          disabled={processing()}
        >
          <IconReload />
        </Button>
        <SubmitBotCreation dataBinder={myBotsBinder} />
      </div>

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
        {
          //取得中表示
          processing() && myBots().length === 0 && (
            <div class="mt-5 text-center">取得中...</div>
          )
        }
        {
          //ボットが無いときの表示。エラー時は空一覧と区別できるよう出さない
          myBots().length === 0 && !processing() && !error() && (
            <div class="mt-5 text-center">ボットがありません。</div>
          )
        }

        <For each={myBots()}>
          {(bot) => (
            <div
              onClick={() => props.setActiveBot(bot.id)}
              class="p-2 rounded-md flex items-center gap-3 hover:bg-accent cursor-pointer"
            >
              <div class="flex flex-col min-w-0">
                <p class="truncate font-semibold">{bot.botName}</p>
                <p class="truncate text-sm text-muted-foreground">
                  {bot.createdBy}
                </p>
              </div>

              <span class="ml-auto flex items-center gap-2 shrink-0">
                <BotApprovalBadge approveStatus={bot.approveStatus} />
                <span class="text-sm text-muted-foreground">
                  {new Date(bot.createdAt).toLocaleString()}
                </span>
              </span>
            </div>
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
    </div>
  );
}
