import { AppServer } from "./AppServer";
import * as fs from "fs";

const metadataFileContent = fs.readFileSync("/volumes/config/metadata.json").toString();
const metadata = JSON.parse(metadataFileContent);

const appServer = new AppServer(metadata);
appServer.start(80);