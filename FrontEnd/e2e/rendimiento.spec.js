import { test, expect } from '@playwright/test';

// Rendimiento REAL en navegador (no confundir con k6: entrega de HTML/JS/CSS).
test('el login cumple presupuesto de carga en navegador local', async ({ page }) => {
  const response = await page.goto('/login', { waitUntil: 'load' });
  expect(response?.status()).toBe(200);
  await expect(page.getByLabel('Correo')).toBeVisible();

  const metricas = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0];
    const fcp = performance.getEntriesByType('paint').find(x => x.name === 'first-contentful-paint');
    return {
      domContentLoadedMs: n?.domContentLoadedEventEnd ?? -1,
      loadMs: n?.loadEventEnd ?? -1,
      firstContentfulPaintMs: fcp?.startTime ?? -1,
    };
  });
  console.log('Métricas navegador ASIS:', JSON.stringify(metricas));
  expect(metricas.domContentLoadedMs).toBeGreaterThanOrEqual(0);
  expect(metricas.loadMs).toBeGreaterThanOrEqual(0);
  expect(metricas.loadMs).toBeLessThan(Number(process.env.ASIS_QA_MAX_LOAD_MS || 10000));
  if (metricas.firstContentfulPaintMs >= 0) {
    expect(metricas.firstContentfulPaintMs).toBeLessThan(Number(process.env.ASIS_QA_MAX_FCP_MS || 6000));
  }
});
