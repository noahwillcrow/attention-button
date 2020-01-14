import { Request, Response } from "express";
import * as fs from "fs";
import { Logger } from '@overnightjs/logger';

export class CorsPolicyEnforcer {
	private static allowedOriginPatterns?: ReadonlyArray<RegExp>

	public static loadCorsPolicy() {
		const patternStrings = fs.readFileSync("/volumes/config/allowed-origin-patterns.csv").toString().split(",");
		CorsPolicyEnforcer.allowedOriginPatterns = patternStrings.filter(pattern => pattern === "").map(patternString => new RegExp(patternString));
	}

	public static enforce(request: Request, response: Response, next: () => void) {
		if (request.method !== "OPTIONS") {
			next();
			return;
		}

		const requestOrigin = request.get("origin");

		if (CorsPolicyEnforcer.allowedOriginPatterns !== undefined && requestOrigin !== undefined) {
			Logger.Info(`Testing origin ${requestOrigin}`);

			for (const pattern of CorsPolicyEnforcer.allowedOriginPatterns) {
				Logger.Info(`Testing pattern ${pattern}`);
				if (pattern.test(requestOrigin)) {
					Logger.Info(`${requestOrigin} passed the pattern`);
					response.set("Access-Control-Allow-Origin", requestOrigin);
					next();
					return;
				}
				Logger.Info(`${requestOrigin} failed the pattern`);
			}

			Logger.Info(`${requestOrigin} failed all allowed origin patterns`);
		}

		response.status(401).send(`Origin ${requestOrigin} is not allowed access.`);
	}
}