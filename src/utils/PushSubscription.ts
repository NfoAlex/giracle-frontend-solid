import { api } from "~/api/index.ts";

const urlBase64ToUint8Array = (base64String: string): ArrayBuffer => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    view[i] = rawData.charCodeAt(i);
  }
  return buffer;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer | null): string => {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const isPushSupported = (): boolean => {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
};

const getRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!("serviceWorker" in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ?? null;
};

export const getCurrentPushSubscription =
  async (): Promise<PushSubscription | null> => {
    const reg = await getRegistration();
    if (!reg) return null;
    return reg.pushManager.getSubscription();
  };

export const subscribeToPush = async (): Promise<PushSubscription> => {
  if (!isPushSupported()) {
    throw new Error("このブラウザはプッシュ通知に対応していません");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("通知許可が得られませんでした");
  }

  const reg = await getRegistration();
  if (!reg) throw new Error("Service Worker が登録されていません");

  const { data } = await api.notification.vapidPublicKey();
  const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });

  const p256dh = arrayBufferToBase64(subscription.getKey("p256dh"));
  const auth = arrayBufferToBase64(subscription.getKey("auth"));

  await api.notification.deviceRegister({
    token: subscription.endpoint,
    platform: "web",
    keys: { p256dh, auth },
    deviceName: navigator.userAgent,
  });

  return subscription;
};

export const unsubscribeFromPush = async (): Promise<boolean> => {
  const subscription = await getCurrentPushSubscription();
  if (!subscription) return false;

  await api.notification.deviceUnregister({ token: subscription.endpoint }).catch(
    (e) => {
      console.warn("PushSubscription :: unregister API failed", e);
    },
  );

  return subscription.unsubscribe();
};
