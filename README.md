# Gigglefest-STQA

## 📋 Daftar Isi

- [Setup Project](#setup-project)
- [Testing Backend (Jest)](#testing-backend-jest)
- [Testing Frontend (Cypress)](#testing-frontend-cypress)
- [Testing Portability (Docker)](#testing-portability-docker)
- [Struktur Folder Testing](#struktur-folder-testing)

---

## 🚀 Setup Project

### 1. Clone Repository

```bash
git clone https://github.com/qaininaa/Gigglefest-STQA.git
cd Gigglefest-STQA
```

### 2. Setup Backend

```bash
cd giggle-fest-be-repository

# Install dependencies
npm install

# Setup database (pastikan PostgreSQL sudah running)
# Edit .env file sesuai konfigurasi database Anda
cp .env.example .env

# Generate Prisma Client
npx prisma generate

# Jalankan migration
npx prisma migrate dev

# Jalankan server (untuk testing integration)
npm run dev
```

### 3. Setup Frontend

```bash
cd ../giggle-fest-fe

# Install dependencies
npm install

# Jalankan dev server (untuk testing Cypress)
npm run dev
```

---

## 🧪 Testing Backend (Jest)

Backend menggunakan **Jest** untuk unit testing, integration testing, dan berbagai test case ISO/IEC 25010.

### Struktur Folder Testing

```
src/tests/
├── auth.test.js                    # Auth integration tests
├── cart.test.js                    # Cart integration tests
├── event.test.js                   # Event integration tests
├── ticket.test.js                  # Ticket integration tests
├── controllers-test/               # Controller unit tests
├── middlewares-test/               # Middleware unit tests
├── repositories-test/              # Repository unit tests
├── services-test/                  # Service unit tests
├── validators-test/                # Validator unit tests
├── maintainability/                # TC_MAIN_01-03 (ISO/IEC 25010)
├── security/                       # TC_SEC_01-05 (ISO/IEC 25010)
├── performance/                    # TC_PERF_01-05 (ISO/IEC 25010)
├── reliability/                    # TC_REL_01-05 (ISO/IEC 25010)
└── portability/                    # TC_PORT_01-04 (ISO/IEC 25010)
```

### Menjalankan Testing

#### 1. Jalankan Semua Test

```bash
cd giggle-fest-be-repository
npm test
```

#### 2. Jalankan Test per Folder

**Controllers Tests:**

```bash
npm test -- src/tests/controllers-test
```

**Services Tests:**

```bash
npm test -- src/tests/services-test
```

**Middlewares Tests:**

```bash
npm test -- src/tests/middlewares-test
```

**Repositories Tests:**

```bash
npm test -- src/tests/repositories-test
```

**Validators Tests:**

```bash
npm test -- src/tests/validators-test
```

**Maintainability Tests (ISO/IEC 25010):**

```bash
npm test -- src/tests/maintainability
```

**Security Tests (ISO/IEC 25010):**

```bash
npm test -- src/tests/security
```

**Performance Tests (ISO/IEC 25010):**

```bash
npm test -- src/tests/performance
```

**Reliability Tests (ISO/IEC 25010):**

```bash
npm test -- src/tests/reliability
```

#### 3. Jalankan Test dengan Coverage

```bash
npm run test:coverage
```

Hasil coverage akan tersimpan di folder `coverage/lcov-report/index.html`

#### 4. Jalankan Test Spesifik (Optional)

Jika ingin test file tertentu:

```bash
npm test -- src/tests/services-test/event.service.test.js
```

---

## 🎭 Testing Frontend (Cypress)

Frontend menggunakan **Cypress** untuk E2E testing, UI testing, dan accessibility testing.

### Struktur Folder Testing

```
cypress/
├── e2e/
│   ├── TC_UI_01_login_validation.cy.js      # Form validation
│   ├── TC_UI_02_login_success.cy.js         # Login success flow
│   ├── TC_UI_03_login_failure.cy.js         # Login failure handling
│   ├── TC_UI_04_login_responsive.cy.js      # Responsive design
│   ├── TC_UI_05_login_usability.cy.js       # Usability testing
│   ├── TC_UI_06_login_accessibility.cy.js   # WCAG 2.1 AA compliance
│   └── TC_UI_07_keyboard_navigation.cy.js   # Keyboard navigation
└── support/
    ├── commands.js
    └── e2e.js
```

### Menjalankan Testing

#### 1. Pastikan Backend & Frontend Running

```bash
# Terminal 1 - Backend
cd giggle-fest-be-repository
npm run dev

# Terminal 2 - Frontend
cd giggle-fest-fe
npm run dev
```

#### 2. Jalankan Cypress (Interactive Mode)

```bash
cd giggle-fest-fe
npm run cypress:open
```

Pilih test yang ingin dijalankan di UI Cypress.

#### 3. Jalankan Semua Test (Headless Mode)

```bash
npm run test:e2e
# atau
npm run cypress:run
```

#### 4. Jalankan Test Spesifik

```bash
npx cypress run --spec "cypress/e2e/TC_UI_01_login_validation.cy.js"
```

#### 5. Jalankan Test per Kategori

```bash
# Login validation tests
npx cypress run --spec "cypress/e2e/TC_UI_01*.cy.js"

# Accessibility tests
npx cypress run --spec "cypress/e2e/TC_UI_06*.cy.js"
```

---

## 🐳 Testing Portability (Docker)

Testing cross-platform portability menggunakan Docker untuk menguji aplikasi di berbagai arsitektur (AMD64, ARM64).

### Prerequisites

- Docker Desktop terinstall dan running
- Minimal 8GB RAM
- Support multi-platform build

### Struktur Testing

```
giggle-fest-be-repository/
├── docker-compose.portability.yml          # Docker orchestration
├── Dockerfile.test                         # Multi-platform Dockerfile
├── run-portability-test.sh                 # Automated test script (Linux/Mac)
├── run-portability-test.bat                # Automated test script (Windows)
└── src/tests/portability/
    └── tc_port_04_runner.js                # Test runner script
```

### Menjalankan Portability Test

#### Option 1: Automated Script (Recommended)

**Linux/Mac/Git Bash:**

```bash
cd giggle-fest-be-repository
./run-portability-test.sh
```

**Windows CMD/PowerShell:**

```cmd
cd giggle-fest-be-repository
run-portability-test.bat
```

Script akan otomatis:

1. ✓ Check Docker status
2. ✓ Clean up existing containers
3. ✓ Build multi-platform images (AMD64 & ARM64)
4. ✓ Start containers
5. ✓ Wait for services healthy
6. ✓ Run portability tests (20 test cases)
7. ✓ Cleanup

#### Option 2: Manual Step-by-Step

**1. Build Images:**

```bash
docker compose -f docker-compose.portability.yml build
```

**2. Start Containers:**

```bash
docker compose -f docker-compose.portability.yml up -d postgres-test app-linux-amd64 app-linux-arm64
```

**3. Check Container Status:**

```bash
docker ps
```

**4. Run Tests:**

```bash
docker compose -f docker-compose.portability.yml run --rm test-runner
```

**5. Cleanup:**

```bash
docker compose -f docker-compose.portability.yml down -v
```

### Interpretasi Hasil

**Success Output:**

```
╔════════════════════════════════════════════════════════════╗
║  ✓ Portability Tests PASSED                               ║
╚════════════════════════════════════════════════════════════╝

Total Tests: 20
Passed: 20
Failed: 0
Success Rate: 100.0%
```

**Apa yang Ditest:**

- ✓ Health check endpoints (AMD64 & ARM64)
- ✓ API response consistency
- ✓ Database connectivity
- ✓ Authentication flow
- ✓ CRUD operations
- ✓ Error handling
- ✓ Performance metrics
- ✓ Data validation

---

## 📊 Struktur Folder Testing

### Backend Testing Structure

```
giggle-fest-be-repository/
├── src/tests/
│   ├── auth.test.js                         # Auth API integration
│   ├── cart.test.js                         # Cart API integration
│   ├── event.test.js                        # Event API integration
│   ├── ticket.test.js                       # Ticket API integration
│   │
│   ├── controllers-test/                    # Unit tests untuk controllers
│   │   ├── cart.controller.test.js
│   │   ├── category.controller.test.js
│   │   ├── event.controller.test.js
│   │   ├── notification.controller.test.js
│   │   ├── payment.controller.test.js
│   │   ├── promo.controller.test.js
│   │   ├── review.controller.test.js
│   │   ├── ticket.controller.test.js
│   │   └── user.controller.test.js
│   │
│   ├── services-test/                       # Unit tests untuk services
│   │   ├── cart.service.test.js
│   │   ├── category.service.test.js
│   │   ├── event.service.test.js
│   │   ├── notification.service.test.js
│   │   ├── password.service.test.js
│   │   ├── payment.service.test.js
│   │   ├── promo.service.test.js
│   │   ├── review.service.test.js
│   │   ├── ticket.service.test.js
│   │   └── user.service.test.js
│   │
│   ├── middlewares-test/                    # Unit tests untuk middlewares
│   │   ├── auth.middleware.test.js
│   │   ├── error.middleware.test.js
│   │   ├── multer.middleware.test.js
│   │   ├── rateLimiter.middleware.test.js
│   │   └── validation.middleware.test.js
│   │
│   ├── repositories-test/                   # Unit tests untuk repositories
│   │   ├── cart.repository.test.js
│   │   ├── category.repository.test.js
│   │   ├── event.repository.test.js
│   │   ├── notification.repository.test.js
│   │   ├── payment.repository.test.js
│   │   ├── promo.repository.test.js
│   │   ├── review.repository.test.js
│   │   ├── ticket.repository.test.js
│   │   └── user.repository.test.js
│   │
│   ├── validators-test/                     # Unit tests untuk validators
│   │   ├── auth.validator.test.js
│   │   ├── cart.validator.test.js
│   │   ├── event.validator.test.js
│   │   ├── notification.validator.test.js
│   │   ├── payment.validator.test.js
│   │   ├── promo.validator.test.js
│   │   ├── review.validator.test.js
│   │   ├── ticket.validator.test.js
│   │   └── user.validator.test.js
│   │
│   ├── maintainability/                     # ISO/IEC 25010 - Maintainability
│   │   ├── tc_main_01.test.js              # Modularity testing
│   │   ├── tc_main_02.test.js              # Reusability testing
│   │   └── tc_main_03.test.js              # Analyzability testing
│   │
│   ├── security/                            # ISO/IEC 25010 - Security
│   │   ├── tc_sec_01.test.js               # Authentication security
│   │   ├── tc_sec_02.test.js               # Authorization security
│   │   ├── tc_sec_03.test.js               # Data encryption
│   │   ├── tc_sec_04.test.js               # Input validation
│   │   └── tc_sec_05.test.js               # SQL Injection prevention
│   │
│   ├── performance/                         # ISO/IEC 25010 - Performance
│   │   ├── tc_perf_01.test.js              # Response time
│   │   ├── tc_perf_02.test.js              # Resource utilization
│   │   ├── tc_perf_03.test.js              # Scalability
│   │   ├── tc_perf_04.test.js              # Load testing
│   │   └── tc_perf_05.test.js              # Stress testing
│   │
│   ├── reliability/                         # ISO/IEC 25010 - Reliability
│   │   ├── tc_rel_01.test.js               # Error recovery
│   │   ├── tc_rel_02.test.js               # Fault tolerance
│   │   ├── tc_rel_03.test.js               # Data consistency
│   │   ├── tc_rel_04.test.js               # Transaction rollback
│   │   └── tc_rel_05.test.js               # System availability
│   │
│   └── portability/                         # ISO/IEC 25010 - Portability
│       ├── tc_port_04_runner.js            # Cross-platform test runner
│       └── test-scenarios.js                # Test scenarios definition
│
├── coverage/                                 # Test coverage reports
│   └── lcov-report/
│       └── index.html                       # HTML coverage report
│
├── jest.config.js                           # Jest configuration
├── docker-compose.portability.yml           # Docker portability setup
├── Dockerfile.test                          # Multi-platform Dockerfile
├── run-portability-test.sh                  # Portability test script (Bash)
└── run-portability-test.bat                 # Portability test script (Windows)
```

### Frontend Testing Structure

```
giggle-fest-fe/
├── cypress/
│   ├── e2e/                                 # E2E test cases
│   │   ├── TC_UI_01_login_validation.cy.js
│   │   ├── TC_UI_02_login_success.cy.js
│   │   ├── TC_UI_03_login_failure.cy.js
│   │   ├── TC_UI_04_login_responsive.cy.js
│   │   ├── TC_UI_05_login_usability.cy.js
│   │   ├── TC_UI_06_login_accessibility.cy.js
│   │   └── TC_UI_07_keyboard_navigation.cy.js
│   │
│   ├── support/
│   │   ├── commands.js                      # Custom Cypress commands
│   │   └── e2e.js                          # Support configuration
│   │
│   ├── downloads/                           # Downloaded files
│   ├── fixtures/                            # Test data
│   ├── screenshots/                         # Failure screenshots
│   └── videos/                              # Test recordings
│
├── cypress.config.js                        # Cypress configuration
├── CYPRESS_IMPLEMENTATION.md                # Implementation guide
├── CYPRESS_QUICKSTART.md                    # Quick start guide
├── LOGIN_SETUP.md                           # Login setup documentation
└── LOGIN_TEST_GUIDE.md                      # Login testing guide
```

---

## 📝 Quick Commands Reference

### Backend (Jest)

```bash
# All tests
npm test

# Tests dengan coverage
npm run test:coverage

# Test per folder
npm test -- src/tests/services-test
npm test -- src/tests/controllers-test
npm test -- src/tests/maintainability
npm test -- src/tests/security
npm test -- src/tests/performance
npm test -- src/tests/reliability
```

### Frontend (Cypress)

```bash
# Interactive mode
npm run cypress:open

# Headless mode
npm run test:e2e

# Specific test
npx cypress run --spec "cypress/e2e/TC_UI_01*.cy.js"
```

### Portability (Docker)

```bash
# Automated (Linux/Mac/Git Bash)
./run-portability-test.sh

# Automated (Windows)
run-portability-test.bat

# Manual
docker compose -f docker-compose.portability.yml build
docker compose -f docker-compose.portability.yml up -d
docker compose -f docker-compose.portability.yml run --rm test-runner
docker compose -f docker-compose.portability.yml down -v
```

---

## 🎯 Test Coverage Goals

- **Unit Tests**: Controllers, Services, Repositories, Middlewares, Validators
- **Integration Tests**: API endpoints (Auth, Cart, Event, Ticket)
- **ISO/IEC 25010 Tests**: Maintainability, Security, Performance, Reliability, Portability
- **UI Tests**: Form validation, User flows, Responsive design, Accessibility (WCAG 2.1 AA)
- **Cross-Platform Tests**: Docker multi-arch (AMD64, ARM64)

---

## 🐛 Troubleshooting

### Jest Tests

**Problem**: Tests timeout

```bash
# Increase timeout in jest.config.js
testTimeout: 300000  # 5 minutes
```

**Problem**: Database connection error

```bash
# Pastikan PostgreSQL running dan .env sudah benar
npx prisma migrate dev
```

### Cypress Tests

**Problem**: Backend tidak connect

```bash
# Pastikan backend running di http://localhost:8080
cd giggle-fest-be-repository
npm run dev
```

**Problem**: Frontend tidak connect

```bash
# Pastikan frontend running di http://localhost:5173
cd giggle-fest-fe
npm run dev
```

### Docker Portability Tests

**Problem**: Docker not running

```bash
# Windows: Start Docker Desktop
# Linux/Mac: sudo systemctl start docker
```

**Problem**: Build gagal

```bash
# Clean up dan rebuild
docker compose -f docker-compose.portability.yml down -v
docker system prune -a
./run-portability-test.sh
```

---

## 📚 Dokumentasi Tambahan

- **Backend**: `giggle-fest-be-repository/readme.md`
- **Frontend**: `giggle-fest-fe/README.md`
- **Cypress**: `giggle-fest-fe/CYPRESS_QUICKSTART.md`
- **Portability**: `giggle-fest-be-repository/PORTABILITY_QUICKSTART.md`

---

## 👥 Contributors

Tim STQA - Software Testing & Quality Assurance

---

## 📄 License

MIT License
