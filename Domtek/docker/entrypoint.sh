#!/bin/bash
set -e

# Créer les répertoires framework nécessaires (absents du repo via .gitignore)
mkdir -p storage/framework/cache/data
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
chown -R www-data:www-data storage/framework
chmod -R 775 storage/framework

php artisan storage:link --force || true
php artisan migrate --force
php artisan config:cache
php artisan route:cache

exec "$@"