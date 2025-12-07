# Maintainability Test Suite

This directory contains automated maintainability tests aligned with ISO 25010 standards.

## Test Cases

### TC_MAIN_01: Module Independence

**Purpose**: Verify code organization and ensure modules are fully independent.

**Test Steps**:

1. Run tests for the authentication module only
2. Run tests for the user module only
3. Confirm that neither module relies on the internal logic of the other
4. Verify that each module can be tested in complete isolation using mocks

**Running the test**:

```bash
npm test -- tc_main_01
```

**Expected Results**:

- ✅ Authentication module tested in isolation
- ✅ User module tested in isolation
- ✅ No cross-module internal logic dependencies
- ✅ All external dependencies successfully mocked
- ✅ No circular dependencies detected

**Success Criteria**:

- Each module's test suite executes successfully on its own
- No unexpected cross-dependencies found
- Mock implementations properly isolated

---

### TC_MAIN_02: Shared Utility Consistency

**Purpose**: Verify that shared utility functions behave consistently across all modules.

**Test Steps**:

1. Test shared validation utilities individually
2. Test shared formatting utilities individually
3. Use these utility functions inside multiple modules
4. Confirm that the output remains consistent regardless of where the utilities are used

**Running the test**:

```bash
npm test -- tc_main_02
```

**Expected Results**:

- ✅ Validation utilities tested individually
- ✅ Formatting utilities tested individually
- ✅ Utilities work consistently across all modules
- ✅ Same input produces same output in all contexts
- ✅ Utilities are pure (no side effects)

**Success Criteria**:

- All shared utility functions work correctly across modules
- Output remains consistent in every context
- No context-dependent behavior

---

### TC_MAIN_03: Test Coverage Analysis

**Purpose**: Verify system-wide test coverage and identify untested areas.

**Test Steps**:

1. Execute the full test suite using the Jest --coverage flag
2. Generate the full coverage report
3. Check that the project meets the required minimum coverage threshold (80%)
4. Identify any low-coverage or uncovered lines of code

**Running the test**:

```bash
# First, generate coverage data
npm test -- --coverage

# Then run the coverage analysis test
npm test -- tc_main_03
```

**Expected Results**:

- ✅ Coverage report files generated
- ✅ Statement coverage ≥ 80%
- ✅ Branch coverage ≥ 80%
- ✅ Function coverage ≥ 80%
- ✅ Line coverage ≥ 80%
- ✅ Low-coverage files identified
- ✅ HTML and LCOV reports available

**Success Criteria**:

- Complete coverage report generated
- Project meets or exceeds 80% coverage threshold
- Untested areas clearly identified

**Viewing Coverage Reports**:

- HTML Report: `coverage/lcov-report/index.html` (open in browser)
- JSON Summary: `coverage/coverage-summary.json`
- LCOV Report: `coverage/lcov.info` (for CI/CD tools)

---

## Running All Maintainability Tests

Run all maintainability tests together:

```bash
npm test -- src/tests/maintainability/
```

Run all tests with coverage:

```bash
npm test -- src/tests/maintainability/ --coverage
```

---

## ISO 25010 Compliance

These tests validate the following ISO 25010 Maintainability characteristics:

### Modularity

- **TC_MAIN_01**: Verifies that the system is composed of discrete components with minimal dependencies

### Reusability

- **TC_MAIN_02**: Ensures shared utilities can be used consistently across different modules

### Analyzability

- **TC_MAIN_03**: Provides comprehensive coverage analysis to identify maintainability issues

### Testability

- **TC_MAIN_01**: Confirms modules can be tested in isolation
- **TC_MAIN_03**: Measures test coverage across the entire system

---

## Prerequisites

- Node.js and npm installed
- Jest configured with ES modules support
- All project dependencies installed (`npm install`)

---

## Interpreting Results

### TC_MAIN_01 Results

- **All tests pass**: Modules are properly isolated and independent
- **Failures**: Indicates tight coupling between modules that should be refactored

### TC_MAIN_02 Results

- **All tests pass**: Utility functions are consistent and reliable
- **Failures**: Indicates utilities behave differently in different contexts (requires investigation)

### TC_MAIN_03 Results

- **Coverage ≥ 80%**: Excellent test coverage, meets maintainability standards
- **Coverage < 80%**: Needs more tests to ensure adequate maintainability
- **Check console output**: Lists specific files and functions that need more coverage

---

## Troubleshooting

### TC_MAIN_01 Issues

**Problem**: Tests fail due to module dependencies
**Solution**:

- Review import statements in modules
- Ensure modules only depend on interfaces, not implementations
- Use dependency injection and mocking

### TC_MAIN_02 Issues

**Problem**: Utility functions produce inconsistent results
**Solution**:

- Check for global state or side effects
- Ensure functions are pure (same input → same output)
- Verify no context-dependent behavior

### TC_MAIN_03 Issues

**Problem**: Coverage data not found
**Solution**:

```bash
# Generate coverage first
npm test -- --coverage

# Then run analysis
npm test -- tc_main_03
```

**Problem**: Coverage below threshold
**Solution**:

- Review HTML report: `coverage/lcov-report/index.html`
- Focus on untested files shown in console output
- Add tests for uncovered functions and branches

---

## Best Practices

1. **Run TC_MAIN_03 regularly**: Monitor coverage trends over time
2. **Fix TC_MAIN_01 failures immediately**: Module coupling is hard to fix later
3. **Keep utilities pure**: TC_MAIN_02 tests depend on utility function purity
4. **Aim for >80% coverage**: But focus on meaningful tests, not just coverage numbers
5. **Review coverage reports**: Use HTML reports to identify exactly what needs testing

---

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run Maintainability Tests
  run: |
    npm test -- src/tests/maintainability/ --coverage

- name: Upload Coverage Reports
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

### Coverage Thresholds in Jest Config

```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};
```

---

## Maintenance Schedule

- **Daily**: Run TC_MAIN_01 and TC_MAIN_02 (fast tests)
- **Before commits**: Run all maintainability tests
- **Weekly**: Review TC_MAIN_03 coverage reports and trends
- **Monthly**: Analyze coverage trends and improve low-coverage areas

---

## Support

For issues or questions about maintainability tests:

1. Check this README
2. Review test output and console logs
3. Consult ISO 25010 standards documentation
4. Review project maintainability guidelines
