import { createMutable } from "solid-js/store";

export const storeAppStatus = createMutable({
  wsConnected: false,
  loggedIn: false,
  hasServerinfo: false,
});
