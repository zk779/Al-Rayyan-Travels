import * as PusherPushNotifications from "@pusher/push-notifications-web";

// Push notifications through Pusher Beams. The Instance ID comes from the backend
// (GET /api/notifications/config) so it is configured in one place only; the device is tied to the
// logged-in ADMIN through the backend's /beams-auth endpoint.

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const flagKey = (userId) => `push-on:${userId}`;

let client = null;
const getClient = (instanceId) => {
  if (!client) client = new PusherPushNotifications.Client({ instanceId });
  return client;
};

export const pushSupported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
export const pushPermission = () => (pushSupported() ? Notification.permission : "unsupported");
export const pushWanted = (userId) => {
  try {
    return localStorage.getItem(flagKey(userId)) === "1";
  } catch {
    return false;
  }
};

const register = async (instanceId, userId, token) => {
  const beams = getClient(instanceId);
  await beams.start(); // asks the browser for permission the first time
  await beams.setUserId(
    String(userId),
    new PusherPushNotifications.TokenProvider({
      url: `${API_BASE}/api/notifications/beams-auth`,
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
};

/** Turn push on for this device (call from a button — the browser asks for permission). */
export async function enablePush({ instanceId, userId, token }) {
  if (!pushSupported()) throw new Error("This browser does not support push notifications");
  await register(instanceId, userId, token);
  if (Notification.permission !== "granted") throw new Error("Notifications are blocked for this site in the browser");
  try {
    localStorage.setItem(flagKey(userId), "1");
  } catch {
    /* ignore */
  }
}

/** Re-register quietly when it was already turned on (keeps the device attached after a login). */
export async function resumePush({ instanceId, userId, token }) {
  if (!pushSupported() || Notification.permission !== "granted" || !pushWanted(userId)) return;
  await register(instanceId, userId, token);
}

/** Turn push off for this device. */
export async function disablePush({ instanceId, userId }) {
  try {
    localStorage.removeItem(flagKey(userId));
  } catch {
    /* ignore */
  }
  if (!pushSupported()) return;
  try {
    const beams = getClient(instanceId);
    await beams.stop();
  } catch {
    /* ignore */
  }
}
