import { Request, Response } from "express";
import { Controller, Post, Middleware } from "@overnightjs/core";
import { is } from "typescript-is";
import * as webpush from "web-push";
import { VapidDetails } from "../interfaces/VapidDetails";
import { SuccessResponse } from "../models/response/SuccessResponse";
import { SendNotificationRequest } from "../models/request/SendNotificationRequest";
import { PushedNotification } from "../models/notification/PushedNotification";
import { PushSubscriptionsManager } from "../classes/PushSubscriptionsManager";
import { SecurityKeyEnforcer } from "../middleware/SecurityKeyEnforcer";

@Controller("notifications")
export class NotificationsController {
	private readonly pushSubscriptionsManager: PushSubscriptionsManager;

	public constructor(pushSubscriptionsManager: PushSubscriptionsManager, vapidDetails: VapidDetails) {
		this.pushSubscriptionsManager = pushSubscriptionsManager;

		webpush.setVapidDetails(vapidDetails.subject, vapidDetails.keys.public, vapidDetails.keys.secret);
	}

	@Post("")
	@Middleware([SecurityKeyEnforcer.enforce])
	public sendNotification(request: Request, response: Response) {
		if (!is<SendNotificationRequest>(request.body)) {
			return response.status(400).send("Bad request");
		}
		const requestModel = request.body as SendNotificationRequest;

		const pushedNotification = {
			message: requestModel.message,
		} as PushedNotification;

		for (const pushSubscription of this.pushSubscriptionsManager.currentSubscriptions) {
			webpush.sendNotification(pushSubscription, JSON.stringify(pushedNotification));
		}

		return response.status(200).json(new SuccessResponse());
	}
}