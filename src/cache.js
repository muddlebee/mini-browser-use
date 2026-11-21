// Remembers how act() carried out an instruction on a page, so the next time the same
// instruction runs on the same page it can be replayed without calling the model.
// Elements are remembered by description ("<button> Greet"), not number, since numbers change.
const fs = require('fs');

class ActCache {
  /** @param {string} [file] JSON file to persist to; memory only when omitted. */
  constructor(file) {
    this.file = file;
    this.entries = {};
    if (file && fs.existsSync(file)) this.entries = JSON.parse(fs.readFileSync(file, 'utf8'));
  }

  // Same instruction on the same page (ignoring the query string and #fragment).
  static key(url, instruction) {
    let page = url;
    try { const u = new URL(url); page = u.origin === 'null' ? u.protocol + u.pathname : u.origin + u.pathname; } catch {}
    return `${page} :: ${instruction.trim().toLowerCase()}`;
  }

  get(key) { return this.entries[key]; }

  set(key, steps) {
    this.entries[key] = steps;
    this.save();
  }

  delete(key) {
    delete this.entries[key];
    this.save();
  }

  save() {
    if (this.file) fs.writeFileSync(this.file, JSON.stringify(this.entries, null, 2));
  }
}

module.exports = { ActCache };
