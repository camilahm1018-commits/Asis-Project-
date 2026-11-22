# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: regresion.spec.js >> página de login muestra correo, contraseña y continuar
- Location: e2e/regresion.spec.js:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByLabel('Contraseña')
Expected: visible
Error: strict mode violation: getByLabel('Contraseña') resolved to 2 elements:
    1) <input value="" required="" type="password" id="contrasena_usuario" placeholder="Contraseña" name="contrasena_usuario"/> aka getByRole('textbox', { name: 'Contraseña' })
    2) <button type="button" title="Mostrar contraseña" class="btnMostrarContrasena" aria-label="Mostrar contraseña">👁️</button> aka getByRole('button', { name: 'Mostrar contraseña' })

Call log:
  - Expect "toBeVisible" getByLabel('Contraseña') with timeout 5000ms
  - waiting for getByLabel('Contraseña')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - generic [ref=e4]:
      - img "ASIS" [ref=e6]
      - navigation [ref=e7]:
        - list [ref=e9]:
          - listitem [ref=e10]:
            - link "Nosotros" [ref=e11] [cursor=pointer]:
              - /url: /nosotros
          - listitem [ref=e12]:
            - link "Contáctanos" [ref=e13] [cursor=pointer]:
              - /url: /contactanos
        - generic [ref=e14]:
          - button "☀️" [ref=e15] [cursor=pointer]
          - link "Registrarse" [ref=e16] [cursor=pointer]:
            - /url: /registrarse
  - generic [ref=e17]:
    - heading "INGRESO DE USUARIOS" [level=3] [ref=e19]
    - generic [ref=e20]:
      - generic [ref=e21]:
        - heading "INICIAR SESIÓN" [level=1] [ref=e22]
        - generic [ref=e23]: Correo
        - textbox "Correo" [ref=e25]:
          - /placeholder: usuario@sena.edu.co
        - generic [ref=e26]: Contraseña
        - generic [ref=e27]:
          - textbox "Contraseña" [ref=e28]
          - button "Mostrar contraseña" [ref=e29] [cursor=pointer]: 👁️
        - button "Continuar" [ref=e30] [cursor=pointer]
        - button "Iniciar sesión con Google" [ref=e32] [cursor=pointer]
      - paragraph [ref=e38]:
        - text: ¿No tienes una cuenta?
        - link "Regístrate" [ref=e39] [cursor=pointer]:
          - /url: /registrarse
      - paragraph [ref=e40]:
        - link "¿Olvidaste tu contraseña?" [ref=e41] [cursor=pointer]:
          - /url: /recuperar
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('página de login muestra correo, contraseña y continuar', async ({ page }) => {
  4  |   await page.goto('/login');
  5  |   await expect(page.getByLabel('Correo')).toBeVisible();
> 6  |   await expect(page.getByLabel('Contraseña')).toBeVisible();
     |                                               ^ Error: expect(locator).toBeVisible() failed
  7  |   await expect(page.getByRole('button', { name: /continuar/i })).toBeVisible();
  8  | });
  9  | 
  10 | test('rutas privadas exigen iniciar sesión', async ({ page }) => {
  11 |   for (const ruta of [
  12 |     '/administrador/usuarios', '/mesa-ayuda/panel', '/tecnico/disponibles',
  13 |     '/instructor/reportar', '/cuentadante/inventario',
  14 |   ]) {
  15 |     await page.goto(ruta);
  16 |     await expect(page).toHaveURL(/\/login$/);
  17 |   }
  18 | });
  19 | 
  20 | test('error 401 del login aparece en la interfaz', async ({ page }) => {
  21 |   await page.route('**/auth/login', async route => {
  22 |     await route.fulfill({
  23 |       status: 401, contentType: 'application/json',
  24 |       body: JSON.stringify({ detail: 'Correo o contraseña incorrectos' }),
  25 |     });
  26 |   });
  27 |   await page.goto('/login');
  28 |   await page.getByLabel('Correo').fill('qa@example.test');
  29 |   await page.getByLabel('Contraseña').fill('clave-incorrecta');
  30 |   await page.getByRole('button', { name: /continuar/i }).click();
  31 |   await expect(page.getByText('Correo o contraseña incorrectos')).toBeVisible();
  32 | });
  33 | 
  34 | test('login completo con backend (opcional, cuenta de QA)', async ({ page }) => {
  35 |   test.skip(!process.env.ASIS_QA_EMAIL || !process.env.ASIS_QA_PASSWORD,
  36 |     'Faltan ASIS_QA_EMAIL / ASIS_QA_PASSWORD de una cuenta DE PRUEBAS');
  37 |   await page.goto('/login');
  38 |   await page.getByLabel('Correo').fill(process.env.ASIS_QA_EMAIL);
  39 |   await page.getByLabel('Contraseña').fill(process.env.ASIS_QA_PASSWORD);
  40 |   await page.getByRole('button', { name: /continuar/i }).click();
  41 |   await expect.poll(async () => page.evaluate(() => localStorage.getItem('access_token'))).toBeTruthy();
  42 |   await expect(page).not.toHaveURL(/\/login$/);
  43 | });
  44 | 
```