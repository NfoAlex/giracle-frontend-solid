import { asyncGetterUserinfo } from "~/stores/Userinfo.ts";
import FormatMessageContent from "~/utils/FormatMessageContent.ts";
import { ExternalNavigater } from "./ExternalNavigater.ts";

/**
 * ブラウザの通知を出す
 */
export const notifyIt = async (
  from: string,
  content: string,
  option?: { channelId?: string },
) => {
  // ブラウザ通知が非対応または未許可の場合は処理をスキップ
  if (
    typeof Notification === "undefined" ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  const body = await FormatMessageContent(content);
  const fromUser = await asyncGetterUserinfo(from);

  // モジュール変数の競合・誤動作を防ぐためローカル変数化
  const notificationInstance = new Notification(fromUser.name, {
    body,
  });

  //クリックされたときのチャンネル移動処理
  if (option?.channelId) {
    notificationInstance.onclick = () => {
      window.focus();
      ExternalNavigater.navi({ to: `/app/channel/${option.channelId}` });
      notificationInstance.close();
    };
  }
};
