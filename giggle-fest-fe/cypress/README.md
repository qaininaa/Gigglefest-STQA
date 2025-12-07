# Cypress Automated Usability Tests

This directory contains automated usability test scripts for the GiggleWest login page using Cypress.

## Test Cases Implemented

### TC_UI_01 - Login Form Validation

**Feature:** Login Form  
**Scenario:** Verify validation for empty login form  
**File:** `cypress/e2e/TC_UI_01_login_validation.cy.js`

Tests that HTML5 validation prevents form submission when email and password fields are empty.

---

### TC_UI_02 - Login Success

**Feature:** Login Success  
**Scenario:** Verify successful login  
**File:** `cypress/e2e/TC_UI_02_login_success.cy.js`

Tests that valid credentials result in:

- Success message display
- Token storage in localStorage
- Redirection to homepage

---

### TC_UI_03 - Login Failure

**Feature:** Login Failure  
**Scenario:** Verify login error for incorrect password  
**File:** `cypress/e2e/TC_UI_03_login_failure.cy.js`

Tests that invalid credentials display an error message and prevent login.

---

### TC_UI_04 - Responsive Layout

**Feature:** Responsive Layout  
**Scenario:** Verify mobile view responsiveness  
**File:** `cypress/e2e/TC_UI_04_responsiveness.cy.js`

Tests the UI on mobile viewports (iPhone 6 & iPhone X) to ensure:

- Elements are visible
- Layout adapts properly
- Elements remain interactable

---

### TC_UI_05 - Usability

**Feature:** Usability  
**Scenario:** Verify common UI elements are easy to access  
**File:** `cypress/e2e/TC_UI_05_usability.cy.js`

Tests that:

- Labels are clear and visible
- Input fields are accessible
- Buttons have appropriate size (44px+ tap targets)
- Elements provide visual feedback

---

### TC_UI_06 - Accessibility

**Feature:** Accessibility  
**Scenario:** Verify color contrast accessibility  
**File:** `cypress/e2e/TC_UI_06_accessibility.cy.js`

Tests that the login page meets WCAG 2.1 AA standards using cypress-axe, specifically:

- Color contrast requirements
- Best practices for accessibility

---

### TC_UI_07 - Keyboard Navigation

**Feature:** Keyboard Navigation  
**Scenario:** Verify keyboard tab navigation  
**File:** `cypress/e2e/TC_UI_07_keyboard_navigation.cy.js`

Tests that all form elements are accessible via keyboard:

- Tab key navigation through inputs and buttons
- Sequential focus order
- Keyboard input works on all fields
- Enter key submits the form
- Visible focus indicators

---

## Prerequisites

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The app should be running on `http://localhost:5173`

## Running the Tests

### Option 1: Cypress Interactive Mode (Recommended for Development)

```bash
npm run cypress:open
```

or

```bash
npm run test:e2e:ui
```

This opens the Cypress Test Runner where you can:

- Select and run individual test files
- Watch tests run in real-time
- Debug failing tests
- See visual feedback

### Option 2: Headless Mode (CI/CD)

```bash
npm run cypress:run
```

or

```bash
npm run test:e2e
```

This runs all tests in headless mode and generates reports.

### Running Individual Test Files

To run a specific test:

```bash
npx cypress run --spec "cypress/e2e/TC_UI_01_login_validation.cy.js"
```

## Test Structure

```
cypress/
├── e2e/
│   ├── TC_UI_01_login_validation.cy.js
│   ├── TC_UI_02_login_success.cy.js
│   ├── TC_UI_03_login_failure.cy.js
│   ├── TC_UI_04_responsiveness.cy.js
│   ├── TC_UI_05_usability.cy.js
│   ├── TC_UI_06_accessibility.cy.js
│   └── TC_UI_07_keyboard_navigation.cy.js
├── support/
│   ├── commands.js          # Custom Cypress commands
│   └── e2e.js               # Test configuration and imports
└── cypress.config.js         # Cypress configuration
```

## Data Test IDs

The following `data-testid` attributes have been added to the LoginPage component for reliable testing:

- `data-testid="login-form"` - The login form element
- `data-testid="email-input"` - Email input field
- `data-testid="password-input"` - Password input field
- `data-testid="login-button"` - Login submit button
- `data-testid="error-message"` - Error notification (when visible)
- `data-testid="success-message"` - Success notification (when visible)

## Configuration

The Cypress configuration is in `cypress.config.js`:

```javascript
{
  baseUrl: "http://localhost:5173",
  viewportWidth: 1280,
  viewportHeight: 720
}
```

## API Mocking

Tests TC_UI_02 and TC_UI_03 use Cypress interceptors to mock API responses:

- Success responses (200) for valid login
- Error responses (401) for invalid credentials

This ensures tests run consistently without requiring a live backend.

## Accessibility Testing

TC_UI_06 uses `cypress-axe` to run automated accessibility audits. It checks:

- WCAG 2.1 Level AA compliance
- Color contrast ratios
- Best practices for web accessibility

## Troubleshooting

### Port Already in Use

If port 5173 is in use, update the `baseUrl` in `cypress.config.js` to match your dev server port.

### Tests Failing

1. Ensure the dev server is running on `http://localhost:5173`
2. Check that all data-testid attributes are present in LoginPage.jsx
3. Clear browser cache and localStorage
4. Check Cypress console for detailed error messages

### Cypress Not Opening

Try clearing Cypress cache:

```bash
npx cypress cache clear
npx cypress install
```

## Best Practices

1. **Run tests against a clean state** - Tests clear localStorage before each run
2. **Use data-testid over CSS classes** - More stable for UI changes
3. **Mock API calls** - Faster, more reliable tests
4. **Check visual regression** - Use Cypress screenshots for visual testing

## Continuous Integration

To run tests in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Cypress tests
  run: |
    npm install
    npm run dev &
    npm run cypress:run
```

## Video Recording

Cypress automatically records videos of test runs in headless mode. Videos are saved to:

```
cypress/videos/
```

## Screenshots

Screenshots of failures are automatically saved to:

```
cypress/screenshots/
```

## Support

For more information about Cypress, visit:

- [Cypress Documentation](https://docs.cypress.io)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [cypress-axe Documentation](https://github.com/component-driven/cypress-axe)
