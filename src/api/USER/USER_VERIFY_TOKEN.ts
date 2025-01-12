export default async function GET_USER_VERIFY_TOKEN(): Promise<{
  message: `Token is valid`;
  data: {
    userId: string;
  };
}> {
  const res = await fetch("/api/user/verify-token", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch((err) => {
    throw new Error("GET_USER_VERIFY_TOKEN :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
