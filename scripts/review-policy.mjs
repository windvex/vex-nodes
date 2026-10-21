import { loadRegistry, validateRegistry } from './validate-registry.mjs';

const filename = /^registry\/nodes\/([a-z0-9]+(?:-[a-z0-9]+)*)\.json$/;

export function assessFiles(files) {
  if (!Array.isArray(files) || files.length === 0 || files.length > 3) throw Error('Only 1–3 new node JSON files per PR may be reviewed automatically');
  for (const file of files) {
    const match = filename.exec(file.filename || '');
    if (!match || file.status !== 'added' || (file.previous_filename !== undefined)) {
      throw Error('Auto-review accepts new registry/nodes/*.json files only; changes to existing files require a maintainer');
    }
    if (file.changes > 120 || file.additions > 120 || file.deletions) throw Error('Unexpectedly large node file');
    if (file.filename.length > 110) throw Error('Node filename too long');
  }
  if (new Set(files.map(x=>x.filename)).size !== files.length) throw Error('Duplicate PR filenames');
  return true;
}

export function parseNewEntries(files, jsonTexts, source = loadRegistry()) {
  assessFiles(files);
  if (jsonTexts.length !== files.length) throw Error('Missing file contents');
  const additions = files.map((file,index)=>{
    const raw = jsonTexts[index];
    if (typeof raw !== 'string' || Buffer.byteLength(raw,'utf8') > 12000) throw Error('Node file too large');
    let data;
    try { data = JSON.parse(raw); } catch { throw Error('Invalid JSON: ' + file.filename); }
    const expected = file.filename.match(filename)?.[1];
    if (data?.id !== expected) throw Error('Node ID must match filename: '+file.filename);
    return data;
  });
  validateRegistry(source.network, [...source.entries,...additions]);
  return additions;
}
