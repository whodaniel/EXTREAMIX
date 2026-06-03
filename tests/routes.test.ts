import test from 'node:test';
import assert from 'node:assert';
import express from 'express';
import request from 'supertest';
import dnsRoutes from '../src/routes/dns.ts';
import webhookRoutes from '../src/routes/webhooks.ts';

test('DNS route - returns generic error when keys missing', async (t) => {
  const app = express();
  app.use(express.json());
  app.use('/api/dns', dnsRoutes);

  // Setup env vars missing keys
  process.env.ADMIN_PASSWORD = 'test_password';

  const res = await request(app)
    .get('/api/dns/example.com/records')
    .set('x-admin-password', 'test_password');

  assert.strictEqual(res.status, 500);
  assert.strictEqual(res.body.error, 'Porkbun API keys are not configured on the server.');
});

test('DNS route - unauthorized if missing admin password', async (t) => {
  const app = express();
  app.use(express.json());
  app.use('/api/dns', dnsRoutes);

  // Setup env vars missing keys
  process.env.ADMIN_PASSWORD = 'test_password';

  const res = await request(app)
    .get('/api/dns/example.com/records');

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error, 'Unauthorized access');
});
