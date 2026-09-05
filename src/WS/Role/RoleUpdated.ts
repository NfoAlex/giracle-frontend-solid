import { setStoreRoleInfo } from "~/stores/RoleInfo.store.ts";
import type { IRole } from "~/types/Role.ts";

export default function WSRoleUpdated(dat: IRole) {
  setStoreRoleInfo(dat.id, dat);
}
