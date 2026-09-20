import { IconHash } from "@tabler/icons-solidjs";
import type { JSX } from "solid-js";
import { api } from "~/api/index.ts";
import type { IChannel } from "~/types/Channel.ts";
import SearchSelect from "./SearchSelect.tsx";
import type { TSearchSelectPageFetcher } from "./SearchSelect.tsx";

/**
 * チャンネル選択用の検索セレクト
 *
 * バックエンド（`BetterChannelSearching` HEAD `47a09b1`）の仕様:
 * - `/api/channel/search` は **前方一致かつ大文字小文字を区別** する（`name GLOB '<query>*'`）。
 *   中間部分一致はヒットしない（"eneral" は "General" に一致しない）。
 * - `query` は `minLength: 1` / `maxLength: 100`。空文字・100 文字超はエラーになるため、
 *   空のときは `/api/channel/list` を使い、入力長は maxQueryLength で 100 に制限する。
 * - ページング（limit / cursor）は無い。1クエリ分の全件を取得して pageSize 件ずつ切り出すので、
 *   **通信量は表示件数では減らない**（絞れるのは表示だけ）。
 * - `/api/channel/list` は閲覧可能な全チャンネルを返すため、`search(q)` の結果は常に
 *   `list()` の部分集合になる。事前選択 id の解決はこの1回の取得を使い回す。
 * 詳細は docs/channel-api-analysis.md を参照。
 */
export default function ChannelSearchSelect(props: {
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  placement?: "top" | "bottom";
  class?: string;
}): JSX.Element {
  //コンポーネント関数の本体（= インスタンスごと）に置く。モジュールスコープに置くと
  //複数インスタンスでキャッシュが混ざる
  //検索語ごとの全件キャッシュ。resolveItems が "" を引いても進行中の検索結果を
  //捨てないよう、単一エントリではなく検索語をキーにして保持する
  const cache = new Map<string, IChannel[]>();
  //キャッシュの上限。超えたら最も古いエントリから捨てる
  const CACHE_MAX = 5;
  //取得中の query と Promise。同一 query の並行呼び出しを1回の取得にまとめる
  let inflightQuery: string | undefined;
  let inflight: Promise<IChannel[]> | undefined;

  /** 1クエリ分の全件を取得する（同一 query の並行要求は同じ Promise を共有する） */
  const fetchAll = (query: string): Promise<IChannel[]> => {
    const cached = cache.get(query);
    if (cached !== undefined) {
      //参照されたエントリを最新に寄せる（Mapの挿入順を古さの順として使う）
      cache.delete(query);
      cache.set(query, cached);
      return Promise.resolve(cached);
    }
    if (inflightQuery === query && inflight !== undefined) return inflight;

    const request = (
      query === "" ? api.channel.list() : api.channel.search({ query })
    ).then((res) => res.data);
    inflightQuery = query;
    inflight = request;

    return request
      .then((all) => {
        //取得中に別 query が始まっていたらキャッシュに入れない
        if (inflightQuery === query) {
          cache.set(query, all);
          if (cache.size > CACHE_MAX) {
            const oldest = cache.keys().next().value;
            if (oldest !== undefined) cache.delete(oldest);
          }
        }
        return all;
      })
      .finally(() => {
        //成功・失敗どちらでも解放する。失敗時はキャッシュに入れず次回に再取得させる
        if (inflight === request) {
          inflight = undefined;
          inflightQuery = undefined;
        }
      });
  };

  const fetchPage: TSearchSelectPageFetcher<IChannel> = async ({
    query,
    page,
    pageSize,
  }) => {
    const all = await fetchAll(query);
    const start = page * pageSize;
    const items = all.slice(start, start + pageSize);
    return { items, hasMore: all.length > start + items.length };
  };

  /** 事前に value で渡された id の実体を引く */
  const resolveItems = async (ids: string[]): Promise<IChannel[]> => {
    //まず閲覧可能な全チャンネル（list）から引く。search と同一の可視集合・同一カラムなので
    //事前選択が何件あっても取得は1回で済む。
    //list が失敗しても握り潰すのは意図的: ここで reject すると getInfo フォールバックに
    //到達せず、解決の再試行契機が無いため選択済みチップが id 表示のまま固定されてしまう。
    //空にすれば全 id が下の per-id フォールバック（個別 catch 付き）に落ちる
    const byId = new Map(
      (await fetchAll("").catch(() => [] as IChannel[])).map((c) => [c.id, c]),
    );
    const found = new Map<string, IChannel>();
    //同じ id が複数回渡されても getInfo を重複させないよう、出現順を保って一意化する
    const missing: string[] = [];
    for (const id of new Set(ids)) {
      const channel = byId.get(id);
      if (channel !== undefined) found.set(id, channel);
      else missing.push(id);
    }

    //list に無い id（可視集合外など）だけ getInfo にフォールバックする。
    //無制限並列を避けるため 5 件ずつ処理する
    for (let i = 0; i < missing.length; i += 5) {
      const chunk = missing.slice(i, i + 5);
      const fetched = await Promise.all(
        chunk.map((id) =>
          api.channel
            .getInfo({ channelId: id })
            .then((res) => res.data)
            .catch(() => undefined),
        ),
      );
      for (const channel of fetched) {
        if (channel !== undefined) found.set(channel.id, channel);
      }
    }

    //渡された順序を保って返す
    return ids
      .map((id) => found.get(id))
      .filter((c): c is IChannel => c !== undefined);
  };

  /** 項目1行の描画（channel/search・channel/list のどちらにも ChannelViewableRole は無いので錠前は出さない） */
  const renderItem = (channel: IChannel): JSX.Element => (
    <span class="flex min-w-0 items-center gap-1">
      <IconHash class="shrink-0" size={16} />
      <span class="truncate">{channel.name}</span>
    </span>
  );

  return (
    <SearchSelect<IChannel>
      fetchPage={fetchPage}
      resolveItems={resolveItems}
      renderItem={renderItem}
      value={props.value}
      onChange={props.onChange}
      placeholder={props.placeholder}
      placement={props.placement}
      class={props.class}
      //channel/search の query 上限（t.String({ maxLength: 100 })）に合わせる
      maxQueryLength={100}
    />
  );
}
