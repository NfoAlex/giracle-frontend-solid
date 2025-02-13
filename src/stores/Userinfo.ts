import { createStore } from "solid-js/store";
import GET_USER_INFO from "~/api/USER/USER_INFO";
import type { IUser } from "~/types/User";

export const [storeUserinfo, setStoreUserinfo] = createStore<{
  [key: string]: IUser;
}>({});
export const [storeUserOnline, setStoreUserOnline] = createStore<string[]>([]);

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
 * 非同期でユーザー情報を取得し返す
 * @param userId
 */
export const asyncGetterUserinfo = async (userId: string) => {
  if (storeUserinfo[userId] === undefined) {
    const userFetched = await GET_USER_INFO(userId);
    if (userFetched?.message === "User info") {
      updateUserinfo(userFetched.data);
    }
  }
  return storeUserinfo[userId];
}

/**
 * ユーザー情報を返す。無いなら取得しつつ返す
 * @param userId
 */
export const getterUserinfo = (userId: string): IUser => {
  if (storeUserinfo[userId] === undefined) {
    updateUserinfo({
      id: userId,
      name: "ロード中...",
      isBanned: false,
      selfIntroduction: "ロード中のユーザー情報です。しばらく経っても同じ表示の場合、リロードしてください。",
      ChannelJoin: [],
      RoleLink: []
    });

    GET_USER_INFO(userId)
      .then((r) => {
        //Storeに設定
        updateUserinfo(r.data);
      })
      .catch((e) => {
        console.error("Userinfo :: getterUserinfo : エラー -> ", e);
        updateUserinfo({
          id: userId,
          name: "存在しないユーザー",
          isBanned: false,
          selfIntroduction: "このユーザーは存在しません。",
          ChannelJoin: [],
          RoleLink: [],
        });
      });
  }

  return storeUserinfo[userId];
};
