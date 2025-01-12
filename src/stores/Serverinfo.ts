import { createMutable, createStore } from "solid-js/store";
import type { IServer } from "~/types/Server";

export const [storeServerinfo, setStoreServerinfo] = createStore({
  name: "",
  introduction: "",
  RegisterAvailable: false,
  RegisterInviteOnly: false,
  RegisterAnnounceChannelId: "",
  MessageMaxLength: 1,
});

export const bindServerinfo = (value: IServer) => {
  setStoreServerinfo(value);
};
