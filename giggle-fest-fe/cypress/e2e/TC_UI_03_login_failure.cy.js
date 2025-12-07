/**
 * TC_UI_03 — UI Login
 * Feature: Login Failure
 * Test Scenario: Verify login error for incorrect password
 */

describe("TC_UI_03 - Login Failure", () => {
  beforeEach(() => {
    cy.visit("/login");
  });

  it('should display error message "Invalid credentials" for incorrect password', () => {
    // Test Steps:
    // 1. Enter a valid email
    const validEmail = "user@example.com";

    // 2. Enter an incorrect password
    const incorrectPassword = "wrongPassword123";

    // Intercept the login API call and mock a 401 error response
    cy.intercept("POST", "**/api/v1/auth/login", {
      statusCode: 401,
      body: {
        status: "error",
        message: "Invalid credentials",
      },
    }).as("loginRequest");

    cy.get('[data-testid="email-input"]').type(validEmail);
    cy.get('[data-testid="password-input"]').type(incorrectPassword);

    // 3. Attempt to log in
    cy.get('[data-testid="login-button"]').click();

    // Wait for the API request to complete
    cy.wait("@loginRequest");

    // Expected Result:
    // An error message "Invalid credentials" is displayed
    cy.get('[data-testid="error-message"]').should("be.visible");
    cy.get('[data-testid="error-message"]').should(
      "contain",
      "Email atau password salah"
    );

    // Verify user remains on login page
    cy.url().should("include", "/login");

    // Verify no token is stored
    cy.window()
      .its("localStorage")
      .invoke("getItem", "token")
      .should("be.null");
  });
});
