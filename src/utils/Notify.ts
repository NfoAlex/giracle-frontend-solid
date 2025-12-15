import {asyncGetterUserinfo} from "~/stores/Userinfo.ts";
import FormatMessageContent from "~/utils/FormatMessageContent.ts";

let notify: null | Notification = null;

/**
 * ブラウザの通知を出す
 */
export const notifyIt = async (from: string, content: string) => {
  const body = await FormatMessageContent(content);
  const fromUser = await asyncGetterUserinfo(from);
  notify = new Notification(fromUser.name, {
    body,
  });
}