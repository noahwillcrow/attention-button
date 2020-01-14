const SubscriptionManager = (() => {
	const urlSearchParams = new URLSearchParams(window.location.search);
	const securityKey = urlSearchParams.get("key")!;

	function urlBase64ToUint8Array(base64String: string) {
		const padding = "=".repeat((4 - base64String.length % 4) % 4);
		const base64 = (base64String + padding)
			.replace(/-/g, "+")
			.replace(/_/g, "/");

		const rawData = window.atob(base64);
		const outputArray = new Uint8Array(rawData.length);

		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray;
	}

	async function sendRequest<T>(method: string, url: string, includeSecurityKey: boolean, queryParams?: Map<string, string>, body?: any): Promise<T> {
		return new Promise((resolve: (result: T) => void, reject: (error: { status: number, message: string }) => void) => {
			let finalUrl = url;
			if (queryParams === undefined) {
				queryParams = new Map<string, string>();
			}

			if (includeSecurityKey) {
				queryParams.set("key", securityKey);
			}

			for (const key of queryParams.keys()) {
				if (finalUrl.indexOf("?") === -1) {
					finalUrl += "?"
				} else {
					finalUrl += "&"
				}

				finalUrl += `${key}=${encodeURIComponent(queryParams.get(key)!)}`;
			}

			const request = new XMLHttpRequest();
			request.open(method, finalUrl, true);
			request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

			request.onload = function() {
				if (this.status === 200) {
					const result = JSON.parse(this.response) as T;
					resolve(result);
				} else {
					reject({
						"status": this.status,
						"message": this.response
					});
				}
			}

			request.onerror = function() {
				reject({
					"status": this.status,
					"message": this.response
				});
			};

			const bodyJson = JSON.stringify(body);
			request.send(bodyJson);
		});
	}

	async function sendDelete<T>(url: string, includeSecurityKey: boolean, queryParams?: Map<string, string>, body?: any): Promise<T> {
		return sendRequest("DELETE", url, includeSecurityKey, queryParams, body);
	}

	async function sendGet<T>(url: string, includeSecurityKey: boolean, queryParams?: Map<string, string>): Promise<T> {
		return sendRequest<T>("GET", url, includeSecurityKey, queryParams);
	}

	async function sendPost<T>(url: string, includeSecurityKey: boolean, queryParams?: Map<string, string>, body?: any): Promise<T> {
		return sendRequest("POST", url, includeSecurityKey, queryParams, body);
	}

	function setMessage(message: string) {
		const messageElement = document.getElementById("message");
		if (messageElement === null) {
			return;
		}

		messageElement.innerText = message;
	}

	function logMessage(message: string, messageType: string) {
		const logElement = document.getElementById("log");
		if (logElement === null) {
			return;
		}

		const infoNode = document.createElement("span");
		infoNode.className = `${messageType}-message`;
		infoNode.innerText = message;
		logElement.appendChild(infoNode);
	}

	function logInfo(message: string) {
		logMessage(message, "info");
	}

	function logWarning(message: string) {
		logMessage(message, "warn");
	}

	function logError(message: string) {
		logMessage(message, "error");
	}

	async function getMetadata(): Promise<Metadata> {
		return sendGet<Metadata>("/metadata", false);
	}

	async function getVapidPublicKey(metadata: Metadata): Promise<string> {
		return sendGet<{ publicKey: string }>(`${metadata.apiUrlBase}/subscriptions/vapid-public-key`, true)
			.then(result => {
				return result.publicKey;
			});
	}

	async function getExistingServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | undefined> {
		logInfo("Attempting to find an existing service worker registration");

		logInfo("Checking if serviceWorker is in navigator");
		if (!("serviceWorker" in navigator)) {
			throw "Service workers are not supported";
		}
		logInfo("serviceWorker exists in navigator");
		
		logInfo("Attempting to get existing service worker registration");
		return navigator.serviceWorker.getRegistration("/js/service_workers/AttentionNotificationServiceWorker.js");
	}

	async function getOrCreateServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
		logInfo("Attempting to get or create a service worker registration");
		
		logInfo("Checking for an existing service worker registration");
		return getExistingServiceWorkerRegistration()
			.then(existingRegistration => {
				if (existingRegistration !== undefined) {
					logInfo("An existing service worker was found");
					return existingRegistration;
				}

				logInfo("No existing service worker found");

				logInfo("Checking if PushManager exists in window");
				if (!("PushManager" in window)) {
					throw "Push messaging is not supported";
				}
				logInfo("PushManager exists in window");

				logInfo("Attempting to register a new service worker");
				return navigator.serviceWorker.register("/js/service_workers/AttentionNotificationServiceWorker.js")
					.then(newRegistration => {
						logInfo("New service worker is registered");

						return newRegistration;
					});
			});
	}

	async function getExistingPushManagerSubscription(swRegistration: ServiceWorkerRegistration) {
		logInfo("Attempting to get existing push manager subscription");
		return swRegistration.pushManager.getSubscription();
	}

	async function subscribeToPushNotifications(metadata: Metadata, vapidPublicKey: string, swRegistration: ServiceWorkerRegistration): Promise<void> {
		logInfo("Attempting to subscribe to push notifications");
		
		return getExistingPushManagerSubscription(swRegistration)
			.then(subscription => {
				if (subscription !== null) {
					logInfo("A push subscription already exists");

					logInfo("Attempting to send existing subscription to server");
					return sendPost<any>(`${metadata.apiUrlBase}/subscriptions`, true, undefined, subscription)
						.then(() => {
							logInfo("Successfully established existing subscription with server");
						});
				}

				logInfo("No existing push subscription");

				logInfo("Encoding vapidPublicKey");
				const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

				logInfo("Attempting to create a new push manager subscription");
				return swRegistration.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: applicationServerKey
				}).then(function (newSubscription) {
					logInfo("Successfully created a new push manager subscription");

					logInfo("Attempting to send new subscription to server");
					return sendPost<any>(`${metadata.apiUrlBase}/subscriptions`, true, undefined, newSubscription)
						.then(() => {
							logInfo("Successfully established new subscription with server");
						});
				});
			});
	}

	async function unsubscribeFromPushNotifications(metadata: Metadata, swRegistration: ServiceWorkerRegistration): Promise<void> {
		logInfo("Attempting to unsubscribe from push notifications");

		return getExistingPushManagerSubscription(swRegistration)
			.then(pushSubscription => {
				if (pushSubscription === null) {
					logInfo("No push manager subscription to cancel");
					return unregisterServiceWorker(swRegistration);
				}

				logInfo("Found existing push manager subscription");

				return deleteSubscriptionOnServer(metadata, pushSubscription)
					.then(() => {
						logInfo("Attempting to unsubscribe push manager subscription");
						return pushSubscription.unsubscribe()
							.then(unsubscriptionSuccess => {
								if (!unsubscriptionSuccess) {
									throw "Could not unsubscribe service worker's subscription";
								}

								logInfo("Successfully unsubscribed push manager subscription");
								
								return unregisterServiceWorker(swRegistration);
							});
					});
			});
	}

	async function deleteSubscriptionOnServer(metadata: Metadata, pushSubscription: PushSubscription) {
		logInfo("Attempting to communicate subscription removal with server");
		return sendDelete<any>(`${metadata.apiUrlBase}/subscriptions`, false, undefined, pushSubscription)
			.then(() => {
				logInfo("Successfully communicated subscription removal with server");
			});
	}

	async function unregisterServiceWorker(swRegistration: ServiceWorkerRegistration) {
		logInfo("Attempting to unregister service worker registration");
		return swRegistration.unregister()
			.then(deregistrationSuccess => {
				if (!deregistrationSuccess) {
					throw "Could not unregister service worker";
				}

				logInfo("Successfully unregistered service worker");
			});
	}

	async function subscribe() {
		await getMetadata().then(metadata => {
			getVapidPublicKey(metadata)
				.then(vapidPublicKey => {
					getOrCreateServiceWorkerRegistration()
						.then(swRegistration => {
							subscribeToPushNotifications(metadata, vapidPublicKey, swRegistration)
								.then(() => {
									setMessage("Subscription complete");
								});
						});
				})
				.catch(error => {
					logError(error);
					setMessage("Subscription failed");
				});
		});
	}

	async function unsubscribe() {
		await getMetadata().then(metadata => {
			getExistingServiceWorkerRegistration()
				.then(swRegistration => {
					if (swRegistration === undefined) {
						logInfo("No subscription to cancel");
						return;
					}

					return unsubscribeFromPushNotifications(metadata, swRegistration);
				})
		});
	}

	return {
		subscribe: subscribe,
		unsubscribe: unsubscribe
	};
})();