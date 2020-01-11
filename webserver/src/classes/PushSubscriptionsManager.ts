import * as fs from "fs";
import * as webpush from "web-push";

export class PushSubscriptionsManager {
	private readonly pushSubscriptionsFilePath: string;
	private pushSubscriptions: Array<webpush.PushSubscription>;

	public get currentSubscriptions(): ReadonlyArray<webpush.PushSubscription> {
		return this.pushSubscriptions;
	}

	public constructor(pushSubscriptionsFilePath: string) {
		this.pushSubscriptionsFilePath = pushSubscriptionsFilePath;

		this.pushSubscriptions = this.loadPushSubscriptionsFromFileSystem();
	}

	public addSubscription(pushSubscription: webpush.PushSubscription) {
		const currentIndex = this.getMatchingSubscriptionIndex(pushSubscription);
		if (currentIndex === -1) {
			this.pushSubscriptions.push(pushSubscription);
		}
	}

	public removeSubscription(pushSubscription: webpush.PushSubscription) {
		const currentIndex = this.getMatchingSubscriptionIndex(pushSubscription);
		if (currentIndex > -1) {
			this.pushSubscriptions.splice(currentIndex, 1);
		}
	}

	public persist() {
		const pushSubscriptionsListString = JSON.stringify(this.pushSubscriptions);
		fs.writeFileSync(this.pushSubscriptionsFilePath, pushSubscriptionsListString);
	}

	private loadPushSubscriptionsFromFileSystem() {
		const pushSubscriptionsListString = fs.readFileSync(this.pushSubscriptionsFilePath).toString();
		return JSON.parse(pushSubscriptionsListString) as Array<webpush.PushSubscription>;
	}

	private getMatchingSubscriptionIndex(pushSubscription: webpush.PushSubscription) {
		return this.pushSubscriptions.findIndex(value => value.endpoint === pushSubscription.endpoint && value.keys.p256dh === pushSubscription.keys.p256dh && value.keys.auth === pushSubscription.keys.auth);
	}
}