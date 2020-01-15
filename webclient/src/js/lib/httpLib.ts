const urlSearchParams = new URLSearchParams(window.location.search);
const securityKey = urlSearchParams.get("key")!;

async function sendRequest<T>(method: string, url: string, includeSecurityKey: boolean, queryParams?: Map<string, string>, body?: any): Promise<T> {
	return new Promise((resolve: (result: T) => void, reject: (error: { status: number, message: string }) => void) => {
		let finalUrl = url;
		if (queryParams === undefined) {
			queryParams = new Map<string, string>();
		}

		if (includeSecurityKey) {
			queryParams.set("key", securityKey);
		}

		for (const key of queryParams.keys()) {
			if (finalUrl.indexOf("?") === -1) {
				finalUrl += "?"
			} else {
				finalUrl += "&"
			}

			finalUrl += `${key}=${encodeURIComponent(queryParams.get(key)!)}`;
		}

		const request = new XMLHttpRequest();
		request.open(method, finalUrl, true);
		request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

		request.onload = function() {
			if (this.status === 200) {
				const result = JSON.parse(this.response) as T;
				resolve(result);
			} else {
				reject({
					"status": this.status,
					"message": this.response
				});
			}
		}

		request.onerror = function() {
			reject({
				"status": this.status,
				"message": this.response
			});
		};

		const bodyJson = JSON.stringify(body);
		request.send(bodyJson);
	});
}

async function sendDelete<T>(url: string, includeSecurityKey: boolean, queryParams?: Map<string, string>, body?: any): Promise<T> {
	return sendRequest("DELETE", url, includeSecurityKey, queryParams, body);
}

async function sendGet<T>(url: string, includeSecurityKey: boolean, queryParams?: Map<string, string>): Promise<T> {
	return sendRequest<T>("GET", url, includeSecurityKey, queryParams);
}

async function sendPost<T>(url: string, includeSecurityKey: boolean, queryParams?: Map<string, string>, body?: any): Promise<T> {
	return sendRequest("POST", url, includeSecurityKey, queryParams, body);
}