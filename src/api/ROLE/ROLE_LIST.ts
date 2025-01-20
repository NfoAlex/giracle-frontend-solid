import type { IRole } from "~/types/Role";

export async function GET_ROLE_LIST(): Promise<{
  message: "Role list",
  data: IRole[]
}> {
  const res = await fetch("/api/role/list", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch((err) => {
    throw new Error("ROLE_LIST :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
