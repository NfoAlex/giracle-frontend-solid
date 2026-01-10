import { createStore } from "solid-js/store";
import type { IUser } from "~/types/User.ts";
import { getterRoleInfo } from "./RoleInfo.ts";

export const [storeMyUserinfo, setStoreMyUserinfo] = createStore<IUser>({
  id: "",
  name: "ユーザー",
  selfIntroduction: "",
  isBanned: false,
  ChannelJoin: [],
  RoleLink: [],
});

/**
 * 該当の権限を持っているか確認する
 * @param roleTerm 確認する権限名
 */
export const getRolePower = (
  roleTerm: "manageRole" | "manageChannel" | "manageUser" | "manageServer" | "manageEmoji"
): boolean => {
  for (const index in storeMyUserinfo.RoleLink) {
    //HOST権限を持っている場合はtrueを返す
    if (storeMyUserinfo.RoleLink[index].roleId === "HOST") {
      return true;
    }
    //ロール情報を取得
    const role = getterRoleInfo(storeMyUserinfo.RoleLink[index].roleId);
    //該当の権限を持っている場合はtrueを返す
    if (role[roleTerm]) {
      return true;
    }
  }

  return false;
}
