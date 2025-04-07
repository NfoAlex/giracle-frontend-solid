import { createMutable } from "solid-js/store";

export const storeClientConfig = createMutable({
  notification: {
    notifyInbox: true,
    notifyAll: false
  },
  display: {
    messageGapLevel: 0, //0-6
  },
});
