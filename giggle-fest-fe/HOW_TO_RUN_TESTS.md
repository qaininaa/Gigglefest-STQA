# Running Cypress Tests - Step by Step

## Prerequisites Check ✅

Before running tests, verify:

- [x] Node.js installed
- [x] Dependencies installed (`npm install` completed)
- [x] Cypress installed (check `node_modules/cypress`)

---

## Step 1: Start Development Server

Open a terminal and run:

```bash
npm run dev
```

You should see:

```
  VITE v7.1.7  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Keep this terminal running!** ⚠️

---

## Step 2: Open Cypress Test Runner

Open a **NEW** terminal (keep the first one running) and run:

```bash
npm run cypress:open
```

This will:

1. Open the Cypress Launchpad
2. Show "Welcome to Cypress!" if first time
3. Click "E2E Testing"
4. Choose your browser (Chrome recommended)
5. Click "Start E2E Testing"

---

## Step 3: Run Tests

### Option A: Run All Tests

In the Cypress Test Runner:

1. Click "Specs" in the sidebar
2. Click "Run all specs"
3. Watch all 7 tests execute

### Option B: Run Individual Tests

Click on any test file to run it:

- ✅ `TC_UI_01_login_validation.cy.js`
- ✅ `TC_UI_02_login_success.cy.js`
- ✅ `TC_UI_03_login_failure.cy.js`
- ✅ `TC_UI_04_responsiveness.cy.js`
- ✅ `TC_UI_05_usability.cy.js`
- ✅ `TC_UI_06_accessibility.cy.js`
- ✅ `TC_UI_07_keyboard_navigation.cy.js`

---

## Alternative: Headless Mode (No GUI)

Run all tests in terminal without opening browser:

```bash
npm run cypress:run
```

Output will look like:

```
Running:  TC_UI_01_login_validation.cy.js                                (1 of 6)
  TC_UI_01 - Login Form Validation
    ✓ should display validation message... (152ms)

Running:  TC_UI_02_login_success.cy.js                                   (2 of 7)
  TC_UI_02 - Login Success
    ✓ should redirect to homepage... (423ms)

...

  12 passing (4s)
```

---

## Expected Results 🎯

### All Tests Should Pass ✅

| Test     | Expected Outcome                           |
| -------- | ------------------------------------------ |
| TC_UI_01 | ✓ Form validation prevents submission      |
| TC_UI_02 | ✓ Success message shown, redirects to home |
| TC_UI_03 | ✓ Error message shown for wrong password   |
| TC_UI_04 | ✓ Mobile layout works on iPhone 6 & X      |
| TC_UI_05 | ✓ UI elements are accessible and usable    |
| TC_UI_06 | ✓ Passes WCAG AA accessibility audit       |
| TC_UI_07 | ✓ Keyboard navigation works correctly      |

---

## Troubleshooting 🔧

### Problem: "baseUrl" not responding

**Solution:**

- Make sure dev server is running (`npm run dev`)
- Check that it's on port 5173
- If different port, update `cypress.config.js`

### Problem: Tests timing out

**Solution:**

- Restart dev server
- Clear browser cache
- Run `npx cypress cache clear`

### Problem: Accessibility test fails

**Solution:**

- This might indicate real accessibility issues
- Check the Cypress console for specific violations
- Review color contrast on the login page

### Problem: "Cannot find module 'cypress-axe'"

**Solution:**

```bash
npm install --save-dev cypress-axe axe-core
```

---

## What Each Test Does

### TC_UI_01 👉 Form Validation

Clicks login button with empty fields → Checks HTML5 validation

### TC_UI_02 👉 Login Success

Types valid credentials → Mocks API success → Checks redirect

### TC_UI_03 👉 Login Failure

Types wrong password → Mocks API error → Checks error message

### TC_UI_04 👉 Responsiveness

Sets mobile viewport → Checks layout adapts → Tests on 2 devices

### TC_UI_05 👉 Usability

Checks labels visible → Verifies 44px+ tap targets → Tests interactions

### TC_UI_06 👉 Accessibility

Runs axe-core audit → Checks WCAG AA compliance → Reports violations

### TC_UI_07 👉 Keyboard Navigation

Simulates Tab key presses → Verifies focus order → Tests Enter key submission

---

## Video & Screenshots

When running in headless mode:

- **Videos:** `cypress/videos/`
- **Screenshots:** `cypress/screenshots/` (failures only)

---

## CI/CD Usage

For automated testing in CI/CD:

```bash
# Start server in background
npm run dev &

# Wait for server
sleep 5

# Run tests
npm run cypress:run
```

---

## Quick Commands Reference

```bash
# Interactive mode
npm run cypress:open
npm run test:e2e:ui

# Headless mode
npm run cypress:run
npm run test:e2e

# Run specific test
npx cypress run --spec "cypress/e2e/TC_UI_01_login_validation.cy.js"

# Run with specific browser
npx cypress run --browser chrome
npx cypress run --browser firefox
npx cypress run --browser edge
```

---

## Success Indicators ✅

You'll know tests are working when:

1. Dev server is running on localhost:5173
2. Cypress Test Runner opens without errors
3. Tests turn green (passing)
4. No red error messages in console
5. Videos/screenshots show expected behavior

---

## Next Steps

After all tests pass:

1. Review test code in `cypress/e2e/`
2. Customize tests for your needs
3. Add to CI/CD pipeline
4. Run before each deployment

---

**Happy Testing! 🚀**

For more details, see:

- `CYPRESS_QUICKSTART.md` - Quick reference
- `cypress/README.md` - Full documentation
- `CYPRESS_IMPLEMENTATION.md` - Implementation details
