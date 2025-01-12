import GET_MESSAGE_GET_READTIME from "~/api/MESSAGE/MESSAGE_GET_READTIME";
import GET_USER_INFO from "~/api/USER/USER_INFO";
import { storeAppStatus } from "~/stores/AppStatus";
import { setStoreMyUserinfo } from "~/stores/MyUserinfo";
import { setStoreMessageReadTime } from "~/stores/Readtime";
import { initWS } from "~/WS/WScontroller";

export default function InitLoad(_userId: string) {
  //自分のユーザー情報を取得してStoreに格納
  GET_USER_INFO(_userId).then((r) => {
    console.log("Login :: loginIt : 自分の情報r->", r);
    setStoreMyUserinfo(r.data);
  });
  //メッセージ既読時間を取得、格納
  GET_MESSAGE_GET_READTIME().then((r) => {
    setStoreMessageReadTime(r.data);
  });

  //WS接続の初期化
  initWS();

  //ログイン状態をtrueに
  storeAppStatus.loggedIn = true;
}
