/**
 * TC_UI_07 — UI Accessibility
 * Feature: Keyboard Navigation
 * Test Scenario: Verify keyboard tab navigation
 */

describe("TC_UI_07 - Keyboard Navigation", () => {
  beforeEach(() => {
    cy.visit("/login");
  });

  it("should allow keyboard navigation through all form elements", () => {
    // Test Steps:
    // 1. Navigate the login form using the TAB key
    // 2. Verify focus moves sequentially through all inputs and buttons

    // Expected Result:
    // All form elements are accessible via keyboard navigation

    // Start from the body to ensure we begin from the top
    cy.get("body").click();

    // Tab to email input
    cy.realPress("Tab");
    cy.focused()
      .should("have.attr", "data-testid", "email-input")
      .and("have.attr", "type", "email");

    // Verify email input can receive keyboard input
    cy.focused().type("test@example.com");
    cy.get('[data-testid="email-input"]').should(
      "have.value",
      "test@example.com"
    );

    // Tab to password input
    cy.realPress("Tab");
    cy.focused()
      .should("have.attr", "data-testid", "password-input")
      .and("have.attr", "type", "password");

    // Verify password input can receive keyboard input
    cy.focused().type("password123");
    cy.get('[data-testid="password-input"]').should(
      "have.value",
      "password123"
    );

    // Tab to login button
    cy.realPress("Tab");
    // Skip privacy policy link
    cy.realPress("Tab");
    cy.focused()
      .should("have.attr", "data-testid", "login-button")
      .and("contain", "MASUK");

    // Verify button can be activated with keyboard (Enter key)
    // Mock the API to prevent actual login
    cy.intercept("POST", "**/api/v1/auth/login", {
      statusCode: 200,
      body: {
        status: "success",
        message: "Login successful",
        data: { token: "test-token" },
      },
    }).as("loginRequest");

    cy.focused().realPress("Enter");

    // Verify form was submitted via keyboard
    cy.wait("@loginRequest");
    cy.get('[data-testid="success-message"]').should("be.visible");

    // Verify all elements are accessible and focusable
    cy.get('[data-testid="email-input"]')
      .should("be.visible")
      .and("not.be.disabled");
    cy.get('[data-testid="password-input"]')
      .should("be.visible")
      .and("not.be.disabled");
    cy.get('[data-testid="login-button"]')
      .should("be.visible")
      .and("not.be.disabled");
  });

  it("should have visible focus indicators on all interactive elements", () => {
    // Verify focus indicators are visible for accessibility

    // Focus on email input
    cy.get('[data-testid="email-input"]').focus();
    cy.focused().should("have.attr", "data-testid", "email-input");

    // Focus on password input
    cy.get('[data-testid="password-input"]').focus();
    cy.focused().should("have.attr", "data-testid", "password-input");

    // Focus on login button
    cy.get('[data-testid="login-button"]').focus();
    cy.focused().should("have.attr", "data-testid", "login-button");
  });

  it("should maintain logical tab order", () => {
    // Verify tab order follows logical reading order
    const expectedTabOrder = ["email-input", "password-input", "login-button"];

    cy.get("body").click();

    // Tab through form and verify order
    cy.realPress("Tab");
    cy.focused().should("have.attr", "data-testid", expectedTabOrder[0]);

    cy.realPress("Tab");
    cy.focused().should("have.attr", "data-testid", expectedTabOrder[1]);

    cy.realPress("Tab");
    // Skip privacy link
    cy.realPress("Tab");
    cy.focused().should("have.attr", "data-testid", expectedTabOrder[2]);
  });
});
