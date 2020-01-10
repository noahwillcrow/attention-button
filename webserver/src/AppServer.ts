// Thanks to the following blog article for all the help: https://levelup.gitconnected.com/setup-express-with-typescript-in-3-easy-steps-484772062e01

import * as bodyParser from 'body-parser';
import { Server } from '@overnightjs/core';
import { Logger } from '@overnightjs/logger';
import { AttentionController } from './controllers/AttentionController';

export class AppServer extends Server {
	public static readonly port: number = 3000;

	public constructor() {
		super(true);
        this.app.use(bodyParser.json());
		this.app.use(bodyParser.urlencoded({extended: true}));
		
        this.setupControllers();
	}

	private setupControllers(): void {
        const controllers = new Array<any>();
		
		controllers.push(new AttentionController());
		
        super.addControllers(controllers);
	}
	
	public start(): void {
        this.app.get('*', (request, response) => {
            response.send(`Started server on ${AppServer.port}`);
		});
		
        this.app.listen(AppServer.port, () => {
            Logger.Imp(`Started server on ${AppServer.port}`);
        });
    }
}
