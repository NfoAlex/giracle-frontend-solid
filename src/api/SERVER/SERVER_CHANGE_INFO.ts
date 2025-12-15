import type { IServer } from "~/types/Server.ts";

export default async function POST_SERVER_CHANGE_INFO(
  _name: string,
  _introduction: string,
): Promise<{
  message: "Server info updated"; 
  data: IServer;
}> {
  const res = await fetch("/api/server/change-info", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: _name,
      introduction: _introduction,
    }),
  }).catch((err) => {
    throw new Error("SERVER_CHANGE_INFO :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
