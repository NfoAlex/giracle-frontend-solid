import { createStore } from "solid-js/store";
import { GET_ROLE } from "~/api/ROLE/ROLE_INFO";
import type { IRole } from "~/types/Role";

export const [storeRoleInfo, setStoreRoleInfo] = createStore<{
  [key: string]: IRole;
}>({});

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
 * @param channelId
 */
export const getterRoleInfo = (
  roleId: string,
): IRole => {
  if (storeRoleInfo[roleId] === undefined) {
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
      manageUser: false
    });
    //ロール情報を取得
    GET_ROLE(roleId)
      .then((r) => {
        //Storeに設定
        updateRoleInfo(r.data);
      })
      .catch((e) => {
        console.error("RoleInfo :: getterRoleInfo : エラー -> ", e);
        updateRoleInfo({
          name: "存在しないロール",
          id: roleId,
          createdAt: new Date(),
          createdUserId: "",
          color: "#f00",
          manageServer: false,
          manageChannel: false,
          manageRole: false,
          manageUser: false
        });
      });
  }

  return storeRoleInfo[roleId];
};
