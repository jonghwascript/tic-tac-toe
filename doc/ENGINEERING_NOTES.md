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
