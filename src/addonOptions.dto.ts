import { KitsasConnectionOptions } from 'kitsas-library';

export interface AddonOptions {
  /**
   * Name of the app
   */
  appName?: string;
  /**
   * Port to listen on
   * Can be configured via environment variable PORT
   * @default 3210
   */
  port?: number;
  /**
   * Connection options for the Kitsas server
   * Look at the [KitsasConnectionOptions](https://kitsas-oy.github.io/kitsaslibrary/classes/KitsasConnectionOptions.html) in kitsas-library for more details
   * Can be configured via environment variables
   */
  connection?: KitsasConnectionOptions;
  /**
   * Secret for the session
   * Can be configured via environment variable SESSION_SECRET
   * Default is a random 32 byte hex string
   */
  sessionSecret?: string;
  /**
   * View engine to use
   * @default pug
   */
  viewEngine?: string;
  /**
   * Route for static files
   * @default /static
   */
  staticRoute?: string;
  /**
   * Path to the static files
   * @default public
   */
  staticPath?: string;
  /**
   * Redirect root to /addon
   * @default true
   */
  redirectRoot?: boolean;
}
