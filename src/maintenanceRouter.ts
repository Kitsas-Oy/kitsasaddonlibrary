import { randomBytes } from 'crypto';

import { NextFunction, Request, Response, Router } from 'express';

import { KitsasAddon } from './kitsasAddon';

type MaintenanceFunction = () => Promise<void>;

export class MaintenanceRouter {
  private addon: KitsasAddon;
  private myRouter: Router;
  private functions: Map<string, MaintenanceFunction> = new Map();
  private secret: string;

  constructor(
    addon: KitsasAddon,
    secret = process.env.MAINTENANCE_SECRET,
    path = '/launch_maintenance'
  ) {
    this.addon = addon;
    this.secret = secret ?? randomBytes(16).toString('hex');
    this.myRouter = this.addon.createRouter(path, false);
    this.myRouter.use(this.middleware.bind(this));
    this.myRouter.post('/', this.maintenanceFunction.bind(this));
    if (!secret) {
      console.warn(
        JSON.stringify({
          level: 'WARN',
          message: 'Maintenance secret is not set. Using random secret.',
          secret: this.secret,
        })
      );
    }
  }

  public router(): Router {
    return this.myRouter;
  }

  public addFunction(name: string, func: MaintenanceFunction): void {
    this.functions.set(name, func);
  }

  public hasFunction(name: string): boolean {
    return this.functions.has(name);
  }

  private middleware(req: Request, res: Response, next: NextFunction): void {
    const secret =
      req.get('X-Maintenance-Secret') ?? req.query.secret ?? req.body.secret;

    if (secret === this.secret) {
      next();
    } else {
      console.error(
        JSON.stringify({
          level: 'ERROR',
          message: 'Maintenance secret mismatch',
          action: req.body.action,
          location: req.get('X-Maintenance-Secret')
            ? 'header'
            : req.query.secret
            ? 'query'
            : req.body.secret
            ? 'body'
            : 'missing',
        })
      );
      res.status(401).send('Unauthorized');
    }
  }

  private async maintenanceFunction(
    req: Request,
    res: Response
  ): Promise<void> {
    const action = req.query.action ?? req.body.action;
    if (action === undefined) {
      res.status(400).send('Action is required');
      console.error(
        JSON.stringify({
          level: 'ERROR',
          message: 'Maintenance action is required',
          action: action,
          location: req.query.action
            ? 'query'
            : req.body.action
            ? 'body'
            : 'missing',
        })
      );
      return;
    }
    const func = this.functions.get(action);
    if (func === undefined) {
      res.status(400).send('Action not found');
      console.error(
        JSON.stringify({
          level: 'ERROR',
          message: `Maintenance action not found: ${action}`,
          action: req.body.action,
          location: req.query.action
            ? 'query'
            : req.body.action
            ? 'body'
            : 'missing',
        })
      );
      return;
    }
    try {
      await func();
    } catch (error) {
      console.error(
        JSON.stringify({
          level: 'ERROR',
          message: 'Maintenance function failed',
          action: action,
          error: (error as Error).message,
          stack: (error as Error).stack,
        })
      );
      res.status(500).send('Server error');
      return;
    }
    console.info(
      JSON.stringify({
        level: 'INFO',
        message: 'Maintenance function executed',
        action: action,
      })
    );
    res.status(200).send(`Maintenance ${action} executed`);
  }
}
