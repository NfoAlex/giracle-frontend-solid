import type { IUser } from "~/types/User.ts";
import { FETCH_CLIENT } from "../FETCH_CLIENT.ts";

export const user = {
  ban: (p: { userId: string }) =>
    FETCH_CLIENT<{ message: `User banned`; data: string }>({
      url: "/api/user/ban",
      method: "POST",
      body: { userId: p.userId },
      label: "USER_BAN",
    }),

  changeBanner: (p: { banner: File }) => {
    const formData = new FormData();
    formData.append("banner", p.banner);
    return FETCH_CLIENT<{ message: "Icon changed" }>({
      url: "/api/user/change-banner",
      method: "POST",
      body: formData,
      credentials: "include",
      label: "USER_CHANGE_BANNER",
    });
  },

  changeIcon: (p: { icon: File }) => {
    const formData = new FormData();
    formData.append("icon", p.icon);
    return FETCH_CLIENT<{ message: "Icon changed" }>({
      url: "/api/user/change-icon",
      method: "POST",
      body: formData,
      credentials: "include",
      label: "USER_CHANGE_ICON",
    });
  },

  changePassword: (p: { currentPassword: string; newPassword: string }) =>
    FETCH_CLIENT<{ message: `Password changed` }>({
      url: "/api/user/change-password",
      method: "POST",
      body: { currentPassword: p.currentPassword, newPassword: p.newPassword },
      label: "CHANGE_PASSWORD",
    }),

  deleteSession: (p: { sessionId: number }) =>
    FETCH_CLIENT<{ message: "Session removed"; data: { sessionId: number } }>({
      url: "/api/user/session",
      method: "DELETE",
      body: { sessionId: p.sessionId },
      label: "DELETE_USER_SESSION",
    }),

  getOnline: () =>
    FETCH_CLIENT<{ message: "Fetched online user list"; data: string[] }>({
      url: "/api/user/get-online",
      method: "GET",
      label: "USER_GET_ONLINE",
    }),

  getSession: (p: { cursor?: number } = {}) =>
    FETCH_CLIENT<{
      message: "Fetched your sessions";
      data: {
        id: number;
        name: string;
        userId: string;
        thisIsYou: boolean;
        createdAt: Date;
      }[];
    }>({
      url: `/api/user/session?cursor=${p.cursor ?? 1}`,
      method: "GET",
      label: "USER_SESSION",
    }),

  info: (p: { userId: string }) =>
    FETCH_CLIENT<{ message: "User info"; data: IUser }>({
      url: `/api/user/info/${p.userId}`,
      method: "GET",
      label: "USER_INFO",
    }),

  list: (
    p: {
      length?: number;
      cursorUserId?: string,
      username?: string,
      joinedChannel?: string
    }
  ) =>
    FETCH_CLIENT<{
      message: "",
      data: IUser[]
    }>({
      url: `/api/user/list`,
      method: "GET",
      label: "USER_LIST",
      query: {
        length: p.length,
        cursorUserId: p.cursorUserId,
        username: p.username,
        joinedChannel: p.joinedChannel
      },
    }),

  login: (p: { username: string; password: string }) =>
    FETCH_CLIENT<{
      message: `Signed in as ${string}`;
      data: { userId: string };
    }>({
      url: "/api/user/sign-in",
      method: "POST",
      body: { username: p.username, password: p.password },
      label: "AUTH_LOGIN",
    }),

  changeSessionName: (p: { sessionId: number; name: string }) =>
    FETCH_CLIENT<{
      message: "Session name updated";
      data: {
        id: number;
        name: string;
        userId: string;
        thisIsYou: boolean;
        createdAt: Date;
      };
    }>({
      url: "/api/user/change-session-name",
      method: "POST",
      body: { sessionId: p.sessionId, name: p.name },
      label: "USER_SESSION",
    }),

  profileUpdate: (p: { name?: string; selfIntroduction?: string }) =>
    FETCH_CLIENT<{
      message: `Profile updated`;
      data: { name: string | null; id: string; selfIntroduction: string };
    }>({
      url: "/api/user/profile-update",
      method: "POST",
      body: { name: p.name, selfIntroduction: p.selfIntroduction },
      label: "PROFILE_UPDATE",
    }),

  register: (p: { username: string; password: string; inviteCode?: string }) =>
    FETCH_CLIENT<{ message: "User created" }>({
      url: "/api/user/sign-up",
      method: "PUT",
      body: {
        username: p.username,
        password: p.password,
        inviteCode: p.inviteCode,
      },
      label: "AUTH_REGISTER",
    }),

  search: (p: { username: string; channelId: string; cursor?: number }) =>
    FETCH_CLIENT<{ message: "User search result"; data: IUser[] }>({
      url: `/api/user/search?username=${p.username}&joinedChannel=${p.channelId}&cursor=${p.cursor ?? 0}`,
      method: "GET",
      label: "USER_SEARCH",
    }),

  unban: (p: { userId: string }) =>
    FETCH_CLIENT<{ message: `User unbanned`; data: string }>({
      url: "/api/user/unban",
      method: "POST",
      body: { userId: p.userId },
      label: "USER_UNBAN",
    }),

  verifyToken: () =>
    FETCH_CLIENT<{ message: `Token is valid`; data: { userId: string } }>({
      url: "/api/user/verify-token",
      method: "GET",
      label: "GET_USER_VERIFY_TOKEN",
    }),
};
