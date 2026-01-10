import type {IUser} from "~/types/User.ts";

export default async function GET_USER_SEARCH(
  _username: string,
  _channelId: string,
  _cursor: number = 0
): Promise<{
  message: "User search result";
  data: IUser[]
}> {
  const res = await fetch(`/api/user/search?username=${_username}&joinedChannel=${_channelId}&cursor=${_cursor}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch((err) => {
    throw new Error("USER_SEARCH :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
