import * as ComboboxPrimitive from "@kobalte/core/combobox";
import { IconCheck, IconChevronDown, IconX } from "@tabler/icons-solidjs";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import type { JSX } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { Badge } from "~/components/ui/badge.tsx";
import { Button } from "~/components/ui/button.tsx";
import { cn } from "~/lib/utils.ts";

/** 選択対象が満たすべき最小構造（IChannel / IUser / IRole はいずれもこれを構造的に満たす） */
export interface ISearchSelectOption {
  id: string;
  name: string;
}

/** fetchPage に渡されるページ要求 */
export interface ISearchSelectPageParams<T> {
  /** 入力中の検索語（未入力時は ""） */
  query: string;
  /** 0 始まりのページ番号 */
  page: number;
  /** 1ページの件数 */
  pageSize: number;
  /** これまでに読み込んだ全件（カーソル型API用） */
  itemsSoFar: T[];
}

/** fetchPage の戻り値 */
export interface ISearchSelectPageResult<T> {
  /** このページ分のみ */
  items: T[];
  /** さらに読み込めるか */
  hasMore: boolean;
}

export type TSearchSelectPageFetcher<T> = (
  params: ISearchSelectPageParams<T>,
) => Promise<ISearchSelectPageResult<T>>;

export interface ISearchSelectProps<T extends ISearchSelectOption> {
  /** ページ単位の取得処理。検索語が空のときは query: "" で呼ばれる */
  fetchPage: TSearchSelectPageFetcher<T>;
  /** 事前に value で渡された id の実体を引く（未指定なら id を名前として表示） */
  resolveItems?: (ids: string[]) => Promise<T[]>;
  /** 選択済みの id 一覧 */
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  /** ポップアップの上下位置。既定 "bottom" */
  placement?: "top" | "bottom";
  /** 1ページの件数。既定 30 */
  pageSize?: number;
  /**
   * 検索語の最大長。指定時は入力欄に maxLength を付け、
   * 超過した検索語は fetchPage へ渡さない（サーバー側の 500 を防ぐ）
   */
  maxQueryLength?: number;
  /** 項目1行の描画。既定は name のテキスト表示 */
  renderItem?: (item: T) => JSX.Element;
  class?: string;
}

const DEFAULT_PAGE_SIZE = 30;
//検索入力の debounce（ChannelTextInput と同じ値）
const DEBOUNCE_MS = 200;

/**
 * 検索付き複数選択コンボボックス（Kobalte Combobox ベース）
 *
 * - 文字入力でサーバー検索（debounce 付き）
 * - 1ページ pageSize 件（既定 30）。続きは「さらに読み込む」ボタン
 * - 選択済みは入力欄内にチップ表示。複数選択可能
 * - ポップアップの上下位置を placement で指定
 */
export default function SearchSelect<T extends ISearchSelectOption>(
  props: ISearchSelectProps<T>,
): JSX.Element {
  const [items, setItems] = createSignal<T[]>([]);
  const [page, setPage] = createSignal(0);
  const [hasMore, setHasMore] = createSignal(false);
  const [status, setStatus] = createSignal<"idle" | "loading" | "error">(
    "idle",
  );
  const [loadingMore, setLoadingMore] = createSignal(false);
  //直近 load に渡したクエリ（入力欄の現在値とは別。追加読み込みで使う）
  const [currentQuery, setCurrentQuery] = createSignal("");
  //一度でも見た項目の辞書。選択済み項目を常に options に含めるために必要
  const [known, setKnown] = createStore<{ [id: string]: T }>({});
  //resolveItems の二重取得を防ぐ
  const resolving = new Set<string>();
  let debounceTimer: ReturnType<typeof setTimeout> | undefined; //検索debounce用タイマー
  //古い応答を捨てるための世代カウンタ
  let reqSeq = 0;

  /**
   * known に未登録の id は即座に { id, name: id } で補う。
   * resolveItems の解決前でも選択が欠落しないようにするために必須。
   */
  const fallback = (id: string): T =>
    known[id] ?? ({ id, name: id } as unknown as T);

  /** props.value を必ず同じ長さ・同じ順序で T[] に変換する */
  const selectedItems = createMemo<T[]>(() => props.value.map(fallback));

  /**
   * 現在のページ結果 + ページ結果に無い選択済み項目（id で重複排除）。
   * Kobalte は selectedOptions / onChange のペイロードを options から逆引きするため、
   * 選択済み項目が options に無いとチップも onChange も壊れる。
   * Kobalte はこれを複数回読むため memo 化して再確保を避ける。
   */
  const options = createMemo<T[]>(() => {
    const merged = [...items()];
    const seen = new Set(merged.map((i) => i.id));
    for (const id of props.value) {
      if (seen.has(id)) continue;
      seen.add(id);
      merged.push(fallback(id));
    }
    return merged;
  });

  /**
   * ページを読み込む
   * @param nextPage - 0 始まりのページ番号
   * @param query - 検索語
   */
  const load = async (nextPage: number, query: string) => {
    //上限は入力欄の maxLength が主たる制御（ブラウザが入力を打ち切る）。
    //ここはそれを迂回する経路（プログラム経由の load 呼び出しなど）向けの保険で、
    //通常の UI 操作では到達しない。サーバー超過は 500 になるため送らない
    if (
      props.maxQueryLength !== undefined &&
      query.length > props.maxQueryLength
    ) {
      return;
    }

    const seq = ++reqSeq;
    const size = props.pageSize ?? DEFAULT_PAGE_SIZE;

    setCurrentQuery(query);
    if (nextPage === 0) {
      setStatus("loading");
      //新 query の先頭ページ取得中は (query, page, hasMore) を一致させる。
      //古い query の page / hasMore のまま「さらに読み込む」が押されると、
      //新 query と古い page の組み合わせでリストが汚染されるため
      setPage(0);
      setHasMore(false);
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await props.fetchPage({
        query,
        page: nextPage,
        pageSize: size,
        itemsSoFar: items(),
      });

      //古い応答は以降の state を一切触らない
      if (seq !== reqSeq) return;

      if (nextPage === 0) setItems(result.items);
      else setItems([...items(), ...result.items]);

      //known を書き直す。items() 分を残すのは、表示中の行を選択した時に resolveItems を
      //再実行させないための最適化。props.value 分のループは最適化ではなく必須:
      //resolveUnknown は onMount と props.value 変更でしか走らず、この prune では再実行
      //されないため、落とすと現在のページに無い選択済み id のラベルが二度と復元されない。
      //未解決 id は書き戻さない（プレースホルダを入れると resolveUnknown の
      //known[id] === undefined 判定が偽になり、その id が永久に解決されなくなる）
      const keep: { [id: string]: T } = {};
      for (const item of items()) keep[item.id] = item;
      for (const id of props.value) {
        const resolved = known[id];
        if (resolved !== undefined) keep[id] = resolved;
      }
      setKnown(reconcile(keep));

      setHasMore(result.hasMore);
      setPage(nextPage);
      setStatus("idle");
      setLoadingMore(false);
    } catch (e) {
      if (seq !== reqSeq) return;

      console.error("SearchSelect :: load : e", e);
      //表示中のリストは消さない
      setStatus("error");
      setLoadingMore(false);
    }
  };

  /** 入力欄の変更（200ms 待ってから先頭ページを検索する） */
  const handleInputChange = (value: string) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => load(0, value), DEBOUNCE_MS);
  };

  /** value のうち未解決の id を解決して known に格納する */
  const resolveUnknown = () => {
    const unknownIds = props.value.filter(
      (id) => known[id] === undefined && !resolving.has(id),
    );
    if (unknownIds.length === 0) return;

    const resolve = props.resolveItems;
    if (resolve === undefined) {
      //解決手段が無い場合は id を名前として扱う
      for (const id of unknownIds) setKnown(id, fallback(id));
      return;
    }

    for (const id of unknownIds) resolving.add(id);

    resolve(unknownIds)
      .then((resolved) => {
        for (const item of resolved) setKnown(item.id, item);
      })
      .catch((e) => {
        console.error("SearchSelect :: resolveItems : e", e);
      })
      .finally(() => {
        for (const id of unknownIds) resolving.delete(id);
      });
  };

  onMount(() => {
    //未入力時に先頭ページを用意する
    load(0, "");
    resolveUnknown();
  });

  createEffect(on(() => props.value, resolveUnknown));

  onCleanup(() => clearTimeout(debounceTimer));

  //スクリーンリーダ向け文言。countAnnouncement だけは型が文字列リテラルに固定されているため読み上げなし
  const translations = {
    focusAnnouncement: (optionText: string, isSelected: boolean) =>
      `${optionText}${isSelected ? "、選択済み" : ""}`,
    countAnnouncement: () => undefined,
    selectedAnnouncement: (optionText: string) => `${optionText}、選択しました`,
    triggerLabel: "候補を表示",
    listboxLabel: "候補",
  };

  return (
    <ComboboxPrimitive.Root<T, never, "div">
      class={cn("w-full", props.class)}
      multiple
      value={selectedItems()}
      onChange={(next) => props.onChange(next.map((i) => i.id))}
      options={options()}
      optionValue={(o) => o.id}
      optionTextValue={(o) => o.name}
      optionLabel={(o) => o.name}
      defaultFilter={() => true}
      allowsEmptyCollection
      closeOnSelection={false}
      triggerMode="focus"
      placement={props.placement ?? "bottom"}
      placeholder={props.placeholder}
      translations={translations}
      onInputChange={handleInputChange}
      itemComponent={(p) => (
        <ComboboxPrimitive.Item
          item={p.item}
          class="relative flex w-full cursor-default select-none items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
        >
          <ComboboxPrimitive.ItemLabel>
            {props.renderItem?.(p.item.rawValue as T) ??
              (p.item.rawValue as T).name}
          </ComboboxPrimitive.ItemLabel>
          <ComboboxPrimitive.ItemIndicator class="flex size-3.5 shrink-0 items-center justify-center">
            <IconCheck class="size-4" />
          </ComboboxPrimitive.ItemIndicator>
        </ComboboxPrimitive.Item>
      )}
    >
      <ComboboxPrimitive.Control<T, "div"> class="flex min-h-10 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-transparent px-2 py-1 text-sm">
        {(state) => (
          <>
            <For each={state.selectedOptions()}>
              {(opt) => (
                <Badge variant="outline" class="flex items-center gap-1">
                  <span>{opt.name}</span>
                  <button
                    type="button"
                    aria-label={`${opt.name} を外す`}
                    class="cursor-pointer"
                    onClick={() => state.remove(opt)}
                  >
                    <IconX size={12} />
                  </button>
                </Badge>
              )}
            </For>
            <ComboboxPrimitive.Input
              aria-label={props.placeholder ?? "検索"}
              maxLength={props.maxQueryLength}
              class="h-8 min-w-24 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
            <ComboboxPrimitive.Trigger class="shrink-0">
              <ComboboxPrimitive.Icon>
                <IconChevronDown class="size-4 opacity-50" />
              </ComboboxPrimitive.Icon>
            </ComboboxPrimitive.Trigger>
          </>
        )}
      </ComboboxPrimitive.Control>
      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Content class="z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          <ComboboxPrimitive.Listbox class="m-0 max-h-64 overflow-y-auto" />
          <Show when={status() === "loading" && items().length === 0}>
            <p class="p-2 text-sm text-muted-foreground">読み込み中...</p>
          </Show>
          <Show
            when={
              status() === "idle" &&
              items().length === 0 &&
              props.value.length === 0
            }
          >
            <p class="p-2 text-sm text-muted-foreground">該当なし</p>
          </Show>
          <Show when={status() === "error"}>
            <p class="p-2 text-sm text-destructive">取得に失敗しました</p>
          </Show>
          <Show when={hasMore()}>
            <div class="border-t p-1">
              <Button
                variant="secondary"
                size="sm"
                class="w-full"
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => load(page() + 1, currentQuery())}
                disabled={loadingMore()}
              >
                {loadingMore() ? "読み込み中..." : "さらに読み込む"}
              </Button>
            </div>
          </Show>
        </ComboboxPrimitive.Content>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  );
}
