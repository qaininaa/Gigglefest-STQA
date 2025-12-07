/**
 * TC_UI_02 — UI Login
 * Feature: Login Success
 * Test Scenario: Verify successful login
 */

describe("TC_UI_02 - Login Success", () => {
  beforeEach(() => {
    cy.visit("/login");
  });

  it("should redirect to homepage after successful login", () => {
    // Test Steps:
    // 1. Enter a valid email and valid password
    const validEmail = "valid@example.com";
    const validPassword = "validPassword123";

    // Intercept the login API call and mock a successful response
    cy.intercept("POST", "**/api/v1/auth/login", {
      statusCode: 200,
      body: {
        status: "success",
        message: "Login successful",
        data: {
          token: "mock-jwt-token-123",
          user: {
            id: 1,
            email: validEmail,
            name: "Test User",
          },
        },
      },
    }).as("loginRequest");

    cy.get('[data-testid="email-input"]').type(validEmail);
    cy.get('[data-testid="password-input"]').type(validPassword);

    // 2. Click the login button
    cy.get('[data-testid="login-button"]').click();

    // Wait for the API request to complete
    cy.wait("@loginRequest");

    // Expected Result:
    // The user is redirected to the dashboard/homepage

    // Verify success message appears
    cy.get('[data-testid="success-message"]').should("be.visible");
    cy.get('[data-testid="success-message"]').should(
      "contain",
      "Login Berhasil"
    );

    // Verify token is stored in localStorage
    cy.window()
      .its("localStorage")
      .invoke("getItem", "token")
      .should("equal", "mock-jwt-token-123");

    // Verify redirection to homepage (after 1 second delay)
    cy.url().should("eq", Cypress.config().baseUrl + "/", { timeout: 2000 });
  });
});
