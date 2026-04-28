import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const apiDuration = new Trend('api_duration');
const errorRate = new Rate('error_rate');
const successRate = new Rate('success_rate');
const requestCounter = new Counter('request_count');
const concurrentUsers = new Gauge('concurrent_users');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';
const BUSINESS_ID = __ENV.BUSINESS_ID || 'test-business-123';
const API_KEY = __ENV.API_KEY || 'test-api-key';

export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp-up to 10 users
    { duration: '3m', target: 25 },   // Ramp-up to 25 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '3m', target: 25 },   // Ramp-down to 25 users
    { duration: '2m', target: 0 },    // Ramp-down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(99)<500', 'p(95)<300'],
    'http_req_failed': ['rate<0.1'],
    'error_rate': ['rate<0.1'],
  },
};

export default function () {
  const authHeaders = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };

  group('Load Test - API Endpoints', () => {
    // Simulate API calls
    const res = http.get(`${BASE_URL}/api/health`, { headers: authHeaders });
    check(res, {
      'Health check': (r) => r.status === 200,
    });
    
    apiDuration.add(res.timings.duration);
    requestCounter.add(1);
    
    if (res.status !== 200) {
      errorRate.add(1);
    } else {
      successRate.add(1);
    }
  });

  concurrentUsers.set(__VU);
  sleep(1);
}
