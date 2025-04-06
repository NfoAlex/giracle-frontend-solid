import { createMutable } from "solid-js/store";

export const storeClientConfig = createMutable({
  notification: {
    enabled: true,
    notifyAll: false
  },
  display: {
    messageGapLevel: 0,
  },
});
