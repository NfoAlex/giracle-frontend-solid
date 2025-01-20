import { setStoreMyUserinfo, storeMyUserinfo } from "~/stores/MyUserinfo";

export default function WSRoleLinked(dat: { roleId: string, userId: string }) {
  console.log("WSRoleLinked :: triggered dat->", dat);

  const myRole = storeMyUserinfo.RoleLink;

  //リンクされておらず自分のユーザーId宛てならリンクする
  if (!Object.keys(myRole).includes(dat.roleId) && dat.userId === storeMyUserinfo.id) {
    setStoreMyUserinfo((prev) => {
      prev.RoleLink.push({ roleId: dat.roleId });
      return prev;
    });
  }
}
