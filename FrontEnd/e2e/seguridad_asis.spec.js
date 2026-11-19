// Las pruebas se hacen en el navegador local; no envían datos peligrosos a BD.
import { test, expect } from '@playwright/test';

test('sin sesión no permite visitar páginas administrativas', async ({ page }) => {
  await page.goto('/administrador/usuarios');
  await expect(page).toHaveURL(/\/login$/);
});

test('no hay token guardado antes de iniciar sesión', async ({ page }) => {
  await page.goto('/login');
  const token = await page.evaluate(() => localStorage.getItem('access_token'));
  expect(token).toBeNull();
});

test('mensaje potencialmente malicioso del servidor se muestra como texto, no HTML', async ({ page }) => {
  const payload = '<img src=x onerror="window.__ASIS_XSS_QA=true">';
  await page.addInitScript(() => { window.__ASIS_XSS_QA = false; });
  await page.route('**/auth/login', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ detail: payload }),
    });
  });
  await page.goto('/login');
  await page.getByLabel('Correo').fill('test@example.test');
  await page.getByLabel('Contraseña').fill('clave-incorrecta');
  await page.getByRole('button', { name: /continuar/i }).click();
  await expect(page.getByText(payload, { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__ASIS_XSS_QA)).toBe(false);
  expect(await page.locator('img[onerror]').count()).toBe(0);
  expect(await page.evaluate(() => localStorage.getItem('access_token'))).toBeNull();
});
