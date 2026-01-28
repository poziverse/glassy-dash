# ANTIGRAVITY MANUAL

## Overview

This manual serves as the definitive guide for Antigravity, the AI agent responsible for orchestrating the `glassy-dash` project and its environment. It documents the current state, verification procedures, and maintenance tasks.

## Project Structure

- **Root**: `/home/pozicontrol/projects/glassy-dash/GLASSYDASH`
- **Frontend**: `src/` (Vite + React)
- **Backend**: `server/` (Node.js + Express)
- **Tests**: `tests/` (Integration/E2E) and `src/__tests__` (Unit)
- **Docs**: `docs/`
- **Deployment**: `DEPLOYMENT.md` (Production Infrastructure)

## Infrastructure "Poziverse"

- **Jump Host**: `104.225.217.232`
- **Nested VM**: `192.168.122.45`
- **Prod Port**: `3001` (due to Traefik conflict on 8080)
- **Constraint**: VM disk fills up; extensive use of `docker system prune` required.

## Key Commands

- **Start Dev Server**: `npm run dev` (starts Frontend, API, and Scheduler)
- **Run API Only**: `npm run api`
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Test Unit**: `npm run test:unit`
- **Test E2E**: `npm run test:e2e`

## Environment Setup

- **Node Version**: Check `.nvmrc` (v20+)
- **Port**:
  - Frontend: 5173
  - API: 3001 (default)

## Verification Procedures

1.  **Build Verification**: Always ensuring `npm run build` passes is critical before confirming any changes.
2.  **Linting**: Code quality is enforced via ESLint. `npm run lint` should remain clean.
3.  **Tests**: Unit tests covering core logic and API health checks must pass.
4.  **Health Dashboard Check**: Verify `/api/monitoring/metrics` returns valid JSON with CPU/Memory stats before deploying.
5.  **Performance Check**: Ensure `applyThemePreset` in `settingsStore.js` is atomic to prevent UI flicker.

## Maintenance

- **Cleanup**: `npm run trash:cleanup` manages deleted items.
- **Backups**: `npm run db:backup` creates snapshots of the SQLite database.
