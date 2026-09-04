import { api } from "~/api/index.ts";
import { storeAppStatus } from "~/stores/AppStatus.store.ts";
import { useStoreClientConfig } from "~/stores/ClientConfig.store.ts";
import { useStoreCustomEmoji } from "~/stores/CustomEmoji.store.ts";
import { setStoreHasNewMessage } from "~/stores/HasNewMessage.store.ts";
import { setStoreInbox } from "~/stores/Inbox.store.ts";
import { setStoreMyUserinfo } from "~/stores/MyUserinfo.store.ts";
import {
  setStoreMutedChannels,
  setStoreNotificationConfig,
} from "~/stores/Notification.store.ts";
import { setStoreMessageReadTime } from "~/stores/Readtime.store.ts";
import { setStoreRoleInfo } from "~/stores/RoleInfo.store.ts";
import { useStoreServerinfo } from "~/stores/Serverinfo.store.ts";
import type { IRole } from "~/types/Role.ts";
import { initWS } from "~/WS/WScontroller.ts";

export default function InitLoad(_userId: string, initWsToo = false) {
  // 不正な JSON 文字列によるアプリ起動クラッシュを回避
  const localConfig = localStorage.getItem("clientConfig");
  if (localConfig) {
    try {
      useStoreClientConfig.bindClientConfig(JSON.parse(localConfig));
    } catch (error) {
      console.error("InitLoad :: clientConfig parse error", error);
    }
  }

  //自分のユーザー情報を取得してStoreに格納
  api.user
    .info({ userId: _userId })
    .then((r) => setStoreMyUserinfo(r.data))
    .catch((e) => console.error("InitLoad :: user.info error", e));

  //サーバー情報を取得してStoreに格納
  api.server
    .config()
    .then((r) => {
      const { isFirstUser, ..._serverConfig } = r.data;
      useStoreServerinfo.bindServerinfo(_serverConfig);
    })
    .catch((e) => console.error("InitLoad :: server.config error", e));

  //ロールリストを取得してStoreに格納
  api.role
    .list()
    .then((r) => {
      setStoreRoleInfo(() => {
        const _value: { [key: string]: IRole } = {};
        for (const role of r.data) {
          _value[role.id] = role;
        }
        return _value;
      });
    })
    .catch((e) => console.error("InitLoad :: role.list error", e));

  //メッセージ既読時間を取得、格納
  api.message
    .getReadTime()
    .then((r) => {
      setStoreMessageReadTime(
        r.data.map((r) => ({ ...r, readTimeBefore: r.readTime })),
      );
    })
    .catch((e) => console.error("InitLoad :: message.getReadTime error", e));

  //新着メッセージの有無を取得、格納
  api.message
    .getNew()
    .then((r) => setStoreHasNewMessage(r.data))
    .catch((e) => console.error("InitLoad :: message.getNew error", e));
  //インボックス取得
  api.message
    .inbox()
    .then((r) => {
      //console.log("InitLoad :: GET_MESSAGE_INBOX : インボックスr->", r);
      setStoreInbox(r.data);
    })
    .catch((e) =>
      console.error(
        "InitLoad :: GET_MESSAGE_INBOX : インボックス取得エラー",
        e,
      ),
    );
  //カスタム絵文字取得
  api.server
    .customEmoji()
    .then((r) => {
      //console.log("InitLoad :: GET_SERVER_CUSTOM_EMOJI : カスタム絵文字取得r->", r);
      useStoreCustomEmoji.bindCustomEmoji(r.data);
    })
    .catch((e) =>
      console.error(
        "InitLoad :: GET_SERVER_CUSTOM_EMOJI : カスタム絵文字取得エラー",
        e,
      ),
    );
  //通知設定取得
  api.notification
    .configGet()
    .then((r) => {
      setStoreNotificationConfig(r.data);
    })
    .catch((e) =>
      console.error("InitLoad :: GET_NOTIFICATION_CONFIG エラー", e),
    );
  //ミュートチャンネル取得
  api.notification
    .mutedChannels()
    .then((r) => {
      setStoreMutedChannels({ ids: r.data.map((m) => m.channelId) });
    })
    .catch((e) =>
      console.error("InitLoad :: GET_NOTIFICATION_MUTED_CHANNELS エラー", e),
    );

  // オンラインユーザーの同期は👇のinitWS関数で行う

  //WS接続の初期化
  if (initWsToo) initWS();

  //ログイン状態をtrueに
  storeAppStatus.loggedIn = true;
}
