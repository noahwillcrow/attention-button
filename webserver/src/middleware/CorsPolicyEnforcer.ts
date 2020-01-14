import { Request, Response } from "express";
import * as fs from "fs";

export class CorsPolicyEnforcer {
	private static corsPolicy?: string;

	public static loadCorsPolicy() {
		CorsPolicyEnforcer.corsPolicy = fs.readFileSync("/volumes/config/cors-policy.txt").toString().trim();
	}

	public static enforce(request: Request, response: Response, next: () => void) {
		if (CorsPolicyEnforcer.corsPolicy !== undefined) {
			response.header("Access-Control-Allow-Origin", CorsPolicyEnforcer.corsPolicy);
		}

		next();
	}
}