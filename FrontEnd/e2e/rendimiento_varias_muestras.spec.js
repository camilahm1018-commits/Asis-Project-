import { test, expect } from '@playwright/test';

// Tres observaciones de navegador real: útiles para tendencias, no representan carga concurrente.
test('muestras de DOMContentLoaded de login', async ({ page }) => {
  const muestras = [];
  for (let i = 0; i < 3; i++) {
    const respuesta = await page.goto('/login', { waitUntil: 'load' });
    expect(respuesta?.status()).toBe(200);
    await expect(page.getByLabel('Correo')).toBeVisible();
    const ms = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation').at(-1);
      return nav?.domContentLoadedEventEnd ?? -1;
    });
    expect(ms).toBeGreaterThanOrEqual(0);
    muestras.push(ms);
  }
  const ordenadas = [...muestras].sort((a, b) => a - b);
  const mediana = ordenadas[1];
  const p95aprox = ordenadas[2]; // con 3 muestras es solo una aproximación
  console.log(JSON.stringify({
    prueba: 'ASIS login', muestrasMs: muestras, medianaMs: mediana, maxMs: p95aprox,
  }));
  if (process.env.ASIS_QA_MAX_DOM_MS) {
    expect(p95aprox).toBeLessThan(Number(process.env.ASIS_QA_MAX_DOM_MS));
  }
});
