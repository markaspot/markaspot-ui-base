

import { test, expect } from '@playwright/test';


const mockRequests = [
  {
    service_request_id: '01-2025',
    title: 'Test Request 1',
    description: 'Description 1',
    lat: 50.941357,
    long: 6.958307,
    address_string: 'Cologne, Germany',
    service_name: 'Test Service',
    requested_datetime: '2025-07-27T12:00:00Z',
    status: 'open',
    media_url: 'https://example.com/image1.jpg,https://example.com/image2.jpg', 
    service_code: 'TEST',
    extended_attributes: {
      markaspot: {
        category_hex: '#ff0000',
        category_icon: 'map-marker',
        status_hex: '#00ff00',
        status_descriptive_name: 'Open',
        status_notes: [
          {
            status_descriptive_name: 'In Progress',
            status_hex: '#ffaa00',
            status_icon: 'wrench',
            status_note: 'Working on this issue',
            updated_datetime: '2025-07-28T14:00:00Z'
          }
        ],
      },
    },
  },
  {
    service_request_id: '02-2025',
    title: 'Test Request 2',
    description: 'Description 2',
    lat: 51.941357,
    long: 7.958307,
    address_string: 'Münster, Germany',
    service_name: 'Test Service 2',
    requested_datetime: '2024-07-28T12:00:00Z',
    status: 'open',
    media_url: null,
    service_code: 'TEST',
    extended_attributes: {
      markaspot: {
        category_hex: '#0000ff',
        category_icon: 'map-marker',
        status_hex: '#00ff00',
        status_descriptive_name: 'Open',
        status_notes: [],
      },
    },
  },
];


const setupApiMocks = async (page) => {
  
  await page.route('**/settings**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        title: 'Mark-a-Spot Test',
        center_lat: '50.941357',
        center_lng: '6.958307',
        zoom_initial: '13',
        mapbox_style: 'https://api.maptiler.com/maps/streets/style.json?key=test',
        mapbox_style_dark: 'https://api.maptiler.com/maps/streets-dark/style.json?key=test',
        features: {
          voting: true
        }
      })
    });
  });

  
  await page.route('**/requests**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockRequests)
    });
  });

  
  await page.route('**/geocode/reverse**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        display_name: 'Test Location',
        address: {
          road: 'Test Street',
          housenumber: '123',
          city: 'Test City',
          postcode: '12345'
        }
      })
    });
  });

  
  await page.route('**/service_definition**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          service_code: 'CATEGORY1',
          service_name: 'Category 1',
          description: 'Test Category 1',
          metadata: true,
          type: 'realtime',
          keywords: 'test, category, 1',
          group: 'Test Group',
          extended_attributes: {
            markaspot: {
              category_hex: '#ff0000',
              category_icon: 'map-marker'
            }
          }
        },
        {
          service_code: 'CATEGORY2',
          service_name: 'Category 2',
          description: 'Test Category 2',
          metadata: true,
          type: 'realtime',
          keywords: 'test, category, 2',
          group: 'Test Group',
          extended_attributes: {
            markaspot: {
              category_hex: '#0000ff',
              category_icon: 'map-marker'
            }
          }
        }
      ])
    });
  });
};

test.describe('Mark-a-Spot E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    
    await setupApiMocks(page);
    
    
    
    
    try {
      await page.goto('/', { 
        timeout: 30000,
        waitUntil: 'domcontentloaded' 
      });
    } catch (error) {
      console.error(`Navigation error: ${error.message}`);
      
    }
    
    
    try {
      await page.waitForSelector('#__nuxt', {
        state: 'attached',
        timeout: 20000
      });
    } catch (error) {
      console.warn(`App mounting error: ${error.message}`);
      
    }
  });

  test('Main navigation and UI elements are displayed correctly', async ({ page }) => {
    
    await page.waitForTimeout(5000);
    
    
    await expect(page.locator('button', { hasText: 'Photo Report' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button', { hasText: 'Classic Report' })).toBeVisible({ timeout: 15000 });
    
    
    await expect(page.locator('.map-container')).toBeVisible({ timeout: 15000 });
    
    
    await expect(page.locator('button[aria-label="Zoom in"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button[aria-label="Zoom out"]')).toBeVisible({ timeout: 15000 });
  });

  test('Photo Report button opens form dialog', async ({ page }) => {
    
    await page.waitForTimeout(5000);
    
    
    await page.locator('button', { hasText: 'Photo Report' }).click({ timeout: 15000 });
    
    
    await expect(page.locator('div.bg-white')).toBeVisible({ timeout: 15000 });
    
    
    await expect(page.getByRole('button', { name: 'Close' })).toBeVisible({ timeout: 15000 });
  });

  test('Map interaction and marker placement', async ({ page }) => {
    
    await page.waitForTimeout(5000);
    
    
    await page.locator('.map-container').click({
      position: { x: 300, y: 300 },
      timeout: 15000
    });
    
    
    await page.waitForTimeout(2000);
    
    
    await expect(page.locator('div.bg-white', { hasText: 'Test Location' })).toBeVisible({ timeout: 15000 });
    
    
    await expect(page.locator('button', { hasText: 'Photo' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button', { hasText: 'Classic' })).toBeVisible({ timeout: 15000 });
  });

  test('Request details display and interaction', async ({ page }) => {
    
    const markers = page.locator('.maplibregl-canvas');
    
    
    await page.evaluate(() => {
      
      const mapContainer = document.querySelector('.map-container');
      if (mapContainer) {
        const event = new MouseEvent('click', {
          bubbles: true,
          clientX: 300,
          clientY: 300
        });
        mapContainer.dispatchEvent(event);
      }
    });
    
    
    await page.locator('button', { hasText: 'Photo' }).click();
    
    
    await expect(page.locator('div.bg-white')).toBeVisible();
    
    
    await page.getByRole('button', { name: 'Close' }).click();
    
    
    await page.locator('.map-container').click({
      position: { x: 350, y: 350 }
    });
    
    
    await expect(page.locator('div.bg-white', { hasText: 'Test Location' })).toBeVisible();
  });

  test('Dark mode toggle functionality', async ({ page }) => {
    
    const initialIsDarkMode = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    
    
    const themeToggleButton = page.locator('button[aria-label*="theme"]');
    await themeToggleButton.click();
    
    
    const newIsDarkMode = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    
    
    expect(newIsDarkMode).not.toEqual(initialIsDarkMode);
  });

  test('Location search functionality', async ({ page }) => {
    
    await page.route('**/geocode/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            display_name: 'Test Search Location',
            lat: '51.5074',
            lon: '0.1278',
            address: {
              road: 'Test Search Road',
              city: 'Test Search City'
            }
          }
        ])
      });
    });
    
    
    const searchInput = page.locator('[placeholder*="Search"]');
    await searchInput.click();
    
    
    await searchInput.fill('test location');
    
    
    await page.waitForSelector('div.bg-white', { hasText: 'Test Search Location' });
    await page.locator('div', { hasText: 'Test Search Location' }).first().click();
    
    
    
  });

  test('Zoom controls functionality', async ({ page }) => {
    
    
    
    
    await page.locator('button[aria-label="Zoom in"]').click();
    
    
    await page.locator('button[aria-label="Zoom out"]').click();
    
    
    await expect(page.locator('.map-container')).toBeVisible();
  });

  test('Geolocation functionality', async ({ page }) => {
    
    await page.evaluate(() => {
      const mockPosition = {
        coords: {
          latitude: 52.5200,
          longitude: 13.4050,
          accuracy: 10
        }
      };
      
      
      navigator.geolocation.getCurrentPosition = (success) => {
        success(mockPosition);
      };
    });
    
    
    await page.locator('button[aria-label*="location"]').click();
    
    
    
  });

  test('Classic report form submission flow', async ({ page }) => {
    
    await page.route('**/requests**', async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            service_request_id: '03-2025',
            service_notice: 'Your request has been submitted successfully'
          })
        });
      } else {
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockRequests)
        });
      }
    });
    
    
    await page.locator('button', { hasText: 'Classic Report' }).click();
    
    
    await page.locator('input[id*="firstname"]').fill('Test');
    await page.locator('input[id*="lastname"]').fill('User');
    await page.locator('input[id*="email"]').fill('test@example.com');
    
    
    const categorySelect = page.locator('select[id*="category"]');
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption({ index: 0 });
    }
    
    
    await page.locator('textarea[id*="description"]').fill('This is a test report');
    
    
    const gdprCheckbox = page.locator('input[type="checkbox"]');
    if (await gdprCheckbox.isVisible()) {
      await gdprCheckbox.check();
    }
    
    
    await page.locator('button[type="submit"]').click();
    
    
    await expect(page.locator('div', { hasText: 'success' })).toBeVisible({ timeout: 5000 });
  });
  
  
});