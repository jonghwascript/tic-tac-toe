(() => {
  'use strict';

  const STORAGE_KEY = 'tic-tac-toe-v1';
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  const menu = document.querySelector('.c-new-game');
  const game = document.querySelector('.c-game-board');
  const cells = [...document.querySelectorAll('.c-board__cell')];
  const choices = [...document.querySelectorAll('input[name="mark"]')];
  const hint = document.querySelector('.c-new-game__hint');
  const turnIcon = document.querySelector('.c-turn-indicator__icon path');
  const turnText = document.querySelector('.c-turn-indicator__text .u-sr-only');
  const paths = Object.fromEntries(choices.map((choice) => [
    choice.value, choice.parentElement.querySelector('path').getAttribute('d'),
  ]));
  const resultDialog = document.querySelector('.c-round-result');
  const restartDialog = document.querySelector('.c-restart-dialog');
  const messages = [...document.querySelectorAll('.c-round-result__message')];
  const winner = document.querySelector('.c-round-result__winner');
  const winnerIcon = document.querySelector('.c-round-result__icon');
  const winnerText = document.querySelector('.c-round-result__text');
  const tie = document.querySelector('.c-round-result__tie');
  const [quitButton, nextButton] = resultDialog.querySelectorAll('button');
  const [cancelButton, confirmButton] = restartDialog.querySelectorAll('button');
  const restartButton = document.querySelector('.c-button--icon-restart');
  let state = null;
  let cpuTimer = null;

  const other = (mark) => mark === 'X' ? 'O' : 'X';

  function updateMarkHint() {
    const mark = choices.find((choice) => choice.checked).value;
    hint.textContent = mark === 'X'
      ? 'You picked X. You go first.'
      : 'You picked O. X goes first.';
  }

  function outcome(board) {
    for (const line of lines) {
      const mark = board[line[0]];
      if (mark && line.every((index) => board[index] === mark)) return mark;
    }
    return board.every(Boolean) ? 'ties' : null;
  }

  function save() {
    try {
      if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage may be unavailable; the current game remains playable.
    }
  }

  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || !['cpu', 'player'].includes(saved.mode) ||
          !['X', 'O'].includes(saved.playerMark) ||
          !['X', 'O'].includes(saved.starter) || !['X', 'O'].includes(saved.turn) ||
          !Array.isArray(saved.board) || saved.board.length !== 9 ||
          !saved.board.every((mark) => mark === null || mark === 'X' || mark === 'O') ||
          !saved.scores || !['X', 'O', 'ties'].every((key) =>
            Number.isSafeInteger(saved.scores[key]) && saved.scores[key] >= 0)) return;
      const firstCount = saved.board.filter((mark) => mark === saved.starter).length;
      const secondCount = saved.board.filter((mark) => mark === other(saved.starter)).length;
      if (firstCount !== secondCount && firstCount !== secondCount + 1) return;
      const result = outcome(saved.board);
      const expectedTurn = result
        ? (firstCount === secondCount ? other(saved.starter) : saved.starter)
        : (firstCount === secondCount ? saved.starter : other(saved.starter));
      if (saved.turn !== expectedTurn || saved.result !== result) return;
      if (lines.some((line) => line.every((index) => saved.board[index] === other(saved.turn)))) return;
      state = saved;
    } catch {
      // Ignore malformed or inaccessible saved games.
    }
  }

  function showResult() {
    const tied = state.result === 'ties';
    resultDialog.setAttribute('aria-labelledby', tied ? tie.id : winnerText.id);
    messages.forEach((message, index) => message.classList.toggle('u-hidden', tied || index !== 0));
    if (!tied) {
      messages[0].textContent = state.mode === 'cpu'
        ? (state.result === state.playerMark ? 'You won!' : 'Oh no, you lost')
        : `Player ${state.result === state.playerMark ? 1 : 2} wins!`;
      winnerIcon.src = `./images/icon-${state.result.toLowerCase()}.svg`;
      winnerText.textContent = `${state.result} takes the round`;
      winnerText.style.color = state.result === 'X' ? '#31c3bd' : '#f2b137';
    }
    winner.classList.toggle('u-hidden', tied);
    tie.classList.toggle('u-hidden', !tied);
    if (!resultDialog.open) resultDialog.showModal();
  }

  function render() {
    menu.classList.toggle('u-hidden', Boolean(state));
    game.classList.toggle('u-hidden', !state);
    if (!state) return;
    turnIcon.setAttribute('d', paths[state.turn]);
    turnText.textContent = `${state.turn}'s `;
    const cpuTurn = state.mode === 'cpu' && state.turn !== state.playerMark;
    cells.forEach((cell, index) => {
      const mark = state.board[index];
      cell.classList.toggle('c-board__cell--x', mark === 'X');
      cell.classList.toggle('c-board__cell--o', mark === 'O');
      cell.setAttribute('aria-disabled', String(Boolean(mark || state.result || cpuTurn)));
      cell.setAttribute('aria-label', `Row ${Math.floor(index / 3) + 1}, column ${index % 3 + 1}, ${mark || 'empty'}`);
    });
    for (const mark of ['X', 'O']) {
      const owner = state.mode === 'cpu'
        ? (state.playerMark === mark ? 'You' : 'CPU')
        : (state.playerMark === mark ? 'P1' : 'P2');
      document.querySelector(`#score-${mark.toLowerCase()}-label`).textContent = `${mark} (${owner})`;
    }
    for (const key of ['X', 'O', 'ties']) {
      document.querySelector(`.c-score--${key.toLowerCase()} .c-score__value`).textContent = state.scores[key];
    }
    if (state.result) showResult();
  }

  // Minimax examines all continuations, so the CPU always wins or draws.
  function minimax(board, turn, cpu, depth) {
    const result = outcome(board);
    if (result) return result === 'ties' ? 0 : result === cpu ? 10 - depth : depth - 10;
    const scores = [];
    board.forEach((mark, index) => {
      if (mark) return;
      board[index] = turn;
      scores.push(minimax(board, other(turn), cpu, depth + 1));
      board[index] = null;
    });
    return turn === cpu ? Math.max(...scores) : Math.min(...scores);
  }

  function cpuMove() {
    const board = [...state.board];
    let best = -Infinity;
    let move = -1;
    for (const index of [4, 0, 2, 6, 8, 1, 3, 5, 7]) {
      if (board[index]) continue;
      board[index] = state.turn;
      const score = minimax(board, other(state.turn), state.turn, 0);
      board[index] = null;
      if (score > best) {
        best = score;
        move = index;
      }
    }
    if (move !== -1) play(move);
  }

  function scheduleCpu() {
    clearTimeout(cpuTimer);
    cpuTimer = null;
    if (!state || state.result || state.mode !== 'cpu' ||
        state.turn === state.playerMark || restartDialog.open) return;
    cpuTimer = setTimeout(() => {
      cpuTimer = null;
      cpuMove();
    }, 350);
  }

  function play(index) {
    if (!state || state.result || state.board[index] || restartDialog.open) return;
    state.board[index] = state.turn;
    state.result = outcome(state.board);
    if (state.result) state.scores[state.result] += 1;
    else state.turn = other(state.turn);
    save();
    render();
    scheduleCpu();
  }

  function resetRound(alternate) {
    clearTimeout(cpuTimer);
    if (alternate) state.starter = other(state.starter);
    state.board = Array(9).fill(null);
    state.turn = state.starter;
    state.result = null;
    save();
    render();
    scheduleCpu();
    cells[0].focus();
  }

  hint.setAttribute('aria-live', 'polite');
  choices.forEach((choice) => {
    choice.addEventListener('change', updateMarkHint);
  });
  menu.querySelectorAll('.c-new-game__actions button').forEach((button) => {
    button.addEventListener('click', () => {
      state = {
        mode: button.classList.contains('c-button--primary') ? 'cpu' : 'player',
        playerMark: choices.find((choice) => choice.checked).value,
        starter: 'X', turn: 'X', board: Array(9).fill(null),
        result: null, scores: { X: 0, O: 0, ties: 0 },
      };
      resetRound(false);
    });
  });
  cells.forEach((cell, index) => cell.addEventListener('click', () => {
    if (cell.getAttribute('aria-disabled') === 'true') return;
    if (state && (state.mode === 'player' || state.turn === state.playerMark)) play(index);
  }));
  resultDialog.removeAttribute('close');
  // Require an explicit next-round or quit action for a completed round.
  resultDialog.addEventListener('cancel', (event) => event.preventDefault());
  nextButton.addEventListener('click', () => {
    resultDialog.close();
    resetRound(true);
  });
  quitButton.addEventListener('click', () => {
    resultDialog.close();
    clearTimeout(cpuTimer);
    state = null;
    save();
    render();
    choices.find((choice) => choice.checked).focus();
  });
  restartDialog.removeAttribute('close');
  restartButton.addEventListener('click', () => {
    clearTimeout(cpuTimer);
    restartDialog.showModal();
  });
  cancelButton.addEventListener('click', () => restartDialog.close());
  restartDialog.addEventListener('close', scheduleCpu);
  confirmButton.addEventListener('click', () => {
    restartDialog.close();
    // Restart the current round; retain match scores and its starting mark.
    resetRound(false);
  });

  resultDialog.close();
  restartDialog.close();
  restore();
  if (state) choices.forEach((choice) => { choice.checked = choice.value === state.playerMark; });
  updateMarkHint();
  render();
  scheduleCpu();
})();
