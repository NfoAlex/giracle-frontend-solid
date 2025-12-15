import {setStoreUserOnline, storeUserOnline} from "~/stores/Userinfo.ts";

export default function WSUserConnected(dat: string) {
  console.log("WSUserConnected :: triggered dat->", dat);

  //すでにオンラインユーザーとしているなら処理停止
  if (storeUserOnline.includes(dat)) return;

  //オンラインユーザーを追加
  setStoreUserOnline((prev) => {
    return [...prev, dat];
  })
}
