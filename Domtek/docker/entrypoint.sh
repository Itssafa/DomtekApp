#!/bin/bash
set -e

php artisan storage:link --force || true
php artisan migrate --force
php artisan config:cache
php artisan route:cache


exec "$@"