import {setStoreUserOnline, updateUserinfo} from "~/stores/Userinfo";
import type {IUser} from "~/types/User";

export default function WSUserProfileUpdate(dat: IUser) {
  console.log("WSProfileUpdate :: triggered dat->", dat);

  //ユーザー情報を格納
  updateUserinfo(dat);
}
