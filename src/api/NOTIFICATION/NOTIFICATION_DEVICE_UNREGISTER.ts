export default async function POST_NOTIFICATION_DEVICE_UNREGISTER(
  _token: string,
): Promise<{
  message: "Device unregistered";
  data: { token: string | null };
}> {
  const res = await fetch("/api/notification/device/unregister", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: _token }),
  }).catch((err) => {
    throw new Error("NOTIFICATION_DEVICE_UNREGISTER :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
