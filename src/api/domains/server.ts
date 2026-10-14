import type { IChannel } from "~/types/Channel.ts";
import type { ICustomEmoji } from "~/types/Message.ts";
import type {
  IBot,
  IInvite,
  IRequestLog,
  IRequestLogCount,
  IServer,
  TBotListItem,
} from "~/types/Server.ts";
import { FETCH_CLIENT } from "../FETCH_CLIENT.ts";

export const server = {
  changeConfig: (p: IServer) =>
    FETCH_CLIENT<{ message: "Server config updated"; data: IServer }>({
      url: "/api/server/change-config",
      method: "POST",
      body: { ...p },
      label: "SERVER_CHANGE_CONFIG",
    }),

  changeInfo: (p: { name: string; introduction: string }) =>
    FETCH_CLIENT<{ message: "Server info updated"; data: IServer }>({
      url: "/api/server/change-info",
      method: "POST",
      body: { name: p.name, introduction: p.introduction },
      label: "SERVER_CHANGE_INFO",
    }),

  // 元実装は「未応答なら3.5秒でAbortして例外」というタイムアウト機構を持つため、
  // FETCH_CLIENT を使わず現行挙動をそのまま維持する。
  config: async (): Promise<{
    message: string;
    data: {
      isFirstUser: boolean;
      defaultJoinChannel: IChannel[];
      id: undefined;
      name?: string | undefined;
      introduction?: string | undefined;
      RegisterAvailable?: boolean | undefined;
      RegisterInviteOnly?: boolean | undefined;
      RegisterAnnounceChannelId?: string | undefined;
      MessageMaxLength?: number | undefined;
      BotEnabled?: boolean;
    };
  }> => {
    let FLAG_RECEIVED = false;
    const CONTROLLER = new AbortController();

    const res = await fetch("/api/server/config", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: CONTROLLER.signal,
    })
      .then((response) => {
        FLAG_RECEIVED = true;
        return response;
      })
      .catch((err) => {
        throw new Error("SERVER_CONFIG :: fetch failed", { cause: err });
      });

    setTimeout(() => {
      if (!FLAG_RECEIVED) {
        CONTROLLER.abort();
        throw new Error("SERVER_CONFIG :: timeout");
      }
    }, 3500);

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getBot: (q: { length?: number; cursorBotId?: string; query?: string }) =>
    FETCH_CLIENT<{ message: "Bot list fetched"; data: TBotListItem[] }>({
      url: "/api/bot/list",
      method: "GET",
      label: "BOT_LIST",
      query: q,
    }),

  getBotAll: (q: { length?: number; query?: string; cursorBotId?: string }) =>
    FETCH_CLIENT<{ message: "Bot list fetched"; data: TBotListItem[] }>({
      url: "/api/bot/all",
      method: "GET",
      label: "BOT_ALL",
      query: q,
    }),

  // リモートユーザーIdからBot情報を取得(作成者表示用)。tokenCodeは含まない
  getBotByRemoteUserId: (p: { remoteUserId: string }) =>
    FETCH_CLIENT<{ message: "Bot info"; data: IBot }>({
      url: `/api/bot/${p.remoteUserId}`,
      method: "GET",
      label: "BOT_GET_BY_REMOTE_USER_ID",
    }),

  putBot: (p: {
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
      label: "BOT_PUT",
      body: p,
    }),

  deleteBotById: (p: { botId: string }) =>
    FETCH_CLIENT<{ message: "Bot deleted" }>({
      url: "/api/bot",
      method: "DELETE",
      label: "BOT_DELETE",
      body: p,
    }),

  // 承認状態の変更(manageServer)。enabled=true で承認
  configureBot: (p: { botId: string; enabled: boolean }) =>
    FETCH_CLIENT<{ message: "Bot updated"; data: IBot }>({
      url: "/api/server/bot/set-approve",
      method: "POST",
      label: "BOT_SET_APPROVE",
      body: { botId: p.botId, isApproved: p.enabled },
    }),

  createInvite: (p: { inviteCode: string; maxUsage?: number }) =>
    FETCH_CLIENT<{ message: "Server invite created"; data: IInvite }>({
      url: "/api/server/create-invite",
      method: "PUT",
      body: { inviteCode: p.inviteCode, maxUsage: p.maxUsage },
      label: "SERVER_CREATE_INVITE",
    }),

  customEmoji: () =>
    FETCH_CLIENT<{ message: string; data: ICustomEmoji[] }>({
      url: "/api/server/custom-emoji",
      method: "GET",
      label: "SERVER_CUSTOM_EMOJI",
    }),

  customEmojiDelete: (p: { emojiCode: string }) =>
    FETCH_CLIENT<{ message: string; data: ICustomEmoji[] }>({
      url: "/api/server/custom-emoji/delete",
      method: "DELETE",
      body: { emojiCode: p.emojiCode },
      label: "SERVER_CUSTOM_EMOJI_DELETE",
    }),

  customEmojiUpload: (p: { emojiCode: string; emoji: File }) => {
    const formData = new FormData();
    formData.append("emoji", p.emoji);
    formData.append("emojiCode", p.emojiCode);
    return FETCH_CLIENT<{ message: string; data: ICustomEmoji[] }>({
      url: "/api/server/custom-emoji/upload",
      method: "PUT",
      body: formData,
      label: "SERVER_CUSTOM_EMOJI_UPLOAD",
    });
  },

  deleteInvite: (p: { inviteId: number }) =>
    FETCH_CLIENT<{ message: "Server invite created"; data: IInvite }>({
      url: "/api/server/delete-invite",
      method: "DELETE",
      body: { inviteId: p.inviteId },
      label: "SERVER_DELETE_INVITE",
    }),

  // 元実装は戻り値型注釈なし（推論 any）だったため、型を維持するため any のまま踏襲する
  getInvite: () =>
    FETCH_CLIENT<any>({
      url: "/api/server/get-invite",
      method: "GET",
      label: "SERVER_GET_INVITE",
    }),

  getLog: (p: { targetDate: Date; cursorLogId?: string }) =>
    FETCH_CLIENT<{
      message: string;
      data: IRequestLog[]; //最高50件
    }>({
      url: "/api/server/log",
      method: "GET",
      label: "SERVER_GET_LOG",
      query: {
        targetDate: p.targetDate
          ? new Date(p.targetDate).toLocaleDateString("sv-SE", {
              timeZone: "Asia/Tokyo",
            })
          : undefined,
        cursorLogId: p.cursorLogId,
      },
    }),

  getLogGroup: (p: {
    type?: "success" | "error";
    userId?: string;
    cursorLogDate?: Date;
    includeFirstLogs?: boolean;
  }) =>
    FETCH_CLIENT<{
      message: string;
      data: {
        group: IRequestLogCount[];
        firstDayLog: IRequestLog[] | undefined;
      };
    }>({
      url: "/api/server/log-group",
      method: "GET",
      label: "SERVER_GET_LOG_GROUP",
      query: {
        type: p.type,
        userId: p.userId,
        cursorLogDate: p.cursorLogDate
          ? new Date(p.cursorLogDate).toLocaleDateString("sv-SE", {
              timeZone: "Asia/Tokyo",
            })
          : undefined,
        includeFirstLogs: p.includeFirstLogs,
      },
    }),
};
