import { produce } from "solid-js/store";
import {
  setStoreMyUserinfo,
  storeMyUserinfo,
} from "~/stores/MyUserinfo.store.ts";
import { setStoreUserinfo } from "~/stores/Userinfo.store.ts";

export default function WSRoleUnlinked(dat: {
  roleId: string;
  userId: string;
}) {
  //自分宛てなら自Store解除
  if (storeMyUserinfo.id === dat.userId) {
    setStoreMyUserinfo("RoleLink", (prev) =>
      prev.filter((role) => role.roleId !== dat.roleId),
    );
  }

  //ユーザー情報Store更新
  setStoreUserinfo(
    produce((prev) => {
      const user = prev[dat.userId];
      //未取得ユーザーへの解除は初期取得時に反映されるため何もしない
      if (user === undefined) return;
      //未リンク時の無駄更新防止
      if (!user.RoleLink.some((rl) => rl.roleId === dat.roleId)) return;
      user.RoleLink = user.RoleLink.filter(
        (role) => role.roleId !== dat.roleId,
      );
    }),
  );
}
