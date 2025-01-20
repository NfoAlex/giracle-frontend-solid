import { setStoreMyUserinfo, storeMyUserinfo } from "~/stores/MyUserinfo";

export default function WSRoleUnlinked(dat: { roleId: string, userId: string }) {
  console.log("WSRoleUnlinked :: triggered dat->", dat);

  const myRole = storeMyUserinfo.RoleLink;

  //リンクされていて自分のユーザーId宛てなら解除
  if (Object.keys(myRole).includes(dat.roleId) && dat.userId === storeMyUserinfo.id) {
    setStoreMyUserinfo((prev) => {
      prev.RoleLink.filter((role) => role.roleId !== dat.roleId);
      return prev;
    });
  }
}
