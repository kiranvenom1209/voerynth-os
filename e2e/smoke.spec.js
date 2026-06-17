import { expect, test } from '@playwright/test';

const liveHubUrl = process.env.VOERYNTH_HA_URL;
const liveHubToken = process.env.VOERYNTH_HA_TOKEN;

const markSetupComplete = async (page) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('voerynth_setup_completed', 'true');
  });
};

const seedLiveCredentials = async (page) => {
  await page.addInitScript(({ url, token }) => {
    window.localStorage.setItem('voerynth_setup_completed', 'true');
    window.localStorage.setItem('voerynth_ha_url', url);
    window.localStorage.setItem('voerynth_ha_token', token);
  }, { url: liveHubUrl, token: liveHubToken });
};

test('first-time setup opens on the branded welcome screen', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('button', { name: /get started/i })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Vite');
  await expect(page).toHaveTitle(/Vœrynth OS/);
});

test('settings detail deep link refreshes into the offline login state', async ({ page }) => {
  await markSetupComplete(page);
  await page.goto('/#/settings/devices-services');

  await expect(page).toHaveURL(/#\/settings\/devices-services$/);
  await expect(page.getByText(/system offline/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /connect to system/i })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Vite');

  await page.getByRole('button', { name: /connect to system/i }).click();
  await page.getByRole('button', { name: /^connect$/i }).click();
  await expect(page.getByText(/enter the control hub url and access token/i)).toBeVisible();
});

test.describe('live Control Hub sidebar navigation', () => {
  test.skip(!liveHubUrl || !liveHubToken, 'Set VOERYNTH_HA_URL and VOERYNTH_HA_TOKEN to run live navigation smoke tests.');

  test('desktop sidebar navigates primary routes', async ({ page }) => {
    await seedLiveCredentials(page);
    await page.goto('/#/');

    await expect(page.getByText(/system offline/i)).toBeHidden({ timeout: 30000 });
    await page.getByRole('button', { name: /lights/i }).click();
    await expect(page).toHaveURL(/#\/lights$/);
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page).toHaveURL(/#\/settings$/);
  });

  test('mobile sidebar can open and navigate', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedLiveCredentials(page);
    await page.goto('/#/');

    await expect(page.getByText(/system offline/i)).toBeHidden({ timeout: 30000 });
    await page.getByRole('button', { name: /open menu|close menu/i }).click();
    await page.getByRole('button', { name: /media/i }).click();
    await expect(page).toHaveURL(/#\/media$/);
  });
});
