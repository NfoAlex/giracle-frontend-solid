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
      <Card class="basis-[30%] grow-0 shrink-0 min-h-0 flex flex-col overflow-hidden">
        <p>ここでグラフ表示予定</p>
      </Card>

      <Card class="flex-1 min-h-0 flex flex-col overflow-hidden">
        <p>データのテーブル表示</p>
      </Card>
    </div>
  );
}
