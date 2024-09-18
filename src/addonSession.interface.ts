import { SessionData } from 'express-session';
import { AddonCallInfo } from 'kitsas-library';

export interface AddonSession extends SessionData {
  call?: AddonCallInfo;
  language?: string;
  callId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: { [key: string]: any };
}
