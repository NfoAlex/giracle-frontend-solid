import { api } from "~/api/index.ts";
import { storeAppStatus } from "~/stores/AppStatus.ts";
import { setStoreHasNewMessage } from "~/stores/HasNewMessage.ts";
import { setStoreMyUserinfo } from "~/stores/MyUserinfo.ts";
import { setStoreMessageReadTime } from "~/stores/Readtime.ts";
import { setStoreRoleInfo } from "~/stores/RoleInfo.ts";
import type { IRole } from "~/types/Role.ts";
import { initWS } from "~/WS/WScontroller.ts";
import { setStoreInbox } from "~/stores/Inbox.ts";
import { bindCustomEmoji } from "~/stores/CustomEmoji.ts";
import { bindClientConfig } from "~/stores/ClientConfig.ts";
import { bindServerinfo } from "~/stores/Serverinfo.ts";
import {
  setStoreMutedChannels,
  setStoreNotificationConfig,
} from "~/stores/Notification.ts";

export default function InitLoad(_userId: string, initWsToo = false) {
  //クライアント設定を呼び出して適用
  const localConfig = localStorage.getItem("clientConfig");
  if (localConfig) {
    bindClientConfig(JSON.parse(localConfig));
  }

  //自分のユーザー情報を取得してStoreに格納
  api.user.info({ userId: _userId }).then((r) => {
    //console.log("Login :: loginIt : 自分の情報r->", r);
    setStoreMyUserinfo(r.data);
  });
  //サーバー情報を取得してStoreに格納
  api.server.config().then((r) => {
    //console.log("InitLoad :: GET_SERVER_CONFIG : サーバー情報r->", r);
    const { isFirstUser, ..._serverConfig } = r.data;
    //サーバーの設定をStoreに格納
    bindServerinfo(_serverConfig);
  });
  //ロールリストを取得してStoreに格納
  api.role.list().then((r) => {
    //console.log("Login :: loginIt : ロールリストr->", r);
    setStoreRoleInfo(() => {
      const _value: { [key: string]: IRole } = {};
      for (const role of r.data) {
        _value[role.id] = role;
      }
      return _value;
    });
  });
  //メッセージ既読時間を取得、格納
  api.message.getReadTime().then((r) => {
    //console.log("InitLoad :: GET_MESSAGE_GET_READTIME : 自分の既読時間r->", r);
    setStoreMessageReadTime(r.data.map(r => { return { ...r, readTimeBefore: r.readTime }; }));
  });
  //新着メッセージの有無を取得、格納
  api.message.getNew().then((r) => {
    //console.log("InitLoad :: GET_MESSAGE_GET_NEW : 新着メッセージr->", r);
    setStoreHasNewMessage(r.data);
  });
  //インボックス取得
  api.message.inbox().then((r) => {
    //console.log("InitLoad :: GET_MESSAGE_INBOX : インボックスr->", r);
    setStoreInbox(r.data);
  }).catch((e) => console.error("InitLoad :: GET_MESSAGE_INBOX : インボックス取得エラー", e));
  //カスタム絵文字取得
  api.server.customEmoji().then((r) => {
    //console.log("InitLoad :: GET_SERVER_CUSTOM_EMOJI : カスタム絵文字取得r->", r);
    bindCustomEmoji(r.data);
  }).catch((e) => console.error("InitLoad :: GET_SERVER_CUSTOM_EMOJI : カスタム絵文字取得エラー", e));
  //通知設定取得
  api.notification.configGet().then((r) => {
    setStoreNotificationConfig(r.data);
  }).catch((e) => console.error("InitLoad :: GET_NOTIFICATION_CONFIG エラー", e));
  //ミュートチャンネル取得
  api.notification.mutedChannels().then((r) => {
    setStoreMutedChannels({ ids: r.data.map((m) => m.channelId) });
  }).catch((e) => console.error("InitLoad :: GET_NOTIFICATION_MUTED_CHANNELS エラー", e));

  // オンラインユーザーの同期は👇のinitWS関数で行う

  //WS接続の初期化
  if (initWsToo) initWS();

  //ログイン状態をtrueに
  storeAppStatus.loggedIn = true;
}
