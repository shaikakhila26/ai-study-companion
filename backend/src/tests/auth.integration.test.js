/**
 * Integration tests for auth + Project data isolation.
 *
 * These require a real, reachable MongoDB -- this sandbox has no outbound
 * access to download a MongoDB binary for an in-memory server, so these
 * tests self-skip when the DB isn't reachable rather than failing the
 * whole suite.
 *
 * IMPORTANT: this suite calls mongoose.connection.dropDatabase() when it
 * finishes, so it deliberately does NOT read the app's normal MONGODB_URI
 * (which likely points at real dev data) -- it only reads a dedicated
 * TEST_MONGODB_URI so a plain `npm test` can never wipe real data by
 * accident. Add TEST_MONGODB_URI=<a *different* database name, e.g. your
 * Atlas URI with /ai-study-companion-test instead of /ai-study-companion>
 * to backend/.env once, and `npm test` will run these for real from then
 * on with no shell env var needed.
 *
 * NOTE ON SKIP MECHANICS: Jest registers every test (runs all describe()
 * callbacks) BEFORE any beforeAll hook executes. That means a variable set
 * inside beforeAll (like dbAvailable) is never ready in time to decide
 * test.skip() at registration -- calling test.skip() based on it always
 * evaluates the pre-connection value. So instead of a dynamic maybeTest()
 * wrapper, every test below runs for real and checks dbAvailable as its
 * very first line, returning early (reported as a quick pass, not a
 * "skipped" test) when there's no DB. Less pretty in the summary output,
 * but it's what actually works with Jest's execution order.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const request = require('supertest');

jest.setTimeout(20000);

let dbAvailable = false;
let app;

beforeAll(async () => {
  const testUri = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-study-companion-test';
  try {
    await mongoose.connect(testUri, {
      serverSelectionTimeoutMS: 10000,
    });
    dbAvailable = true;
    app = require('../app');
    console.log('[auth.integration.test] Connected -- running integration tests for real.');
  } catch (err) {
    dbAvailable = false;
    console.warn('[auth.integration.test] Skipping: no reachable MongoDB (' + err.message + ')');
  }
});

afterAll(async () => {
  if (dbAvailable) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

describe('Auth + isolation (integration)', () => {
  const email = `test_${Date.now()}@example.com`;
  const password = 'password123';
  let token;
  let otherToken;

  test('registers a new user', async () => {
    if (!dbAvailable) return;
    const res = await request(app).post('/api/auth/register').send({ name: 'Test User', email, password });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    token = res.body.token;
  });

  test('rejects duplicate registration', async () => {
    if (!dbAvailable) return;
    const res = await request(app).post('/api/auth/register').send({ name: 'Test User', email, password });
    expect(res.status).toBe(409);
  });

  test('rejects invalid login', async () => {
    if (!dbAvailable) return;
    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('logs in with correct credentials', async () => {
    if (!dbAvailable) return;
    const res = await request(app).post('/api/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  test('rejects unauthenticated access to /api/spaces', async () => {
    if (!dbAvailable) return;
    const res = await request(app).get('/api/spaces');
    expect(res.status).toBe(401);
  });

  test('creates a Space and Project for the authenticated user', async () => {
    if (!dbAvailable) return;
    const spaceRes = await request(app)
      .post('/api/spaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Space', description: 'desc' });
    expect(spaceRes.status).toBe(201);

    const projectRes = await request(app)
      .post(`/api/spaces/${spaceRes.body.space._id}/projects`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Project', goal: 'Learn testing' });
    expect(projectRes.status).toBe(201);
  });

  test("a second user cannot see the first user's Spaces (data isolation)", async () => {
    if (!dbAvailable) return;
    const otherEmail = `other_${Date.now()}@example.com`;
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Other User', email: otherEmail, password });
    otherToken = registerRes.body.token;

    const res = await request(app).get('/api/spaces').set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(200);
    expect(res.body.spaces.length).toBe(0);
  });
});