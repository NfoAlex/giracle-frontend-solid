import { produce } from "solid-js/store";
import {
  setStoreMyUserinfo,
  storeMyUserinfo,
} from "~/stores/MyUserinfo.store.ts";
import { setStoreUserinfo } from "~/stores/Userinfo.store.ts";

export default function WSRoleLinked(dat: { roleId: string; userId: string }) {
  //自分への付与なら自Store更新（setter内判定で再送・連続受信の二重登録防止）
  if (storeMyUserinfo.id === dat.userId) {
    setStoreMyUserinfo("RoleLink", (prev) =>
      prev.some((rl) => rl.roleId === dat.roleId)
        ? prev
        : [...prev, { roleId: dat.roleId }],
    );
  }

  //ユーザー情報Store更新
  setStoreUserinfo(
    produce((prev) => {
      const user = prev[dat.userId];
      //未取得ユーザーへの付与は初期取得時に反映されるため何もしない
      if (user === undefined) return;
      //再送時の二重登録防止
      if (user.RoleLink.some((rl) => rl.roleId === dat.roleId)) return;
      user.RoleLink.push({ roleId: dat.roleId });
    }),
  );
}
