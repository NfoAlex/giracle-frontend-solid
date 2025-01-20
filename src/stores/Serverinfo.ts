import { createMutable, createStore } from "solid-js/store";
import type { IServer } from "~/types/Server";

export const [storeServerinfo, setStoreServerinfo] = createStore<IServer>({
  name: "",
  introduction: "",
  RegisterAvailable: false,
  RegisterInviteOnly: false,
  RegisterAnnounceChannelId: "",
  MessageMaxLength: 1,
  defaultJoinChannel: []
});

export const bindServerinfo = (value: IServer) => {
  setStoreServerinfo(value);
};
