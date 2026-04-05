# Docker Compose Setup Guide

This project is now configured to run with Docker and Docker Compose, featuring a PostgreSQL database for persistent data storage.

## Prerequisites

- Docker (20.10+)
- Docker Compose (2.0+)

## Project Architecture

```
alarmbot (Discord Bot)
    ↓ depends_on
db (PostgreSQL 17-Alpine)
    ↓
db-data (Persistent Volume)
```

## Quick Start

### 1. Create Environment File

Copy the `.env.example` to create your `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Discord Bot Token from Discord Developer Portal
DISCORD_BOT_TOKEN=your_token_here

# Database credentials
DB_USER=alarmbot
DB_PASSWORD=your_secure_password_here
DB_NAME=alarmbot
DB_PORT=5432
```

### 2. Build and Start Services

```bash
# Build and start both services
docker compose up --build

# Run in background
docker compose up -d --build

# View logs
docker compose logs -f alarmbot
docker compose logs -f db
```

### 3. Stop Services

```bash
# Stop and keep containers
docker compose stop

# Stop and remove containers
docker compose down

# Remove volumes as well (WARNING: deletes database data)
docker compose down -v
```

## Service Details

### PostgreSQL Database (db)

- **Image:** `postgres:17-alpine`
- **Port:** `5432` (exposed on host via `DB_PORT`)
- **Data Persistence:** Stored in `db-data` volume
- **Health Check:** Runs `pg_isready` every 10 seconds
- **User:** Configured via `DB_USER` env var
- **Password:** Configured via `DB_PASSWORD` env var
- **Database:** Configured via `DB_NAME` env var

**Connection String (from bot):** `postgresql://alarmbot:password@db:5432/alarmbot`

### Alarmbot Application

- **Build:** Multi-stage Docker build from `Dockerfile`
- **Depends On:** PostgreSQL database (waits for healthy status)
- **Environment:** Production mode with environment variables
- **Health Check:** Checks bot responsiveness every 30 seconds
- **Restart Policy:** Restarts automatically unless manually stopped
- **Network:** Connected via `alarmbot-network` bridge

## Database Schema and Migrations

The bot automatically initializes the database schema using Prisma migrations when it starts. This happens in the container's entrypoint before the bot begins running.

### Automatic Migration Process

When you run `docker compose up`, the startup process is:

1. **Database Container Starts** → PostgreSQL begins (health check waits ~10 seconds)
2. **Bot Container Starts** → entrypoint.sh runs
3. **Migrations Execute** → `pnpm run migrate` applies all pending migrations
4. **Bot Launches** → Discord bot connects and starts listening

This ensures the database is always in sync with your schema definitions.

### Schema Overview

The bot uses the following data models (defined in `prisma/schema.prisma`):

#### Tables

1. **alarm**
   - Stores Discord alarm configurations per guild
   - Fields: id, guildId, channelId, timeOfDay, triggerAt, createdAt, modifiedAt, isDeleted
   - Indexes: (guildId, timeOfDay, isDeleted) and (isDeleted, triggerAt)
   - Purpose: Tracks scheduled alarms and deletion state

2. **guildcommandaccess**
   - Controls command access per guild
   - Fields: id, guildId, principalType, principalId, createdAt, modifiedAt
   - Unique constraint: (guildId, principalType, principalId)
   - Purpose: Manages user/role-based access control per guild

### Migration Files

Located in `prisma/migrations/`:

- **20260207053653/**: Initial schema setup (Alarm table)
- **20260404094500_add_access_and_alarm_time/**: Added access control and time-of-day fields

### Creating New Migrations

If you modify `prisma/schema.prisma`, create a new migration:

```bash
# Development environment (uses prisma directly)
pnpm run migrate:dev --name "description_of_changes"

# Or manually create migration
pnpm run migrate:create -- --name "description_of_changes"

# Then apply with
pnpm run migrate
```

**Note:** Migrations should be committed to version control before deployment.

### Migration Files Copied to Container

The Dockerfile copies the entire `prisma/` directory including:
- `schema.prisma` - Current schema definition
- `migrations/` - All migration files
- `migration_lock.toml` - Lock file (prevents concurrent migrations)

This ensures every deployment can apply all necessary migrations.

## Volumes

### db-data

- Persists PostgreSQL database files
- Mounted at `/var/lib/postgresql/data` in the database container
- Survives container restarts and recreation
- Can be cleaned with: `docker compose down -v`

### Audio File

- `migu_alarm.m4a` is copied into the container during build
- Required for alarm playback functionality
- Mounted as read-only in the bot container

## Networks

### alarmbot-network

A bridge network enabling communication between services:
- Bot can reach database at hostname `db` on port `5432`
- Database can reach bot at hostname `alarmbot` on port 3000
- Isolated from host and other containers

## Common Tasks

### View Database

Connect to the running PostgreSQL container:

```bash
docker compose exec db psql -U alarmbot -d alarmbot
```

### View Bot Logs

```bash
# Last 50 lines
docker compose logs --tail=50 alarmbot

# Follow logs in real-time
docker compose logs -f alarmbot

# Specific service
docker compose logs db
```

### Restart Services

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart alarmbot
docker compose restart db
```

### Access the Database from Host

PostgreSQL is exposed on the port defined by `DB_PORT` (default 5432):

```bash
# Using psql
psql -h localhost -U alarmbot -d alarmbot

# Using another Docker container
docker run --rm -it postgres:17-alpine psql -h alarmbot-db -U alarmbot -d alarmbot
```

## Environment Variables

### For Docker Services

| Variable | Default | Description |
|----------|---------|-------------|
| `DISCORD_BOT_TOKEN` | - | Discord bot authentication token |
| `DB_USER` | alarmbot | PostgreSQL user |
| `DB_PASSWORD` | - | PostgreSQL password |
| `DB_NAME` | alarmbot | PostgreSQL database name |
| `DB_PORT` | 5432 | PostgreSQL port on host |
| `NODE_ENV` | production | Node.js environment |

### For Node Application

Inside the container, the bot uses:
- `DATABASE_URL`: Constructed from `DB_USER`, `DB_PASSWORD`, `db` hostname, and `DB_NAME`
- `DISCORD_BOT_TOKEN`: Your Discord bot token

## Troubleshooting

### Database Connection Refused

**Issue:** Bot can't connect to database

**Solutions:**
1. Ensure `docker compose ps` shows both services as healthy
2. Check logs: `docker compose logs db`
3. Verify `DB_PASSWORD` is set in `.env`
4. Ensure the database finished initialization (check health status)

### Permission Denied Error

**Issue:** Cannot write to database directory

**Solution:**
```bash
# Ensure proper permissions
docker compose down -v
docker compose up -d
```

### Port Already in Use

**Issue:** `DB_PORT` is already in use on host

**Solution:** Change `DB_PORT` in `.env` to an available port (e.g., 5433)

### Bot Crashes on Startup

**Issue:** Application fails immediately

**Solutions:**
1. Check logs: `docker compose logs alarmbot`
2. Verify `DISCORD_BOT_TOKEN` is correct
3. Ensure audio file `migu_alarm.m4a` exists
4. Check Prisma schema and migrations are present

### Migration Failures

**Issue:** Database migrations fail on startup

**Symptoms:**
- Error messages about "migration already exists" or "failed to apply migration"
- Bot doesn't start after database is healthy

**Solutions:**

1. **View full migration logs:**
   ```bash
   docker compose logs alarmbot
   ```

2. **Check migration status:**
   ```bash
   docker compose exec db psql -U alarmbot -d alarmbot -c \
     "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"
   ```

3. **Verify schema is current:**
   - Ensure `prisma/schema.prisma` matches your code
   - Ensure all migration files in `prisma/migrations/` are present

4. **Reset migrations (development only):**
   ```bash
   # WARNING: This deletes all data!
   docker compose down -v
   docker compose up --build
   ```

5. **Manual migration in existing database:**
   ```bash
   docker compose exec alarmbot pnpm run migrate
   ```

### Database Already Exists

**Issue:** "database already exists" error on fresh start

**Solution:** This is usually harmless. The migration will skip existing tables. If you want a clean slate:

```bash
docker compose down -v        # Remove volume
docker compose up --build     # Start fresh
```

## Entrypoint Script

The bot uses `entrypoint.sh` to manage startup sequence:

1. **Checks DATABASE_URL** - Ensures environment is configured
2. **Runs Migrations** - `pnpm run migrate` applies pending changes
3. **Starts Bot** - `pnpm start` launches the Discord bot

The entrypoint ensures migrations complete before the bot attempts to connect to the database.

**View entrypoint output:**
```bash
docker compose logs alarmbot
```

## Production Considerations

1. **Environment Security**
   - Use strong, randomly generated passwords
   - Store `.env` in secure configuration management
   - Never commit `.env` to version control

2. **Database Backups**
   - Regularly backup the `db-data` volume
   - Use `docker compose exec db pg_dump` for exports
   - Schedule automated backups before deployments

3. **Migration Safety**
   - Test migrations in development first
   - Always have backups before running new migrations in production
   - Monitor logs during migration execution
   - Keep migration files in version control
   - Document schema changes with migration descriptions

4. **Updates**
   - Test image updates in development first
   - Use specific PostgreSQL versions (avoid `latest` tag)
   - Verify migrations work with new versions

5. **Monitoring**
   - Implement health checks (already configured)
   - Monitor container logs regularly
   - Set up alerts for migration failures
   - Track database size growth

6. **Resource Limits**
   - Consider adding memory and CPU limits in compose.yaml
   - Monitor database performance with `pg_stat_statements`
   - Plan for database scaling

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Discord.js Documentation](https://discord.js.org/)
