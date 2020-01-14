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
		if (CorsPolicyEnforcer.allowedOriginPatterns !== undefined && requestOrigin !== undefined) {
			Logger.Info(`Testing origin ${requestOrigin}`);

			for (const pattern of CorsPolicyEnforcer.allowedOriginPatterns) {
				Logger.Info(`Testing pattern ${pattern}`);
				if (pattern.test(requestOrigin)) {
					Logger.Info(`${requestOrigin} passed the pattern`);
					callback(null, true);
					return;
				}
				Logger.Info(`${requestOrigin} failed the pattern`);
			}

			Logger.Info(`${requestOrigin} failed all allowed origin patterns`);
		}

		callback(new Error(`Origin ${requestOrigin} is not allowed access.`));
	}
}