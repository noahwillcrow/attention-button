import * as express from "express";
import { Application } from "express";
import * as path from "path";

export class AppServer {
	private readonly app: Application;
	private readonly metadata: any;

	public constructor(metadata: any) {
		this.metadata = metadata;

		this.app = express();
	}
	
	public start(port: number): void {
		this.app.get("/metadata", (request, response) => {
			response.json(this.metadata);
		});

		this.app.get("/css/*", (request, response) => {
			response.sendFile(path.join(__dirname, `/${request.url}`));
		});

		this.app.get("/js/*", (request, response) => {
			response.sendFile(path.join(__dirname, `/${request.url}`));
		});

		this.app.get("*", (request, response) => {
			response.sendFile(path.join(__dirname, `/html/${request.path}.html`));
		});
		
		this.app.listen(port, () => {
			console.log(`Listening on port ${port}`);
		});
	}
}
