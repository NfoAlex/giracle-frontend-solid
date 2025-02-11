import { produce } from "solid-js/store";
import { setStoreMyUserinfo, storeMyUserinfo } from "~/stores/MyUserinfo";
import { setStoreUserinfo } from "~/stores/Userinfo";

export default function WSRoleLinked(dat: { roleId: string, userId: string }) {
  //console.log("WSRoleLinked :: triggered dat->", dat);

  //自分に対する付与なら自分のStoreを更新
  if (storeMyUserinfo.id === dat.userId) {
    setStoreMyUserinfo((prev) => {
      prev.RoleLink.push({ roleId: dat.roleId });
      return prev;
    });
  }

  //ユーザー情報Storeを更新
  setStoreUserinfo(produce((prev) => {
    //もしユーザー情報Storeにこの人が無いなら停止
    if (prev[dat.userId] === undefined) return prev;
    //ユーザー情報をコピー
    const _user = { ...prev[dat.userId] };
    //すでにロールがリンクされているなら停止
    if (_user.RoleLink.some((rl) => rl.roleId === dat.roleId)) return prev;
    //リンク
    _user.RoleLink.push({ roleId: dat.roleId });
    //Store更新
    prev[dat.userId] = _user;

    //console.log("WSRoleLinked :: setStoreUserinfo :: prev[dat.userId] ->", prev[dat.userId]);
    return prev;
  }));
}
