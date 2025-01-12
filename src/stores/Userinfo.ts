import { createStore } from "solid-js/store";
import GET_USER_INFO from "~/api/USER/USER_INFO";
import type { IUser } from "~/types/User";

export const [storeUserinfo, setStoreUserinfo] = createStore<{
  [key: string]: IUser;
}>({});

/**
 * ユーザー情報Storeの値を更新/挿入する
 * @param value 挿入/更新するチャンネルデータ。
 */
export const updateUserinfo = (value: IUser) => {
  //ユーザー情報をコピーして追記or書き換え
  const _userinfo = { ...storeUserinfo };
  _userinfo[value.id] = value;
  //storeへ格納
  setStoreUserinfo({
    ..._userinfo,
  });
};

/**
 * チャンネル情報を返す。無いなら取得してから返す
 * @param channelId
 */
export const getterUserinfo = async (userId: string): Promise<IUser> => {
  if (storeUserinfo[userId] === undefined) {
    await GET_USER_INFO(userId)
      .then((r) => {
        //Storeに設定
        updateUserinfo(r.data);
      })
      .catch((e) => {
        console.error("Userinfo :: getterUserinfo : エラー -> ", e);
        updateUserinfo({
          id: userId,
          name: "存在しないユーザー",
          selfIntroduction: "このユーザーは存在しません。",
          ChannelJoin: [],
          RoleLink: [],
        });
      });
  }

  return storeUserinfo[userId];
};
