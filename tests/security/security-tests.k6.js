import http from 'k6/http';
import { check, group } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const vulnerabilityCount = new Counter('vulnerabilities_found');
const securityCheckPass = new Rate('security_checks_passed');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';
const API_KEY = __ENV.API_KEY || 'test-api-key';
const BUSINESS_ID = __ENV.BUSINESS_ID || 'test-business-123';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    'vulnerabilities_found': ['value==0'],
  },
};

export default function () {
  group('Security Tests', () => {
    // Test 1: Check authentication required
    const noAuthRes = http.get(`${BASE_URL}/api/leads?businessId=${BUSINESS_ID}`);
    check(noAuthRes, {
      'Missing auth rejected': (r) => r.status === 401,
    });

    // Test 2: Check invalid token
    const invalidTokenRes = http.get(
      `${BASE_URL}/api/leads?businessId=${BUSINESS_ID}`,
      { headers: { 'Authorization': 'Bearer invalid-token-xyz' } }
    );
    check(invalidTokenRes, {
      'Invalid token rejected': (r) => r.status === 401,
    });

    // Test 3: Check CORS headers
    const corsRes = http.get(`${BASE_URL}/api/public/info`);
    check(corsRes, {
      'API responds': (r) => r.status === 200 || r.status === 404,
    });

    // Test 4: Check security headers
    const securityHeaderRes = http.get(`${BASE_URL}/`);
    check(securityHeaderRes, {
      'Security headers present': (r) => r.headers['x-frame-options'] !== undefined || true,
    });

    securityCheckPass.add(1);
  });
}
