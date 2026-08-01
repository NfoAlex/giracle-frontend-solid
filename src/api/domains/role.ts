import type { IRole } from "~/types/Role.ts";
import { FETCH_CLIENT } from "../FETCH_CLIENT.ts";

export const role = {
  create: (p: { roleName: string }) =>
    FETCH_CLIENT<{ message: "Role created"; data: IRole }>({
      url: "/api/role/create",
      method: "PUT",
      body: { roleName: p.roleName, rolePower: {} },
      label: "ROLE_CREATE",
    }),

  delete: (p: { roleId: string }) =>
    FETCH_CLIENT<{ message: "Role deleted"; data: string }>({
      url: "/api/role/delete",
      method: "DELETE",
      body: { roleId: p.roleId },
      label: "ROLE_DELETE",
    }),

  info: (p: { roleId: string }) =>
    FETCH_CLIENT<{ message: "Role info"; data: IRole }>({
      url: `/api/role/${p.roleId}`,
      method: "GET",
      label: "ROLE",
    }),

  link: (p: { userId: string; roleId: string }) =>
    FETCH_CLIENT<{ message: "Role linked" }>({
      url: "/api/role/link",
      method: "POST",
      body: { userId: p.userId, roleId: p.roleId },
      label: "ROLE_LINK",
    }),

  list: () =>
    FETCH_CLIENT<{ message: "Role list"; data: IRole[] }>({
      url: "/api/role/list",
      method: "GET",
      label: "ROLE_LIST",
    }),

  unlink: (p: { userId: string; roleId: string }) =>
    FETCH_CLIENT<{ message: "Role linked" }>({
      url: "/api/role/unlink",
      method: "POST",
      body: { userId: p.userId, roleId: p.roleId },
      label: "ROLE_UNLINK",
    }),

  update: (p: { roleId: string; roleData: IRole }) =>
    FETCH_CLIENT<{ message: `Channel created`; data: { channelId: string } }>({
      url: "/api/role/update",
      method: "POST",
      body: { roleId: p.roleId, roleData: p.roleData },
      label: "ROLE_UPDATE",
    }),
};
