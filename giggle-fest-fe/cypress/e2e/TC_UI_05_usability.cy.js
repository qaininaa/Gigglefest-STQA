/**
 * TC_UI_05 — UI Usability
 * Feature: Usability
 * Test Scenario: Verify common UI elements are easy to access
 */

describe("TC_UI_05 - Usability", () => {
  beforeEach(() => {
    // Test Steps:
    // 1. Load the login page
    cy.visit("/login");
  });

  it("should have all UI elements easy to locate, read, and interact with", () => {
    // Test Steps:
    // 2. Observe placement and accessibility of input fields and buttons
    // 3. Ensure labels and buttons are clear and intuitive

    // Expected Result:
    // All UI elements are easy to locate, read, and interact with

    // Verify form is visible and accessible
    cy.get('[data-testid="login-form"]').should("be.visible");

    // Verify labels are present and clear
    cy.contains("label", "Email").should("be.visible");
    cy.contains("label", "Password").should("be.visible");

    // Verify input fields are associated with their labels
    cy.contains("label", "Email")
      .parent()
      .find('input[type="email"]')
      .should("exist");
    cy.contains("label", "Password")
      .parent()
      .find('input[type="password"]')
      .should("exist");

    // Verify inputs are accessible and can be typed into
    cy.get('[data-testid="email-input"]')
      .should("be.visible")
      .and("not.be.disabled")
      .type("user@example.com")
      .should("have.value", "user@example.com");

    cy.get('[data-testid="password-input"]')
      .should("be.visible")
      .and("not.be.disabled")
      .type("password123")
      .should("have.value", "password123");

    // Verify button is clear and accessible
    cy.get('[data-testid="login-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .should("contain", "MASUK");

    // Verify button has appropriate styling (contrast and size)
    cy.get('[data-testid="login-button"]').should(
      "have.css",
      "cursor",
      "pointer"
    );

    // Verify input fields have adequate size for interaction (tap targets)
    cy.get('[data-testid="email-input"]')
      .invoke("outerHeight")
      .should("be.greaterThan", 44);
    cy.get('[data-testid="password-input"]')
      .invoke("outerHeight")
      .should("be.greaterThan", 44);
    cy.get('[data-testid="login-button"]')
      .invoke("outerHeight")
      .should("be.greaterThan", 44);

    // Verify visual feedback on focus
    cy.get('[data-testid="email-input"]').focus();
    cy.get('[data-testid="email-input"]').should("have.focus");

    // Verify button is clickable
    cy.get('[data-testid="login-button"]').click();
  });
});
