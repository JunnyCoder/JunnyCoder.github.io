// Logical coordinates shared by conversion, table editing and column designs.
window.TableModel = {layout(table) {
  const rows = Array.from(table.rows).filter(row => row.closest('table') === table);
  const grid = rows.map(() => []), records = [], ends = new Map();
  rows.forEach((row, index) => ends.set(row.parentElement, index));
  let slots = 0;
  rows.forEach((row, top) => {
    let left = 0;
    for (const cell of row.cells) {
      while (grid[top][left]) left++;
      const group = row.parentElement, groupEnd = ends.get(group);
      const bottom = Math.min(groupEnd, cell.rowSpan === 0 ? groupEnd : top + cell.rowSpan - 1);
      const right = left + Math.max(1, cell.colSpan) - 1;
      if (right >= 1000) throw Error('표의 열이 너무 많습니다. 표를 나누어주세요.');
      slots += (bottom - top + 1) * (right - left + 1);
      if (slots > 100000) throw Error('표의 병합 구조가 너무 복잡합니다. 표를 나누어주세요.');
      const record = {cell, top, bottom, left, right, group}; records.push(record);
      for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) grid[y][x] = record;
      left = right + 1;
    }
  });
  return {rows, grid, records, width: grid.reduce((width, row) => Math.max(width, row.length), 1)};
}};
