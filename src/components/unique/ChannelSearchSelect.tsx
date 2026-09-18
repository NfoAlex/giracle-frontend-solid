import { IconHash } from "@tabler/icons-solidjs";
import type { JSX } from "solid-js";
import { api } from "~/api/index.ts";
import type { IChannel } from "~/types/Channel.ts";
import SearchSelect from "./SearchSelect.tsx";
import type { TSearchSelectPageFetcher } from "./SearchSelect.tsx";

/**
 * チャンネル選択用の検索セレクト
 *
 * バックエンドの `/api/channel/search` はページングを持たないため、
 * 1クエリ分の全件を取得してクライアント側で pageSize 件ずつ切り出す。
 * また `/api/channel/search` は query が minLength:1 のため空文字を受け付けない。
 * 未入力時は全件を返す `/api/channel/list` を使う。
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
  let cachedQuery: string | undefined;
  let cachedAll: IChannel[] = [];
  //取得中の query と Promise。同一 query の並行呼び出しを1回の取得にまとめる
  let inflightQuery: string | undefined;
  let inflight: Promise<IChannel[]> | undefined;

  const fetchPage: TSearchSelectPageFetcher<IChannel> = async ({
    query,
    page,
    pageSize,
  }) => {
    let all = cachedAll;

    if (cachedQuery !== query) {
      const request =
        inflightQuery === query && inflight !== undefined
          ? inflight
          : (query === ""
                ? api.channel.list()
                : api.channel.search({ query })
              ).then((res) => res.data);
      inflightQuery = query;
      inflight = request;

      try {
        all = await request;
        //取得中に別 query が始まっていたらキャッシュを上書きしない
        if (inflightQuery === query) {
          cachedAll = all;
          cachedQuery = query;
        }
      } finally {
        //成功・失敗どちらでも解放する。失敗時は cachedQuery を進めず次回に再取得させる
        if (inflight === request) {
          inflight = undefined;
          inflightQuery = undefined;
        }
      }
    }

    const start = page * pageSize;
    const items = all.slice(start, start + pageSize);
    return { items, hasMore: all.length > start + items.length };
  };

  /** 事前に value で渡された id の実体を引く */
  const resolveItems = async (ids: string[]): Promise<IChannel[]> => {
    const fetched = await Promise.all(
      ids.map((id) =>
        api.channel
          .getInfo({ channelId: id })
          .then((res) => res.data)
          .catch(() => undefined),
      ),
    );
    return fetched.filter((c): c is IChannel => c !== undefined);
  };

  /** 項目1行の描画（channel/search のレスポンスには ChannelViewableRole が無いので錠前は出さない） */
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
    />
  );
}
