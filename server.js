const express = require("express");
require("dotenv").config();
const prisma = require("./db");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function getWinner(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] !== "-" && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return board.includes("-") ? null : "Draw";
}

function validId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validName(value) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 50;
}

function validAvatar(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]+\.(png|jpe?g|gif|webp)$/.test(value);
}

// READ: all games (history)
app.get("/api/games", async (req, res) => {
  try {
    const games = await prisma.game.findMany({ orderBy: { createdAt: "desc" } });
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch games" });
  }
});

// READ: one game
app.get("/api/games/:id", async (req, res) => {
  try {
    const id = validId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid game ID" });
    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) return res.status(404).json({ error: "Game not found" });
    res.json(game);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch game" });
  }
});

// CREATE: start a new game
app.post("/api/games", async (req, res) => {
  try {
    const { playerX, playerO, avatarX, avatarO } = req.body;
    if (!validName(playerX) || !validName(playerO)) {
      return res.status(400).json({ error: "Both player names are required (max 50 characters)." });
    }
    if (!validAvatar(avatarX) || !validAvatar(avatarO)) {
      return res.status(400).json({ error: "Please choose an avatar for each player." });
    }
    const game = await prisma.game.create({
      data: { playerX: playerX.trim(), playerO: playerO.trim(), avatarX, avatarO }
    });
    res.status(201).json(game);
  } catch (error) {
    res.status(500).json({ error: "Failed to create game" });
  }
});

// UPDATE: make a move
app.put("/api/games/:id/move", async (req, res) => {
  try {
    const id = validId(req.params.id);
    const index = Number(req.body.index);
    if (!id) return res.status(400).json({ error: "Invalid game ID" });
    if (!Number.isInteger(index) || index < 0 || index > 8) {
      return res.status(400).json({ error: "Invalid cell" });
    }

    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) return res.status(404).json({ error: "Game not found" });
    if (game.winner) return res.status(400).json({ error: "This game is already finished." });
    if (game.board[index] !== "-") return res.status(400).json({ error: "That cell is already taken." });

    const board = game.board.slice(0, index) + game.turn + game.board.slice(index + 1);
    const winner = getWinner(board);

    const updated = await prisma.game.update({
      where: { id },
      data: { board, turn: game.turn === "X" ? "O" : "X", winner }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to save move" });
  }
});

// UPDATE: rename players
app.put("/api/games/:id", async (req, res) => {
  try {
    const id = validId(req.params.id);
    const { playerX, playerO } = req.body;
    if (!id) return res.status(400).json({ error: "Invalid game ID" });
    if (!validName(playerX) || !validName(playerO)) {
      return res.status(400).json({ error: "Both player names are required (max 50 characters)." });
    }
    const updated = await prisma.game.update({
      where: { id },
      data: { playerX: playerX.trim(), playerO: playerO.trim() }
    });
    res.json(updated);
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ error: "Game not found" });
    res.status(500).json({ error: "Failed to update game" });
  }
});

// DELETE: remove a game
app.delete("/api/games/:id", async (req, res) => {
  try {
    const id = validId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid game ID" });
    await prisma.game.delete({ where: { id } });
    res.json({ message: "Game deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ error: "Game not found" });
    res.status(500).json({ error: "Failed to delete game" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});