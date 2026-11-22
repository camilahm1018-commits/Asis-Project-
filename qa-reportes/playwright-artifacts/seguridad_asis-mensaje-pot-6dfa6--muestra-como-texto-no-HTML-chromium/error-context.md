# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: seguridad_asis.spec.js >> mensaje potencialmente malicioso del servidor se muestra como texto, no HTML
- Location: e2e/seguridad_asis.spec.js:15:1

# Error details

```
Error: locator.fill: Error: strict mode violation: getByLabel('Contraseña') resolved to 2 elements:
    1) <input value="" required="" type="password" id="contrasena_usuario" placeholder="Contraseña" name="contrasena_usuario"/> aka getByRole('textbox', { name: 'Contraseña' })
    2) <button type="button" title="Mostrar contraseña" class="btnMostrarContrasena" aria-label="Mostrar contraseña">👁️</button> aka getByRole('button', { name: 'Mostrar contraseña' })

Call log:
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
        - textbox "Correo" [active] [ref=e25]:
          - /placeholder: usuario@sena.edu.co
          - text: test@example.test
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
  1  | // Las pruebas se hacen en el navegador local; no envían datos peligrosos a BD.
  2  | import { test, expect } from '@playwright/test';
  3  | 
  4  | test('sin sesión no permite visitar páginas administrativas', async ({ page }) => {
  5  |   await page.goto('/administrador/usuarios');
  6  |   await expect(page).toHaveURL(/\/login$/);
  7  | });
  8  | 
  9  | test('no hay token guardado antes de iniciar sesión', async ({ page }) => {
  10 |   await page.goto('/login');
  11 |   const token = await page.evaluate(() => localStorage.getItem('access_token'));
  12 |   expect(token).toBeNull();
  13 | });
  14 | 
  15 | test('mensaje potencialmente malicioso del servidor se muestra como texto, no HTML', async ({ page }) => {
  16 |   const payload = '<img src=x onerror="window.__ASIS_XSS_QA=true">';
  17 |   await page.addInitScript(() => { window.__ASIS_XSS_QA = false; });
  18 |   await page.route('**/auth/login', async (route) => {
  19 |     await route.fulfill({
  20 |       status: 401,
  21 |       contentType: 'application/json',
  22 |       body: JSON.stringify({ detail: payload }),
  23 |     });
  24 |   });
  25 |   await page.goto('/login');
  26 |   await page.getByLabel('Correo').fill('test@example.test');
> 27 |   await page.getByLabel('Contraseña').fill('clave-incorrecta');
     |                                       ^ Error: locator.fill: Error: strict mode violation: getByLabel('Contraseña') resolved to 2 elements:
  28 |   await page.getByRole('button', { name: /continuar/i }).click();
  29 |   await expect(page.getByText(payload, { exact: true })).toBeVisible();
  30 |   expect(await page.evaluate(() => window.__ASIS_XSS_QA)).toBe(false);
  31 |   expect(await page.locator('img[onerror]').count()).toBe(0);
  32 |   expect(await page.evaluate(() => localStorage.getItem('access_token'))).toBeNull();
  33 | });
  34 | 
```