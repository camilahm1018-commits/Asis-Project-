import { backend } from './comun.js';

export const options = {
  scenarios: {
    stress_backend: {
      executor: 'ramping-vus',
      stages: [
        { duration: '20s', target: 5 },
        { duration: '30s', target: 15 },
        { duration: '30s', target: 30 },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    checks: ['rate>0.95'],
    http_req_failed: ['rate<0.05'],
    'http_req_duration{componente:backend}': ['p(95)<3500'],
  },
};

export default function () { backend(); }
