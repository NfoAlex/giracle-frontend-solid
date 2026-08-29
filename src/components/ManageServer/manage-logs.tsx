import { IconSearch, IconX } from "@tabler/icons-solidjs";
import { createSignal, For, onMount, Show } from "solid-js";
import { api } from "~/api/index.ts";
import { Badge } from "~/components/ui/badge.tsx";
import { Button } from "~/components/ui/button.tsx";
import { Callout } from "~/components/ui/callout.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card.tsx";
import { Skeleton } from "~/components/ui/skeleton.tsx";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table.tsx";
import { TextField, TextFieldInput } from "~/components/ui/text-field.tsx";
import { Label } from "~/components/ui/label.tsx";
import { IRequestLog, IRequestLogCount } from "~/types/Server";
import { getterUserinfo } from "~/stores/Userinfo";

type FilterType = "all" | "success" | "error";

const PAGE_LIMIT_HINT = 20;
const LOG_PAGE_SIZE = 50;

export default function ManageLogs() {
  const [logs, setLogs] = createSignal<IRequestLog[]>([]);
  const [dailyCount, setDailyCount] = createSignal<IRequestLogCount[]>([]);
  const [filterType, setFilterType] = createSignal<FilterType>("all");
  const [filterUserId, setFilterUserId] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [loadingMore, setLoadingMore] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [hasMore, setHasMore] = createSignal(true);
  const [targetDate, setTargetDate] = createSignal<Date | null>(null);

  const totalCount = (e: IRequestLogCount) => e.successCount + e.errorCount + e.otherCount;

  const methodVariant = (m: string) =>
    m === "GET" ? "success" : m === "DELETE" ? "error" : m === "POST" ? "warning" : "outline";

  const statusVariant = (s: number) =>
    s >= 200 && s < 300 ? "success" : s >= 400 ? "error" : "outline";

  const formatDate = (d: Date) => new Date(d).toLocaleString();

  const totals = () => {
    const l = dailyCount();
    return {
      success: l.reduce((a, c) => a + c.successCount, 0),
      error: l.reduce((a, c) => a + c.errorCount, 0),
      other: l.reduce((a, c) => a + c.otherCount, 0),
    };
  };

  const fetchLogCount = async (cursorDate?: Date) => {
    const userIdParam = filterUserId().trim() || undefined;
    const d = cursorDate ? new Date(cursorDate) : new Date();
    const day = d.getDay();
    d.setDate(d.getDate() - day);

    const res = await api.server.getLogGroup({
      userId: userIdParam,
      cursorLogDate: d,
      includeFirstLogs: true
    });

    setDailyCount(res.data.group);
    if (res.data.firstDayLog && res.data.firstDayLog.length > 0) {
      setLogs(res.data.firstDayLog);
      setTargetDate(new Date(res.data.firstDayLog[0].createdAt));
      setHasMore(res.data.firstDayLog.length >= LOG_PAGE_SIZE);
    }
  };

  //ログ取得。cursorLogIdが指定されていると継続取得扱い
  const fetchLogs = async (options: { targetDate: Date, cursorLogId?: string }) => {
    setError(null);

    const res = await api.server.getLog({
      targetDate: options.targetDate,
      cursorLogId: options.cursorLogId
    });

    if (options.cursorLogId) {
      setLogs([...logs(), ...res.data]);
    } else {
      setLogs(res.data);
      setTargetDate(options.targetDate);
    }

    setHasMore(res.data.length >= LOG_PAGE_SIZE);
  };

  const loadMore = async () => {
    const t = targetDate();
    const last = logs()[logs().length - 1];
    if (!t || !last) return;

    setLoadingMore(true);
    try {
      await fetchLogs({ targetDate: t, cursorLogId: last.id });
    } finally {
      setLoadingMore(false);
    }
  };

  onMount(() => fetchLogCount());

  return (
    <div class="flex flex-col h-full w-full gap-2 overflow-y-auto">
      <Card class="basis-[30%] grow-0 shrink-0 min-h-0 flex flex-col overflow-hidden p-4">
        <p>ここでグラフ表示予定</p>
        <div class="border-l-2 border-b-2 relative grow flex items-end justify-evenly">
          {
            dailyCount().map((count) => (
              <div>
                { count.successCount }
              </div>
            ))
          }
        </div>
        <div class="flex justify-evenly items-center gap-4">
          {
            dailyCount().map((count) => (
              <span>
                { new Date(count.date).getMonth() + 1 }/{ new Date(count.date).getDate() }
              </span>
            ))
          }
        </div>
      </Card>

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
                        {formatDate(log.createdAt)}
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
