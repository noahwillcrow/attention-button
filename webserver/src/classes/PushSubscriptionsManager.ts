import * as fs from "fs";
import * as webpush from "web-push";

export class PushSubscriptionsManager {
	private readonly pushSubscriptionsFilePath: string;
	private pushSubscriptions: Array<webpush.PushSubscription>;

	/**
	 * The list of current push subscriptions
	 */
	public get currentSubscriptions(): ReadonlyArray<webpush.PushSubscription> {
		return this.pushSubscriptions;
	}

	public constructor(pushSubscriptionsFilePath: string) {
		this.pushSubscriptionsFilePath = pushSubscriptionsFilePath;

		this.pushSubscriptions = this.loadPushSubscriptionsFromFileSystem();
	}

	/**
	 * An idempotent operation to add a push subscription to the list of current subscriptions
	 * This method will not add a subscription that is already in the list
	 * @param pushSubscription The push subscription to add
	 * @returns A boolean indicating whether the list of current subscriptions was mutated
	 */
	public addSubscription(pushSubscription: webpush.PushSubscription) {
		const currentIndex = this.getMatchingSubscriptionIndex(pushSubscription);
		if (currentIndex === -1) {
			this.pushSubscriptions.push(pushSubscription);
			return true;
		}

		return false;
	}

	/**
	 * An idempotent operation to remove a push subscription from the list of current subscriptions
	 * @param pushSubscription The push subscription to remove
	 * @returns A boolean indicating whether the list of current subscriptions was mutated
	 */
	public removeSubscription(pushSubscription: webpush.PushSubscription) {
		const currentIndex = this.getMatchingSubscriptionIndex(pushSubscription);
		if (currentIndex > -1) {
			this.pushSubscriptions.splice(currentIndex, 1);
			return true;
		}

		return false;
	}

	/**
	 * Persists the list of current subscriptions
	 */
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