#!/usr/bin/env bash
# Uso: bash qa/scripts/probar_frontend.sh (desde la raíz del proyecto; Node >=20 recomendado).
set -euo pipefail
cd FrontEnd
npm install --save-dev 'vitest@^2.1.9' 'jsdom@^24.1.3' \
  '@testing-library/react@^16.0.0' '@testing-library/jest-dom@^6.0.0' \
  '@testing-library/user-event@^14.0.0' 'axios-mock-adapter@^2.1.0' \
  '@playwright/test@^1.56.0' '@vitest/coverage-v8@^2.1.9'
npx vitest run --config vitest.config.js
npx playwright install chromium
npx playwright test --config playwright.config.js
