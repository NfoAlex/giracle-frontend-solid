import type { IChannel } from "~/types/Channel.ts";

export default async function GET_SERVER_CONFIG(): Promise<{
  message: string;
  data: {
    isFirstUser: boolean;
    defaultJoinChannel: IChannel[];
    id: undefined;
    name?: string | undefined;
    introduction?: string | undefined;
    RegisterAvailable?: boolean | undefined;
    RegisterInviteOnly?: boolean | undefined;
    RegisterAnnounceChannelId?: string | undefined;
    MessageMaxLength?: number | undefined;
  };
}> {
  const res = await fetch("/api/server/config", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch((err) => {
    throw new Error("SERVER_CONFIG :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
