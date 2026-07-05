export type IMutedChannel = {
  channelId: string;
  mutedAt: string;
};

export default async function GET_NOTIFICATION_MUTED_CHANNELS(): Promise<{
  message: "Fetched muted channels";
  data: IMutedChannel[];
}> {
  const res = await fetch("/api/notification/muted-channels", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  }).catch((err) => {
    throw new Error("NOTIFICATION_MUTED_CHANNELS :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
