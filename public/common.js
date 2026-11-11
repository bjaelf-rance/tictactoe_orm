const API = "/api/games";

// File names of your avatar pictures (inside public/avatars).
const AVATARS = ["avatar1.jpg", "avatar2.jpg", "avatar3.jpg", "avatar4.jpg", "avatar5.jpg", "avatar6.jpg", "avatar7.jpg", "avatar8.jpg", "avatar9.jpg", "avatar10.jpg", "avatar11.jpg", "avatar12.jpg"];

const LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

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