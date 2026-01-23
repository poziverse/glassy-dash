# Testing Guide

**Version:** ALPHA 1.0  
**Last Updated:** January 19, 2026  

---

## Overview

This guide covers testing strategies, tools, and best practices for GlassKeep.

---

## Table of Contents

- [Testing Setup](#testing-setup)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [E2E Testing](#e2e-testing)
- [API Testing](#api-testing)
- [Performance Testing](#performance-testing)
- [Testing Best Practices](#testing-best-practices)

---

## Testing Setup

### Dependencies

**Install Testing Tools:**
```bash
cd GLASSYDASH
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Configuration

**vitest.config.js:**
```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/'
      ]
    }
  }
});
```

**setup.js:**
```javascript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

---

## Unit Testing

### Component Testing

**Example: NoteCard Component**
```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NoteCard from '../NoteCard';

describe('NoteCard', () => {
  const mockNote = {
    id: 1,
    title: 'Test Note',
    content: 'Test content',
    type: 'text'
  };

  const mockOnClick = vi.fn();
  const mockOnDelete = vi.fn();

  it('renders note title', () => {
    render(
      <NoteCard 
        note={mockNote} 
        onClick={mockOnClick} 
        onDelete={mockOnDelete} 
      />
    );
    
    expect(screen.getByText('Test Note')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    render(
      <NoteCard 
        note={mockNote} 
        onClick={mockOnClick} 
        onDelete={mockOnDelete} 
      />
    );
    
    fireEvent.click(screen.getByText('Test Note'));
    expect(mockOnClick).toHaveBeenCalledWith(1);
  });

  it('calls delete on delete button', () => {
    render(
      <NoteCard 
        note={mockNote} 
        onClick={mockOnClick} 
        onDelete={mockOnDelete} 
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(mockOnDelete).toHaveBeenCalledWith(1);
  });
});
```

### Hook Testing

**Example: useNotes Hook**
```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotes } from '../contexts/NotesContext';

describe('useNotes', () => {
  beforeEach(() => {
    // Mock API calls
    vi.mock('../../services/api', () => ({
      fetchNotes: vi.fn(() => Promise.resolve([])),
      createNote: vi.fn(() => Promise.resolve({ id: 1 }))
    }));
  });

  it('returns notes array', () => {
    const { result } = renderHook(() => useNotes());
    
    expect(result.current.notes).toBeDefined();
    expect(Array.isArray(result.current.notes)).toBe(true);
  });

  it('creates new note', async () => {
    const { result } = renderHook(() => useNotes());
    
    await act(async () => {
      await result.current.createNote({ title: 'New Note' });
    });
    
    expect(result.current.notes).toHaveLength(1);
  });
});
```

### Utility Testing

**Example: Format Date Utility**
```javascript
import { describe, it, expect } from 'vitest';
import { formatDate } from '../utils/date';

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2026-01-19T12:00:00.000Z');
    const formatted = formatDate(date);
    
    expect(formatted).toBe('Jan 19, 2026');
  });

  it('handles null input', () => {
    const formatted = formatDate(null);
    
    expect(formatted).toBe('');
  });
});
```

---

## Integration Testing

### Context Integration

**Example: NotesProvider Integration**
```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { NotesProvider, useNotes } from '../contexts/NotesContext';

function TestComponent() {
  const { notes, createNote } = useNotes();
  
  return (
    <div>
      <button onClick={() => createNote({ title: 'Test' })}>Create</button>
      <div>{notes.length} notes</div>
    </div>
  );
}

describe('NotesProvider Integration', () => {
  it('updates notes on create', async () => {
    render(
      <NotesProvider>
        <TestComponent />
      </NotesProvider>
    );
    
    expect(screen.getByText('0 notes')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Create'));
    
    await waitFor(() => {
      expect(screen.getByText('1 notes')).toBeInTheDocument();
    });
  });
});
```

---

## E2E Testing

### Playwright Setup

**Install Playwright:**
```bash
npm install --save-dev @playwright/test
npx playwright install
```

**playwright.config.js:**
```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

### E2E Test Example

**Example: Note Creation Flow**
```javascript
import { test, expect } from '@playwright/test';

test.describe('Note Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5173/notes');
  });

  test('creates new note', async ({ page }) => {
    // Click create button
    await page.click('button[aria-label="Create note"]');
    
    // Fill note form
    await page.fill('input[placeholder="Note title"]', 'Test Note');
    await page.fill('textarea[placeholder="Note content"]', 'Test content');
    
    // Save note
    await page.click('button[aria-label="Save note"]');
    
    // Verify note appears
    await expect(page.locator('text=Test Note')).toBeVisible();
  });

  test('edits existing note', async ({ page }) => {
    // Click existing note
    await page.click('text=Test Note');
    
    // Edit content
    await page.fill('textarea', 'Updated content');
    await page.click('button[aria-label="Save"]');
    
    // Verify update
    await expect(page.locator('text=Updated content')).toBeVisible();
  });

  test('deletes note', async ({ page }) => {
    // Click note
    await page.click('text=Test Note');
    
    // Delete note
    await page.click('button[aria-label="Delete note"]');
    await page.click('button:has-text("Confirm")');
    
    // Verify deletion
    await expect(page.locator('text=Test Note')).not.toBeVisible();
  });
});
```

### Run E2E Tests

```bash
# Run all tests
npx playwright test

# Run specific file
npx playwright test notes.spec.ts

# Run in headed mode
npx playwright test --headed

# Run specific browser
npx playwright test --project=chromium
```

---

## API Testing

### Supertest Setup

**Install:**
```bash
npm install --save-dev supertest
```

### API Test Example

**Example: Notes API**
```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../server/index';
import db from '../../server/database';

describe('Notes API', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Create test user and get token
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
    
    authToken = response.body.token;
    userId = response.body.user.id;
  });

  afterAll(async () => {
    // Cleanup test data
    db.prepare('DELETE FROM notes WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  });

  describe('GET /api/notes', () => {
    it('returns empty array for new user', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toEqual([]);
    });

    it('requires authentication', async () => {
      await request(app)
        .get('/api/notes')
        .expect(401);
    });
  });

  describe('POST /api/notes', () => {
    it('creates new note', async () => {
      const noteData = {
        type: 'text',
        title: 'Test Note',
        content: 'Test content'
      };

      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Note');
    });

    it('validates input', async () => {
      const invalidNote = {
        type: 'invalid',
        title: ''
      };

      await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidNote)
        .expect(400);
    });
  });
});
```

### Run API Tests

```bash
# Run all API tests
npm run test:api

# Run with coverage
npm run test:coverage
```

---

## Performance Testing

### Load Testing with k6

**Install k6:**
```bash
# macOS
brew install k6

# Linux
curl https://github.com/grafana/k6/releases/download/v0.46.0/k6-v0.46.0-linux-amd64.tar.gz -L | tar xvz
```

### Load Test Example

**load-test.js:**
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '20s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests <500ms
    http_req_failed: ['rate<0.01'],    // <1% failure rate
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Login
  let loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    username: 'testuser',
    password: 'password123'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  let token = loginRes.json('token');

  // Get notes
  let notesRes = http.get(`${BASE_URL}/api/notes`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  check(notesRes, {
    'notes retrieved': (r) => r.status === 200,
    'response time <500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

**Run Load Test:**
```bash
k6 run load-test.js
```

---

## Testing Best Practices

### 1. Test Structure

**Arrange-Act-Assert Pattern:**
```javascript
it('creates note successfully', () => {
  // Arrange
  const noteData = { title: 'Test', content: 'Content' };
  
  // Act
  createNote(noteData);
  
  // Assert
  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

### 2. Descriptive Tests

**Good:**
```javascript
it('returns 401 when token is expired', () => { });
```

**Bad:**
```javascript
it('works', () => { });
```

### 3. Mock External Dependencies

```javascript
vi.mock('../../services/api', () => ({
  fetchNotes: vi.fn(() => Promise.resolve([])),
}));
```

### 4. Test Edge Cases

```javascript
it('handles empty input', () => { });
it('handles null values', () => { });
it('handles special characters', () => { });
it('handles maximum length', () => { });
```

### 5. Keep Tests Isolated

```javascript
beforeEach(() => {
  // Reset state before each test
  localStorage.clear();
  vi.clearAllMocks();
});
```

### 6. Use Testing Library Queries

**Preferred:**
```javascript
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText('Email')
screen.getByText('Submit')
```

**Avoid:**
```javascript
document.querySelector('.submit-button')
```

### 7. Test User Behavior

```javascript
// Good: Test what user sees
expect(screen.getByText('Success')).toBeInTheDocument();

// Bad: Test implementation details
expect(mockApi).toHaveBeenCalled();
```

---

## Coverage

### Generate Coverage Report

```bash
npm run test:coverage
```

**View Coverage:**
- Open `coverage/index.html` in browser

### Coverage Goals

| Type | Target |
|-------|--------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

### CI/CD Integration

**GitHub Actions Example:**
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## Debugging Tests

### Vitest Debugging

```bash
# Run in watch mode
npm run test:watch

# Run specific file
npm run test NoteCard

# Debug with inspector
npm run test:debug
```

### Playwright Debugging

```bash
# Run in headed mode with inspector
npx playwright test --debug

# Run with trace viewer
npx playwright show-trace trace.zip
```

---

## Test Organization

```
GLASSYDASH/
├── src/
│   └── __tests__/
│       ├── setup.js
│       ├── components/
│       │   ├── NoteCard.test.jsx
│       │   └── Modal.test.jsx
│       ├── contexts/
│       │   ├── NotesContext.test.jsx
│       │   └── AuthContext.test.jsx
│       ├── hooks/
│       │   └── useNotes.test.js
│       └── utils/
│           └── date.test.js
├── server/
│   └── __tests__/
│       ├── api/
│       │   └── notes.test.js
│       └── middleware/
│           └── auth.test.js
└── tests/
    └── e2e/
        ├── notes.spec.ts
        └── auth.spec.ts
```

---

**Document Version:** 1.0  
**Last Updated:** January 19, 2026  
**Status:** Complete