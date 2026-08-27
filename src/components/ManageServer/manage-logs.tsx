import { createSignal, For, onMount, Show } from "solid-js";
import { api } from "~/api/index.ts";
import { Badge } from "~/components/ui/badge.tsx";
import { Button } from "~/components/ui/button.tsx";
import { Callout } from "~/components/ui/callout.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select.tsx";
import { Skeleton } from "~/components/ui/skeleton.tsx";
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
      if (isMore) {
        if (data.length === 0) setHasMore(false);
        else setLogs((prev) => [...prev, ...data]);
        // 取得件数が少なければ終端とみなす
        if (data.length < PAGE_LIMIT_HINT) setHasMore(false);
      } else {
        setLogs(data);
        setHasMore(data.length >= PAGE_LIMIT_HINT || data.length > 0);
        // 空なら終端
        if (data.length === 0) setHasMore(false);
        // 少ない場合でも続きがある可能性はあるため hasMore は維持するが、
        // 明確に0件なら false。厳密なページング情報がないため楽観的に true のまま
        if (data.length > 0 && data.length < PAGE_LIMIT_HINT) {
          // 一旦 true のまま、次回 more で 0件なら止まる
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = () => {
    setHasMore(true);
    fetchLogs("reset");
  };

  const handleReset = () => {
    setFilterType("all");
    setFilterUserId("");
    setHasMore(true);
    // state更新後に取得
    setTimeout(() => fetchLogs("reset"), 0);
  };

  onMount(() => fetchLogs("reset"));

  return (
    <div class="flex flex-col h-full gap-2 overflow-y-auto">
      {/* フィルタ */}
      <Card class="shrink-0">
        <CardHeader class="pb-3">
          <CardTitle class="text-base">リクエストログ</CardTitle>
        </CardHeader>
        <CardContent class="flex flex-col gap-3">
          <div class="flex flex-col md:flex-row gap-3 md:items-end">
            <div class="flex flex-col gap-1 min-w-[160px]">
              <Label>タイプ</Label>
              <Select
                value={filterType()}
                onChange={(v) => v && setFilterType(v as FilterType)}
                options={["all", "success", "error"] as FilterType[]}
                itemComponent={(props) => (
                  <SelectItem item={props.item}>
                    {props.item.rawValue === "all" && "すべて"}
                    {props.item.rawValue === "success" && "success"}
                    {props.item.rawValue === "error" && "error"}
                  </SelectItem>
                )}
              >
                <SelectTrigger>
                  <SelectValue<FilterType>>
                    {(state) => (
                      <span>
                        {state.selectedOption() === "all" && "すべて"}
                        {state.selectedOption() === "success" && "success"}
                        {state.selectedOption() === "error" && "error"}
                        {!state.selectedOption() && "すべて"}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent />
              </Select>
            </div>

            <TextField class="flex-1 max-w-sm">
              <Label>ユーザーID（任意）</Label>
              <TextFieldInput
                type="text"
                placeholder="userId で絞り込み"
                value={filterUserId()}
                onInput={(e) => setFilterUserId(e.currentTarget.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </TextField>

            <div class="flex gap-2 md:ml-auto">
              <Button onClick={handleSearch} disabled={loading() || loadingMore()}>
                絞り込み
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={loading() || loadingMore()}>
                リセット
              </Button>
              <Button variant="outline" onClick={() => fetchLogs("reset")} disabled={loading() || loadingMore()}>
                再取得
              </Button>
            </div>
          </div>

          {/* サマリ */}
          <Show when={!loading() && logs().length > 0}>
            <div class="flex flex-wrap gap-2 text-sm">
              <Badge variant="secondary">合計 {logs().length} 日分</Badge>
              <Badge variant="success">success {totals().success}</Badge>
              <Badge variant="error">error {totals().error}</Badge>
              <Badge variant="outline">other {totals().other}</Badge>
            </div>
          </Show>

          <Show when={error()}>
            <Callout variant="error">{error()}</Callout>
          </Show>
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
