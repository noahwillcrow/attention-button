import { Request, Response } from "express";
import * as fs from "fs";

export class SecurityKeyEnforcer {
	private static securityKey?: string;

	public static loadSecurityKey() {
		SecurityKeyEnforcer.securityKey = fs.readFileSync("/volumes/config/security-key.txt").toString().trim();
	}

	public static enforce(request: Request, response: Response, next: () => void) {
		if (SecurityKeyEnforcer.securityKey === undefined) {
			response.status(503).send("Service unavailable");
			return;
		}

		if (!("key" in request.query)) {
			response.status(403).send("Missing security key");
			return;
		}

		if (request.query.key !== SecurityKeyEnforcer.securityKey) {
			response.status(403).send("Invalid security key");
			return;
		}

		next();
	}
}