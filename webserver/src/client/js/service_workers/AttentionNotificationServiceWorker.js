self.addEventListener("push", event => {
	console.log("[ATTN SVC WRKR] Push received");
	console.log(`[ATTN SVC WRKR] Push had the following data:\n${event.data.text()}`);

	const pushedNotification = event.data.json();

	const title = "Attention Alert";
	const options = {
		body: pushedNotification.message
	};

	const notificationPromise = self.registration.showNotification(title, options);
	event.waitUntil(notificationPromise);
});