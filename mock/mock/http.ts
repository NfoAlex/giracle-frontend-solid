import { Buffer } from "node:buffer";
import type { ServerResponse } from "node:http";
import type { IMockStore, MockHub } from "./store.ts";

export interface MockCtx {
  res: ServerResponse;
  url: URL;
  body: unknown;
  rawBody?: { buffer: Buffer; contentType: string };
  params: string[];
  userId: string;
  store: IMockStore;
  hub: MockHub;
}

export const obj = (body: unknown): Record<string, unknown> =>
  body !== null && typeof body === "object"
    ? (body as Record<string, unknown>)
    : {};

export interface MockMultipartPart {
  name: string;
  filename: string | null;
  contentType: string;
  data: Buffer;
}

/** ローカル dev 用の簡易 multipart パーサ */
export const parseMultipart = (
  rawBody: { buffer: Buffer; contentType: string } | undefined,
): MockMultipartPart[] => {
  if (rawBody === undefined) return [];
  const m = /boundary=(?:"([^"]+)"|([^;\s]+))/.exec(rawBody.contentType);
  if (m === null) return [];
  const boundary = m[1] ?? m[2];
  const raw = rawBody.buffer.toString("binary");
  return raw
    .split(`--${boundary}`)
    .slice(1, -1) // 先頭 preamble(通常空)と終端 `--` を除外
    .map((segment) => segment.replace(/^\r\n/, "").replace(/\r\n$/, ""))
    .filter((segment) => segment.includes("\r\n\r\n"))
    .map((segment) => {
      const headerEnd = segment.indexOf("\r\n\r\n");
      const headers = segment.slice(0, headerEnd);
      const data = Buffer.from(segment.slice(headerEnd + 4), "binary");
      const name = /name="([^"]*)"/.exec(headers)?.[1] ?? "";
      const filename = /filename="([^"]*)"/.exec(headers)?.[1] ?? null;
      const contentType =
        /^content-type:\s*(.+)$/im.exec(headers)?.[1].trim() ??
        "application/octet-stream";
      return { name, filename, contentType, data };
    });
};

export type MockHandler = (ctx: MockCtx) => void | Promise<void>;

export interface MockRoute {
  method: string;
  pattern: RegExp;
  handler: MockHandler;
}

export const json = (
  res: ServerResponse,
  message: string,
  data?: unknown,
  status = 200,
) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data === undefined ? { message } : { message, data }));
};

export const text = (res: ServerResponse, status: number, body: string) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(body);
};

export const setTokenCookie = (res: ServerResponse, token: string) => {
  res.setHeader(
    "Set-Cookie",
    `token=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=1296000`,
  );
};

export const cookieToken = (cookie: string | undefined): string | undefined => {
  if (cookie === undefined) return undefined;
  for (const part of cookie.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === "token") return value.join("=");
  }
  return undefined;
};
