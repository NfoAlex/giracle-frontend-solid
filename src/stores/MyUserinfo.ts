import { createStore } from "solid-js/store";
import type { IUser } from "~/types/User";

export const [storeMyUserinfo, setStoreMyUserinfo] = createStore<IUser>({
  id: "",
  name: "ユーザー",
  selfIntroduction: "",
  ChannelJoin: [],
  RoleLink: [],
});
