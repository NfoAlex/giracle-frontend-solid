import type { IChannel } from "~/types/Channel";

export default async function GET_MESSAGE_GET_NEW(): Promise<{
  message: "Fetched news",
  data: {
    [key: IChannel["id"]]: boolean;
  }
}> {
  const res = await fetch("/api/message/get-new", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch((err) => {
    throw new Error("MESSAGE_GET_NEW :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
