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

let listRequest: Promise<void> | undefined;

/**
 * 未ロードのチャンネル情報を補完する
 * (ストアは共有なので成功後は再送しない。失敗時は次回再試行する)
 */
const ensureChannelList = (): Promise<void> => {
  if (!listRequest) {
    listRequest = api.channel
      .list()
      .then((r) => {
        for (const channel of r.data)
          useStoreChannelInfo.updateChannelInfo(channel);
      })
      .catch((e) => {
        // 失敗時は次回の検索で再試行できるよう破棄する
        listRequest = undefined;
        throw e;
      });
  }
  return listRequest;
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
  // 成功後は再送なし・失敗時は次回再試行。応答後にもう一度絞り直す
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
