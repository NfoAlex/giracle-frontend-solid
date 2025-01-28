import GET_MESSAGE_GET_NEW from "~/api/MESSAGE/MESSAGE_GET_NEW";
import GET_MESSAGE_GET_READTIME from "~/api/MESSAGE/MESSAGE_GET_READTIME";
import { GET_ROLE_LIST } from "~/api/ROLE/ROLE_LIST";
import GET_USER_INFO from "~/api/USER/USER_INFO";
import { storeAppStatus } from "~/stores/AppStatus";
import { setStoreHasNewMessage } from "~/stores/HasNewMessage";
import { setStoreMyUserinfo } from "~/stores/MyUserinfo";
import { setStoreMessageReadTime, setStoreMessageReadTimeBefore } from "~/stores/Readtime";
import { setStoreRoleInfo } from "~/stores/RoleInfo";
import type { IRole } from "~/types/Role";
import { initWS } from "~/WS/WScontroller";

export default function InitLoad(_userId: string) {
  //自分のユーザー情報を取得してStoreに格納
  GET_USER_INFO(_userId).then((r) => {
    //console.log("Login :: loginIt : 自分の情報r->", r);
    setStoreMyUserinfo(r.data);
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
    console.log("InitLoad :: GET_MESSAGE_GET_READTIME : 自分の既読時間r->", r);
    setStoreMessageReadTime(r.data);
    setStoreMessageReadTimeBefore(r.data);
  });
  //新着メッセージの有無を取得、格納
  GET_MESSAGE_GET_NEW().then((r) => {
    console.log("InitLoad :: GET_MESSAGE_GET_NEW : 新着メッセージr->", r);
    setStoreHasNewMessage(r.data);
  });

  // オンラインユーザーの同期は👇のinitWS関数で行う

  //WS接続の初期化
  initWS();

  //ログイン状態をtrueに
  storeAppStatus.loggedIn = true;
}
