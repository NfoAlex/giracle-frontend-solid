export type INotificationConfig = {
  userId: string;
  enabled: boolean;
  mode: "off" | "mention" | "all";
};

export default async function GET_NOTIFICATION_CONFIG(): Promise<{
  message: "Fetched notification config";
  data: INotificationConfig;
}> {
  const res = await fetch("/api/notification/config", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  }).catch((err) => {
    throw new Error("NOTIFICATION_CONFIG_GET :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
