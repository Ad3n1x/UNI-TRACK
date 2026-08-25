// Listen for push events sent from the backend cron job / web-push
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "Uni-Track Reminder", body: "Keep your streak alive!" };

  const options = {
    body: data.body,
    icon: "/favicon.ico", // Change this if you have a custom app icon in public/
    badge: "/favicon.ico",
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click event (opens the app when clicked)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it
      for (let client of windowClients) {
        if (client.url && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window at the root URL
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});