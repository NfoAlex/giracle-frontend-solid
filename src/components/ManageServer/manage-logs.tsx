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

type LogEntry = {
  date: string;
  successCount: number;
  errorCount: number;
  otherCount: number;
};

type FilterType = "all" | "success" | "error";

const PAGE_LIMIT_HINT = 20;

export default function ManageLogs() {
  // リクエストID: 連続リクエストの古い応答を破棄する（後勝ちレース防止）
  let requestId = 0;
  const [logs, setLogs] = createSignal<LogEntry[]>([]);
  const [filterType, setFilterType] = createSignal<FilterType>("all");
  const [filterUserId, setFilterUserId] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [loadingMore, setLoadingMore] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [hasMore, setHasMore] = createSignal(true);

  const totalCount = (e: LogEntry) => e.successCount + e.errorCount + e.otherCount;

  const totals = () => {
    const l = logs();
    return {
      success: l.reduce((a, c) => a + c.successCount, 0),
      error: l.reduce((a, c) => a + c.errorCount, 0),
      other: l.reduce((a, c) => a + c.otherCount, 0),
    };
  };

  const fetchLogs = async (mode: "reset" | "more") => {
    const isMore = mode === "more";
    const currentRequestId = ++requestId;
    if (isMore) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    // カーソルは最後の要素の日付
    const cursor = isMore && logs().length > 0 ? new Date(logs()[logs().length - 1].date) : undefined;
    const typeParam = filterType() === "all" ? undefined : filterType();
    const userIdParam = filterUserId().trim() || undefined;

    try {
      const res = await api.server.getLogs({
        type: typeParam as "success" | "error" | undefined,
        userId: userIdParam,
        cursorLogDate: cursor,
      });
      const data = (Array.isArray(res) ? res : (res as { data: LogEntry[] }).data ?? []) as LogEntry[];
      // 古い応答（最新でないリクエストID）は破棄
      if (currentRequestId !== requestId) return;
      if (isMore) {
        if (data.length === 0) setHasMore(false);
        else setLogs((prev) => [...prev, ...data]);
        // 取得件数が少なければ終端とみなす
        if (data.length < PAGE_LIMIT_HINT) setHasMore(false);
      } else {
        setLogs(data);
        setHasMore(data.length >= PAGE_LIMIT_HINT);
      }
    } catch (e) {
      if (currentRequestId !== requestId) return;
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (currentRequestId === requestId) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  const applyFilter = () => {
    setHasMore(true);
    fetchLogs("reset");
  };

  const handleTypeChange = (v: string) => {
    if (v === filterType()) return;
    setFilterType(v as FilterType);
    applyFilter();
  };

  const handleReset = () => {
    setFilterType("all");
    setFilterUserId("");
    setHasMore(true);
    fetchLogs("reset");
  };

  onMount(() => fetchLogs("reset"));

  return (
    <div class="flex flex-col h-full gap-2 overflow-y-auto">
      {/* フィルタ */}
      <Card class="shrink-0">
        <CardHeader class="pb-3 flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle class="text-base">リクエストログ</CardTitle>
        </CardHeader>

        <CardContent class="flex flex-col gap-3">
          <div class="flex flex-col md:flex-row gap-3 md:items-end">
            <div class="flex flex-col gap-1">
              <Label>タイプ</Label>
              <Tabs value={filterType()} onChange={handleTypeChange} class="w-full">
                <TabsList class="grid w-full grid-cols-3">
                  <TabsTrigger value="all">すべて</TabsTrigger>
                  <TabsTrigger value="success">success</TabsTrigger>
                  <TabsTrigger value="error">error</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <TextField class="flex-1 max-w-sm">
              <Label>ユーザーID（任意）</Label>
              <div class="relative">
                <TextFieldInput
                  type="text"
                  placeholder="userId で絞り込み"
                  value={filterUserId()}
                  onInput={(e) => setFilterUserId(e.currentTarget.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyFilter()}
                  class="pr-8"
                />
                <Show when={filterUserId()}>
                  <button
                    type="button"
                    aria-label="クリア"
                    onClick={() => {
                      setFilterUserId("");
                      applyFilter();
                    }}
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <IconX class="size-4" />
                  </button>
                </Show>
              </div>
            </TextField>

            <div class="flex gap-2 md:ml-auto">
              <Button onClick={applyFilter} disabled={loading() || loadingMore()}>
                <IconSearch class="size-4 mr-2" />
                絞り込み
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={loading() || loadingMore()}>
                リセット
              </Button>
            </div>
          </div>

          <Show when={error()}>
            <Callout variant="error">{error()}</Callout>
          </Show>

          <hr />

          <div class="flex flex-row items-center justify-around gap-2 text-lg font-bold">
            <span>合計 {logs().length} 日分</span>
            <span>通過: <span class="text-success">{totals().success}</span></span>
            <span>エラー: <span class="text-error">{totals().error}</span></span>
            <span>その他: <span class="text-warning">{totals().other}</span></span>
          </div>
        </CardContent>
      </Card>

      {/* 一覧 */}
      <Card class="flex-1 min-h-0 flex flex-col overflow-hidden">
        <Show
          when={!loading()}
          fallback={
            <div class="p-4 flex flex-col gap-2">
              <For each={Array.from({ length: 6 })}>
                {() => <Skeleton class="h-10 w-full" />}
              </For>
            </div>
          }
        >
          <div class="overflow-auto flex-1">
            <Table>
              <TableHeader class="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead class="text-right">success</TableHead>
                  <TableHead class="text-right">error</TableHead>
                  <TableHead class="text-right">other</TableHead>
                  <TableHead class="text-right">合計</TableHead>
                  <TableHead class="w-[160px]">内訳</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <Show
                  when={logs().length > 0}
                  fallback={
                    <TableRow>
                      <TableCell colSpan={6} class="h-24 text-center text-muted-foreground">
                        ログがありません。
                      </TableCell>
                    </TableRow>
                  }
                >
                  <For each={logs()}>
                    {(entry) => {
                      const total = totalCount(entry);
                      const wSuccess = total ? (entry.successCount / total) * 100 : 0;
                      const wError = total ? (entry.errorCount / total) * 100 : 0;
                      const wOther = total ? (entry.otherCount / total) * 100 : 0;
                      return (
                        <TableRow>
                          <TableCell class="font-mono text-xs whitespace-nowrap">
                            {new Date(entry.date).toLocaleString("ja-JP", { dateStyle: "medium", timeStyle: "short" })}
                          </TableCell>
                          <TableCell class="text-right tabular-nums">{entry.successCount}</TableCell>
                          <TableCell class="text-right tabular-nums">{entry.errorCount}</TableCell>
                          <TableCell class="text-right tabular-nums">{entry.otherCount}</TableCell>
                          <TableCell class="text-right font-medium tabular-nums">{total}</TableCell>
                          <TableCell>
                            <div class="flex h-2 rounded-full overflow-hidden bg-muted">
                              <div class="bg-success" style={`width:${wSuccess}%`} />
                              <div class="bg-destructive" style={`width:${wError}%`} />
                              <div class="bg-secondary" style={`width:${wOther}%`} />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }}
                  </For>
                </Show>
              </TableBody>
            </Table>
          </div>

          <div class="p-3 border-t flex justify-center shrink-0">
            <Show
              when={hasMore() && logs().length > 0}
              fallback={<p class="text-sm text-muted-foreground py-1">{logs().length > 0 ? "これ以上ログはありません" : ""}</p>}
            >
              <Button variant="outline" onClick={() => fetchLogs("more")} disabled={loadingMore()}>
                {loadingMore() ? "読み込み中..." : "さらに読み込む"}
              </Button>
            </Show>
          </div>
        </Show>
      </Card>
    </div>
  );
}
