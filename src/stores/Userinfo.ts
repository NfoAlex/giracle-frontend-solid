import { createStore } from "solid-js/store";
import { HttpError } from "~/api/FETCH_CLIENT.ts";
import { api } from "~/api/index.ts";
import type { IUser } from "~/types/User.ts";

export const [storeUserinfo, setStoreUserinfo] = createStore<{
  [key: string]: IUser;
}>({});
export const [storeUserOnline, setStoreUserOnline] = createStore<string[]>([]);

//一時的失敗の連続回数。上限に達したら再取得を打ち切る(即時再取得を許すと描画ごとのfetchストームになる)
const MAX_RETRY_COUNT = 3;
//userIdごとの連続一時失敗回数
const retryFailCounts = new Map<string, number>();

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
  //一時的失敗が上限回数未満の間のみ再取得する
  const failCount = retryFailCounts.get(userId) ?? 0;

  if (storeUserinfo[userId] === undefined || failCount < MAX_RETRY_COUNT) {
    updateUserinfo({
      id: userId,
      name: "ロード中...",
      isBanned: false,
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
        retryFailCounts.delete(userId);
      })
      .catch((e) => {
        console.error("Userinfo :: getterUserinfo : エラー -> ", e);
        if (e instanceof HttpError && e.status === 404) {
          //本物の404(存在しない)は再取得不要なので確定させる
          retryFailCounts.delete(userId);
          updateUserinfo({
            id: userId,
            name: "存在しないユーザー",
            isBanned: false,
            selfIntroduction: "このユーザーは存在しません。",
            ChannelJoin: [],
            RoleLink: [],
          });
        } else {
          //一時的な失敗はプレースホルダを保持し、上限回数未満なら次回呼び出しで再試行
          retryFailCounts.set(userId, failCount + 1);
        }
      });
  }

  return storeUserinfo[userId];
};
