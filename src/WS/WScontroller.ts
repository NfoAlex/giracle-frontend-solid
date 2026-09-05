import { produce } from "solid-js/store";
import { api } from "~/api/index.ts";
import { storeAppStatus } from "~/stores/AppStatus.store.ts";
import { setStoreHistory } from "~/stores/History.store.ts";
import { useStoreMessageFetchCache } from "~/stores/MessageFetchCache.store.ts";
import { storeMyUserinfo } from "~/stores/MyUserinfo.store.ts";
import { storeMessageReadTime } from "~/stores/Readtime.store.ts";
import { setStoreUserOnline } from "~/stores/Userinfo.store.ts";
import FetchHistory from "~/utils/FethchHistory.ts";
import InitLoad from "~/utils/InitLoad.ts";
import WSInboxAdded from "~/WS/inbox/inboxAdded.ts";
import WSInboxDelete from "~/WS/inbox/inboxDeleted.ts";
import WSMessageAddReaction from "~/WS/Message/MessageAddReaction.ts";
import WSMessageDeleteReaction from "~/WS/Message/MessageDeleteReaction.ts";
import WSReadTimeUpdate from "~/WS/Message/ReadTimeUpdate.ts";
import WSUpdateMessage from "~/WS/Message/UpdateMessage.ts";
import WSCustomEmojiDeleted from "~/WS/Server/CustomEmojiDeleted.ts";
import WSCustomEmojiUploaded from "~/WS/Server/CustomEmojiUploaded.ts";
import WSUserConnected from "~/WS/User/UserConnected.ts";
import WSUserDisconnected from "~/WS/User/UserDisconnected.ts";
import WSUserProfileUpdate from "~/WS/User/UserProfileUpdate.ts";
import WSChannelDeleted from "./Channel/ChannelDeleted.ts";
import WSChannelJoined from "./Channel/ChannelJoined.ts";
import WSChannelLeft from "./Channel/ChannelLeft.ts";
import WSUpdateChannel from "./Channel/UpdateChannel.ts";
import WSMessageDeleted from "./Message/MessageDelete.ts";
import WSSendMessage from "./Message/SendMessage.ts";
import WSRoleDeleted from "./Role/RoleDeleted.ts";
import WSRoleLinked from "./Role/RoleLinked.ts";
import WSRoleUnlinked from "./Role/RoleUnlinked.ts";
import WSRoleUpdated from "./Role/RoleUpdated.ts";

//WSインスタンス（外部参照あり、公開維持）
export let ws: WebSocket | undefined = undefined;

//WS接続がエラーで閉じられた場合のフラグ
let FLAGwsError = false;
//再接続フラグ（onopenで消費）
let FLAGwsReconnect = false;
//PING送信タイマー（再接続毎に蓄積しないようmodule変数化）
let pingInterval: ReturnType<typeof setInterval> | undefined;

// バックエンド仕様値
const WS_ENDPOINT = "/ws";
const WS_AUTH_ERROR_SIGNAL = "ERROR";
const WS_TOKEN_INVALID = "token not valid";
const PING_MSG = "ping";
const PING_INTERVAL_MS = 20_000;
const RECONNECT_BASE_DELAY_MS = 1_000;
const RECONNECT_JITTER_MS = 500;
const RECONNECT_FETCH_LENGTH = 10;

// チャンネルパス抽出（/:channelId/:messageId? 対応）
const CHANNEL_PATH_RE = /^\/app\/channel\/([A-Za-z0-9_-]+)(?:\/[^/]+)?$/;

// 受信signal（バックエンド仕様）
enum EWsSignal {
  CustomEmojiUploaded = "server::CustomEmojiUploaded",
  CustomEmojiDeleted = "server::CustomEmojiDeleted",
  SendMessage = "message::SendMessage",
  MessageDeleted = "message::MessageDeleted",
  UpdateMessage = "message::UpdateMessage",
  ReadTimeUpdated = "message::ReadTimeUpdated",
  AddReaction = "message::AddReaction",
  DeleteReaction = "message::DeleteReaction",
  InboxDeleted = "inbox::Deleted",
  InboxAdded = "inbox::Added",
  UpdateChannel = "channel::UpdateChannel",
  ChannelDeleted = "channel::Deleted",
  ChannelLeft = "channel::Left",
  ChannelJoin = "channel::Join",
  RoleUpdated = "role::Updated",
  RoleLinked = "role::Linked",
  RoleUnlinked = "role::Unlinked",
  RoleDeleted = "role::Deleted",
  ProfileUpdate = "user::ProfileUpdate",
  Connected = "user::Connected",
  Disconnected = "user::Disconnected",
}

// payload型はハンドラ毎に異なるため境界1箇所に集約
// biome-ignore lint/suspicious/noExplicitAny: バックエンド次第
type TWsHandler = (data: any) => void;

// signal追加時はここ1行で登録
const HANDLERS: Record<EWsSignal, TWsHandler> = {
  [EWsSignal.CustomEmojiUploaded]: WSCustomEmojiUploaded,
  [EWsSignal.CustomEmojiDeleted]: WSCustomEmojiDeleted,
  [EWsSignal.SendMessage]: WSSendMessage,
  [EWsSignal.MessageDeleted]: WSMessageDeleted,
  [EWsSignal.UpdateMessage]: WSUpdateMessage,
  [EWsSignal.ReadTimeUpdated]: WSReadTimeUpdate,
  [EWsSignal.AddReaction]: WSMessageAddReaction,
  [EWsSignal.DeleteReaction]: WSMessageDeleteReaction,
  [EWsSignal.InboxDeleted]: WSInboxDelete,
  [EWsSignal.InboxAdded]: WSInboxAdded,
  [EWsSignal.UpdateChannel]: WSUpdateChannel,
  [EWsSignal.ChannelDeleted]: WSChannelDeleted,
  [EWsSignal.ChannelLeft]: WSChannelLeft,
  [EWsSignal.ChannelJoin]: WSChannelJoined,
  [EWsSignal.RoleUpdated]: WSRoleUpdated,
  [EWsSignal.RoleLinked]: WSRoleLinked,
  [EWsSignal.RoleUnlinked]: WSRoleUnlinked,
  [EWsSignal.RoleDeleted]: WSRoleDeleted,
  [EWsSignal.ProfileUpdate]: WSUserProfileUpdate,
  [EWsSignal.Connected]: WSUserConnected,
  [EWsSignal.Disconnected]: WSUserDisconnected,
};

// PING多重生成防止のため既存タイマー解除して開始
const startPing = () => {
  stopPing();
  pingInterval = setInterval(() => {
    if (ws?.readyState !== WebSocket.OPEN) {
      stopPing();
      return;
    }
    ws.send(JSON.stringify({ signal: PING_MSG, data: PING_MSG }));
  }, PING_INTERVAL_MS);
};

const stopPing = () => {
  if (pingInterval === undefined) return;
  clearInterval(pingInterval);
  pingInterval = undefined;
};

// オンラインユーザー取得・格納
const fetchOnlineUsers = () => {
  api.user
    .getOnline()
    .then((r) => setStoreUserOnline(r.data))
    .catch((e) => console.error("WScontroller :: fetchOnlineUsers :", e));
};

// 再接続時の再同期（履歴初期化＋表示中チャンネル再取得）
const resyncAfterReconnect = () => {
  InitLoad(storeMyUserinfo.id);
  useStoreMessageFetchCache.clearCache();

  setStoreHistory(
    produce((prev) => {
      for (const channelId of Object.keys(prev)) {
        prev[channelId].history = [];
        prev[channelId].atTop = false;
        prev[channelId].atEnd = false;
      }
    }),
  );

  // /:channelId/:messageId? 両対応
  const channelId = document.location.pathname.match(CHANNEL_PATH_RE)?.[1];
  if (channelId === undefined) return;

  const readTime = storeMessageReadTime.find(
    (mrt) => mrt.channelId === channelId,
  )?.readTime;
  FetchHistory(
    channelId,
    { messageTimeFrom: readTime, fetchLength: RECONNECT_FETCH_LENGTH },
    "newer",
  );
};

export const initWS = (): void => {
  //既に接続済みの場合は再接続しない
  if (ws === undefined || ws.readyState === WebSocket.CLOSED) {
    ws = new WebSocket(WS_ENDPOINT);
  }

  ws.onmessage = (event) => {
    if (typeof event.data !== "string") return;

    try {
      const json: { signal: string; data: unknown } = JSON.parse(event.data);

      //トークンが無効な場合のフラグ設定
      if (
        json.signal === WS_AUTH_ERROR_SIGNAL &&
        json.data === WS_TOKEN_INVALID
      ) {
        FLAGwsError = true;
        //認証状態を無効化して AuthGuard による /auth へのリダイレクトを促す
        storeAppStatus.loggedIn = false;
        //旧socketを閉じないとinitWSがCLOSED判定できず再利用されてしまう
        ws?.close();

        return;
      }

      const handler = HANDLERS[json.signal as EWsSignal];
      if (handler === undefined) return;

      handler(json.data);
    } catch (e) {
      console.error(
        "WScontroller :: initWS(.onmessage) : error->",
        e,
        " \ndata->",
        event.data,
      );
    }
  };

  ws.onopen = () => {
    FLAGwsError = false;
    storeAppStatus.wsConnected = true;

    startPing();
    fetchOnlineUsers();

    //初回接続時は再同期不要
    if (!FLAGwsReconnect) return;
    //消費しないと再接続毎に再同期が走る
    FLAGwsReconnect = false;

    resyncAfterReconnect();
  };

  ws.onerror = (event) => {
    console.error("WScontroller :: initWS(.onerror) : error->", event);
  };

  ws.onclose = () => {
    storeAppStatus.wsConnected = false;
    //旧socket向けping蓄積防止
    stopPing();

    //エラーで閉じられた場合は再接続しない
    if (FLAGwsError) return;

    //再接続
    setTimeout(
      () => {
        FLAGwsReconnect = true;
        initWS();
      },
      Math.random() * RECONNECT_JITTER_MS + RECONNECT_BASE_DELAY_MS,
    );
  };
};

// スマホ用のブラウザ可視状態が変更されたときのイベントリスナー
//再接続毎に登録すると重複するためinitWS外で一度だけ登録
document.addEventListener("visibilitychange", () => {
  if (ws === undefined) return;
  if (document.visibilityState === "visible") {
    // ブラウザがアクティブになったときに WebSocket の接続状態を確認
    if (
      ws.readyState !== WebSocket.OPEN &&
      ws.readyState !== WebSocket.CONNECTING
    ) {
      initWS();
    }
  }
});
