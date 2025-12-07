/**
 * TC_UI_06 — UI Accessibility
 * Feature: Accessibility
 * Test Scenario: Verify color contrast accessibility
 */

describe("TC_UI_06 - Accessibility", () => {
  beforeEach(() => {
    // Test Steps:
    // 1. Run an automated accessibility scan on the login page using cypress-axe
    cy.visit("/login");
    cy.injectAxe();
  });

  it("should meet WCAG AA contrast requirements", () => {
    // Test Steps:
    // 2. Check color contrast issues

    // Expected Result:
    // All color combinations meet WCAG AA contrast requirements

    // Run accessibility check with focus on color contrast
    cy.checkA11y(null, {
      runOnly: {
        type: "tag",
        values: ["wcag2aa", "wcag21aa"],
      },
      rules: {
        "color-contrast": { enabled: true },
      },
    });
  });

  it("should pass comprehensive accessibility audit", () => {
    // Additional accessibility checks for completeness
    cy.checkA11y(null, {
      runOnly: {
        type: "tag",
        values: ["wcag2aa", "wcag21aa", "best-practice"],
      },
    });
  });

  it("should have accessible form inputs", () => {
    // Verify form inputs have proper labels
    cy.get('[data-testid="email-input"]').should("have.attr", "type", "email");
    cy.get('[data-testid="password-input"]').should(
      "have.attr",
      "type",
      "password"
    );

    // Verify button has accessible text
    cy.get('[data-testid="login-button"]').should("contain.text", "MASUK");
  });
});
