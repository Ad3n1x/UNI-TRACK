// UNI-TRACK service worker: push support only.
// Private tracker data is deliberately not cached by this worker.
self.addEventListener("push", (event) => {
  let data = { title: "UNI-TRACK reminder", body: "You have an update to review." };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body || "You have an update to review.",
    icon: "/logo.svg",
    badge: "/logo.svg",
    tag: data.tag || "unitrack-reminder",
    renotify: Boolean(data.renotify),
    data: { url: typeof data.url === "string" ? data.url : "/" },
  };

  event.waitUntil(self.registration.showNotification(data.title || "UNI-TRACK reminder", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin);
  if (target.origin !== self.location.origin) target.href = self.location.origin + "/";
  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin && "focus" in client) {
        await client.navigate(target.href);
        return client.focus();
      }
    }
    return clients.openWindow(target.href);
  })());
});