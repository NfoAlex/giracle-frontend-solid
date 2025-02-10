import {getterUserinfo} from "~/stores/Userinfo";
import FormatMessageContent from "~/utils/FormatMessageContent";

let notify: null | Notification = null;

/**
 * ブラウザの通知を出す
 */
export const notifyIt = async (from: string, content: string) => {
  notify = new Notification(getterUserinfo(from).name, {
    body: await FormatMessageContent(content),
  });
}