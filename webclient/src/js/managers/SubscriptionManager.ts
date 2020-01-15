class SubscriptionManager {
	public constructor(private readonly domLogger: DomLogger, private readonly messageController: MessageController, private readonly metadataFetcher: MetadataFetcher) {
	}

	public async subscribe() {
		await this.metadataFetcher.getMetadata().then(metadata => {
			this.getVapidPublicKey(metadata)
				.then(vapidPublicKey => {
					this.getOrCreateServiceWorkerRegistration()
						.then(swRegistration => {
							this.subscribeToPushNotifications(metadata, vapidPublicKey, swRegistration)
								.then(() => {
									this.messageController.setMessage("Subscription complete");
								});
						});
				})
				.catch(error => {
					this.domLogger.logError(error);
					this.messageController.setMessage("Subscription failed");
				});
		});
	}

	public async unsubscribe() {
		await this.metadataFetcher.getMetadata().then(metadata => {
			this.getExistingServiceWorkerRegistration()
				.then(swRegistration => {
					if (swRegistration === undefined) {
						this.domLogger.logInfo("No subscription to cancel");
						return;
					}

					return this.unsubscribeFromPushNotifications(metadata, swRegistration);
				})
		});
	}

	private async getVapidPublicKey(metadata: Metadata): Promise<string> {
		return sendGet<{ publicKey: string }>(`${metadata.apiUrlBase}/subscriptions/vapid-public-key`, true)
			.then(result => {
				return result.publicKey;
			});
	}

	private async getExistingServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | undefined> {
		this.domLogger.logInfo("Attempting to find an existing service worker registration");

		this.domLogger.logInfo("Checking if serviceWorker is in navigator");
		if (!("serviceWorker" in navigator)) {
			throw "Service workers are not supported";
		}
		this.domLogger.logInfo("serviceWorker exists in navigator");
		
		this.domLogger.logInfo("Attempting to get existing service worker registration");
		return navigator.serviceWorker.getRegistration("/js/service_workers/AttentionNotificationServiceWorker.js");
	}

	private async getOrCreateServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
		this.domLogger.logInfo("Attempting to get or create a service worker registration");
		
		this.domLogger.logInfo("Checking for an existing service worker registration");
		return this.getExistingServiceWorkerRegistration()
			.then(existingRegistration => {
				if (existingRegistration !== undefined) {
					this.domLogger.logInfo("An existing service worker was found");
					return existingRegistration;
				}

				this.domLogger.logInfo("No existing service worker found");

				this.domLogger.logInfo("Checking if PushManager exists in window");
				if (!("PushManager" in window)) {
					throw "Push messaging is not supported";
				}
				this.domLogger.logInfo("PushManager exists in window");

				this.domLogger.logInfo("Attempting to register a new service worker");
				return navigator.serviceWorker.register("/js/service_workers/AttentionNotificationServiceWorker.js")
					.then(newRegistration => {
						this.domLogger.logInfo("New service worker is registered");

						return newRegistration;
					});
			});
	}

	private async getExistingPushManagerSubscription(swRegistration: ServiceWorkerRegistration) {
		this.domLogger.logInfo("Attempting to get existing push manager subscription");
		return swRegistration.pushManager.getSubscription();
	}

	private async subscribeToPushNotifications(metadata: Metadata, vapidPublicKey: string, swRegistration: ServiceWorkerRegistration): Promise<void> {
		this.domLogger.logInfo("Attempting to subscribe to push notifications");
		
		return this.getExistingPushManagerSubscription(swRegistration)
			.then(subscription => {
				if (subscription !== null) {
					this.domLogger.logInfo("A push subscription already exists");

					this.domLogger.logInfo("Attempting to send existing subscription to server");
					return sendPost<any>(`${metadata.apiUrlBase}/subscriptions`, true, undefined, subscription)
						.then(() => {
							this.domLogger.logInfo("Successfully established existing subscription with server");
						});
				}

				this.domLogger.logInfo("No existing push subscription");

				this.domLogger.logInfo("Encoding vapidPublicKey");
				const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

				this.domLogger.logInfo("Attempting to create a new push manager subscription");
				return swRegistration.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: applicationServerKey
				}).then(newSubscription => {
					this.domLogger.logInfo("Successfully created a new push manager subscription");

					this.domLogger.logInfo("Attempting to send new subscription to server");
					return sendPost<any>(`${metadata.apiUrlBase}/subscriptions`, true, undefined, newSubscription)
						.then(() => {
							this.domLogger.logInfo("Successfully established new subscription with server");
						});
				});
			});
	}

	private async unsubscribeFromPushNotifications(metadata: Metadata, swRegistration: ServiceWorkerRegistration): Promise<void> {
		this.domLogger.logInfo("Attempting to unsubscribe from push notifications");

		return this.getExistingPushManagerSubscription(swRegistration)
			.then(pushSubscription => {
				if (pushSubscription === null) {
					this.domLogger.logInfo("No push manager subscription to cancel");
					return this.unregisterServiceWorker(swRegistration);
				}

				this.domLogger.logInfo("Found existing push manager subscription");

				return this.deleteSubscriptionOnServer(metadata, pushSubscription)
					.then(() => {
						this.domLogger.logInfo("Attempting to unsubscribe push manager subscription");
						return pushSubscription.unsubscribe()
							.then(unsubscriptionSuccess => {
								if (!unsubscriptionSuccess) {
									throw "Could not unsubscribe service worker's subscription";
								}

								this.domLogger.logInfo("Successfully unsubscribed push manager subscription");
								
								return this.unregisterServiceWorker(swRegistration);
							});
					});
			});
	}

	private async deleteSubscriptionOnServer(metadata: Metadata, pushSubscription: PushSubscription) {
		this.domLogger.logInfo("Attempting to communicate subscription removal with server");
		return sendDelete<any>(`${metadata.apiUrlBase}/subscriptions`, false, undefined, pushSubscription)
			.then(() => {
				this.domLogger.logInfo("Successfully communicated subscription removal with server");
			});
	}

	private async unregisterServiceWorker(swRegistration: ServiceWorkerRegistration) {
		this.domLogger.logInfo("Attempting to unregister service worker registration");
		return swRegistration.unregister()
			.then(deregistrationSuccess => {
				if (!deregistrationSuccess) {
					throw "Could not unregister service worker";
				}

				this.domLogger.logInfo("Successfully unregistered service worker");
			});
	}
}