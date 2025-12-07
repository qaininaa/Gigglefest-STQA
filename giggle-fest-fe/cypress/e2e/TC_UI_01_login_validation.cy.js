/**
 * TC_UI_01 — UI Login
 * Feature: Login Form
 * Test Scenario: Verify validation for empty login form
 */

describe("TC_UI_01 - Login Form Validation", () => {
  beforeEach(() => {
    cy.visit("/login");
  });

  it("should display validation message when email and password fields are empty", () => {
    // Test Steps:
    // 1. Leave the email and password fields empty
    // (Fields are already empty on page load)

    // 2. Click the login button
    cy.get('[data-testid="login-button"]').click();

    // Expected Result:
    // A validation message appears indicating that both fields are required

    // HTML5 validation prevents form submission, so we verify the fields are required
    cy.get('[data-testid="email-input"]').should("have.attr", "required");
    cy.get('[data-testid="password-input"]').should("have.attr", "required");

    // Verify the form was not submitted (we should still be on the login page)
    cy.url().should("include", "/login");

    // Verify no error message is shown from the API (since form didn't submit)
    cy.get('[data-testid="error-message"]').should("not.exist");
  });
});
