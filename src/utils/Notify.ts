import {getterUserinfo} from "~/stores/Userinfo";

let notify: null | Notification = null;

/**
 * ブラウザの通知を出す
 */
export const notifyIt = (from: string, content: string) => {
  notify = new Notification(getterUserinfo(from).name, {
    body: content,
  });
}