# Engineering Notes

## Gulp output

- BrowserSync serves `dist/` only. A page must be handled by a Gulp task before it appears there.
- The current HTML task copies `src/pages/*.html` directly to `dist/`; it does not compile Pug files.
- Builds intentionally do not clean `dist/`. Matching outputs are overwritten, but outputs whose sources were removed can remain stale.

## Sass cascade

- Sass `@extend` emits the extended selector group where the placeholder is declared. If a variant must override a component's base declarations, place the shared placeholder after the base rules so the generated variant declarations come later in the cascade.
- A type selector such as `section` loses to a class selector such as `.l-stack`. Use the existing `.u-hidden` utility when an element must be forcibly hidden; do not rely on a global `section { display: none; }` rule.

## Single-choice controls

- Mutually exclusive X/O selection is a radio group, not a pair of toggle buttons. Keep the native radios focusable with `.u-sr-only`, use `checked` for the initial selection, and style checked/focus-visible states from the associated label.

## Icons that follow text size

- Reuse `.l-icon` from `src/scss/layout/_every-layout.scss`: it sets width and height to `0.75em`, then overrides them with `1cap` in supporting browsers to match the font's capital height.
- Keep `class="c-turn-indicator__icon l-icon"` on the SVG and remove the component's fixed `width: 16px` and `height: 16px` overrides so the layout pattern controls its size.
- Put the shared font settings and their responsive changes on `.c-turn-indicator`, rather than only on `.c-turn-indicator__text`. The SVG and text then inherit the same font settings, which determine the icon's `em` and `cap` sizes. Keep text-only styling such as `text-transform` on the text element.
- Let `.l-with-icon .l-icon` control spacing. Remove the component's fixed `margin-inline-end: 8px` override and set `--space: 0.5em` on `.c-turn-indicator` when the gap should scale with its font size. This is also the layout pattern's default gap when `--space` is not supplied.

## Score cards on narrow screens

- To keep three score cards in one row at a 375px viewport, use `flex-wrap: nowrap` on `.c-scores`, and `flex: 1 1 0` with `min-inline-size: 0` on `.c-score`. Remove the card's explicit width so the cards share the available width after gaps.
- `flex-wrap: wrap` with a preferred card basis can move a card to a second row when the available container width is smaller than the combined card widths and gaps. Even with a zero basis, automatic minimum sizes can constrain the cards.
- Replace the card's explicit height with `min-block-size: clamp(4rem, calc(3.523rem + 2.036vw), 4.5rem)` so its height can grow when labels wrap or scores need more room. Do not also declare the equivalent `min-height` in the horizontal writing mode.
- `rem` sizes grow with the root font size, but that alone does not prevent overflow. Removing the automatic minimum width allows cards to shrink; it does not guarantee that all text will fit. Check long scores and label wrapping, and use `overflow-wrap` if unbroken content needs to wrap.
- Treat the one-row layout at the default font size separately from enlarged text. Verify the 375px layout and 200% text enlargement in a browser; if the content cannot fit comfortably, allow wrapping or a vertical layout in that state. These are implementation guidelines, not a claim that those browser checks have passed.

```scss
.c-scores {
  flex-wrap: nowrap;

  .c-score {
    flex: 1 1 0;
    min-inline-size: 0;
    // Remove the existing width and height declarations.
    min-block-size: clamp(4rem, calc(3.523rem + 2.036vw), 4.5rem);
  }
}
```

## Game board accessibility improvements

### Implemented markup and styles

- `src/pages/components/game-board.html`: give the restart button `aria-label="Restart game"`. Hide its decorative SVG with `aria-hidden="true"` and `focusable="false"`, and use `fill="currentColor"` so the icon follows the button's text color.
- Use `role="group"` with `aria-label="Tic Tac Toe board"` and native buttons for the nine cells. Remove `role="gridcell"`. CSS Grid controls visual layout independently of ARIA roles. A future ARIA grid implementation would also need row structure and managed keyboard navigation.
- Name each cell by row, column, and current state, for example `Row 1, column 1, O` or `Row 2, column 3, empty`. Keep these names synchronized with the visible marks when game logic is implemented.
- The turn indicator uses `role="status"`, `aria-atomic="true"`, and visually hidden text such as `X's ` before `Turn`. Its SVG is decorative. The current markup exposes whose turn it is; actual change announcements still require dynamic updates and screen reader verification.
- Connect each score output to its visible label with `aria-labelledby` and the unique IDs `score-x-label`, `score-ties-label`, and `score-o-label`. Keep the numeric content. Do not add redundant status roles or live regions to native `output` elements.
- `src/pages/components/logo.html`: replace the SVG's ineffective `alt` attribute with `role="img"` and `aria-label="Tic Tac Toe"`; keep `focusable="false"`.
- `src/scss/style.scss`: give board cells a white `:focus-visible` outline with an offset. Apply hover feedback only to enabled cells under `@media (hover: hover)`, and use `cursor: default` for disabled cells. Hover feedback improves usability but its absence alone is not an accessibility failure.
- In `@media (forced-colors: active)`, add a cell border using `ButtonText` and use `Highlight` for the focus outline. Verify both cell boundaries and X/O visibility; the presence of these rules does not establish high-contrast compatibility by itself.
- Use `repeat(3, minmax(0, 1fr))` for board columns, remove explicit row sizing with `grid-template-rows: none`, and set `min-inline-size: 0` and `aspect-ratio: 1` on cells. Limit X/O pseudo-element width with `min(70%, clamp(2.5rem, calc(1.069rem + 6.107vw), 4rem))`. The 70% cap is a design allowance, not an accessibility threshold.

### Intentional styling samples and deferred behavior

- Keep the sample O in the first cell and X in the third cell, including their `disabled` attributes, while styling. The user explicitly excluded clearing these samples from the current work.
- Native `disabled` prevents activation and removes occupied cells from sequential keyboard focus. If occupied cells must remain focusable, use `aria-disabled` together with explicit JavaScript activation guards instead; ARIA alone does not block input.
- Game logic remains deferred: placing marks, updating cell names and disabled states, changing the turn icon and text together, restricting input during the CPU turn, and resetting states for a new round.
- Restart and result dialog behavior also needs implementation and verification, including opening, closing, initial focus, and returning focus to a suitable control.

### Verification status

- Verified by source inspection: the markup and styles listed above are present. The user's accessibility-tree screenshot confirmed the board group and nine named buttons at that stage. The user reported checking the focus and hover changes.
- The earlier Chrome review used a board-only render at 375px and 768px. Before the layout fix, changing the root font from 16px to 32px at 375px produced 616px of board content width. This was a root-font simulation, not a browser text-zoom test or validation of the final layout.
- Still unverified by the agent after the latest changes: the complete built page in Chrome and Firefox, 375px/tablet/desktop layouts, 200% text enlargement, complete keyboard navigation and activation, screen reader announcements, and actual Windows high-contrast mode. DevTools forced-colors emulation is a separate check from the operating system's high-contrast mode.
- Source changes and an accessibility tree do not establish complete accessibility conformance. Recheck the final build and affected states before reporting them as passed.
