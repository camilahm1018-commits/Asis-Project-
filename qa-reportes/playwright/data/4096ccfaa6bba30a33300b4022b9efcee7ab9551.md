# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login_simulado_qa.spec.js >> login simulado: cuentadante redirige a /cuentadante
- Location: e2e/login_simulado_qa.spec.js:12:3

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
          - text: qa@example.test
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
  3  | const perfiles = [
  4  |   ['administrador', '/administrador'],
  5  |   ['administrador_mesa_ayuda', '/mesa-ayuda/panel'],
  6  |   ['tecnico', '/tecnico'],
  7  |   ['instructor', '/instructor'],
  8  |   ['cuentadante', '/cuentadante'],
  9  | ];
  10 | 
  11 | for (const [rol, ruta] of perfiles) {
  12 |   test(`login simulado: ${rol} redirige a ${ruta}`, async ({ page }) => {
  13 |     await page.route('**/auth/login', async route => {
  14 |       await route.fulfill({
  15 |         status: 200,
  16 |         contentType: 'application/json',
  17 |         body: JSON.stringify({ access_token: 'token-ficticio-qa', id_usuario: 100, rol, nombre: 'QA' }),
  18 |       });
  19 |     });
  20 |     // Las pantallas pueden pedir datos. No usar API ni PostgreSQL reales en este E2E simulado.
  21 |     await page.route('**/auth/yo', route => route.fulfill({
  22 |       status: 200, contentType: 'application/json',
  23 |       body: JSON.stringify({ id_usuario: 100, nombre: 'QA', rol }),
  24 |     }));
  25 |     await page.route('**/tickets/**', route => route.fulfill({
  26 |       status: 200, contentType: 'application/json', body: '[]',
  27 |     }));
  28 |     await page.goto('/login');
  29 |     await page.getByLabel('Correo').fill('qa@example.test');
> 30 |     await page.getByLabel('Contraseña').fill('SoloPrueba#2026');
     |                                         ^ Error: locator.fill: Error: strict mode violation: getByLabel('Contraseña') resolved to 2 elements:
  31 |     await page.getByRole('button', { name: /continuar/i }).click();
  32 |     await expect(page).toHaveURL(new RegExp(`${ruta.replaceAll('/', '\\/')}(?:$|[/?#])`));
  33 |     await expect.poll(() => page.evaluate(() => localStorage.getItem('access_token'))).toBe('token-ficticio-qa');
  34 |   });
  35 | }
  36 | 
```