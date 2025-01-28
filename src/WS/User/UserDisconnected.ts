import {setStoreUserOnline} from "~/stores/Userinfo";

export default function WSUserDisconnected(dat: string) {
  console.log("WSUserDisconnected :: triggered dat->", dat);

  //オンラインユーザーを削除
  setStoreUserOnline((prev) => {
    const onlineUserNow = [...prev];
    const index = onlineUserNow.indexOf(dat);
    if (index !== -1) onlineUserNow.splice(index, 1);

    return onlineUserNow;
  })
}
