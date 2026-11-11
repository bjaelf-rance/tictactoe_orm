# Tic-Tac-Toe with Prisma ORM and MySQL

## Purpose
A tic-tac-toe web game where players choose an avatar and play. Every game is saved to a MySQL database, so game history persists after the server restarts. Players can create games, play and save moves, rename players, view history, and delete games.

## Technologies Used
- Node.js and Express.js (backend API)
- Prisma ORM v6
- MySQL (via XAMPP)
- HTML, CSS, and JavaScript (frontend)

## Features and CRUD Operations
- **Create:** start a new game with player names and avatars (`prisma.game.create`)
- **Read:** list the game history and open a game (`findMany`, `findUnique`)
- **Update:** make moves and rename players (`prisma.game.update`)
- **Delete:** remove a game from history (`prisma.game.delete`)

## Database Configuration
1. Start MySQL (for example, from the XAMPP Control Panel).
2. Create a database named `tictactoe_db` (for example, in phpMyAdmin).
3. Copy `.env.example` to a new file named `.env`.
4. In `.env`, set your `DATABASE_URL`. With XAMPP's default settings (no password):
   `DATABASE_URL="mysql://root:@localhost:3306/tictactoe_db"`

## How to Run
Requires Node.js and MySQL.

```bash
npm install
npx prisma migrate dev
node server.js
```
Then open http://localhost:3000 in your browser.

## Project Structure
- `prisma/schema.prisma`: database model (Game)
- `prisma/migrations/`: database migration history
- `db.js`: Prisma Client instance
- `server.js`: Express API using Prisma
- `public/`: frontend pages, styles, and scripts
- `public/avatars/`: pixel avatar images