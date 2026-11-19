import { defineConfig, devices } from '@playwright/test';
import { ENV, PATHS, TIMEOUTS, VISUAL } from './constants';

const SETUP_PROJECT = 'setup';
const VISUAL_SPEC = /.*\.visual\.spec\.ts/;
const CI_RETRIES = 2;
const CI_WORKERS = 2;

export default defineConfig({
  testDir: '.',
  testMatch: '**/specs/**/*.spec.ts',
  timeout: TIMEOUTS.test,
  expect: { timeout: TIMEOUTS.expect },
  fullyParallel: false,
  forbidOnly: ENV.isCI,
  retries: ENV.isCI ? CI_RETRIES : 0,
  workers: ENV.isCI ? CI_WORKERS : 1,
  snapshotPathTemplate: '{testDir}/specs/visual/__snapshots__/{projectName}/{arg}{ext}',
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: ENV.baseUrl,
    navigationTimeout: TIMEOUTS.navigation,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'vi-VN',
  },

  projects: [
    {
      name: SETUP_PROJECT,
      testMatch: '**/fixtures/auth.setup.ts',
    },
    {
      name: 'demo',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/specs/demo/**/*.spec.ts',
    },
    {
      name: 'roles',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/specs/roles/**/*.spec.ts',
      dependencies: [SETUP_PROJECT],
    },
    {
      name: 'lifecycle',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/specs/lifecycle/**/*.spec.ts',
      dependencies: [SETUP_PROJECT],
    },
    {
      name: 'guest',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/specs/roles/guest.spec.ts',
    },
    {
      name: 'customer',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/specs/roles/customer.spec.ts',
      dependencies: [SETUP_PROJECT],
    },
    {
      name: 'employee',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/specs/roles/employee.spec.ts',
      dependencies: [SETUP_PROJECT],
    },
    {
      name: 'admin',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/specs/roles/admin.spec.ts',
      dependencies: [SETUP_PROJECT],
    },
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: VISUAL_SPEC,
      dependencies: [SETUP_PROJECT],
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
      testIgnore: VISUAL_SPEC,
      dependencies: [SETUP_PROJECT],
    },
    {
      name: 'visual',
      use: { ...devices['Desktop Chrome'], viewport: VISUAL.desktopViewport },
      testMatch: VISUAL_SPEC,
      dependencies: [SETUP_PROJECT],
    },
    {
      name: 'visual-mobile',
      use: { ...devices['Pixel 5'] },
      testMatch: VISUAL_SPEC,
      dependencies: [SETUP_PROJECT],
    },
  ],

  webServer: ENV.startServers
    ? [
        {
          command: 'npm run start:dev',
          cwd: PATHS.backendDir,
          url: ENV.apiUrl,
          reuseExistingServer: true,
          timeout: TIMEOUTS.webServer,
        },
        {
          command: 'npm run dev',
          cwd: PATHS.frontendDir,
          url: ENV.baseUrl,
          reuseExistingServer: true,
          timeout: TIMEOUTS.webServer,
        },
      ]
    : undefined,
});
