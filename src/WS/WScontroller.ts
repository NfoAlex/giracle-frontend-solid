import GET_USER_GET_ONLINE from "~/api/USER/USER_GET_ONLINE";
import { storeAppStatus } from "~/stores/AppStatus";
import WSSendMessage from "./Message/SendMessage";

//WSインスタンス
export let ws: WebSocket | undefined = undefined;

//WS接続がエラーで閉じられた場合のフラグ
let FLAGwsError = false;

export const initWS = async () => {
  //既に接続済みの場合は再接続しない
  if (ws === undefined) {
    ws = new WebSocket("/ws");
  }

  console.log("WScontroller :: initWS : triggered");

  ws.onmessage = async (event) => {
    console.log("WScontroller :: initWS(.onmessage) : triggered", await JSON.parse(event.data));
    try {
      // biome-ignore lint/suspicious/noExplicitAny: バックエンド次第
      const json: { signal: string, data: any } = JSON.parse(event.data);
      console.log("WScontroller :: initWS : event->", )

      //トークンが無効な場合のフラグ設定
      if (json.signal === "ERROR" && json.data === "token not valid") {
        FLAGwsError = true;
      }

      switch(json.signal) {

        //メッセージの受け取り
        case "message::SendMessage":
          WSSendMessage(json.data);
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

    //オンラインユーザー情報を同期する
    // TODO

    //オンラインユーザーを取得
    GET_USER_GET_ONLINE()
      .then((r) => {
        console.log("r->", r);
      })
      .catch((e) => {
        console.error("WScontroller :: initWS(.onopen) : error->", e);
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
