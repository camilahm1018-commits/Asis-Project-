import { test, expect } from '@playwright/test';

const perfiles = [
  ['administrador', '/administrador'],
  ['administrador_mesa_ayuda', '/mesa-ayuda/panel'],
  ['tecnico', '/tecnico'],
  ['instructor', '/instructor'],
  ['cuentadante', '/cuentadante'],
];

for (const [rol, ruta] of perfiles) {
  test(`login simulado: ${rol} redirige a ${ruta}`, async ({ page }) => {
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access_token: 'token-ficticio-qa', id_usuario: 100, rol, nombre: 'QA' }),
      });
    });
    // Las pantallas pueden pedir datos. No usar API ni PostgreSQL reales en este E2E simulado.
    await page.route('**/auth/yo', route => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ id_usuario: 100, nombre: 'QA', rol }),
    }));
    await page.route('**/tickets/**', route => route.fulfill({
      status: 200, contentType: 'application/json', body: '[]',
    }));
    await page.goto('/login');
    await page.getByLabel('Correo').fill('qa@example.test');
    await page.getByLabel('Contraseña').fill('SoloPrueba#2026');
    await page.getByRole('button', { name: /continuar/i }).click();
    await expect(page).toHaveURL(new RegExp(`${ruta.replaceAll('/', '\\/')}(?:$|[/?#])`));
    await expect.poll(() => page.evaluate(() => localStorage.getItem('access_token'))).toBe('token-ficticio-qa');
  });
}
