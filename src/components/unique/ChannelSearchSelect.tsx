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

  const fetchPage: TSearchSelectPageFetcher<IChannel> = async ({
    query,
    page,
    pageSize,
  }) => {
    if (cachedQuery !== query) {
      cachedAll =
        query === ""
          ? (await api.channel.list()).data
          : (await api.channel.search({ query })).data;
      cachedQuery = query;
    }

    const start = page * pageSize;
    const items = cachedAll.slice(start, start + pageSize);
    return { items, hasMore: cachedAll.length > start + items.length };
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
