/**
 * TC_UI_04 — UI Responsiveness
 * Feature: Responsive Layout
 * Test Scenario: Verify mobile view responsiveness
 */

describe("TC_UI_04 - Responsive Layout", () => {
  const mobileViewports = [
    { device: "iPhone 6", width: 375, height: 667 },
    { device: "iPhone X", width: 375, height: 812 },
  ];

  mobileViewports.forEach((viewport) => {
    context(
      `On ${viewport.device} (${viewport.width}x${viewport.height})`,
      () => {
        beforeEach(() => {
          // Test Steps:
          // 1. Set viewport to <768px (e.g., iPhone 6 or iPhone X)
          cy.viewport(viewport.width, viewport.height);

          // 2. Visit the login page
          cy.visit("/login");
        });

        it("should adapt UI properly to mobile screen sizes", () => {
          // Expected Result:
          // The UI adapts properly to mobile screen sizes (layout remains usable and readable)

          // Verify the page loads
          cy.get('[data-testid="login-form"]').should("be.visible");

          // Verify key elements are visible and accessible
          cy.get('[data-testid="email-input"]').should("be.visible");
          cy.get('[data-testid="password-input"]').should("be.visible");
          cy.get('[data-testid="login-button"]').should("be.visible");

          // Verify elements are within viewport (not hidden by overflow)
          cy.get('[data-testid="email-input"]')
            .should("be.visible")
            .then(($el) => {
              const rect = $el[0].getBoundingClientRect();
              expect(rect.right).to.be.lessThan(viewport.width);
              expect(rect.left).to.be.greaterThan(0);
            });

          cy.get('[data-testid="login-button"]')
            .should("be.visible")
            .then(($el) => {
              const rect = $el[0].getBoundingClientRect();
              expect(rect.right).to.be.lessThan(viewport.width);
              expect(rect.left).to.be.greaterThan(0);
            });

          // Verify text is readable (elements have sufficient height)
          cy.get('[data-testid="email-input"]')
            .invoke("outerHeight")
            .should("be.greaterThan", 40);
          cy.get('[data-testid="password-input"]')
            .invoke("outerHeight")
            .should("be.greaterThan", 40);
          cy.get('[data-testid="login-button"]')
            .invoke("outerHeight")
            .should("be.greaterThan", 40);

          // Verify elements are interactable
          cy.get('[data-testid="email-input"]')
            .type("test@example.com")
            .should("have.value", "test@example.com");
          cy.get('[data-testid="password-input"]')
            .type("password123")
            .should("have.value", "password123");
          cy.get('[data-testid="login-button"]').should("not.be.disabled");
        });
      }
    );
  });
});
