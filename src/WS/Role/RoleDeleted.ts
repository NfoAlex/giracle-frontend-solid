import { produce } from "solid-js/store";
import { setStoreMyUserinfo } from "~/stores/MyUserinfo.store.ts";
import { setStoreRoleInfo } from "~/stores/RoleInfo.store.ts";
import { setStoreUserinfo } from "~/stores/Userinfo.store.ts";

//ロール削除通知。payloadにuserIdは無いので全員から除去する
export default function WSRoleDeleted(dat: { roleId: string }) {
  //ロール情報Storeから削除
  setStoreRoleInfo(
    produce((prev) => {
      delete prev[dat.roleId];
    }),
  );

  //自分のRoleLinkから除去
  setStoreMyUserinfo("RoleLink", (prev) =>
    prev.filter((role) => role.roleId !== dat.roleId),
  );

  //ユーザー情報Storeの全ユーザーから除去
  setStoreUserinfo(
    produce((prev) => {
      for (const user of Object.values(prev)) {
        user.RoleLink = user.RoleLink.filter(
          (role) => role.roleId !== dat.roleId,
        );
      }
    }),
  );
}
