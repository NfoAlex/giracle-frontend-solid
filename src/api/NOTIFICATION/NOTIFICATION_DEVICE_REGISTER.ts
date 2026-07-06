export default async function POST_NOTIFICATION_DEVICE_REGISTER(_body: {
  token: string;
  platform: "web" | "android" | "ios";
  keys?: { p256dh: string; auth: string };
  deviceName?: string;
}): Promise<{
  message: "Device registered";
  data: { id: number };
}> {
  const res = await fetch("/api/notification/device/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(_body),
  }).catch((err) => {
    throw new Error("NOTIFICATION_DEVICE_REGISTER :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
