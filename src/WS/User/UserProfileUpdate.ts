import {
  setStoreMyUserinfo,
  storeMyUserinfo,
} from "~/stores/MyUserinfo.store.ts";
import { useStoreUserinfo } from "~/stores/Userinfo.store.ts";
import type { IUser } from "~/types/User.ts";

export default function WSUserProfileUpdate(dat: IUser) {
  //console.log("WSProfileUpdate :: triggered dat->", dat);

  //自分のユーザー情報が更新された場合は、MyUserinfoを更新
  if (dat.id === storeMyUserinfo.id) {
    //自分の情報が更新された場合は、MyUserinfoを更新
    setStoreMyUserinfo((u) => {
      return {
        ...u,
        ...dat,
      };
    });
  }

  //ユーザー情報を格納
  useStoreUserinfo.updateUserinfo(dat);
}
