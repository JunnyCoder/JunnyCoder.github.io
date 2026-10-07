# Editor QA

From this folder, install the development dependencies and run `npm test`.

This suite loads the actual site modules and checks merged tables, list numbers,
MathML semantics, reference links, DOM reuse, macro invalidation, bounded caches,
modal scheduling/cancellation, indexed source state, Undo and partial PDF reflow.

The CodeMirror/Marked/DOMPurify/highlight fixtures use the repository libraries.
PDF geometry is mocked. jsdom does not load srcdoc, so one test explicitly creates
a loaded iframe document. Browser layout, font/image decoding and exported PDF
fidelity still require Windows/macOS Chrome QA.

Production pages load scripts with one asset revision. New modules must be listed
in the HTML before consumers and mirrored in these fixture loaders.
