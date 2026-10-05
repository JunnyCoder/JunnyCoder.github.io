# PDF Maker document styles

## Files and priority

- `elements/`: common document typography, paper, cover, and TOC.
- `themes/`: template tokens (fonts, ink, borders, table headers, cover, TOC).
- `tags.css`: explicit per-element choices. IDs match `js/pdf-maker/templates.js`.
- `js/pdf-maker/templates.js`: theme descriptions, tag families, variant labels, samples.

Add a tag variant to the registry and its matching scoped rule to `tags.css`.
Use theme variables so an individual tag variant follows a changed document theme.
Keep ordered-list numbering, nested lists, inline code, table captions, and figure
captions intact. Avoid relying on heavy backgrounds, color alone, or shadows in print.
The old `tech` theme name migrates to `dev` when a draft is restored.

Imported HTML CSS is optional. `<style>`, inline declarations, companion `.css`
files, and reachable HTTP(S) stylesheets are supported. Browser cross-origin
restrictions can prevent remote stylesheets from loading; the UI names missing files.
Choose the HTML and its CSS files together for local relative stylesheet links.
CSS selectors are scoped to document content; original root classes, identifiers,
font registrations, and `rem` sizes are adapted within that scope. Original body
geometry and `@page` do not replace the A4 paper and configured margins.
Print CSS typography also applies in preview to keep pagination measurements aligned.
Turning preservation off uses theme rules while retaining the original CSS for reuse.
Explicit per-tag variants, their line heights, and imported styles survive draft
recovery and undo. Generated cover and TOC always use the selected document theme.

## Design references

These are design references, not copies or publisher submission templates.

- Dev: [GitHub Primer Markdown](https://github.com/primer/css/tree/main/src/markdown)
  for technical-document hierarchy, code, and tables.
- Academic: [ACM submission manuscript](https://www.acm.org/binaries/content/assets/publications/taps/acm_layout_submission_template.pdf)
  for a readable single-column manuscript; [booktabs](https://ctan.org/pkg/booktabs)
  for restrained rules and table spacing.
- Shared print typography: [Butterick's Practical Typography](https://practicaltypography.com/typography-in-ten-minutes.html),
  adjusted for Korean paragraphs rather than treated as a rigid size prescription.
- Table hierarchy: [GOV.UK tables](https://design-system.service.gov.uk/components/table/).
- Print behavior: [MDN Printing](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing).

Report, Editorial, and Minimal are approved and registered templates. Report uses
clear section rules and table headers; Editorial uses a serif reading rhythm;
Minimal avoids fills and uses monochrome rules.

## Shared code blocks

`js/shared/code-blocks.js` and `css/shared/code-blocks.css` are used by both tools.
Language labels and aliases are defined once in that module. Only grammars in the
loaded highlight.js bundle are offered. Markdown fence languages select a grammar;
unspecified or unsupported languages use Plain text, with no automatic detection.
HTML file imports start as Plain text even if old language classes are present.
The top-right dropdown updates the Markdown fence (or raw HTML pre attribute) in
the editor; PDF Maker stores the choice on the original block so page fragments,
undo, editing, and recovered drafts use the same language. Preview controls never
enter saved source or copied/downloaded HTML. Printed code keeps a language label
and hides the dropdown.

## Document editing and pagination contracts

- Loading a new file, dropping one, loading editor history, and accepting an editor
  transfer share replacement confirmation. Cancellation retains content and settings.
  A confirmed replacement resets document settings, including A4 margins, to defaults.
  Discarding a document confirms, clears undo/selection/source, and saves an empty draft.
- Manual page breaks are idempotent. Clicking an existing manual break is a no-op;
  its removal is available in the selected-element panel or through undo.
- When a block overflows the remaining space, blocks at least 30% of the available
  page content height split in that space. Smaller blocks start on the next page.
  Images/figures, formula DOM, and tables with merged rows remain atomic; oversized
  atomic content is scaled on an empty page. Text and table fragments retain source IDs.
- Code editing uses a textarea and stores literal text, including newlines, before
  applying the selected syntax language again. Nested code uses its element ID.
- Cover title/subtitle are independent of header override and edited in the sidebar.
  Cover double-click editing exposes only metadata. Presets/custom background,
  image size/repetition/opacity, and color filter are separate settings. Metadata
  edits survive cover design updates. Uploaded images are stored with the draft.
- Original root backgrounds are painted on a full-paper layer outside content margins.
  Removing that layer does not modify element backgrounds or retained original CSS.
- TOC entries retain heading targets, custom labels, optional manual page references,
  and levels H1–H6. TOC/body hierarchy changes update actual heading tags while keeping
  their element IDs and styles. Numbering is optional. Heading edits refresh automatic
  labels; manually edited labels remain independent. Preview links use Ctrl/Cmd-click;
  normal click opens editing actions. Printed anchors retain original heading IDs and
  inherit the TOC text color, including the visited state. PDF link retention depends
  on the browser's print destination and must be checked in an actual exported PDF.

## Follow-up QA fixes

Pending file/image reads carry a request ID and document version. Reset, replacement,
and undo invalidate older requests. Delayed print preparation also checks the version.
The shared code normalizer converts HTML `br` and line containers to literal newlines
before highlighting. Saved general block edits render math on that block again.
Cover metadata records the last automatic author value: sidebar author changes update
untouched automatic text and preserve direct metadata edits. Empty subtitles stay empty;
cover update buttons record history only when the resulting cover changes. Image data
URLs accept the same image MIME family as the upload control, and an image probe reports
load errors. Print preparation waits briefly for the cover image probe.
TOC refresh preserves custom labels and manual entries using stable heading targets;
hidden/deleted targets hide their linked entries and undo restores them. Hidden entries
do not consume TOC numbering or appear in paginated TOC chunks.
