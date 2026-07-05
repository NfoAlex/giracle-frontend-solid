import type { INotificationConfig } from "./NOTIFICATION_CONFIG_GET.ts";

export default async function POST_NOTIFICATION_CONFIG_UPDATE(_body: {
  enabled?: boolean;
  mode?: "off" | "mention" | "all";
}): Promise<{
  message: "Updated notification config";
  data: INotificationConfig;
}> {
  const res = await fetch("/api/notification/config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(_body),
  }).catch((err) => {
    throw new Error("NOTIFICATION_CONFIG_UPDATE :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
