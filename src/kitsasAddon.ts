import 'dotenv/config';

import { randomBytes } from 'crypto';

import dayJs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import express, {
  Express,
  NextFunction,
  Request,
  Response,
  Router,
} from 'express';
import session from 'express-session';
import { KitsasConnectionInterface, KitsasService } from 'kitsas-library';
import morgan from 'morgan';

import { AddonOptions } from './addonOptions.dto';
import { AddonSession } from './addonSession.interface';
import { morganFormatter } from './morganFormatter';

dayJs.extend(utc);

/**
 * Kitsas Addon Class
 *
 * First create an instance of this class,
 * add all the routers and then call the start method.
 *
 */
export class KitsasAddon {
  private app: Express;
  private connection: KitsasConnectionInterface | null = null;
  private options: AddonOptions;

  /**
   * Constructor for KitsasAddon
   *
   * @param options - Options for the addon. Most of the options are configurable via environment variables too.
   *
   * @see AddonOptions
   */
  constructor(options: AddonOptions = {}) {
    options.appName = options.appName ?? process.env.APP_NAME ?? 'Addon';
    options.port = options.port ?? parseInt(process.env.PORT ?? '3210');
    options.sessionSecret =
      options.sessionSecret ??
      process.env.SESSION_SECRET ??
      randomBytes(32).toString('hex');
    options.viewEngine = options.viewEngine ?? 'pug';
    options.staticRoute = options.staticRoute ?? '/static';
    options.staticPath = options.staticPath ?? 'public';
    options.redirectRoot = options.redirectRoot ?? true;
    options.baseUrl =
      options.baseUrl ??
      process.env.BASE_URL ??
      'http://localhost:' + options.port;

    this.options = options;
    this.app = express();
    this.app.locals.appName = options.appName;
    this.app.locals.baseUrl = options.baseUrl;
    this.app.locals.dayjs = dayJs;
    this.app.set('Addon', this);

    this.app.set('view engine', options.viewEngine);
    this.app.use(
      session({
        secret: options.sessionSecret,
        resave: false,
        saveUninitialized: false,
      })
    );
    this.app.use(morgan(morganFormatter));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.json());
    this.app.use(this.unreadyMiddleware.bind(this));
    if (options.redirectRoot) {
      this.app.get('/', (req: Request, res: Response) => {
        res.redirect('addon' + req.url);
      });
    }
    this.app.use(options.staticRoute, express.static(options.staticPath));
  }

  private async connect() {
    try {
      this.connection = await KitsasService.connect(
        this.options.connection ?? {}
      );
      console.log(
        JSON.stringify({
          level: 'INFO',
          message: 'Connected to Kitsas',
          name: this.connection.getName(),
        })
      );
    } catch (error) {
      console.log(
        JSON.stringify({
          level: 'WARN',
          message: 'Failed to connect to Kitsas. Retrying in 15 seconds',
          error: (error as Error).message,
        })
      );
      setTimeout(this.connect.bind(this), 5000);
    }
  }

  /**
   * Start the addon server
   *
   * @param routers - Array of routers to use
   */
  public start(routers: Router[]): void {
    this.connect();
    console.log(
      JSON.stringify({
        level: 'INFO',
        message: `Init ${routers.length} routers`,
      })
    );

    this.app.listen(this.options.port, () => {
      console.log(
        JSON.stringify({
          level: 'INFO',
          message: 'Listening for connections',
          port: this.options.port,
        })
      );
    });
  }

  /**
   * Get the express app
   *
   * @returns The express app
   */
  public getApp(): Express {
    return this.app;
  }

  public getConnection(): KitsasConnectionInterface {
    if (!this.connection) {
      throw new Error('Kitsas connection not available');
    }
    return this.connection;
  }

  private unreadyMiddleware(
    _req: Request,
    res: Response,
    next: NextFunction
  ): void {
    if (!this.connection) {
      try {
        res.status(503).render('unready');
      } catch (error) {
        res.status(503).send('Service is starting...');
      }
    } else {
      next();
    }
  }

  private async middleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const session = req.session as AddonSession;
    const callId = req.query.callId as string;
    if (!callId) {
      if (session.call) {
        next();
      } else {
        const message =
          'This is a Kitsas addon and should be called from Kitsas with valid Call ID.';
        try {
          res.status(400).render('error', { message });
        } catch (error) {
          res.status(400).send(message);
        }
      }
    } else {
      if (!this.connection) {
        throw new Error('Kitsas connection not available');
      }
      try {
        const call = await this.connection.getAddonCallInfo(callId as string);
        session.call = call;
        req.app.locals.info = call;
        session.language = (req.query['language'] as string) || 'fi';
        req.app.locals.language = session.language;
        session.data = {};
        next();
      } catch (error) {
        const message = 'Call ID not valid.';
        try {
          res.status(500).render('error', { message });
        } catch (error) {
          res.status(500).send(message);
        }
      }
    }
  }

  /**
   * Create a new router
   *
   * Remember to include this router in the start method
   *
   * @param path Path to route, default is /addon
   * @param useMiddleWare Use middleware, default is true. Set to false with webhooks etc.
   * @returns Router
   */
  public createRouter(path = '/addon', useMiddleWare = true): Router {
    const router = Router();
    if (useMiddleWare) {
      router.use(this.middleware.bind(this));
    }
    this.app.use(path, router);
    return router;
  }
}
