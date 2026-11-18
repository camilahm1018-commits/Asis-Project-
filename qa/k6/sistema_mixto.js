import { backend, frontend } from './comun.js';

// Carga simultánea de entrega del FrontEnd y lecturas del Backend.
export const options = {
  scenarios: {
    backend: {
      executor: 'constant-arrival-rate', exec: 'probarBackend',
      rate: 3, timeUnit: '1s', duration: '30s', preAllocatedVUs: 3, maxVUs: 12,
    },
    frontend: {
      executor: 'constant-arrival-rate', exec: 'probarFrontend',
      rate: 3, timeUnit: '1s', duration: '30s', preAllocatedVUs: 3, maxVUs: 12,
    },
  },
  thresholds: { checks: ['rate>0.98'], http_req_failed: ['rate<0.02'] },
};

export function probarBackend() { backend(); }
export function probarFrontend() { frontend(); }
