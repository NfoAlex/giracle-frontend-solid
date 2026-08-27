import type { IChannel } from "~/types/Channel.ts";
import type { ICustomEmoji } from "~/types/Message.ts";
import type { IInvite, IServer } from "~/types/Server.ts";
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

  getLogs: (p: {
    type?: "success" | "error";
    userId?: string;
    cursorLogDate?: Date;
  }) =>
    // バックエンドは { message, data: LogEntry[] } を返す想定。
    // （旧実装は裸配列を想定していたが、他エンドポイントと同様のラップ形式に統一）
    // 裸配列が返る場合は呼び出し側（manage-logs）の Array.isArray 分岐で吸収する。
    FETCH_CLIENT<{
      message: string;
      data: {
        date: string;
        successCount: number;
        errorCount: number;
        otherCount: number;
      }[];
    }>({
      url: "/api/server/log",
      method: "GET",
      label: "SERVER_GET_LOGS",
      query: {
        type: p.type,
        userId: p.userId,
        cursorLogDate: p.cursorLogDate
          ? new Date(p.cursorLogDate).toISOString()
          : undefined,
      },
    }),
};
