import { storeMyUserinfo } from "~/stores/MyUserinfo";
import type { IRole } from "~/types/Role";

export default function WSRoleUpdated(dat: IRole) {
  console.log("WSRoleUpdated :: triggered dat->", dat);

  //todo :: 使える権限の計算処理
}
