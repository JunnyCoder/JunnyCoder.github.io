// Structure-preserving operations used by the HTML import converter.
window.HtmlImportStructures = (() => {
  function checkComplexity(root, sourceLength = 0) {
    if (sourceLength > 10 * 1024 * 1024) throw new Error('HTML은 10MB 이하로 입력해주세요.');
    const stack = [[root, 0]];
    let count = 0;
    while (stack.length) {
      const [node, depth] = stack.pop();
      if (++count > 50000 || depth > 256) throw new Error('HTML 구조가 너무 복잡합니다. 문서를 나누거나 중첩 태그를 줄여주세요.');
      for (let child = node.lastElementChild; child; child = child.previousElementSibling) stack.push([child, depth + 1]);
    }
  }
  const literal = text => text.replace(/[\\{}$%#_&]/g, char => char === '\\' ? '\\textbackslash{}' : '\\' + char);
  function mathmlTex(node) {
    if (node.nodeType === 3) return node.textContent.trim();
    const tag = node.tagName.toLowerCase();
    if (tag === 'mtext') return '\\text{' + literal(node.textContent) + '}';
    const parts = Array.from(node.childNodes).filter(n => n.nodeType === 1 || n.textContent.trim()).map(mathmlTex);
    if (parts.some(part => part === null)) return null;
    const joined = parts.join('');
    if (['math', 'mrow', 'semantics', 'mstyle', 'mpadded'].includes(tag)) return joined;
    if (tag === 'mphantom') return '\\phantom{' + joined + '}';
    if (['mi', 'mn'].includes(tag)) return joined;
    if (tag === 'mo') return ({'×':'\\times ', '÷':'\\div ', '−':'-', '≤':'\\le ', '≥':'\\ge ', '∞':'\\infty ', '∑':'\\sum ', '∫':'\\int '})[joined] || joined;
    if (tag === 'mfrac' && parts.length === 2) return '\\frac{' + parts[0] + '}{' + parts[1] + '}';
    if (tag === 'msqrt') return '\\sqrt{' + joined + '}';
    if (tag === 'mroot' && parts.length === 2) return '\\sqrt[' + parts[1] + ']{' + parts[0] + '}';
    if ((tag === 'msup' || tag === 'msub') && parts.length === 2) return '{' + parts[0] + '}' + (tag === 'msup' ? '^' : '_') + '{' + parts[1] + '}';
    if (tag === 'msubsup' && parts.length === 3) return '{' + parts[0] + '}_{' + parts[1] + '}^{' + parts[2] + '}';
    if (tag === 'annotation') return '';
    return null;
  }
  function listNumbers(node) {
    const items = Array.from(node.children).filter(child => child.tagName === 'LI');
    const reversed = node.hasAttribute('reversed');
    let index = node.hasAttribute('start') ? Number(node.getAttribute('start')) : reversed ? items.length : 1;
    return items.map(item => {
      if (item.hasAttribute('value')) index = Number(item.getAttribute('value'));
      const number = index;
      index += reversed ? -1 : 1;
      return number;
    });
  }
  function needsLiteralNumbers(node) {
    if (node.tagName !== 'OL') return false;
    const numbers = listNumbers(node);
    return node.hasAttribute('reversed') || numbers.some((number, index) => number < 0 || number > 999999999 || (index > 0 && number !== numbers[index - 1] + 1));
  }
  function tableGrid(table, content) {
    const {grid, records} = TableModel.layout(table);
    const values = new Map(records.map(record => [record, content(record.cell)]));
    return grid.map((row, y) => row.map((record, x) => record.top === y && record.left === x ? values.get(record) : ''));
  }

  return {checkComplexity, mathmlTex, listNumbers, needsLiteralNumbers, tableGrid};
})();
