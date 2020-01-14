import { Request, Response } from "express";
import * as fs from "fs";

export class CorsPolicyEnforcer {
	private static allowedOriginPatterns?: ReadonlyArray<RegExp>

	public static loadCorsPolicy() {
		const patternStrings = fs.readFileSync("/volumes/config/allowed-origin-patterns.csv").toString().split(",");
		CorsPolicyEnforcer.allowedOriginPatterns = patternStrings.map(patternString => new RegExp(patternString));
	}

	public static enforce(request: Request, response: Response, next: () => void) {
		if (CorsPolicyEnforcer.allowedOriginPatterns === undefined) {
			next();
			return;
		}

		const requestOrigin = request.get("origin");

		if (requestOrigin !== undefined) {
			for (const pattern of CorsPolicyEnforcer.allowedOriginPatterns) {
				if (pattern.test(requestOrigin)) {
					response.header("Access-Control-Allow-Origin", requestOrigin);
					next();
					return;
				}
			}
		}

		response.status(401).send(`Origin ${requestOrigin} is not allowed access.`);
	}
}