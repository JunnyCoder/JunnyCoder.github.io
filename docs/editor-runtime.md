# Editor runtime modules

## Responsibilities

| Module | Contract |
| --- | --- |
| `js/shared/render-runtime.js` | Bounded LRU caches, debounced jobs with cancel/flush, mutation-aware element indexes. |
| `js/shared/html-import-structures.js` | MathML semantics, list ordinals, logical table coordinates, HTML complexity budgets. |
| `js/shared/html-to-markdown.js` | Conversion choices and Markdown output. Accepts existing lexer tokens for strict validation. |
| `js/shared/html-blocks.js` | Sanitized HTML cache; exact CSS keys share one collision-free scoped sheet. |
| `js/markdown-editor/preview-renderer.js` | Parsed block records, source lines and prefix/suffix DOM reuse. Reference definitions invalidate dependent output. |
| `js/markdown-editor/import-preview.js` | Iframe lifecycle, generation checks, scroll metrics and one synchronization write per frame. |
| `js/markdown-editor/html-import.js` | Import choices, pending-result gate and application to CodeMirror. |
| `js/pdf-maker/document-state.js` | Source serialization cache, state comparison and history byte/count limits. |
| `js/pdf-maker/page-reflow.js` | Reuse complete pages before the affected block; move the boundary back for split blocks. |

The two main controllers still connect editing, UI and output. Modules are plain
scripts loaded explicitly before their consumers; there is no build step or worker
requirement. Both HTML entry points use the same asset revision.

## Rendering invariants

- Preserve DOM identity for unchanged Markdown blocks; source positions are updated
  even when nodes are retained. Reference-link changes invalidate rendered links.
- Raw HTML spanning multiple lexer tokens uses one parser context. Temporary source
  markers are removed after scroll mapping. Code, TeX and copied/exported HTML stay literal.
- Macro definitions execute in document order. Formulas under a macro context bypass
  the KaTeX cache. Generated output never replaces the saved TeX.
- HTML caching reuses sanitized results, never bypasses the initial sanitizer.
  Exact source equality controls hydration, and CSS scope identifiers are unique.
- Import output edits wait 180ms before heavy work. Pending validation disables Apply.
  Regeneration/close cancels scheduled output, and source changes invalidate Apply.
- A loaded preview iframe keeps its document and fonts. Updating its body uses the
  same Markdown renderer; initial srcdoc and compatibility fallback still work.
- PDF partial reflow is requested for selected style preview/apply and code-language
  changes. Global settings, load/Undo, cover/TOC and printing use full pagination.
- Reused PDF pages always end before a reflow boundary; a split block is recalculated
  from its earliest page. Page numbers and heading anchors are updated afterwards.
- History keeps up to 30 states and approximately 16MiB of state strings, retaining
  at least one state. Both Undo and Redo preserve asset references. Serialization
  caches invalidate synchronously on source mutations before they are read.

## Budgets and fallback

HTML import accepts at most 10MiB of text, 50,000 elements and 256 nested element
levels. Logical table expansion permits at most 100,000 occupied grid slots and
1,000 columns. Failure leaves the editor document intact and shows a message.

Parsed HTML/CSS/highlight/math caches have independent entry and byte limits.
Large uncached inputs are still rendered; cache limits are not document limits.

## Verification

`tests/editor-qa` contains the portable regression cases for these contracts.
Run `npm install` followed by `npm test` in that directory. Tests load the repository
libraries, use jsdom and mock PDF geometry. Real Windows/macOS Chrome layout,
font/image decoding, scrolling after resource loads and actual PDF output need
browser QA.

## Further work

The current partial PDF path deliberately keeps full reflow for cover/TOC and
structural edits. Measurement caching, viewport rendering and command-based history
need a further stage of browser profiling. If viewport rendering is introduced,
printing must materialize every page and wait for assets. A worker can handle pure
parsing, but DOM sanitization/measurement and DOM updates remain separate concerns.
