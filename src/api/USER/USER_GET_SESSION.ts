export default async function GET_USER_SESSION(_cursor: number = 1): Promise<{
  message: "Fetched your sessions";
  data: {
    id: number;
    name: string;
    userId: string;
    thisIsYou: boolean;
    createdAt: Date;
  }[];
}> {
  const res = await fetch(`/api/user/session?cursor=${_cursor}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch((err) => {
    throw new Error("USER_SESSION :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
