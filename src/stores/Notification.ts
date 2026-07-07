import { createStore } from "solid-js/store";
import type { INotificationConfig } from "~/api/domains/notification.ts";

export const [storeNotificationConfig, setStoreNotificationConfig] =
  createStore<INotificationConfig>({
    userId: "",
    enabled: true,
    mode: "mention",
  });

export const [storeMutedChannels, setStoreMutedChannels] = createStore<{
  ids: string[];
}>({ ids: [] });

export const isChannelMuted = (channelId: string): boolean => {
  return storeMutedChannels.ids.includes(channelId);
};
