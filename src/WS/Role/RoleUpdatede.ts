import type { IRole } from "~/types/Role";
import {setStoreRoleInfo} from "~/stores/RoleInfo";

export default function WSRoleUpdated(dat: IRole) {
  //console.log("WSRoleUpdated :: triggered dat->", dat);

  setStoreRoleInfo((prev) => {
    const _role = {...prev};
    _role[dat.id] = dat;
    return _role;
  });
}
