import { createStore } from "solid-js/store";
import { api } from "~/api/index.ts";
import type { IUser } from "~/types/User.ts";

export const [storeUserinfo, setStoreUserinfo] = createStore<{
  [key: string]: IUser;
}>({});
export const [storeUserOnline, setStoreUserOnline] = createStore<string[]>([]);

export namespace useStoreUserinfo {
  /**
   * ユーザー情報Storeの値を更新/挿入する
   * @param value 挿入/更新するチャンネルデータ。
   */
  export const updateUserinfo = (value: IUser) => {
    // users 行のみの payload（user::ProfileUpdate 等）で RoleLink / ChannelJoin が
    // 消えないよう、既存値で補ってから格納する
    setStoreUserinfo(value.id, (prev: IUser | undefined) => ({
      ...prev,
      ...value,
      ChannelJoin: value.ChannelJoin ?? prev?.ChannelJoin ?? [],
      RoleLink: value.RoleLink ?? prev?.RoleLink ?? [],
    }));
  };

  /**
   * 非同期でユーザー情報を取得し返す
   * @param userId
   */
  export const asyncGetterUserinfo = async (userId: string) => {
    if (storeUserinfo[userId] === undefined) {
      const userFetched = await api.user.info({ userId });
      if (userFetched?.message === "User info") {
        updateUserinfo(userFetched.data);
      }
    }
    return storeUserinfo[userId];
  };

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
        isBot: false,
        selfIntroduction:
          "ロード中のユーザー情報です。しばらく経っても同じ表示の場合、リロードしてください。",
        ChannelJoin: [],
        RoleLink: [],
      });

      api.user
        .info({ userId })
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
            isBot: false,
            selfIntroduction: "このユーザーは存在しません。",
            ChannelJoin: [],
            RoleLink: [],
          });
        });
    }

    return storeUserinfo[userId];
  };
}
