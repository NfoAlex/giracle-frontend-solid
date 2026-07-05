export default async function GET_NOTIFICATION_VAPID_PUBLIC_KEY(): Promise<{
  message: "Fetched VAPID public key";
  data: { publicKey: string };
}> {
  const res = await fetch("/api/notification/vapid-public-key", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  }).catch((err) => {
    throw new Error("NOTIFICATION_VAPID_PUBLIC_KEY :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
