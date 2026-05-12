(() => {
  const dom = {
    cells: Array.from(document.querySelectorAll(".cell")),
    status: document.querySelector(".status"),
    choiceButtons: Array.from(document.querySelectorAll(".choice-btn")),
    playerScore: document.querySelector("#playerScore"),
    aiScore: document.querySelector("#aiScore"),
    drawScore: document.querySelector("#drawScore"),
    newGame: document.querySelector("#newGame"),
    resetScore: document.querySelector("#resetScore"),
    themeToggle: document.querySelector("#themeToggle"),
  };

  const themeVars = {
    light: {
      "--primary-color": "#2563eb",
      "--primary-hover": "#1d4ed8",
      "--accent-color": "#22c55e",
      "--bg-color": "#f8fafc",
      "--panel-bg": "#ffffff",
      "--cell-bg": "#f1f5f9",
      "--text-color": "#0f172a",
      "--muted-text": "#64748b",
      "--border-color": "rgba(15, 23, 42, 0.12)",
      "--shadow": "0 20px 45px rgba(15, 23, 42, 0.1)",
    },
    dark: {
      "--primary-color": "#60a5fa",
      "--primary-hover": "#3b82f6",
      "--accent-color": "#22c55e",
      "--bg-color": "#0b1120",
      "--panel-bg": "#111827",
      "--cell-bg": "#1f2937",
      "--text-color": "#f8fafc",
      "--muted-text": "#94a3b8",
      "--border-color": "rgba(248, 250, 252, 0.16)",
      "--shadow": "0 20px 45px rgba(2, 6, 23, 0.45)",
    },
  };

  const state = {
    board: Array(9).fill(""),
    currentPlayer: "X",
    playerSymbol: "X",
    aiSymbol: "O",
    gameActive: false,
    isThinking: false,
    score: {
      player: 0,
      ai: 0,
      draw: 0,
    },
  };

  const winningCombos = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  const applyTheme = (mode) => {
    const root = document.documentElement;
    const vars = themeVars[mode];
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    root.style.colorScheme = mode;
  };

  const initTheme = () => {
    const stored = localStorage.getItem("ttt-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const mode = stored || (prefersDark ? "dark" : "light");
    dom.themeToggle.checked = mode === "dark";
    applyTheme(mode);
  };

  const setStatus = (message) => {
    dom.status.textContent = message;
  };

  const setBoardInteractivity = (enabled) => {
    dom.cells.forEach((cell) => {
      cell.disabled = !enabled;
    });
  };

  const updateScoreboard = () => {
    dom.playerScore.textContent = String(state.score.player);
    dom.aiScore.textContent = String(state.score.ai);
    dom.drawScore.textContent = String(state.score.draw);
  };

  const resetBoard = () => {
    state.board = Array(9).fill("");
    dom.cells.forEach((cell) => {
      cell.textContent = "";
      cell.classList.remove("filled", "win");
    });
  };

  const highlightWinner = (combo) => {
    combo.forEach((index) => {
      dom.cells[index].classList.add("win");
    });
  };

  const renderMove = (index, symbol) => {
    const cell = dom.cells[index];
    cell.textContent = symbol;
    cell.classList.add("filled");
  };

  // Verificação de vitória: retorna a combinação vencedora ou null
  const checkWinner = (board) => {
    for (const combo of winningCombos) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return combo;
      }
    }
    return null;
  };

  const isBoardFull = (board) => board.every((cell) => cell !== "");

  const endGame = (message, winningCombo) => {
    state.gameActive = false;
    state.isThinking = false;
    setBoardInteractivity(false);
    if (winningCombo) {
      highlightWinner(winningCombo);
    }
    setStatus(message);
  };

  const updateScoresOnEnd = (winnerSymbol) => {
    if (winnerSymbol === state.playerSymbol) {
      state.score.player += 1;
    } else if (winnerSymbol === state.aiSymbol) {
      state.score.ai += 1;
    } else {
      state.score.draw += 1;
    }
    updateScoreboard();
  };

  const handleEndState = () => {
    const winnerCombo = checkWinner(state.board);
    if (winnerCombo) {
      const winnerSymbol = state.board[winnerCombo[0]];
      updateScoresOnEnd(winnerSymbol);
      const winnerMessage =
        winnerSymbol === state.playerSymbol ? "Você venceu!" : "A IA venceu!";
      endGame(winnerMessage, winnerCombo);
      return true;
    }

    if (isBoardFull(state.board)) {
      updateScoresOnEnd(null);
      endGame("Empate!", null);
      return true;
    }

    return false;
  };

  // Minimax com Poda Alpha-Beta: avalia jogadas ótimas para a IA
  const minimax = (board, depth, isMaximizing, alpha, beta) => {
    const winnerCombo = checkWinner(board);
    if (winnerCombo) {
      const winnerSymbol = board[winnerCombo[0]];
      if (winnerSymbol === state.aiSymbol) {
        return 10 - depth;
      }
      if (winnerSymbol === state.playerSymbol) {
        return -10 + depth;
      }
    }

    if (isBoardFull(board)) {
      return 0;
    }

    if (isMaximizing) {
      let bestScore = -Infinity;
      board.forEach((cell, index) => {
        if (!cell) {
          board[index] = state.aiSymbol;
          const score = minimax(board, depth + 1, false, alpha, beta);
          board[index] = "";
          bestScore = Math.max(bestScore, score);
          alpha = Math.max(alpha, score);
          if (beta <= alpha) {
            return;
          }
        }
      });
      return bestScore;
    }

    let bestScore = Infinity;
    board.forEach((cell, index) => {
      if (!cell) {
        board[index] = state.playerSymbol;
        const score = minimax(board, depth + 1, true, alpha, beta);
        board[index] = "";
        bestScore = Math.min(bestScore, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) {
          return;
        }
      }
    });
    return bestScore;
  };

  const getBestMove = (board) => {
    let bestScore = -Infinity;
    let move = -1;
    board.forEach((cell, index) => {
      if (!cell) {
        board[index] = state.aiSymbol;
        const score = minimax(board, 0, false, -Infinity, Infinity);
        board[index] = "";
        if (score > bestScore) {
          bestScore = score;
          move = index;
        }
      }
    });
    return move;
  };

  const aiTurn = () => {
    state.isThinking = true;
    setBoardInteractivity(false);
    setStatus("IA pensando...");

    setTimeout(() => {
      const move = getBestMove(state.board);
      if (move >= 0 && state.gameActive) {
        state.board[move] = state.aiSymbol;
        renderMove(move, state.aiSymbol);
      }

      if (!handleEndState()) {
        state.currentPlayer = state.playerSymbol;
        state.isThinking = false;
        setBoardInteractivity(true);
        setStatus("Sua vez.");
      }
    }, 400);
  };

  const startNewGame = () => {
    resetBoard();
    state.gameActive = true;
    state.isThinking = false;
    state.currentPlayer = "X";

    setBoardInteractivity(true);

    if (state.playerSymbol === "X") {
      setStatus("Sua vez.");
    } else {
      setStatus("A IA começa.");
      aiTurn();
    }
  };

  const handleCellClick = (event) => {
    const cell = event.currentTarget;
    const index = Number(cell.dataset.index);

    if (!state.gameActive || state.isThinking) {
      return;
    }

    if (state.board[index]) {
      return;
    }

    if (state.currentPlayer !== state.playerSymbol) {
      return;
    }

    state.board[index] = state.playerSymbol;
    renderMove(index, state.playerSymbol);

    if (!handleEndState()) {
      state.currentPlayer = state.aiSymbol;
      aiTurn();
    }
  };

  const handleChoice = (event) => {
    const symbol = event.currentTarget.dataset.symbol;
    if (!symbol) {
      return;
    }

    state.playerSymbol = symbol;
    state.aiSymbol = symbol === "X" ? "O" : "X";

    dom.choiceButtons.forEach((button) => {
      const isSelected = button.dataset.symbol === symbol;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });

    startNewGame();
  };

  const handleNewGame = () => {
    if (!state.playerSymbol) {
      return;
    }
    startNewGame();
  };

  const handleResetScore = () => {
    state.score.player = 0;
    state.score.ai = 0;
    state.score.draw = 0;
    updateScoreboard();
    setStatus("Placar resetado. Escolha seu símbolo para começar.");
    resetBoard();
    state.gameActive = false;
    setBoardInteractivity(false);
  };

  const handleThemeToggle = (event) => {
    const mode = event.currentTarget.checked ? "dark" : "light";
    localStorage.setItem("ttt-theme", mode);
    applyTheme(mode);
  };

  const init = () => {
    initTheme();
    updateScoreboard();
    resetBoard();
    setBoardInteractivity(false);
    setStatus("Escolha seu símbolo para iniciar a partida.");

    dom.cells.forEach((cell) => {
      cell.addEventListener("click", handleCellClick);
    });

    dom.choiceButtons.forEach((button) => {
      button.addEventListener("click", handleChoice);
    });

    dom.newGame.addEventListener("click", handleNewGame);
    dom.resetScore.addEventListener("click", handleResetScore);
    dom.themeToggle.addEventListener("change", handleThemeToggle);
  };

  init();
})();
