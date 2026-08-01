type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface FetchClientOptions {
  url: string;
  method: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  credentials?: RequestCredentials;
  label: string;
}

export async function FETCH_CLIENT<TResponse>(
  options: FetchClientOptions,
): Promise<TResponse> {
  const { url, method, body, query, credentials, label } = options;

  let finalUrl = url;
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      params.append(key, String(value));
    }
    const queryString = params.toString();
    if (queryString) finalUrl = `${url}?${queryString}`;
  }

  const isFormData = body instanceof FormData;

  const res = await fetch(finalUrl, {
    method,
    credentials,
    headers: isFormData
      ? undefined
      : body !== undefined
        ? { "Content-Type": "application/json" }
        : undefined,
    body:
      body !== undefined
        ? isFormData
          ? body
          : JSON.stringify(body)
        : undefined,
  }).catch((err) => {
    throw new Error(`${label} :: fetch failed`, { cause: err });
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
