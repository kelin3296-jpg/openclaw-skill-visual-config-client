const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const { createOpenClawService } = require('./lib/openclaw-service');

const PUBLIC_ROOT = path.join(__dirname, '..', 'public');
const DEFAULT_HOST = process.env.HOST || '127.0.0.1';
const DEFAULT_PORT = Number(process.env.PORT || 4318);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        req.destroy();
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    ...CORS_HEADERS,
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data, null, 2));
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
  fs.readFile(filePath, (error, buffer) => {
    if (error) {
      sendJson(res, 404, { error: 'Not found' });
      return;
    }

    res.writeHead(200, {
      ...CORS_HEADERS,
      'Content-Type': mimeType
    });
    res.end(buffer);
  });
}

function createServer(options = {}) {
  const staticDir = options.staticDir || PUBLIC_ROOT;
  const service = options.service || createOpenClawService(options.serviceOptions);

  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, CORS_HEADERS);
        res.end();
        return;
      }

      const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);

      if (req.method === 'GET' && url.pathname === '/api/dashboard') {
        sendJson(res, 200, await service.getDashboardPayload(url.searchParams.get('force') === '1'));
        return;
      }

      const detailMatch = url.pathname.match(/^\/api\/skills\/([^/]+)$/);
      if (req.method === 'GET' && detailMatch) {
        sendJson(res, 200, await service.getSkillDetail(
          decodeURIComponent(detailMatch[1]),
          url.searchParams.get('force') === '1'
        ));
        return;
      }

      const configMatch = url.pathname.match(/^\/api\/skills\/([^/]+)\/config$/);
      if (req.method === 'POST' && configMatch) {
        const body = await parseRequestBody(req);
        sendJson(res, 200, await service.updateSkillConfig(decodeURIComponent(configMatch[1]), body));
        return;
      }

      const requested = url.pathname === '/' ? '/index.html' : url.pathname;
      const safePath = path.normalize(path.join(staticDir, requested));
      if (!safePath.startsWith(staticDir)) {
        sendJson(res, 403, { error: 'Forbidden' });
        return;
      }

      if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
        sendFile(res, safePath);
        return;
      }

      sendJson(res, 404, { error: 'Not found' });
    } catch (error) {
      sendJson(res, 500, {
        error: 'Local OpenClaw API error',
        detail: error instanceof Error ? error.message : String(error)
      });
    }
  });

  return { server, service };
}

function listen(server, options = {}) {
  const host = options.host || DEFAULT_HOST;
  const port = Number(options.port ?? DEFAULT_PORT);

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.removeListener('error', reject);
      resolve(server.address());
    });
  });
}

async function startLocalServer(options = {}) {
  const host = options.host || DEFAULT_HOST;
  const port = Number(options.port ?? DEFAULT_PORT);
  const { server, service } = createServer(options);
  const address = await listen(server, { host, port });
  const url = `http://${host}:${address.port}`;
  return { address, server, service, url };
}

if (require.main === module) {
  startLocalServer()
    .then(({ url }) => {
      console.log(`OpenClaw 本地数据服务已启动: ${url}`);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}

module.exports = {
  CORS_HEADERS,
  DEFAULT_HOST,
  DEFAULT_PORT,
  MIME_TYPES,
  createServer,
  startLocalServer
};
