# UIGen justfile — wraps package.json scripts

# List available recipes
default:
    @just --list

# Start dev server with Turbopack
dev:
    npm run dev

# Start dev server as background daemon (logs to logs.txt)
dev-daemon:
    npm run dev:daemon

# Build for production
build:
    npm run build

# Start production server
start:
    npm run start

# Run ESLint
lint:
    npm run lint

# Run Vitest test suite
test:
    npm run test

# Run a single test file
# Usage: just test-file src/lib/__tests__/file-system.test.ts
test-file file:
    npx vitest run {{file}}

# Install deps + prisma generate + db migrate
setup:
    npm run setup

# Reset database (destructive)
db-reset:
    npm run db:reset
