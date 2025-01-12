import { createMutable, createStore } from "solid-js/store";

export const storeAppStatus = createMutable({
  wsConnected: false,
  loggedIn: false,
  hasServerinfo: false,
});
