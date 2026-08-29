import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { api } from "~/api/index.ts";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert.tsx";
import { Badge } from "~/components/ui/badge.tsx";
import { Button } from "~/components/ui/button.tsx";
import { Card } from "~/components/ui/card.tsx";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "~/components/ui/hover-card.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table.tsx";
import { IRequestLog, IRequestLogCount } from "~/types/Server";
import { getterUserinfo } from "~/stores/Userinfo";
import { IconAlertCircle, IconArrowLeft, IconArrowRight } from "@tabler/icons-solidjs";

const LOG_PAGE_SIZE = 50;

// 週頭(日曜)へスナップしたコピーを返す
const weekStart = (d: Date) => {
  const w = new Date(d);
  w.setDate(w.getDate() - w.getDay());
  return w;
};

export default function ManageLogs() {
  const [logs, setLogs] = createSignal<IRequestLog[]>([]);
  const [dailyCount, setDailyCount] = createSignal<IRequestLogCount[]>([]);
  const [filterUserId] = createSignal("");
  const [loadingMore, setLoadingMore] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [hasMore, setHasMore] = createSignal(true);
  const [currentPosDate, setCurrentPosDate] = createSignal<Date>(new Date());

  const methodVariant = (m: string) =>
    m === "GET" ? "success" : m === "DELETE" ? "error" : m === "POST" ? "warning" : "outline";

  const statusVariant = (s: number) =>
    s >= 200 && s < 300 ? "success" : s >= 400 ? "error" : "outline";

  const fetchLogCount = async (cursorDate?: Date) => {
    setError(null);
    try {
      const userIdParam = filterUserId().trim() || undefined;
      const d = weekStart(cursorDate ?? new Date());

      const res = await api.server.getLogGroup({
        userId: userIdParam,
        cursorLogDate: d,
        includeFirstLogs: true
      });

      setDailyCount(res.data.group);
      if (res.data.firstDayLog) {
        setLogs(res.data.firstDayLog ?? []);
        setHasMore(res.data.firstDayLog.length >= LOG_PAGE_SIZE);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  //ログ取得。cursorLogIdが指定されていると継続取得扱い
  const fetchLogs = async (options: { targetDate: Date, cursorLogId?: string }) => {
    setError(null);

    try {
      const res = await api.server.getLog({
        targetDate: options.targetDate,
        cursorLogId: options.cursorLogId
      });

      if (options.cursorLogId) {
        setLogs([...logs(), ...res.data]);
      } else {
        setLogs(res.data);
        setCurrentPosDate(options.targetDate);
      }

      setHasMore(res.data.length >= LOG_PAGE_SIZE);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const loadMore = async () => {
    const t = currentPosDate();
    const last = logs()[logs().length - 1];
    if (!t || !last) return;

    setLoadingMore(true);
    try {
      await fetchLogs({ targetDate: t, cursorLogId: last.id });
    } finally {
      setLoadingMore(false);
    }
  };

  const getCeiling = createMemo(() => {
    const totalArr = dailyCount().map(c => c.successCount + c.errorCount + c.otherCount);
    if (totalArr.length === 0) return 0;

    const maxVal = Math.max(...totalArr);
    const pow = 10 ** Math.floor(Math.log10(maxVal));
    const base = maxVal / pow;
    const nice = (base > 5 ? 10 : base > 2 ? 5 : 2) * pow;

    return nice;
  });

  const moveWeek = (direction: "forward" | "before") => {
    const d = new Date(currentPosDate());
    const weeks = direction === "before" ? -1 : 1;
    d.setDate(d.getDate() + weeks * 7);
    setCurrentPosDate(d);
    fetchLogCount(d);
  };

  onMount(() => fetchLogCount());

  return (
    <div class="flex flex-col h-full w-full gap-2 overflow-y-auto">
      <Show when={error()}>
        <Alert variant="destructive">
          <IconAlertCircle class="size-6" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>内容: {error()}</AlertDescription>
        </Alert>
      </Show>

      <Card class="p-2 flex items-center justify-center gap-2">
        <Button size={"icon"} variant={"ghost"} onClick={() => moveWeek("before")}><IconArrowLeft /></Button>
        <span>
          {
            (() => { //日程範囲表示
              const dStart = weekStart(currentPosDate());
              const dEnd = structuredClone(currentPosDate());
              dEnd.setDate(dEnd.getDate() + (6 - dEnd.getDay()));
              return <span>{dStart.toLocaleDateString()} ~ {dEnd.toLocaleDateString()}</span>
            })()
          }
        </span>
        <Button size={"icon"} variant={"ghost"} onClick={() => moveWeek("forward")}><IconArrowRight /></Button>
      </Card>

      {/* ログ棒グラフ */}
      <Card class="basis-[30%] grow-0 shrink-0 min-h-0 flex flex-col overflow-hidden p-4">
        <div class="w-full h-full grow flex gap-2">
          {/* グラフの段階表示 */}
          <div class="h-[90%] shrink-0 flex flex-col justify-between w-10">
            <span>{ getCeiling() }</span>
            <span>{ getCeiling() * 0.75 }</span>
            <span>{ getCeiling() * 0.25 }</span>
            <span>0</span>
          </div>

          {/* 棒表示 */}
          <div class="grow h-full flex flex-col gap-2">
            <div class="h-[90%] border-l-2 border-b-2 relative flex items-end justify-evenly">
              {
                dailyCount().map((count) => {
                  const total = count.errorCount + count.otherCount + count.successCount;
                  const containerHeight = Math.ceil(total / getCeiling() * 100);
                  return (
                    <HoverCard openDelay={0}>
                      <HoverCardTrigger
                        as="div"
                        class="w-14 text-center mt-auto flex flex-col"
                        style={`height: ${containerHeight}%`}
                      >
                        { total }
                        <div class="bg-green-300" style={`height: ${count.successCount / total * 100}%`} />
                        <div class="bg-error" style={`height: ${count.errorCount / total * 100}%`} />
                        <div class="bg-white" style={`height: ${count.otherCount / total * 100}%`} />
                      </HoverCardTrigger>
                      <HoverCardContent class="w-40 text-sm">
                        <p class="font-bold">{ new Date(count.date).toLocaleDateString() }</p>
                        <hr class="my-2" />
                        <div>成功: <span class="text-success ml-auto">{count.successCount}</span></div>
                        <div>エラー: <span class="text-error ml-auto">{count.errorCount}</span></div>
                        <div>その他: <span class="ml-auto">{count.otherCount}</span></div>
                      </HoverCardContent>
                    </HoverCard>
                  );
                })
              }
            </div>
            {/* 日付表示 */}
            <div class="flex justify-evenly items-center">
              {
                dailyCount().map((count) => (
                  <span>
                    { new Date(count.date).getMonth() + 1 }/{ new Date(count.date).getDate() }
                  </span>
                ))
              }
            </div>
          </div>
        </div>
      </Card>

      {/* ログ表示 */}
      <Card class="flex-1 min-h-0 flex flex-col">
        <div class="grow overflow-y-auto">
          <Show
            when={logs().length > 0}
            fallback={<p class="p-4 text-sm text-muted-foreground">ログがありません</p>}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>メソッド</TableHead>
                  <TableHead>パス</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>ユーザー</TableHead>
                  <TableHead>日時</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <For each={logs()}>
                  {(log) => (
                    <TableRow>
                      <TableCell>
                        <Badge variant={methodVariant(log.method)}>{log.method}</Badge>
                      </TableCell>
                      <TableCell class="max-w-[280px] truncate font-mono text-xs">
                        {log.path}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(log.status)}>{log.status}</Badge>
                      </TableCell>
                      <TableCell class="text-muted-foreground">
                        <span class="block max-w-[180px] truncate">
                          { log.userId ? getterUserinfo(log.userId).name : "-" }
                        </span>
                      </TableCell>
                      <TableCell class="whitespace-nowrap text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  )}
                </For>
              </TableBody>
            </Table>
          </Show>
        </div>
        <Show when={hasMore()}>
          <div class="border-t p-2 flex justify-center">
            <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore()}>
              {loadingMore() ? "読み込み中..." : "もっと表示"}
            </Button>
          </div>
        </Show>
      </Card>
    </div>
  );
}
