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
  let FLAG_RECEIVED = false;
  const CONTROLLER = new AbortController();
  
  const res = await fetch("/api/server/config", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    signal: CONTROLLER.signal,
  }).then((response) => {
    FLAG_RECEIVED = true;
    return response;
  }).catch((err) => {
    throw new Error("SERVER_CONFIG :: err->", err);
  });

  setTimeout(() => {
    if (!FLAG_RECEIVED) {
      CONTROLLER.abort();
      throw new Error("SERVER_CONFIG :: timeout");
    }
  }, 3500);

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
