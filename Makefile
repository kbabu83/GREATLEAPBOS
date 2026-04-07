# Great Leap App — Docker shortcuts
.PHONY: start stop restart shell artisan logs fresh

## First-time setup (builds images + migrates + seeds)
start:
	bash docker-start.sh

## Stop all containers
stop:
	docker compose down

## Restart containers
restart:
	docker compose restart

## Open a shell inside the PHP container
shell:
	docker compose exec app bash

## Run an artisan command: make artisan CMD="migrate:fresh --seed"
artisan:
	docker compose exec app php artisan $(CMD)

## Tail all container logs
logs:
	docker compose logs -f

## Rebuild frontend assets inside the node container
build:
	docker compose exec node npm run build

## Fresh DB (drop all tables + re-migrate + re-seed)
fresh:
	docker compose exec app php artisan migrate:fresh --seed --force

## Clear all Laravel caches
clear:
	docker compose exec app php artisan optimize:clear

## View running containers
ps:
	docker compose ps
