import { createStore } from "solid-js/store";
import type { IServer } from "~/types/Server.ts";

export const [storeServerinfo, setStoreServerinfo] = createStore<IServer>({
  name: "",
  introduction: "",
  RegisterAvailable: false,
  RegisterInviteOnly: false,
  RegisterAnnounceChannelId: "",
  MessageMaxLength: 1,
  MessageMaxFileSize: 1,
  defaultJoinChannel: [],
  BotEnabled: false,
  BotAutoApprove: false,
});

export namespace useStoreServerinfo {
  export const bindServerinfo = (value: Partial<IServer>) => {
    setStoreServerinfo({ ...storeServerinfo, ...value });
  };
}
