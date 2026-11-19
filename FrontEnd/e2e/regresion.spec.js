import { test, expect } from '@playwright/test';

test('página de login muestra correo, contraseña y continuar', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByLabel('Correo')).toBeVisible();
  await expect(page.getByLabel('Contraseña')).toBeVisible();
  await expect(page.getByRole('button', { name: /continuar/i })).toBeVisible();
});

test('rutas privadas exigen iniciar sesión', async ({ page }) => {
  for (const ruta of [
    '/administrador/usuarios', '/mesa-ayuda/panel', '/tecnico/disponibles',
    '/instructor/reportar', '/cuentadante/inventario',
  ]) {
    await page.goto(ruta);
    await expect(page).toHaveURL(/\/login$/);
  }
});

test('error 401 del login aparece en la interfaz', async ({ page }) => {
  await page.route('**/auth/login', async route => {
    await route.fulfill({
      status: 401, contentType: 'application/json',
      body: JSON.stringify({ detail: 'Correo o contraseña incorrectos' }),
    });
  });
  await page.goto('/login');
  await page.getByLabel('Correo').fill('qa@example.test');
  await page.getByLabel('Contraseña').fill('clave-incorrecta');
  await page.getByRole('button', { name: /continuar/i }).click();
  await expect(page.getByText('Correo o contraseña incorrectos')).toBeVisible();
});

test('login completo con backend (opcional, cuenta de QA)', async ({ page }) => {
  test.skip(!process.env.ASIS_QA_EMAIL || !process.env.ASIS_QA_PASSWORD,
    'Faltan ASIS_QA_EMAIL / ASIS_QA_PASSWORD de una cuenta DE PRUEBAS');
  await page.goto('/login');
  await page.getByLabel('Correo').fill(process.env.ASIS_QA_EMAIL);
  await page.getByLabel('Contraseña').fill(process.env.ASIS_QA_PASSWORD);
  await page.getByRole('button', { name: /continuar/i }).click();
  await expect.poll(async () => page.evaluate(() => localStorage.getItem('access_token'))).toBeTruthy();
  await expect(page).not.toHaveURL(/\/login$/);
});
