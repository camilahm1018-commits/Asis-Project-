const { test, expect } = require('@playwright/test');

test('Flujo E2E: Inicio de sesión y gestión de tickets', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  // Ingresar credenciales
  await page.fill('input[name="username"]', 'admin_test');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Validar acceso al panel
  await expect(page).toHaveURL('http://localhost:5173/dashboard');

  // Crear ticket
  await page.click('text=Nuevo Ticket');
  await page.fill('input[name="titulo"]', 'Prueba Automatizada E2E');
  await page.click('button:has-text("Guardar")');

  // Verificar visibilidad
  await expect(page.locator('text=Prueba Automatizada E2E')).toBeVisible();
});