import type {IUser} from "~/types/User";
import {updateUserinfo} from "~/stores/Userinfo";

export default function WSUserProfileUpdate(dat: IUser) {
  console.log("WSProfileUpdate :: triggered dat->", dat);

  //ユーザー情報を格納
  updateUserinfo(dat);
}
