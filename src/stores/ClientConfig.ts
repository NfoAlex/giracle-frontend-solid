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

/**
 * 設定を格納するだけ
 * @param newConfig 
 */
export const bindClientConfig = (newConfig: Partial<typeof storeClientConfig>) => {
  Object.keys(newConfig).forEach((key) => {
    if (key in storeClientConfig) {
      // @ts-ignore
      storeClientConfig[key] = {
        ...storeClientConfig[key],
        ...newConfig[key]
      };
    }
  });
}