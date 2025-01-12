
export default async function GET_USER_GET_ONLINE(): Promise<{
  message: "Fetched online user list";
  data: string[];
}> {
  const res = await fetch("/api/user/get-online", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch((err) => {
    throw new Error("USER_GET_ONLINE :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
