import type { Server as HttpServer } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { cookieToken } from "./http.ts";
import { hub, type IMockStore } from "./store.ts";

export function attachMockWs(httpServer: HttpServer, store: IMockStore) {
  const wss = new WebSocketServer({ noServer: true });
  const clients = new Map<WebSocket, string>();

  const sendPayload = (ws: WebSocket, signal: string, data: unknown) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ signal, data }));
    }
  };

  hub.broadcast = (signal, data) => {
    for (const ws of clients.keys()) sendPayload(ws, signal, data);
  };

  hub.toUser = (userId, signal, data) => {
    for (const [ws, id] of clients) {
      if (id === userId) sendPayload(ws, signal, data);
    }
  };

  // 実 backend は channel::<id> トピックへ publish するため、参加者だけへ送る
  hub.toChannel = (channelId, signal, data) => {
    for (const [ws, id] of clients) {
      if (store.joins.some((j) => j.userId === id && j.channelId === channelId))
        sendPayload(ws, signal, data);
    }
  };

  httpServer.on("upgrade", (req, socket, head) => {
    const { pathname } = new URL(req.url ?? "/", "http://localhost");
    // Vite の HMR など他 upgrade は素通し（サーバ側で別途処理される）
    if (pathname !== "/ws") return;

    wss.handleUpgrade(req, socket, head, (ws) => {
      const token = cookieToken(req.headers.cookie);
      const session = token
        ? store.sessions.find((s) => s.token === token)
        : undefined;
      if (session === undefined) {
        sendPayload(ws, "ERROR", "token not valid");
        ws.close();
        return;
      }

      const userId = session.userId;
      clients.set(ws, userId);
      if (!store.online.has(userId)) {
        store.online.add(userId);
        hub.broadcast("user::Connected", userId);
      }

      ws.on("message", (raw) => {
        try {
          const json = JSON.parse(raw.toString()) as {
            signal?: string;
            data?: unknown;
          };
          if (json.signal === "ping") sendPayload(ws, "pong", json.data);
        } catch {
          // フロントは ping 以外送らないため無視
        }
      });

      ws.on("error", () => ws.close());

      ws.on("close", () => {
        clients.delete(ws);
        const stillOnline = [...clients.values()].includes(userId);
        if (!stillOnline) {
          store.online.delete(userId);
          hub.broadcast("user::Disconnected", userId);
        }
      });
    });
  });
}
