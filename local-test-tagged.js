import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 30,
  duration: '30s',
  thresholds: {
    'http_req_duration{endpoint:fast}': ['p(95)<500'],
    'http_req_duration{endpoint:slow}': ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const fast = http.get('http://127.0.0.1:8080/fast', {
    tags: { endpoint: 'fast' },
  });
  const slow = http.get('http://127.0.0.1:8080/slow', {
    tags: { endpoint: 'slow' },
  });

  check(fast, { '/fast status 200': (r) => r.status === 200 });
  check(slow, { '/slow status 200': (r) => r.status === 200 });
  sleep(1);
}
