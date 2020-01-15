import * as fs from "fs";
import { Logger } from '@overnightjs/logger';

export class CorsPolicyEnforcer {
	private static allowedOriginPatterns?: ReadonlyArray<RegExp>

	public static loadCorsPolicy() {
		const patternStrings = fs.readFileSync("/volumes/config/allowed-origin-patterns.csv").toString().split(",");
		CorsPolicyEnforcer.allowedOriginPatterns = patternStrings
			.filter(pattern => pattern !== "")
			.map(patternString => new RegExp(patternString));
	}

	public static enforce(requestOrigin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
		if (!requestOrigin) {
			// CORS is a consumer protection measure
			// As such, it is up to the browser to enforce
			// If this is coming from the RaspPi or any other source that doesn't care about CORS,
			// then I don't want to restrict that use-case.
			// As such, if no request origin is given, always allow it through this step.
			callback(null, true);	
		}
		
		if (CorsPolicyEnforcer.allowedOriginPatterns !== undefined) {
			for (const pattern of CorsPolicyEnforcer.allowedOriginPatterns) {
				if (pattern.test(requestOrigin)) {
					callback(null, true);
					return;
				}
			}
		}

		callback(new Error(`Origin ${requestOrigin} is not allowed access.`));
	}
}
