import type {IUser} from "~/types/User.ts";
import {updateUserinfo} from "~/stores/Userinfo.ts";
import { setStoreMyUserinfo, storeMyUserinfo } from "~/stores/MyUserinfo.ts";

export default function WSUserProfileUpdate(dat: IUser) {
  //console.log("WSProfileUpdate :: triggered dat->", dat);

  //自分のユーザー情報が更新された場合は、MyUserinfoを更新
  if (dat.id === storeMyUserinfo.id) {
    //自分の情報が更新された場合は、MyUserinfoを更新
    setStoreMyUserinfo((u) => {
      return {
        ...u,
        ...dat
      };
    });
  }

  //ユーザー情報を格納
  updateUserinfo(dat);
}
