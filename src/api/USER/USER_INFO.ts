import type { IUser } from "~/types/User.ts";

export default async function GET_USER_INFO(_userId: string): Promise<{
  message: "User info";
  data: IUser;
}> {
  const res = await fetch(`/api/user/info/${_userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch((err) => {
    throw new Error("USER_INFO :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
