import { produce } from "solid-js/store";
import { setStoreMyUserinfo } from "~/stores/MyUserinfo.ts";
import { setStoreRoleInfo } from "~/stores/RoleInfo.ts";
import { setStoreUserinfo } from "~/stores/Userinfo.ts";

//ロール削除通知。payloadにuserIdは無いので全員から除去する
export default function WSRoleDeleted(dat: { roleId: string }) {
  //console.log("WSRoleDeleted :: triggered dat->", dat);

  //ロール情報Storeから削除
  setStoreRoleInfo((prev) => {
    const next = { ...prev };
    delete next[dat.roleId];
    return next;
  });

  //自分のRoleLinkから除去
  setStoreMyUserinfo("RoleLink", (prev) =>
    prev.filter((role) => role.roleId !== dat.roleId),
  );

  //ユーザー情報Storeの全ユーザーから除去
  setStoreUserinfo(
    produce((prev) => {
      for (const userId of Object.keys(prev)) {
        const user = prev[userId];
        if (!user.RoleLink.some((rl) => rl.roleId === dat.roleId)) continue;
        const _user = { ...user };
        _user.RoleLink = _user.RoleLink.filter(
          (role) => role.roleId !== dat.roleId,
        );
        prev[userId] = _user;
      }
      return prev;
    }),
  );

  //console.log("WSRoleDeleted :: storeMyUserinfo.RoleLink ->", storeMyUserinfo.RoleLink);
}
