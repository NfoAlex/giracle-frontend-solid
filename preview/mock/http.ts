import type { IncomingMessage, ServerResponse } from "node:http";
import type { IMockStore, MockHub } from "./store.ts";

export interface MockCtx {
  req: IncomingMessage;
  res: ServerResponse;
  url: URL;
  method: string;
  body: unknown;
  params: string[];
  userId: string;
  store: IMockStore;
  hub: MockHub;
}

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
