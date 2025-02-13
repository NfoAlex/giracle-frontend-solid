import GET_USER_GET_ONLINE from "~/api/USER/USER_GET_ONLINE";
import { storeAppStatus } from "~/stores/AppStatus";
import WSSendMessage from "./Message/SendMessage";
import WSUpdateChannel from "./Channel/UpdateChannel";
import WSRoleUpdated from "./Role/RoleUpdatede";
import WSRoleLinked from "./Role/RoleLinked";
import WSRoleUnlinked from "./Role/RoleUnlinked";
import WSChannelDeleted from "./Channel/ChannelDeleted";
import WSMessageDeleted from "./Message/MessageDelete";
import WSUpdateMessage from "~/WS/Message/UpdateMessage";
import {setStoreUserOnline} from "~/stores/Userinfo";
import WSUserConnected from "~/WS/User/UserConnected";
import WSUserDisconnected from "~/WS/User/UserDisconnected";
import WSInboxDelete from "~/WS/inbox/inboxDeleted";
import WSInboxAdded from "~/WS/inbox/inboxAdded";
import InitLoad from "~/utils/InitLoad";
import {storeMyUserinfo} from "~/stores/MyUserinfo";
import WSUserProfileUpdate from "~/WS/User/UserProfileUpdate";

//WSインスタンス
export let ws: WebSocket | undefined = undefined;

//WS接続がエラーで閉じられた場合のフラグ
let FLAGwsError = false;
//再接続フラグ
let FLAGwsReconnect = false;

export const initWS = async () => {
  //既に接続済みの場合は再接続しない
  if (ws === undefined || ws.readyState === WebSocket.CLOSED) {
    ws = new WebSocket("/ws");
  }

  console.log("WScontroller :: initWS : triggered");

  ws.onmessage = async (event) => {
    //console.log("WScontroller :: initWS(.onmessage) : triggered", await JSON.parse(event.data));
    try {
      // biome-ignore lint/suspicious/noExplicitAny: バックエンド次第
      const json: { signal: string, data: any } = JSON.parse(event.data);

      //トークンが無効な場合のフラグ設定
      if (json.signal === "ERROR" && json.data === "token not valid") {
        FLAGwsError = true;
      }

      switch(json.signal) {

        //メッセージの受け取り
        case "message::SendMessage":
          WSSendMessage(json.data);
          break;

        //メッセージ削除の通知受け取り
        case "message::MessageDeleted":
          WSMessageDeleted(json.data);
          break;

        //メッセージ更新の通知受け取り
        case "message::UpdateMessage":
          WSUpdateMessage(json.data);
          break;

        //インボックス項目の削除（既読）受け取り
        case "inbox::Deleted":
          WSInboxDelete(json.data);
          break;

        //新規インボックス項目の受け取り
        case "inbox::Added":
          WSInboxAdded(json.data);
          break;

        //チャンネル情報の受け取り
        case "channel::UpdateChannel":
          WSUpdateChannel(json.data);
          break;

        //チャンネル削除通知の受け取り
        case "channel::Deleted":
          WSChannelDeleted(json.data);
          break;

        //ロール情報の受け取り
        case "role::Updated":
          WSRoleUpdated(json.data);
          break;

        //ロールのリンク
        case "role::Linked":
          WSRoleLinked(json.data);
          break;

        //ロールの解除
        case "role::Unlinked":
          WSRoleUnlinked(json.data);
          break;

        //ロールの解削除、やること一緒なので同じ関数を使う
        case "role::Deleted":
          WSRoleUnlinked(json.data);
          break;

        //ユーザーのプロフィール更新受け取り
        case "user::ProfileUpdate":
          WSUserProfileUpdate(json.data);
          break;

        //オンラインユーザーの登録、削除
        case "user::Connected":
          WSUserConnected(json.data);
          break;
        case "user::Disconnected":
          WSUserDisconnected(json.data);
          break;
      }
    } catch(e) {
      console.error("WScontroller :: initWS(.onmessage) : error->", e, " \ndata->", event.data);
    }
  };

  ws.onopen = (event) => {
    console.log("WScontroller :: initWS(.onopen) : open->", event);
    //エラーフラグをリセット
    FLAGwsError = false;
    //接続状態を更新
    storeAppStatus.wsConnected = true;

    //再接続フラグが立っていた場合は初期処理を再実行
    if (FLAGwsReconnect) {
      InitLoad(storeMyUserinfo.id);
    }

    //オンラインユーザーを取得、格納
    GET_USER_GET_ONLINE()
      .then((r) => {
        console.log("WScontroller :: initWS(.onopen) : オンラインユーザー r->", r);
        setStoreUserOnline(r.data);
      })
      .catch((e) => {
        console.error("WScontroller :: initWS(.onopen) : オンラインユーザー error->", e);
      });
  };

  ws.onerror = (event) => {
    console.error("WScontroller :: initWS(.onerror) : error->", event);
  };

  ws.onclose = (event) => {
    console.log("INIT.ws :: initWS : close->", event);

    //接続状態を更新
    storeAppStatus.wsConnected = false;
    //エラーで閉じられた場合は再接続しない
    if (FLAGwsError) return;

    //再接続
    setTimeout(
      () => {
        FLAGwsReconnect = true;
        initWS();
      },
      Math.random() * 500 + 1000,
    );
  };

  // スマホ用のブラウザ可視状態が変更されたときのイベントリスナー
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
}
