import { produce } from "solid-js/store";
import { setStoreMyUserinfo, storeMyUserinfo } from "~/stores/MyUserinfo";
import { setStoreUserinfo } from "~/stores/Userinfo";

export default function WSRoleUnlinked(dat: { roleId: string, userId: string }) {
  //console.log("WSRoleUnlinked :: triggered dat->", dat);

  //リンクされていて自分のユーザーId宛てなら解除
  if (storeMyUserinfo.id === dat.userId) {
    setStoreMyUserinfo((prev) => {
      prev.RoleLink.filter((role) => role.roleId !== dat.roleId);
      return prev;
    });
  }

  //ユーザー情報Storeを更新
  setStoreUserinfo(produce((prev) => {
    //もしユーザー情報Storeにこの人が無いなら停止
    if (prev[dat.userId] === undefined) return prev;
    //ユーザー情報をコピー
    const _user = { ...prev[dat.userId] };
    //ロールが無ければ停止
    if (!(_user.RoleLink.some((rl) => rl.roleId === dat.roleId))) return prev;
    //解除
    _user.RoleLink = _user.RoleLink.filter((role) => role.roleId !== dat.roleId);
    //Store更新
    prev[dat.userId] = _user;
    return prev;
  }));

  //console.log("WSRoleUnlinked :: storeUserinfo[dat.userId] ->", storeUserinfo[dat.userId]);
}
