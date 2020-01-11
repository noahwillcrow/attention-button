import { AppServer } from "./AppServer";
import * as fs from "fs";
import { VapidDetails } from "./interfaces/VapidDetails";
import { PushSubscriptionsManager } from "./classes/PushSubscriptionsManager";
import { SecurityKeyEnforcer } from "./middleware/SecurityKeyEnforcer";

const pushSubscriptionsManager = new PushSubscriptionsManager("/volumes/persistent_data/push-subscriptions.json");

const securityKey = fs.readFileSync("/volumes/config/security-key.txt").toString().trim();
SecurityKeyEnforcer.setSecurityKey(securityKey);

const rawVapidDetailsContent = fs.readFileSync("/volumes/config/vapid-details.json").toString();
const vapidDetails = JSON.parse(rawVapidDetailsContent) as VapidDetails;

const appServer = new AppServer(pushSubscriptionsManager, vapidDetails);
appServer.start(80);