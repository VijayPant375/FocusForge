# FocusForge Docker Guide
## Start
docker-compose up --build
## Seed
docker-compose exec user-service npm run seed
docker-compose exec habit-service npm run seed
## Access
Frontend: http://localhost:5173
API: http://localhost:5000
## Stop
docker-compose down
