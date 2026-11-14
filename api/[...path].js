import app from '../server/server.js';

export default function handler(req, res) {
  const originalUrl = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || req.headers['x-now-route-matches'];
  if (originalUrl) {
    req.url = originalUrl;
  } else if (!req.url.startsWith('/api') && !req.url.startsWith('/v1')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }
  return app(req, res);
}
