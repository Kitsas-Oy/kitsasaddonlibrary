import { NextFunction, Request, Response, Router } from 'express';

import { KitsasAddon } from './kitsasAddon';

type MaintenanceFunction = () => Promise<void>;

export class MaintenanceRouter {
  private addon: KitsasAddon;
  private myRouter: Router;
  private functions: Map<string, MaintenanceFunction> = new Map();

  constructor(addon: KitsasAddon, path = '/launch_maintenance') {
    this.addon = addon;
    this.myRouter = this.addon.createRouter(path, false);
    this.myRouter.use(this.middleware.bind(this));
    this.myRouter.post('/', this.maintenanceFunction.bind(this));
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

    if (secret === process.env.MAINTENANCE_SECRET) {
      next();
    } else {
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
      return;
    }
    const func = this.functions.get(action);
    if (func === undefined) {
      res.status(400).send('Action not found');
      return;
    }
    await func();
    res.status(200).send(`Maintenance ${action} executed`);
  }
}
