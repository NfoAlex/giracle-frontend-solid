import { storeMyUserinfo } from "~/stores/MyUserinfo.ts";
import {setStoreUserOnline} from "~/stores/Userinfo.ts";

export default function WSUserDisconnected(dat: string) {
  console.log("WSUserDisconnected :: triggered dat->", dat);

  //オンラインユーザーを削除
  setStoreUserOnline((prev) => {
    const onlineUserNow = [...prev];
    //自分だったら削除しない
    if (dat === storeMyUserinfo.id) {
      return onlineUserNow;
    }
    const index = onlineUserNow.indexOf(dat);
    if (index !== -1) onlineUserNow.splice(index, 1);

    return onlineUserNow;
  })
}
