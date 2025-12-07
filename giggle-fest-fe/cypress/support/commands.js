// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to get input by label text
Cypress.Commands.add("getByLabel", (label) => {
  return cy.contains("label", label).parent().find("input");
});

// Custom command to get button by text
Cypress.Commands.add("getByButtonText", (text) => {
  return cy.contains("button", text);
});
