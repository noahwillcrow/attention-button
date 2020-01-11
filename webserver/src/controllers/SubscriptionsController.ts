import { Request, Response } from "express";
import { Controller, Delete, Get, Post, Middleware } from "@overnightjs/core";
import * as path from "path";
import { is } from "typescript-is";
import * as webpush from "web-push";
import { VapidDetails } from "../interfaces/VapidDetails";
import { SuccessResponse } from "../models/response/SuccessResponse";
import { PushSubscriptionsManager } from "../classes/PushSubscriptionsManager";
import { SecurityKeyEnforcer } from "../middleware/SecurityKeyEnforcer";

@Controller("subscriptions")
export class SubscriptionsController {
	private readonly pushSubscriptionsManager: PushSubscriptionsManager;
	private readonly vapidPublicKey: string;

	public constructor(pushSubscriptionsManager: PushSubscriptionsManager, vapidDetails: VapidDetails) {
		this.pushSubscriptionsManager = pushSubscriptionsManager;
		this.vapidPublicKey = vapidDetails.keys.public;

		webpush.setVapidDetails(vapidDetails.subject, vapidDetails.keys.public, vapidDetails.keys.secret);
	}

	@Delete("")
	public unsubscribeFromPushNotifications(request: Request, response: Response) {
		if (!is<webpush.PushSubscription>(request.body)) {
			return response.status(400).send("Bad request");
		}

		const wasCurrentSubscriptionsListMutated = this.pushSubscriptionsManager.removeSubscription(request.body);
		if (wasCurrentSubscriptionsListMutated) {
			this.pushSubscriptionsManager.persist();
		}

		return response.status(200).json(new SuccessResponse());
	}

	@Post("")
	@Middleware([SecurityKeyEnforcer.enforce])
	public subscribeToPushNotifications(request: Request, response: Response) {
		if (!is<webpush.PushSubscription>(request.body)) {
			return response.status(400).send("Bad request");
		}

		const wasCurrentSubscriptionsListMutated = this.pushSubscriptionsManager.addSubscription(request.body);
		if (wasCurrentSubscriptionsListMutated) {
			this.pushSubscriptionsManager.persist();
		}

		return response.status(200).json(new SuccessResponse());
	}

	@Get("set-up")
	@Middleware([SecurityKeyEnforcer.enforce])
	public setUpPushNotificationsSubscription(request: Request, response: Response) {
		return response.status(200).sendFile(path.join(__dirname, "/../client/html/subscribe.html"));
	}

	@Get("tear-down")
	public tearDownPushNotificationsSubscription(request: Request, response: Response) {
		return response.status(200).sendFile(path.join(__dirname, "/../client/html/unsubscribe.html"));
	}

	@Get("vapid-public-key")
	@Middleware([SecurityKeyEnforcer.enforce])
	public getVapidPublicKey(request: Request, response: Response) {
		return response.status(200).json({
			"publicKey": this.vapidPublicKey
		});
	}
}