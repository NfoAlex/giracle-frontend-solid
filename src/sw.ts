/// <reference lib="webworker" />

type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    type?: string;
    messageId?: string;
    channelId?: string;
    [key: string]: unknown;
  };
};

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener("install", () => {
  sw.skipWaiting();
});

sw.addEventListener("activate", (event) => {
  event.waitUntil(sw.clients.claim());
});

sw.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload: PushPayload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Giracle", body: event.data.text() };
  }

  const { title, body, icon, badge, tag, data } = payload;

  event.waitUntil(
    (async () => {
      // Giracle が開いている(フォーカスされていなくても)タブが存在するなら
      // Web ソケット経由の通知経路がそちらで動くのでSW側は通知しない。
      // これで「タブ開きっぱなし + 非フォーカス」で二重通知になる問題を防ぐ。
      const windowClients = await sw.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const hasGiracleClient = windowClients.some((c) => {
        try {
          return new URL(c.url).origin === sw.location.origin;
        } catch {
          return false;
        }
      });
      if (hasGiracleClient) return;

      await sw.registration.showNotification(title, {
        body,
        icon: icon ?? "/favicon.svg",
        badge: badge ?? "/favicon.svg",
        tag,
        data,
      });
    })(),
  );
});

sw.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const channelId = (event.notification.data as { channelId?: string } | null)
    ?.channelId;
  const targetPath = channelId ? `/app/channel/${channelId}` : "/app";

  event.waitUntil(
    (async () => {
      const clientsList = await sw.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of clientsList) {
        const url = new URL(client.url);
        if (url.origin === sw.location.origin) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await (client as WindowClient).navigate(targetPath);
            } catch {
              // ignore
            }
          }
          return;
        }
      }

      if (sw.clients.openWindow) {
        await sw.clients.openWindow(targetPath);
      }
    })(),
  );
});
