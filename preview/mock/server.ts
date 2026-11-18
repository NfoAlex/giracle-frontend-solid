import type {
  Server as HttpServer,
  IncomingMessage,
  ServerResponse,
} from "node:http";
import type { Plugin } from "vite";
import { cookieToken, type MockCtx, type MockRoute, text } from "./http.ts";
import { routes as channelRoutes } from "./routes/channel.ts";
import { routes as messageRoutes } from "./routes/message.ts";
import { routes as userRoutes } from "./routes/user.ts";
import { hub, store } from "./store.ts";
import { attachMockWs } from "./ws.ts";

const ROUTES: MockRoute[] = [...userRoutes, ...channelRoutes, ...messageRoutes];

// 認証不要なパス
const PUBLIC_PATHS = new Set([
  "/api/user/sign-in",
  "/api/user/sign-up",
  "/api/server/config",
]);

const readBody = async (req: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  if (chunks.length === 0) return undefined;
  const contentType = req.headers["content-type"] ?? "";
  if (!contentType.includes("application/json")) return undefined;
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return undefined;
  }
};

const handle = async (req: IncomingMessage, res: ServerResponse, url: URL) => {
  const method = req.method ?? "GET";
  const body = await readBody(req);

  const matched = ROUTES.map((route) => {
    if (route.method !== method) return undefined;
    const m = route.pattern.exec(url.pathname);
    return m === null ? undefined : { route, params: m.slice(1) };
  }).find((x) => x !== undefined);

  if (matched === undefined) {
    text(res, 404, "Not implemented in mock");
    return;
  }

  const token = cookieToken(req.headers.cookie);
  const session = token
    ? store.sessions.find((s) => s.token === token)
    : undefined;
  const userId = session?.userId ?? "";

  if (!PUBLIC_PATHS.has(url.pathname) && session === undefined) {
    text(res, 401, "Unauthorized");
    return;
  }

  const ctx: MockCtx = {
    req,
    res,
    url,
    method,
    body,
    params: matched.params,
    userId,
    store,
    hub,
  };
  await matched.route.handler(ctx);
};

export default function mockApi(): Plugin {
  return {
    name: "giracle-mock-api",
    configureServer(server) {
      if (server.httpServer) {
        attachMockWs(server.httpServer as unknown as HttpServer, store);
      }

      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        if (!url.pathname.startsWith("/api/")) {
          next();
          return;
        }
        handle(req, res, url).catch((error) => {
          console.error("[mock] handler error", error);
          if (!res.headersSent) text(res, 500, String(error));
          else res.end();
        });
      });
    },
  };
}
