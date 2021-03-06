// Thanks to the following blog article for all the help: https://levelup.gitconnected.com/setup-express-with-typescript-in-3-easy-steps-484772062e01

import * as bodyParser from "body-parser";
import * as cors from "cors";
import { Server } from "@overnightjs/core";
import { Logger } from "@overnightjs/logger";
import { NotificationsController } from "./controllers/NotificationsController";
import { SubscriptionsController } from "./controllers/SubscriptionsController";
import { VapidDetails } from "./interfaces/VapidDetails";
import { PushSubscriptionsManager } from "./classes/PushSubscriptionsManager";
import { SecurityKeyEnforcer } from "./middleware/SecurityKeyEnforcer";
import { CorsPolicyEnforcer } from './middleware/CorsPolicyEnforcer';

export class AppServer extends Server {
	public constructor(pushSubscriptionsManager: PushSubscriptionsManager, vapidDetails: VapidDetails) {
		super(true);
		
		this.app.use(bodyParser.json());
		this.app.use(bodyParser.urlencoded({extended: true}));
		this.app.use(cors({
			allowedHeaders: ["Accept", "Content-Type"],
			origin: CorsPolicyEnforcer.enforce
		}));
		
		this.setupControllers(pushSubscriptionsManager, vapidDetails);
	}

	private setupControllers(pushSubscriptionsManager: PushSubscriptionsManager, vapidDetails: VapidDetails): void {
		const controllers = new Array<any>();
		
		controllers.push(new NotificationsController(pushSubscriptionsManager, vapidDetails));
		controllers.push(new SubscriptionsController(pushSubscriptionsManager, vapidDetails));
		
		super.addControllers(controllers);
	}
	
	public start(port: number): void {
		CorsPolicyEnforcer.loadCorsPolicy();
		SecurityKeyEnforcer.loadSecurityKey();

		this.app.listen(port, () => {
			Logger.Imp(`Started server on ${port}`);
		});
	}
}
