import {setStoreUserOnline} from "~/stores/Userinfo";

export default function WSUserConnected(dat: string) {
  console.log("WSUserConnected :: triggered dat->", dat);

  //オンラインユーザーを追加
  setStoreUserOnline((prev) => {
    return [...prev, dat];
  })
}
