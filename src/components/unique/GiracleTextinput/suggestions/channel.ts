import type { EditorView } from "prosemirror-view";
import { api } from "~/api/index.ts";
import {
  storeChannelInfo,
  useStoreChannelInfo,
} from "~/stores/ChannelInfo.store.ts";
import type { IChannel } from "~/types/Channel.ts";
import type { IMentionMenuItem } from "../MentionMenu.tsx";
import { pmSchema } from "../pmSchema.ts";
import { type ISearchContext, insertChip } from "./common.ts";

let listRequested = false;

/**
 * 未ロードのチャンネル情報を1回だけ補完する
 * (ストアは共有なのでコンポーネントインスタンスを跨いで1回で足りる)
 */
const ensureChannelList = (): Promise<void> => {
  if (listRequested) return Promise.resolve();
  listRequested = true;
  return api.channel.list().then((r) => {
    for (const channel of r.data)
      useStoreChannelInfo.updateChannelInfo(channel);
  });
};

/** チャンネル候補を state へ反映する(ストア同期フィルタ・候補0件でも送信は妨げない) */
export const searchChannels = (query: string, ctx: ISearchContext): void => {
  const lower = query.toLowerCase();
  const apply = () =>
    ctx.apply("channel", query, {
      channels: Object.values(storeChannelInfo).filter((c) =>
        c.name.toLowerCase().includes(lower),
      ),
      selectIndex: 0,
      isSearching: false,
    });
  apply();
  // 全件の補完は1回だけ。応答後にもう一度絞り直す
  ensureChannelList()
    .catch((e) => console.error("MENTION_CHANNEL_LIST :: e->", e))
    .finally(apply);
};

export const channelMenuItem = (channel: IChannel): IMentionMenuItem => ({
  id: channel.id,
  name: channel.name,
  fallbackGlyph: "#",
});

export const insertChannelMention = (
  view: EditorView,
  channel: IChannel,
): void => {
  insertChip(
    view,
    pmSchema.nodes.channelMention.create({
      channelId: channel.id,
      name: channel.name,
    }),
  );
};
