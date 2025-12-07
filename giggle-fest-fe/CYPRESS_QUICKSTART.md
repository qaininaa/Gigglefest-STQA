# Cypress Test Quick Start Guide

## 🚀 Quick Setup (3 Steps)

### 1. Install Dependencies

All necessary packages are already installed. If you need to reinstall:

```bash
npm install
```

### 2. Start the Dev Server

```bash
npm run dev
```

Keep this running in one terminal. App runs on `http://localhost:5173`

### 3. Run Tests

**Interactive Mode (Recommended):**

```bash
npm run cypress:open
```

Then click on any test file to run it.

**Headless Mode:**

```bash
npm run cypress:run
```

---

## 📋 Test Cases Overview

| Test ID  | Description                    | File                                 |
| -------- | ------------------------------ | ------------------------------------ |
| TC_UI_01 | Empty form validation          | `TC_UI_01_login_validation.cy.js`    |
| TC_UI_02 | Successful login               | `TC_UI_02_login_success.cy.js`       |
| TC_UI_03 | Login failure (wrong password) | `TC_UI_03_login_failure.cy.js`       |
| TC_UI_04 | Mobile responsiveness          | `TC_UI_04_responsiveness.cy.js`      |
| TC_UI_05 | UI usability                   | `TC_UI_05_usability.cy.js`           |
| TC_UI_06 | Accessibility (WCAG AA)        | `TC_UI_06_accessibility.cy.js`       |
| TC_UI_07 | Keyboard navigation            | `TC_UI_07_keyboard_navigation.cy.js` |

---

## 🎯 Run Individual Tests

```bash
# TC_UI_01 - Form validation
npx cypress run --spec "cypress/e2e/TC_UI_01_login_validation.cy.js"

# TC_UI_02 - Login success
npx cypress run --spec "cypress/e2e/TC_UI_02_login_success.cy.js"

# TC_UI_03 - Login failure
npx cypress run --spec "cypress/e2e/TC_UI_03_login_failure.cy.js"

# TC_UI_04 - Responsiveness
npx cypress run --spec "cypress/e2e/TC_UI_04_responsiveness.cy.js"

# TC_UI_05 - Usability
npx cypress run --spec "cypress/e2e/TC_UI_05_usability.cy.js"

# TC_UI_06 - Accessibility
npx cypress run --spec "cypress/e2e/TC_UI_06_accessibility.cy.js"

# TC_UI_07 - Keyboard navigation
npx cypress run --spec "cypress/e2e/TC_UI_07_keyboard_navigation.cy.js"
```

---

## ✅ Expected Results

### TC_UI_01 ✓

- Browser shows HTML5 validation message
- Form doesn't submit when fields are empty

### TC_UI_02 ✓

- Success message appears: "Login Berhasil!"
- User redirected to homepage
- Token saved in localStorage

### TC_UI_03 ✓

- Error message appears: "Email atau password salah"
- User stays on login page
- No token stored

### TC_UI_04 ✓

- Layout adapts to iPhone 6 (375x667)
- Layout adapts to iPhone X (375x812)
- All elements remain visible and clickable

### TC_UI_05 ✓

- Labels are visible and clear
- Input fields have 44px+ height (good tap targets)
- Button is accessible and clickable
- Visual feedback on focus

### TC_UI_06 ✓

- No color contrast violations
- Meets WCAG 2.1 AA standards
- Form inputs are properly labeled

### TC_UI_07 ✓

- Tab key navigates through form elements sequentially
- All inputs and buttons are keyboard accessible
- Focus indicators are visible
- Enter key submits the form

---

## 📊 Test Output

### Interactive Mode

- See tests running in real browser
- Click on elements to inspect
- Time-travel debugging
- Screenshots on failure

### Headless Mode

```
  TC_UI_01 - Login Form Validation
    ✓ should display validation message... (152ms)

  TC_UI_02 - Login Success
    ✓ should redirect to homepage... (423ms)

  TC_UI_03 - Login Failure
    ✓ should display error message... (315ms)

  TC_UI_04 - Responsive Layout
    ✓ On iPhone 6: should adapt UI... (289ms)
    ✓ On iPhone X: should adapt UI... (267ms)

  TC_UI_05 - Usability
    ✓ should have all UI elements easy... (198ms)

  TC_UI_06 - Accessibility
    ✓ should meet WCAG AA contrast... (412ms)
    ✓ should pass comprehensive audit (385ms)
    ✓ should have accessible form inputs (89ms)

  TC_UI_07 - Keyboard Navigation
    ✓ should allow keyboard navigation... (324ms)
    ✓ should have visible focus indicators (156ms)
    ✓ should maintain logical tab order (178ms)

  12 passing (4s)
```

---

## 🐛 Common Issues

**"baseUrl" error:**

- Make sure dev server is running on port 5173
- Check `cypress.config.js` baseUrl matches your server

**Tests failing unexpectedly:**

- Clear localStorage: `localStorage.clear()` in browser console
- Restart dev server
- Run `npx cypress cache clear && npx cypress install`

**Accessibility test fails:**

- May indicate real accessibility issues
- Check color contrast on affected elements
- Review cypress-axe output for specific violations

---

## 📁 File Structure

```
giggle-fest-fe/
├── cypress/
│   ├── e2e/
│   │   ├── TC_UI_01_login_validation.cy.js
│   │   ├── TC_UI_02_login_success.cy.js
│   │   ├── TC_UI_03_login_failure.cy.js
│   │   ├── TC_UI_04_responsiveness.cy.js
│   │   ├── TC_UI_05_usability.cy.js
│   │   └── TC_UI_06_accessibility.cy.js
│   ├── support/
│   │   ├── commands.js
│   │   └── e2e.js
│   └── README.md
├── cypress.config.js
└── package.json
```

---

## 🎬 Next Steps

1. Run all tests: `npm run cypress:open`
2. Fix any failing tests
3. Integrate with CI/CD
4. Add more test cases as needed

For detailed documentation, see `cypress/README.md`
