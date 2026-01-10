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
  const configRootKeys = ["chat", "notification", "display"] as const;
  for (const rootKey of configRootKeys) {
    if (newConfig[rootKey]) {
      Object.assign(storeClientConfig[rootKey], newConfig[rootKey]);
    }
  }
}