export default function GetCookie(name: string): string | undefined {
  const cookieArray = document.cookie.split(";");
  const prefix = `${name}=`;

  for (const cookieItem of cookieArray) {
    const trimmedCookie = cookieItem.trim();
    if (trimmedCookie.startsWith(prefix)) {
      // split による Cookie 値内部の '=' 切断を防ぐため slice を使用
      return trimmedCookie.slice(prefix.length);
    }
  }

  return undefined;
}
