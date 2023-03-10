const boardEl = document.getElementById("board");
const squares = boardEl.querySelectorAll(".square");

const htmlBoard = [];
const boardSize = 8; // squares

// Piece colors
const [BLACK, WHITE] = ["black", "white"];
const startingColor = BLACK;

const blackDirections = [
  [-1, -1],
  [-1, 1],
  [-2, -2],
  [-2, 2],
  [1, -1],
  [1, 1],
  [2, -2],
  [2, 2],
];

const whiteDirections = [
  [1, -1],
  [1, 1],
  [2, -2],
  [2, 2],
  [-1, -1],
  [-1, 1],
  [-2, -2],
  [-2, 2],
];

const pieceDirections = {
  [BLACK]: blackDirections,
  [WHITE]: whiteDirections,
};

let draggedPiece;
let isBlackTurn;
let checkersGame;

initiliazeGame();

function startGame() {
  draggedPiece = null;
  isBlackTurn = BLACK === startingColor;

  clearBoard();
  placePieces();
  computeAllPieceMoves(startingColor);
}

function computeAllPieceMoves(color) {
  collectPieces(color).forEach((idx) => {
    const [x, y] = getCoor(idx);
    checkersGame.board[x][y].moves = computeMoves(idx);
  });
}

function computeMoves(from) {
  const [x, y] = getCoor(from);
  const piece = checkersGame.board[x][y];
  if (!piece) throw "No piece to compute moves!";
  const { color, isKing } = piece;

  const legalMoves = [];
  const directions = pieceDirections[color];
  const n = directions.length / (isKing ? 1 : 2);

  for (let i = 0; i < n; i++) {
    const move = computeMove(x, y, directions[i], color);
    if (move) legalMoves.push(move);
  }

  return legalMoves;
}

function computeMove(x1, y1, dir, color) {
  x2 = x1 + dir[0];
  y2 = y1 + dir[1];
  if (
    x2 < 0 ||
    boardSize <= x2 ||
    y2 < 0 ||
    boardSize <= y2 ||
    checkersGame.board[x2][y2]
  )
    return null;

  const move = {
    to: getIdx(x2, y2),
    capturedIdx: null,
  };

  const isJumping = Math.abs(dir[0]) === 2;
  if (isJumping) {
    x3 = x1 + dir[0] / 2;
    y3 = y1 + dir[1] / 2;
    const capturedPiece = checkersGame.board[x3][y3];
    if (!capturedPiece || capturedPiece.color === color) return null;
    move.capturedIdx = getIdx(x3, y3);
  }

  return move;
}

function movePiece(pieceEl, to) {
  const from = pieceIdx(pieceEl);
  const [x1, y1] = getCoor(from);
  const [x2, y2] = getCoor(to);
  const { board } = checkersGame;
  const { color, moves } = board[x1][y1];

  if ((color === BLACK) !== isBlackTurn) return;
  const move = moves.filter((move) => move.to === to)[0];
  if (!move) return;

  // Move piece
  board[x2][y2] = board[x1][y1];
  board[x1][y1] = null;
  movePieceEl(x2, y2, pieceEl);
  highlightMove(from, to);

  const oppositeColor = isBlackTurn ? WHITE : BLACK;

  if (!move.capturedIdx) {
    isBlackTurn = !isBlackTurn;
    computeAllPieceMoves(oppositeColor);
    return;
  }

  // Capture piece
  const [x3, y3] = getCoor(move.capturedIdx);
  board[x3][y3] = null;
  htmlBoard[x3][y3].innerHTML = "";

  const comboMoves = computeMoves(to);
  if (comboMoves.length === 0) {
    isBlackTurn = !isBlackTurn;
    computeAllPieceMoves(oppositeColor);
  } else {
    // Remove all other moves but the combo moves
    collectPieces(color).forEach((idx) => {
      const [x, y] = getCoor(idx);
      checkersGame.board[x][y].moves = [];
    });
    board[x2][y2].moves = comboMoves;
  }
}

function computeAllPieceMoves(color) {
  const pieceIndices = collectPieces(color);
  let canJump = false;

  pieceIndices.forEach((idx) => {
    const [x, y] = getCoor(idx);
    checkersGame.board[x][y].moves = computeMoves(idx);
    checkersGame.board[x][y].moves.forEach((move) => {
      if (move.capturedIdx !== null) canJump = true;
    });
  });

  if (canJump) {
    pieceIndices.forEach((idx) => {
      const [x, y] = getCoor(idx);
      checkersGame.board[x][y].moves = checkersGame.board[x][y].moves.filter(
        (move) => move.capturedIdx !== null
      );
    });
  }
}

function collectPieces(color) {
  const allyPieces = [];
  const { board } = checkersGame;
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] && board[i][j].color === color)
        allyPieces.push(getIdx(i, j));
    }
  }
  return allyPieces;
}

function clearBoard() {
  const board = [];
  for (let i = 0; i < boardSize; i++) {
    const arr = [];
    for (let j = 0; j < boardSize; j++) {
      htmlBoard[i][j].innerHTML = "";
      arr.push(null);
    }
    board.push(arr);
  }
  checkersGame = { board };
}

function placePieces() {
  const isKing = false;
  for (let i = 0; i < boardSize; i += 2) {
    createPiece(0, i + 1, WHITE, isKing);
    createPiece(1, i, WHITE, isKing);
    createPiece(2, i + 1, WHITE, isKing);

    createPiece(7, i, BLACK, isKing);
    createPiece(6, i + 1, BLACK, isKing);
    createPiece(5, i, BLACK, isKing);
  }
}

function createPiece(x, y, color, isKing) {
  const piece = {
    color,
    isKing,
    moves: null,
  };

  checkersGame.board[x][y] = piece;

  const square = htmlBoard[x][y];
  const pieceEl = createPieceEl(x, y, color, isKing);
  square.appendChild(pieceEl);
}

function createPieceEl(x, y, color, isKing) {
  const pieceEl = document.createElement("div");
  const oppositeColor = color === BLACK ? WHITE : BLACK;
  pieceEl.className = `piece bg-${color}`;
  pieceEl.draggable = true;
  pieceEl.innerHTML = isKing
    ? `<i class="fa-solid fa-crown ${oppositeColor}"></i>`
    : `<div class="circle ${oppositeColor}-border"></div>`;

  pieceEl.setAttribute("square", getIdx(x, y));
  pieceEl.setAttribute("color", color);
  pieceEl.addEventListener("dragstart", dragStart);
  pieceEl.addEventListener("dragend", dragEnd);
  pieceEl.addEventListener("click", () => {
    console.log(checkersGame.board[x][y].moves);
  });

  return pieceEl;
}

function movePieceEl(x, y, pieceEl) {
  const square = htmlBoard[x][y];
  square.appendChild(pieceEl);
  pieceEl.setAttribute("square", getIdx(x, y));
}

function highlightMove(from, to) {
  squares.forEach((square) => square.classList.remove("highlight"));
  squares[from].classList.add("highlight");
  squares[to].classList.add("highlight");
}

function initiliazeGame() {
  boardEl
    .querySelectorAll(".row")
    .forEach((row) =>
      htmlBoard.push(Array.from(row.querySelectorAll(".square")))
    );
  console.log(htmlBoard);

  addSquareEventListeners();

  startGame();
}

//////////////////
// Event Listeners
//////////////////
function dragStart(e) {
  draggedPiece = e.currentTarget;
}

function dragEnd(e) {
  draggedPiece = null;
}

function addSquareEventListeners() {
  squares.forEach((square, idx) => {
    square.addEventListener("dragenter", (e) => {
      if (!draggedPiece) return;
      e.currentTarget.classList.add("hover");
    });

    square.addEventListener("dragleave", (e) => {
      if (!draggedPiece) return;
      e.currentTarget.classList.remove("hover");
    });

    square.addEventListener("drop", (e) => {
      e.preventDefault();
      if (!draggedPiece) return;
      e.currentTarget.classList.remove("hover");

      movePiece(draggedPiece, idx);
    });

    // Dragging is not enabled by default
    square.addEventListener("dragover", (e) => {
      e.preventDefault();
    });
  });
}

function pieceIdx(pieceEl) {
  return parseInt(pieceEl.getAttribute("square"));
}

function getCoor(idx) {
  const x = parseInt(idx / boardSize);
  const y = idx % boardSize;
  return [x, y];
}

function getIdx(x, y) {
  return x * boardSize + y;
}
