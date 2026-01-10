import {asyncGetterUserinfo} from "~/stores/Userinfo.ts";
import FormatMessageContent from "~/utils/FormatMessageContent.ts";
import { ExternalNavigater } from "./ExternalNavigater.ts";

let notify: null | Notification = null;

/**
 * ブラウザの通知を出す
 */
export const notifyIt = async (from: string, content: string, option?: { channelId?: string }) => {
  const body = await FormatMessageContent(content);
  const fromUser = await asyncGetterUserinfo(from);

  notify = new Notification(fromUser.name, {
    body,
  });
  //クリックされたときのチャンネル移動処理
  if (option?.channelId) {
    notify.onclick = () => {
      window.focus();
      ExternalNavigater.navi({ to: "/app/channel/" + option.channelId });
      notify?.close();
    };
  }
}