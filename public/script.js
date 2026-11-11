const API = "/api/games";

// Put the file names of your avatar pictures (inside public/avatars) here.
const AVATARS = ["avatar1.jpg", "avatar2.jpg", "avatar3.jpg", "avatar4.jpg", "avatar5.jpg", "avatar6.jpg"];

const LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

let current = null;
const selected = { X: AVATARS[0], O: AVATARS[1] || AVATARS[0] };

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const scoreboardEl = document.getElementById("scoreboard");
const historyEl = document.getElementById("history");
const form = document.getElementById("newGameForm");
const gameSection = document.getElementById("game");

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function nameOf(game, symbol) {
  return symbol === "X" ? game.playerX : game.playerO;
}

function avatarOf(game, symbol) {
  return symbol === "X" ? game.avatarX : game.avatarO;
}

// Shows the avatar picture, or the letter if the picture is missing.
function avatarEl(file, fallbackText) {
  const img = document.createElement("img");
  img.className = "avatar";
  img.src = `avatars/${file}`;
  img.alt = "";
  img.onerror = () => {
    const span = document.createElement("span");
    span.className = "avatar fallback";
    span.textContent = fallbackText;
    img.replaceWith(span);
  };
  return img;
}

function winningLine(board) {
  return LINES.find(([a, b, c]) =>
    board[a] !== "-" && board[a] === board[b] && board[a] === board[c]
  ) || null;
}

/* ---------- Avatar pickers ---------- */
function renderPickers() {
  ["X", "O"].forEach(symbol => {
    const other = symbol === "X" ? "O" : "X";
    const container = document.getElementById(`picker${symbol}`);
    container.innerHTML = "";

    AVATARS.forEach((file, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "avatar-option";
      btn.setAttribute("aria-label", `Avatar ${i + 1}`);

      const isSelected = selected[symbol] === file;
      const isTaken = selected[other] === file;
      if (isSelected) btn.classList.add("selected");
      if (isTaken) btn.classList.add("taken");
      btn.setAttribute("aria-pressed", String(isSelected));
      btn.disabled = isTaken;

      btn.appendChild(avatarEl(file, "?"));
      btn.onclick = () => {
        selected[symbol] = file;
        renderPickers();
      };
      container.appendChild(btn);
    });
  });
}

/* ---------- Current game ---------- */
function renderGame() {
  boardEl.innerHTML = "";
  scoreboardEl.innerHTML = "";
  statusEl.className = "status";

  if (!current) {
    statusEl.textContent = "Start a new game or open one from the history.";
    return;
  }

  // Scoreboard
  ["X", "O"].forEach(symbol => {
    const chip = document.createElement("div");
    chip.className = "chip";
    if (!current.winner && current.turn === symbol) chip.classList.add("active");
    if (current.winner === symbol) chip.classList.add("winner");

    const name = document.createElement("div");
    name.className = "chip-name";
    name.textContent = nameOf(current, symbol);

    const role = document.createElement("div");
    role.className = "chip-role";
    role.textContent = `Player ${symbol}`;

    const text = document.createElement("div");
    text.append(name, role);

    chip.append(avatarEl(avatarOf(current, symbol), symbol), text);
    scoreboardEl.appendChild(chip);
  });

  // Board
  const line = current.winner && current.winner !== "Draw" ? winningLine(current.board) : null;
  [...current.board].forEach((cell, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cell";
    if (cell !== "-") {
      btn.classList.add("filled");
      btn.appendChild(avatarEl(avatarOf(current, cell), cell));
    }
    if (line && line.includes(i)) btn.classList.add("win");
    btn.disabled = cell !== "-" || !!current.winner;
    btn.setAttribute(
      "aria-label",
      cell === "-" ? `Cell ${i + 1}, empty` : `Cell ${i + 1}, ${nameOf(current, cell)}`
    );
    btn.onclick = () => makeMove(i);
    boardEl.appendChild(btn);
  });

  // Status
  if (current.winner === "Draw") {
    statusEl.textContent = "It's a draw!";
    statusEl.classList.add("done");
  } else if (current.winner) {
    statusEl.textContent = `${nameOf(current, current.winner)} wins!`;
    statusEl.classList.add("done");
  } else {
    statusEl.textContent = `${nameOf(current, current.turn)}'s turn`;
  }
}

/* ---------- History ---------- */
async function loadHistory() {
  const games = await request(API);
  historyEl.innerHTML = "";

  if (games.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No games yet. Start one!";
    historyEl.appendChild(li);
    return;
  }

  games.forEach(g => {
    const li = document.createElement("li");
    li.className = "history-item";
    if (current && current.id === g.id) li.classList.add("selected");

    const mini = document.createElement("div");
    mini.className = "mini";
    mini.append(avatarEl(g.avatarX, "X"), avatarEl(g.avatarO, "O"));

    const title = document.createElement("div");
    title.className = "history-title";
    title.textContent = `#${g.id} ${g.playerX} vs ${g.playerO}`;

    const badge = document.createElement("span");
    badge.className = "badge";
    if (!g.winner) {
      badge.textContent = "In progress";
      badge.classList.add("progress");
    } else if (g.winner === "Draw") {
      badge.textContent = "Draw";
      badge.classList.add("draw");
    } else {
      badge.textContent = `${nameOf(g, g.winner)} won`;
      badge.classList.add("won");
    }

    const info = document.createElement("div");
    info.append(title, badge);

    const head = document.createElement("div");
    head.className = "history-head";
    head.append(mini, info);

    const openBtn = document.createElement("button");
    openBtn.className = "btn small";
    openBtn.textContent = "Open";
    openBtn.onclick = () => {
      current = g;
      renderGame();
      loadHistory();
      gameSection.scrollIntoView({ behavior: "smooth" });
    };

    const renameBtn = document.createElement("button");
    renameBtn.className = "btn small ghost";
    renameBtn.textContent = "Rename";
    renameBtn.onclick = () => renameGame(g);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn small danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => deleteGame(g);

    const actions = document.createElement("div");
    actions.className = "history-actions";
    actions.append(openBtn, renameBtn, deleteBtn);

    li.append(head, actions);
    historyEl.appendChild(li);
  });
}

/* ---------- Actions (CRUD) ---------- */
async function makeMove(index) {
  try {
    current = await request(`${API}/${current.id}/move`, {
      method: "PUT",
      body: JSON.stringify({ index })
    });
    renderGame();
    loadHistory();
  } catch (e) {
    alert(e.message);
  }
}

async function renameGame(g) {
  const playerX = prompt("Player X name:", g.playerX);
  if (playerX === null) return;
  const playerO = prompt("Player O name:", g.playerO);
  if (playerO === null) return;
  try {
    const updated = await request(`${API}/${g.id}`, {
      method: "PUT",
      body: JSON.stringify({ playerX, playerO })
    });
    if (current && current.id === updated.id) {
      current = updated;
      renderGame();
    }
    loadHistory();
  } catch (e) {
    alert(e.message);
  }
}

async function deleteGame(g) {
  if (!confirm(`Delete game #${g.id}?`)) return;
  try {
    await request(`${API}/${g.id}`, { method: "DELETE" });
    if (current && current.id === g.id) current = null;
    renderGame();
    loadHistory();
  } catch (e) {
    alert(e.message);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    current = await request(API, {
      method: "POST",
      body: JSON.stringify({
        playerX: document.getElementById("playerX").value,
        playerO: document.getElementById("playerO").value,
        avatarX: selected.X,
        avatarO: selected.O
      })
    });
    form.reset();
    renderGame();
    loadHistory();
    gameSection.scrollIntoView({ behavior: "smooth" });
  } catch (e) {
    alert(e.message);
  }
});

renderPickers();
renderGame();
loadHistory();