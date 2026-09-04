import { createStore } from "solid-js/store";
import { HttpError } from "~/api/FETCH_CLIENT.ts";
import { api } from "~/api/index.ts";
import type { IRole } from "~/types/Role.ts";

export const [storeRoleInfo, setStoreRoleInfo] = createStore<{
  [key: string]: IRole;
}>({});

//一時的失敗の連続回数。上限に達したら再取得を打ち切る(即時再取得を許すと描画ごとのfetchストームになる)
const MAX_RETRY_COUNT = 3;
//roleIdごとの連続一時失敗回数
const retryFailCounts = new Map<string, number>();

/**
 * ロール情報Storeの値を更新/挿入する
 * @param value 挿入/更新するロールデータ。
 */
export const updateRoleInfo = (value: IRole) => {
  //ロール情報をコピーして追記or書き換え
  const _roleInfo = { ...storeRoleInfo };
  _roleInfo[value.id] = value;
  //storeへ格納
  setStoreRoleInfo({
    ..._roleInfo,
  });
};

/**
 * ロール情報を返す。無いなら取得してから返す
 * @param roleId
 */
export const getterRoleInfo = (roleId: string): IRole => {
  //一時的失敗が上限回数未満の間のみ再取得する
  const failCount = retryFailCounts.get(roleId) ?? 0;

  if (storeRoleInfo[roleId] === undefined || failCount < MAX_RETRY_COUNT) {
    //プレースホルダーを格納してから取得
    updateRoleInfo({
      name: "ロード中...",
      id: roleId,
      createdAt: new Date(),
      createdUserId: "",
      color: "#00f",
      manageServer: false,
      manageChannel: false,
      manageRole: false,
      manageUser: false,
      manageEmoji: false,
    });
    //ロール情報を取得
    api.role
      .info({ roleId })
      .then((r) => {
        //Storeに設定
        updateRoleInfo(r.data);
        retryFailCounts.delete(roleId);
      })
      .catch((e) => {
        console.error("RoleInfo :: getterRoleInfo : エラー -> ", e);
        if (e instanceof HttpError && e.status === 404) {
          //本物の404(存在しない)は再取得不要なので確定させる
          retryFailCounts.delete(roleId);
          updateRoleInfo({
            name: "存在しないロール",
            id: roleId,
            createdAt: new Date(),
            createdUserId: "",
            color: "#f00",
            manageServer: false,
            manageChannel: false,
            manageRole: false,
            manageUser: false,
            manageEmoji: false,
          });
        } else {
          //一時的な失敗はプレースホルダを保持し、上限回数未満なら次回呼び出しで再試行
          retryFailCounts.set(roleId, failCount + 1);
        }
      });
  }

  return storeRoleInfo[roleId];
};
