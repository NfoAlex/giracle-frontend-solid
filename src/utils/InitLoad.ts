import GET_MESSAGE_GET_NEW from "~/api/MESSAGE/MESSAGE_GET_NEW.ts";
import GET_MESSAGE_GET_READTIME from "~/api/MESSAGE/MESSAGE_GET_READTIME.ts";
import { GET_ROLE_LIST } from "~/api/ROLE/ROLE_LIST.ts";
import GET_USER_INFO from "~/api/USER/USER_INFO.ts";
import { storeAppStatus } from "~/stores/AppStatus.ts";
import { setStoreHasNewMessage } from "~/stores/HasNewMessage.ts";
import { setStoreMyUserinfo } from "~/stores/MyUserinfo.ts";
import { setStoreMessageReadTime, setStoreMessageReadTimeBefore } from "~/stores/Readtime.ts";
import { setStoreRoleInfo } from "~/stores/RoleInfo.ts";
import type { IRole } from "~/types/Role.ts";
import { initWS } from "~/WS/WScontroller.ts";
import GET_MESSAGE_INBOX from "~/api/MESSAGE/MESSAGE_INBOX.ts";
import {setStoreInbox} from "~/stores/Inbox.ts";
import GET_SERVER_CUSTOM_EMOJI from "~/api/SERVER/SERVER_CUSTOM_EMOJI.ts";
import {bindCustomEmoji} from "~/stores/CustomEmoji.ts";
import { bindClientConfig } from "~/stores/ClientConfig.ts";
import GET_SERVER_CONFIG from "~/api/SERVER/SERVER_CONFIG.ts";
import { bindServerinfo } from "~/stores/Serverinfo.ts";

export default function InitLoad(_userId: string, initWsToo = false) {
  //クライアント設定を呼び出して適用
  const localConfig = localStorage.getItem("clientConfig");
  if (localConfig) {
    bindClientConfig(JSON.parse(localConfig));
  }

  //自分のユーザー情報を取得してStoreに格納
  GET_USER_INFO(_userId).then((r) => {
    //console.log("Login :: loginIt : 自分の情報r->", r);
    setStoreMyUserinfo(r.data);
  });
  //サーバー情報を取得してStoreに格納
  GET_SERVER_CONFIG().then((r) => {
    //console.log("InitLoad :: GET_SERVER_CONFIG : サーバー情報r->", r);
    const { isFirstUser, ..._serverConfig } = r.data;
    //サーバーの設定をStoreに格納
    bindServerinfo(_serverConfig);
  });
  //ロールリストを取得してStoreに格納
  GET_ROLE_LIST().then((r) => {
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
  GET_MESSAGE_GET_READTIME().then((r) => {
    //console.log("InitLoad :: GET_MESSAGE_GET_READTIME : 自分の既読時間r->", r);
    setStoreMessageReadTime([...r.data]);
    setStoreMessageReadTimeBefore([...r.data]);
  });
  //新着メッセージの有無を取得、格納
  GET_MESSAGE_GET_NEW().then((r) => {
    //console.log("InitLoad :: GET_MESSAGE_GET_NEW : 新着メッセージr->", r);
    setStoreHasNewMessage(r.data);
  });
  //インボックス取得
  GET_MESSAGE_INBOX().then((r) => {
    //console.log("InitLoad :: GET_MESSAGE_INBOX : インボックスr->", r);
    setStoreInbox(r.data);
  }).catch((e) => console.error("InitLoad :: GET_MESSAGE_INBOX : インボックス取得エラー", e));
  //カスタム絵文字取得
  GET_SERVER_CUSTOM_EMOJI().then((r) => {
    //console.log("InitLoad :: GET_SERVER_CUSTOM_EMOJI : カスタム絵文字取得r->", r);
    bindCustomEmoji(r.data);
  }).catch((e) => console.error("InitLoad :: GET_SERVER_CUSTOM_EMOJI : カスタム絵文字取得エラー", e));

  // オンラインユーザーの同期は👇のinitWS関数で行う

  //WS接続の初期化
  if (initWsToo) initWS();

  //ログイン状態をtrueに
  storeAppStatus.loggedIn = true;
}
