import { AppServer } from "./AppServer";
import * as fs from "fs";
import { VapidDetails } from "./interfaces/VapidDetails";
import { PushSubscriptionsManager } from "./classes/PushSubscriptionsManager";

const pushSubscriptionsManager = new PushSubscriptionsManager("/volumes/persistent_data/push-subscriptions.json");

const vapidDetailsFileContent = fs.readFileSync("/volumes/config/vapid-details.json").toString();
const vapidDetails = JSON.parse(vapidDetailsFileContent) as VapidDetails;

const appServer = new AppServer(pushSubscriptionsManager, vapidDetails);
appServer.start(80);