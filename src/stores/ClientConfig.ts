import { createMutable } from "solid-js/store";

export const storeClientConfig = createMutable({
  chat: {
    sendWithCtrlKey: false
  },
  notification: {
    notifyInbox: true,
    notifyAll: false
  },
  display: {
    messageGapLevel: 0, //0-6
  },
});
