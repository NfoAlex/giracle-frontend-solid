import type { IBot, TBotListItem } from "~/types/Server.ts";
import { FETCH_CLIENT } from "../FETCH_CLIENT.ts";

export const bot = {
  // 自分が作成したBot一覧(作成順)。tokenCodeを含む
  list: (q: { length?: number; cursorBotId?: string; query?: string }) =>
    FETCH_CLIENT<{ message: "Bot list fetched"; data: TBotListItem[] }>({
      url: "/api/bot/list",
      method: "GET",
      label: "BOT_LIST",
      query: { length: q.length, cursorBotId: q.cursorBotId, query: q.query },
    }),

  // 管理者用の全Bot一覧(新しい順)。tokenCodeを含まない
  listAll: (q: { length?: number; cursorBotId?: string; query?: string }) =>
    FETCH_CLIENT<{ message: "Bot list fetched"; data: TBotListItem[] }>({
      url: "/api/bot/all",
      method: "GET",
      label: "BOT_LIST_ALL",
      query: { length: q.length, cursorBotId: q.cursorBotId, query: q.query },
    }),

  // リモートユーザーIdからBot情報を取得(tokenCodeは含まない)
  getByRemoteUserId: (p: { remoteUserId: string }) =>
    FETCH_CLIENT<{ message: "Bot info"; data: IBot }>({
      url: `/api/bot/${p.remoteUserId}`,
      method: "GET",
      label: "BOT_GET_BY_REMOTE_USER_ID",
    }),

  create: (p: {
    name: string;
    // バックエンドは指定時に1文字以上を要求するため、未入力はキー自体を送らない
    introduction?: string;
  }) =>
    FETCH_CLIENT<{
      message: "Bot created";
      data: {
        remoteUser: { id: string; name: string | null; isBot: boolean };
        bot: TBotListItem;
      };
    }>({
      url: "/api/bot",
      method: "PUT",
      label: "BOT_CREATE",
      body: p,
    }),

  delete: (p: { botId: string }) =>
    FETCH_CLIENT<{ message: "Bot deleted" }>({
      url: "/api/bot",
      method: "DELETE",
      label: "BOT_DELETE",
      body: p,
    }),
};
