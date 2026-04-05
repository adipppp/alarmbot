# Prisma Migrations - Quick Reference

## What Was Added

### Files Created
- **entrypoint.sh** - Shell script that runs migrations before starting the bot

### Files Updated
- **package.json** - Added `migrate`, `migrate:dev`, `migrate:create`, `db:seed` scripts
- **Dockerfile** - Copies prisma/ directory and uses entrypoint.sh
- **DOCKER_SETUP.md** - Added comprehensive migration documentation

## How It Works

When you run `docker compose up --build`:

1. PostgreSQL container starts and becomes healthy
2. Bot container starts and runs `entrypoint.sh`
3. `entrypoint.sh` validates DATABASE_URL
4. `pnpm run migrate` executes all pending migrations
5. Bot starts with `pnpm start`

## Current Migrations

Located in `prisma/migrations/`:

1. **20260207053653/** - Initial schema
   - Creates `alarm` table

2. **20260404094500_add_access_and_alarm_time/** - Access control
   - Creates `guildcommandaccess` table
   - Adds `timeOfDay` field to `alarm` table

## NPM Scripts

```bash
pnpm run migrate          # Apply migrations (production - used in Docker)
pnpm run migrate:dev      # Interactive development migrations
pnpm run migrate:create   # Create new migration manually
pnpm run db:seed          # Database seeding (placeholder)
```

## Creating New Migrations

### Local Development
```bash
# Edit schema
nano prisma/schema.prisma

# Generate migration
pnpm run migrate:dev

# Name your migration when prompted
# Migration applies to local database
# Files created in prisma/migrations/

# Commit to Git
git add prisma/
git commit -m "Add new field to alarm table"
```

### Docker Deployment
```bash
# Pull code with new migration
git pull

# Build and deploy
docker compose up --build

# entrypoint.sh automatically applies migrations
```

## Viewing Migrations

```bash
# View migration logs during startup
docker compose logs alarmbot | grep -i migration

# Check applied migrations
docker compose exec db psql -U alarmbot -d alarmbot -c \
  "SELECT * FROM _prisma_migrations;"

# View database tables
docker compose exec db psql -U alarmbot -d alarmbot -c "\dt"
```

## Troubleshooting

### Migration Fails on Startup
```bash
# View full logs
docker compose logs alarmbot

# Check database health
docker compose ps db

# Try manual migration
docker compose exec alarmbot pnpm run migrate
```

### Reset Database (Development Only)
```bash
# WARNING: Deletes all data
docker compose down -v
docker compose up --build
```

### Backup Before Migration
```bash
docker compose exec db pg_dump -U alarmbot alarmbot > backup.sql
```

## Key Points

✅ Migrations run **automatically** on container startup
✅ Idempotent - safe to run multiple times
✅ Version-controlled - all files in Git
✅ No manual database setup needed
✅ Supports development and production flows
✅ Clear error messages if something fails

## Production Checklist

- [ ] Test migrations in development first
- [ ] Create database backup
- [ ] Monitor logs during first deployment
- [ ] Verify schema applied correctly
- [ ] Bot connects to Discord successfully
- [ ] Test bot commands work with new schema

## Development Workflow

1. Edit `prisma/schema.prisma`
2. Run `pnpm run migrate:dev`
3. Test with local database
4. Review generated SQL
5. Commit `prisma/` directory
6. Deploy with `docker compose up --build`
