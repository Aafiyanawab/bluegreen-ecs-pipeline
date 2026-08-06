const request = require('supertest');
const app     = require('../app');

// ─────────────────────────────────────────────────────────
// WHY THESE TESTS EXIST:
//
// This is a CI quality gate, not a unit test suite.
// These 8 tests protect the Jenkins pipeline from
// deploying broken code to ECS Fargate.
//
// If ANY test fails:
//   → Docker image is NOT built
//   → Nothing is pushed to ECR
//   → ECS deployment does NOT happen
//   → Users are never affected
// ─────────────────────────────────────────────────────────

describe('CI Quality Gate — BlueGreen Pipeline', () => {

  // TEST 1
  // Basic availability check.
  // If home page returns non-200, app is broken.
  test('GET / returns HTTP 200', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
  });

  // TEST 2
  // ALB and CodeDeploy call /health before shifting traffic.
  // If this returns non-200, CodeDeploy rolls back automatically.
  test('GET /health returns HTTP 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  // TEST 3
  // CodeDeploy checks this value to confirm container is healthy.
  // status must be exactly "healthy" — not "ok", not "running".
  test('/health returns status = healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.body.status).toBe('healthy');
  });

  // TEST 4
  // Jenkins verifies version after deployment.
  // Confirms the correct Docker image is running.
  test('GET /version returns version field', async () => {
    const res = await request(app).get('/version');
    expect(res.status).toBe(200);
    expect(res.body.version).toBeDefined();
  });

  // TEST 5
  // Confirms environment variables are passed correctly
  // from ECS task definition to running container.
  test('GET /version returns deployment color', async () => {
    const res = await request(app).get('/version');
    expect(res.body.color).toBeDefined();
  });

  // TEST 6
  // Unknown routes must return 404.
  // Prevents silent failures on misconfigured ALB routing rules.
  test('Unknown route returns HTTP 404', async () => {
    const res = await request(app).get('/nonexistent-route');
    expect(res.status).toBe(404);
  });

  // TEST 7
  // Version must follow vX.X.X format.
  // Enforces versioning discipline in the pipeline.
  // A malformed version tag means wrong image was built.
  test('Version follows vX.X.X format', async () => {
    const res = await request(app).get('/version');
    expect(res.body.version).toMatch(/^v\d+\.\d+\.\d+$/);
  });

  // TEST 8
  // Color must be exactly blue or green.
  // Any other value means ECS task definition
  // environment variables are misconfigured.
  test('Deployment color is blue or green', async () => {
    const res = await request(app).get('/health');
    expect(['blue', 'green']).toContain(res.body.color);
  });

});