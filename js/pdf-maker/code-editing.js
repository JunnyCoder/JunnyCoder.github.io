window.PdfCodeEditing = {create({findSource, beforeChange, afterChange}) {
  return {
    planCodeLanguage(pre, language) {
      const source = findSource(pre.dataset.elementId);
      if (!source || source.tagName !== 'PRE' || source.dataset.codeLanguage === language) return null;
      return {source, language};
    },
    commit({source, language}) {
      beforeChange();
      SharedCodeBlocks.setLanguage(source, language);
      if (!DocumentDesigns.validDesign(source, source.dataset.style || 'default')) DocumentDesigns.writeDesign(source, 'default');
      afterChange(source);
    }
  };
}};
