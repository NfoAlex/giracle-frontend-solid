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
      // 該当チャンネルを開いているタブがフォーカスされているなら通知を出さない
      const windowClients = await sw.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const channelId = data?.channelId;
      const focusedOnChannel = windowClients.find((c) => {
        if (!c.focused) return false;
        if (!channelId) return true;
        try {
          const url = new URL(c.url);
          return url.pathname.includes(`/channel/${channelId}`);
        } catch {
          return false;
        }
      });
      if (focusedOnChannel) return;

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
