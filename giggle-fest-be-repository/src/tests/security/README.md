# Security Test Suite

This directory contains automated security tests for the GiggleFest API, following ISO/IEC 25010 Security standards.

## Test Cases

### TC_SEC_01: Password Encryption Verification

**File:** `tc_sec_01.test.js`

Tests that passwords are properly encrypted in the database using bcrypt.

**Steps:**

1. Create a user with plaintext password
2. Query database directly
3. Confirm password is hashed
4. Verify hash is irreversible

**Expected:** Passwords stored as bcrypt hashes, not reversible to plaintext.

---

### TC_SEC_02: JWT Token Validation

**File:** `tc_sec_02.test.js`

Tests JWT token tampering detection.

**Steps:**

1. Generate valid JWT token
2. Tamper with token payload
3. Call protected endpoint with modified token
4. Confirm request is rejected

**Expected:** Tampered tokens rejected with 401 Unauthorized.

---

### TC_SEC_03: Authentication Required for Protected Routes

**File:** `tc_sec_03.test.js`

Tests authentication enforcement on protected endpoints.

**Steps:**

1. Call protected endpoints with no token
2. Call with expired token
3. Call with invalid token
4. Verify all are rejected

**Expected:** All unauthorized requests return 401/403.

---

### TC_SEC_04: Audit Logging of Sensitive Operations

**File:** `tc_sec_04.test.js`

Tests audit logging for sensitive operations.

**Steps:**

1. Perform user login
2. Modify data
3. Delete data
4. Check audit logs

**Expected:** Operations logged with timestamp, user ID, and action details.

---

### TC_SEC_05: SQL Injection Prevention

**File:** `tc_sec_05.test.js`

Tests SQL injection attack prevention.

**Steps:**

1. Submit malicious SQL payloads
2. Attempt common SQL injection patterns
3. Confirm input is sanitized
4. Ensure no data leakage

**Expected:** Malicious SQL treated as literal input, database not compromised.

## Running Tests

### Run all security tests:

```bash
npm test -- --testPathPattern=security
```

### Run individual test:

```bash
npm test -- tc_sec_01
npm test -- tc_sec_02
npm test -- tc_sec_03
npm test -- tc_sec_04
npm test -- tc_sec_05
```

### Run with coverage:

```bash
npm test -- --coverage --testPathPattern=security
```

## Prerequisites

1. **Environment Variables:**

   - `BASE_URL`: API base URL (default: http://localhost:8080)
   - `JWT_SECRET`: JWT secret key for token generation
   - `DATABASE_URL`: PostgreSQL connection string

2. **Dependencies:**

   ```bash
   npm install --save-dev jest supertest
   npm install bcrypt jsonwebtoken @prisma/client
   ```

3. **Database:**

   - PostgreSQL must be running
   - Database must be migrated with Prisma

4. **Server:**
   - API server must be running on configured port

## Test Data Cleanup

All tests include `afterAll()` hooks to clean up test data from the database.

## Security Best Practices Verified

- ✅ Password hashing with bcrypt
- ✅ JWT token validation and tampering detection
- ✅ Authentication enforcement on protected routes
- ✅ Audit logging for sensitive operations
- ✅ SQL injection prevention with parameterized queries
- ✅ Input sanitization
- ✅ Error message security (no information disclosure)
- ✅ Database integrity protection

## Additional Testing Tools

### For comprehensive SQL injection testing:

```bash
# Install sqlmap (Linux/Mac)
git clone --depth 1 https://github.com/sqlmapproject/sqlmap.git

# Run against your API
python sqlmap.py -u "http://localhost:8080/api/v1/auth/login" \
  --data='{"email":"test@example.com","password":"test"}' \
  --batch --risk=3 --level=5
```

## Reporting

Test results include:

- Pass/fail status for each test
- Detailed error messages for failures
- Security vulnerability detection
- Coverage reports

## Compliance

These tests help ensure compliance with:

- ISO/IEC 25010 - Security Quality Characteristics
- OWASP Top 10 Security Risks
- PCI DSS (if handling payment data)
- GDPR (data protection requirements)
