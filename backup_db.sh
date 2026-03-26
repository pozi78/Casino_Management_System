#!/bin/bash

# Configuration
BACKUP_DIR="/opt/CasinosSM/backups"
CONTAINER_NAME="casinosm-database"
DB_USER="userCasinoSM"
DB_NAME="casinosm"
DAYS_TO_KEEP=30
DATE=$(date +%Y-%m-%d_%H%M)
BACKUP_FILE="${BACKUP_DIR}/casinosm_backup_${DATE}.sql"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Run pg_dump inside the container and save to host
echo "Starting backup of ${DB_NAME}..."
docker exec "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" "${DB_NAME}" > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo "Backup completed: ${BACKUP_FILE}"
    # Delete backups older than 30 days
    find "${BACKUP_DIR}" -name "casinosm_backup_*.sql" -mtime +${DAYS_TO_KEEP} -delete
    echo "Old backups cleaned up."
else
    echo "Error: Backup failed."
    exit 1
fi
