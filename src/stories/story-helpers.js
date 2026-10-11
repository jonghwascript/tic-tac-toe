import pageHtml from '../pages/index.html?raw';
import menuHtml from '../pages/components/new-game.html?raw';
import boardHtml from '../pages/components/game-board.html?raw';
import dialogHtml from '../pages/components/dialog.html?raw';
import logoHtml from '../pages/components/logo.html?raw';
import gameScript from '../js/main.js?raw';
import css from '../scss/style.scss?inline';

const partials = {
  'components/new-game.html': menuHtml,
  'components/game-board.html': boardHtml,
  'components/dialog.html': dialogHtml,
  'logo.html': logoHtml,
};

export function expandIncludes(html) {
  return html.replace(/@@include\(['"](?:\.\/)?([^'"]+)['"]\)/g, (_, name) => {
    if (!(name in partials)) throw new Error('Unknown HTML partial: ' + name);
    return expandIncludes(partials[name]);
  });
}

const escapeScript = (value) => value.replace(/<\/script/gi, '<\\/script');

// An iframe gives each story its own document, IDs, focus, and game timer.
export function createFrame({
  html,
  script = '',
  height = 700,
  fullPage = false,
  title,
}) {
  const frame = document.createElement('iframe');
  frame.title = title;
  frame.dataset.gameStory = '';
  frame.style.cssText = 'display:block;width:100%;border:0;';
  frame.style.height = height + 'px';
  const content = fullPage
    ? html
    : '<main class="l-cover"><div class="l-center c-container"><div class="c-app l-stack">' +
      html +
      '</div></div></main>';
  frame.srcdoc =
    '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
    title +
    '</title><style>' +
    css +
    '</style></head><body>' +
    content +
    '<script>' +
    escapeScript(script) +
    '</script></body></html>';
  return frame;
}

let frameSequence = 0;

export function gameFrame({
  mode = 'menu',
  playerMark = 'X',
  board = Array(9).fill(null),
  height = 700,
  fullPage = false,
} = {}) {
  const storageKey = 'storybook-tic-tac-toe-preview-' + ++frameSequence;
  const state =
    mode === 'menu'
      ? null
      : {
          mode,
          playerMark,
          starter: 'X',
          turn: board.filter(Boolean).length % 2 === 0 ? 'X' : 'O',
          board,
          result: null,
          scores: { X: 0, O: 0, ties: 0 },
        };
  // Reset only the Storybook key; never read or overwrite the actual game's key.
  const setup =
    'window.addEventListener("pagehide", () => { try { localStorage.removeItem(' +
    JSON.stringify(storageKey) +
    '); } catch {} }); try { localStorage.removeItem(' +
    JSON.stringify(storageKey) +
    ');' +
    (state
      ? 'localStorage.setItem(' +
        JSON.stringify(storageKey) +
        ',' +
        JSON.stringify(JSON.stringify(state)) +
        ');'
      : '') +
    '} catch {} document.querySelector(' +
    JSON.stringify('input[value="' + playerMark + '"]') +
    ').checked = true;';
  const html = fullPage
    ? expandIncludes(
        pageHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1],
      ).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    : expandIncludes(menuHtml + boardHtml + dialogHtml);
  return createFrame({
    html,
    script:
      setup +
      gameScript.replace("'tic-tac-toe-v1'", JSON.stringify(storageKey)),
    height,
    fullPage,
    title: 'Tic Tac Toe ' + mode,
  });
}

export function logoFrame() {
  return createFrame({
    html: logoHtml,
    height: 180,
    title: 'Tic Tac Toe logo',
  });
}

export function dialogFrame({
  result = 'O',
  playerMark = 'X',
  mode = 'cpu',
  restart = false,
} = {}) {
  const options = JSON.stringify({ result, playerMark, mode, restart });
  const script =
    '(' +
    function (options) {
      const dialog = document.querySelector(
        options.restart ? '.c-restart-dialog' : '.c-round-result',
      );
      document
        .querySelectorAll('dialog')
        .forEach((element) => element.removeAttribute('close'));
      if (!options.restart) {
        const tied = options.result === 'ties';
        const messages = [
          ...dialog.querySelectorAll('.c-round-result__message'),
        ];
        messages.forEach((message, index) =>
          message.classList.toggle('u-hidden', tied || index !== 0),
        );
        messages[0].textContent =
          options.mode === 'cpu'
            ? options.result === options.playerMark
              ? 'You won!'
              : 'Oh no, you lost'
            : 'Player ' +
              (options.result === options.playerMark ? 1 : 2) +
              ' wins!';
        const winner = dialog.querySelector('.c-round-result__winner');
        const tie = dialog.querySelector('.c-round-result__tie');
        winner.classList.toggle('u-hidden', tied);
        tie.classList.toggle('u-hidden', !tied);
        const title = tied
          ? tie
          : dialog.querySelector('.c-round-result__text');
        title.id = 'story-dialog-title';
        dialog.setAttribute('aria-labelledby', title.id);
        if (!tied) {
          title.textContent = options.result + ' takes the round';
          title.style.color = options.result === 'X' ? '#31c3bd' : '#f2b137';
          dialog.querySelector('img').src =
            './images/icon-' + options.result.toLowerCase() + '.svg';
        }
        dialog.addEventListener('cancel', (event) => event.preventDefault());
      }
      const status = document.createElement('p');
      status.setAttribute('role', 'status');
      status.style.color = '#a8bfc9';
      const reopen = document.createElement('button');
      reopen.className = 'c-button c-button--slate';
      reopen.textContent = 'Open dialog';
      document.querySelector('.c-app').append(status, reopen);
      reopen.addEventListener('click', () => dialog.showModal());
      dialog.querySelectorAll('button').forEach((button) =>
        button.addEventListener('click', () => {
          status.textContent = 'Selected: ' + button.textContent.trim();
          dialog.close();
          reopen.focus();
        }),
      );
      dialog.showModal();
    }.toString() +
    ')(' +
    options +
    ');';
  return createFrame({
    html: dialogHtml,
    script,
    height: 500,
    title: restart ? 'Restart confirmation' : 'Round result',
  });
}
