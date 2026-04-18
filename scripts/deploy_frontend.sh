#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/root/web-frontend-javascript}"
BRANCH="${BRANCH:-main}"
SERVICE_NAME="${SERVICE_NAME:-frontend}"
DOCKER_COMPOSE_BIN="${DOCKER_COMPOSE_BIN:-docker compose}"
FORCE_GIT_SYNC="${FORCE_GIT_SYNC:-1}"
NO_CACHE_BUILD="${NO_CACHE_BUILD:-0}"

echo "[deploy] project dir: ${PROJECT_DIR}"
echo "[deploy] branch: ${BRANCH}"
echo "[deploy] service: ${SERVICE_NAME}"

cd "${PROJECT_DIR}"

echo "[deploy] git fetch"
git fetch origin "${BRANCH}"

CURRENT_BRANCH="$(git branch --show-current)"
if [ "${CURRENT_BRANCH}" != "${BRANCH}" ]; then
  echo "[deploy] checkout ${BRANCH}"
  git checkout "${BRANCH}"
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "[deploy] detected local tracked changes:"
  git status --short
fi

if [ "${FORCE_GIT_SYNC}" = "1" ]; then
  echo "[deploy] force sync tracked files to origin/${BRANCH}"
  git reset --hard "origin/${BRANCH}"
else
  echo "[deploy] git pull --ff-only"
  git pull --ff-only origin "${BRANCH}"
fi

echo "[deploy] stop ${SERVICE_NAME}"
${DOCKER_COMPOSE_BIN} down

if [ "${NO_CACHE_BUILD}" = "1" ]; then
  echo "[deploy] docker compose build --no-cache ${SERVICE_NAME}"
  ${DOCKER_COMPOSE_BIN} build --no-cache "${SERVICE_NAME}"
else
  echo "[deploy] docker compose build ${SERVICE_NAME}"
  ${DOCKER_COMPOSE_BIN} build "${SERVICE_NAME}"
fi

echo "[deploy] recreate ${SERVICE_NAME}"
${DOCKER_COMPOSE_BIN} up -d --force-recreate "${SERVICE_NAME}"

echo "[deploy] frontend container status"
docker ps --filter "name=${SERVICE_NAME}"

echo "[deploy] recent logs"
${DOCKER_COMPOSE_BIN} logs --tail=80 "${SERVICE_NAME}"

echo "[deploy] done"
