# Deployment Workflow

Use this for Docker, production, container, packaging, and release-sensitive work.

## Primary Files

- `Dockerfile`
- `docker-compose.yaml`
- `docker/`
- Deployment-related environment and build scripts.

## Specs and ADRs to Open as Needed

- `openspec/specs/container-deployment/spec.md`
- `openspec/specs/electron-packaging/spec.md`
- `openspec/specs/auto-updater/spec.md`
- `docs/adr/ADR-003_docker-optimization.md`

## Required Checks

For deployment changes, run or explicitly report why you could not run:

```bash
npm run build
docker build -t jianan-ai:latest .
```

## Rules

- Do not print secrets, API keys, or full environment dumps.
- Keep image size and multi-stage build behavior in mind.
- If LLM backend configuration changes, also read `domains/llm-infra.md`.
