import { Request, Response } from 'express';
import { TokenIndexer } from 'morgan';

function statusLevel(status: number): string {
  if (status < 400) {
    return 'INFO';
  } else if (status < 500) {
    return 'WARN';
  } else {
    return 'ERROR';
  }
}

export function morganFormatter(
  tokens: TokenIndexer<Request, Response>,
  req: Request,
  res: Response
): string {
  const statusCode = parseInt(tokens.status(req, res) ?? '0');
  const method = tokens.method(req, res);
  const url = tokens.url(req, res);
  const time = tokens['response-time'](req, res);
  const agent = tokens['user-agent'](req, res);
  return JSON.stringify({
    level: statusLevel(statusCode),
    method: method,
    url: url,
    statusCode: statusCode,
    responseTime: time,
    userAgent: agent,
  });
}
