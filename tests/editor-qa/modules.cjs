const fs = require('node:fs');
const path = require('node:path');
const repo = process.env.SITE_ROOT || path.resolve(__dirname, '../..');
function paths(page) {
  const html = fs.readFileSync(path.join(repo, 'tools', page + '.html'), 'utf8');
  return [...html.matchAll(/<script[^>]*src="\.\.\/(js\/[^"?]+)(?:\?[^" ]*)?"/g)].map(match => match[1]);
}
function load(window, modules) { for (const file of modules) window.eval(fs.readFileSync(path.join(repo, file), 'utf8')); }
module.exports = {paths, load};
