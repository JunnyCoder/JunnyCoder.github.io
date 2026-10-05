// Shared parsing rules for the Markdown editor and PDF Maker.
// Reports often use tabs or four spaces to indent ordinary paragraphs.
// Require explicit ``` or ~~~ fences for code blocks; preserve list indentation.
marked.use({
  tokenizer: {
    code: function () {
      // Returning undefined skips indented code. false would use Marked's default.
      return undefined;
    }
  }
});
