import { frontend } from './comun.js';

export const options = {
  scenarios: {
    entrega_front: {
      executor: 'constant-arrival-rate', rate: Number(__ENV.ASIS_QA_RPS || 5),
      timeUnit: '1s', duration: __ENV.ASIS_QA_DURACION || '30s',
      preAllocatedVUs: 5, maxVUs: 20,
    },
  },
  thresholds: {
    checks: ['rate>0.98'],
    http_req_failed: ['rate<0.02'],
    'http_req_duration{componente:frontend}': ['p(95)<1500'],
  },
};

export default function () { frontend(); }
