import { createStore } from "solid-js/store";
import type { IUser } from "~/types/User";
import { getterRoleInfo } from "./RoleInfo";

export const [storeMyUserinfo, setStoreMyUserinfo] = createStore<IUser>({
  id: "",
  name: "ユーザー",
  selfIntroduction: "",
  ChannelJoin: [],
  RoleLink: [],
});

/**
 * 該当の権限を持っているか確認する
 * @param roleTerm 確認する権限名
 */
export const getRolePower = async (
  roleTerm: "manageRole" | "manageChannel" | "manageRole" | "manageUser"
): Promise<boolean> => {
  for (const index in storeMyUserinfo.RoleLink) {
    const role = await getterRoleInfo(storeMyUserinfo.RoleLink[index].roleId);

    if (role[roleTerm]) {
      return true;
    }
  }

  return false;
}
