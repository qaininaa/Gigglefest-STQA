# SQLMap Testing Guide for GiggleFest API

## Prerequisites

- Make sure your server is running: `npm run dev`
- Server should be available at: `http://localhost:8080`
- SQLMap installed at: `C:/Users/karin/Documents/sqlmap`

## Basic SQLMap Commands

### 1. Test Login Endpoint (POST with JSON)

```bash
cd C:/Users/karin/Documents/sqlmap

# Test email field for SQL injection
python sqlmap.py -u "http://localhost:8080/api/v1/auth/login" \
  --data='{"email":"*","password":"test123"}' \
  --method POST \
  --headers="Content-Type: application/json" \
  --batch --level=5 --risk=3

# Test password field
python sqlmap.py -u "http://localhost:8080/api/v1/auth/login" \
  --data='{"email":"test@example.com","password":"*"}' \
  --method POST \
  --headers="Content-Type: application/json" \
  --batch --level=5 --risk=3
```

### 2. Test Search/Filter Endpoints (GET with query parameters)

```bash
# Test search parameter
python sqlmap.py -u "http://localhost:8080/api/v1/events?search=test" \
  --batch --level=5 --risk=3

# Test with multiple parameters
python sqlmap.py -u "http://localhost:8080/api/v1/events?search=test&category=1" \
  --batch --level=5 --risk=3
```

### 3. Test Registration Endpoint

```bash
# Test name field
python sqlmap.py -u "http://localhost:8080/api/v1/auth/register" \
  --data='{"email":"test@example.com","password":"Test123!","name":"*","age":25,"phoneNumber":"081234567890"}' \
  --method POST \
  --headers="Content-Type: application/json" \
  --batch --level=5 --risk=3
```

### 4. Test Protected Endpoints (with authentication)

First, get a valid token by logging in, then:

```bash
# Replace YOUR_TOKEN_HERE with actual token
python sqlmap.py -u "http://localhost:8080/api/v1/users/profile" \
  --method GET \
  --headers="Authorization: Bearer YOUR_TOKEN_HERE" \
  --batch --level=5 --risk=3

# Test profile update
python sqlmap.py -u "http://localhost:8080/api/v1/users/profile" \
  --data='{"name":"*","phoneNumber":"081234567890"}' \
  --method PUT \
  --headers="Authorization: Bearer YOUR_TOKEN_HERE\nContent-Type: application/json" \
  --batch --level=5 --risk=3
```

### 5. Test Event Details Endpoint (ID parameter)

```bash
# Test ID parameter in URL
python sqlmap.py -u "http://localhost:8080/api/v1/events/1" \
  --batch --level=5 --risk=3

# Or with parameter marker
python sqlmap.py -u "http://localhost:8080/api/v1/events/*" \
  --batch --level=5 --risk=3
```

## SQLMap Options Explained

- `--batch`: Run in non-interactive mode (auto-yes to all prompts)
- `--level=5`: Set test depth (1-5, higher = more thorough)
- `--risk=3`: Set risk level (1-3, higher = more aggressive tests)
- `--data`: POST request body
- `--method`: HTTP method (POST, GET, PUT, DELETE)
- `--headers`: Custom HTTP headers
- `-u`: Target URL
- `*`: Injection point marker (where to test)

## Additional Useful Options

### Database Enumeration (if injection found)

```bash
# List databases
python sqlmap.py -u "URL" --dbs

# List tables in database
python sqlmap.py -u "URL" -D database_name --tables

# Dump table data
python sqlmap.py -u "URL" -D database_name -T table_name --dump
```

### Save and Load Sessions

```bash
# Save session
python sqlmap.py -u "URL" --batch --session-file=gigglefest_test

# Resume session
python sqlmap.py --session-file=gigglefest_test
```

### Output Options

```bash
# Verbose output
python sqlmap.py -u "URL" -v 3

# Save output to file
python sqlmap.py -u "URL" --batch > test_results.txt
```

## Example Test Sequence

### Step 1: Start your server

```bash
cd C:/Users/karin/Documents/belajar-fs/gigglefest/giggle-fest-be-repository
npm run dev
```

### Step 2: Run SQLMap tests

Open a new terminal:

```bash
cd C:/Users/karin/Documents/sqlmap

# Quick test on login
python sqlmap.py -u "http://localhost:8080/api/v1/auth/login" \
  --data='{"email":"*","password":"test"}' \
  --method POST \
  --headers="Content-Type: application/json" \
  --batch

# Quick test on search
python sqlmap.py -u "http://localhost:8080/api/v1/events?search=test" \
  --batch
```

## Expected Results

If your application is secure (like the Jest tests showed):

- SQLMap should report: **"all tested parameters do not appear to be injectable"**
- No vulnerabilities found
- Database remains intact

If vulnerabilities are found:

- SQLMap will report the injection type (e.g., "boolean-based blind")
- It may be able to extract database information
- **IMPORTANT**: Fix immediately before production!

## Tips

1. **Always test on localhost/development** - Never run aggressive tests on production
2. **Monitor server logs** - Watch for errors or unusual activity
3. **Test one endpoint at a time** - Easier to identify issues
4. **Start with low risk** - Use `--risk=1` first, then increase if needed
5. **Check database after** - Verify no data was modified

## Troubleshooting

### Issue: "connection refused"

- Make sure server is running on port 8080
- Check: `curl http://localhost:8080/api/v1/events`

### Issue: "JSON parsing error"

- Ensure proper JSON format in `--data`
- Use single quotes around JSON: `'{"key":"value"}'`

### Issue: Too slow

- Reduce level: `--level=3` instead of `--level=5`
- Use specific injection point with `*` marker
- Add `--threads=5` for faster execution

## Safety Notes

⚠️ **WARNING**: SQLMap is a penetration testing tool

- Only use on your own applications
- Get permission before testing third-party systems
- Some tests may cause temporary service disruption
- Monitor database and server health during tests

## Reference

Full SQLMap documentation: https://github.com/sqlmapproject/sqlmap/wiki
