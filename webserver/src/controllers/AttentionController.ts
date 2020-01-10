import { Request, Response } from 'express';
import { Controller, Middleware, Get, Put, Post, Delete } from '@overnightjs/core';
import { Logger } from '@overnightjs/logger';
import { AppServer } from '../AppServer';

@Controller("attention")
export class AttentionController {
	@Get("port")
	public getPortNumber(request: Request, response: Response) {
		Logger.Info(request.params.id);
		return response.status(200).json(AppServer.port);
	}
}