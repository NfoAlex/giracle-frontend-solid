export default async function POST_USER_CHANGE_BANNER(
  _banner: File,
): Promise<{ message: "Icon changed" }> {
  const formData = new FormData();
  formData.append("banner", _banner);
  const res = await fetch("/api/user/change-banner", {
    method: "POST",
    credentials: "include",
    body: formData,
  }).catch((err) => {
    throw new Error("USER_CHANGE_BANNER :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
