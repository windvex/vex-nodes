import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const keys = new Set(['name','operator','id','kind','url','description','docs']);
const kinds = new Set(['native','evm','history']);

export function isPublicHttps(raw) {
  if (typeof raw !== 'string' || raw.length > 512) return false;
  try {
    const u = new URL(raw), host = u.hostname.toLowerCase();
    if (u.protocol !== 'https:' || u.username || u.password || u.port || u.search || u.hash) return false;
    if (!host.includes('.') || host.endsWith('.') || /^[\d.:]+$/.test(host)) return false;
    if (['localhost','local','internal','test','invalid','example'].some(x => host === x || host.endsWith('.' + x))) return false;
    return !/\s/.test(raw);
  } catch { return false; }
}
export function validateRegistry(network, entries) {
  if (!network || !/^[a-f0-9]{64}$/.test(network.chainId) || network.evmChainId !== 6736) throw Error('Invalid chain ID');
  if (!Array.isArray(entries) || entries.length < 1 || entries.length > 1000) throw Error('Invalid registry size');
  const ids = new Set(), services = new Set();
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw Error('Invalid entry');
    if (Object.keys(entry).some(x => !keys.has(x))) throw Error('Unexpected entry field');
    if (typeof entry.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id) || entry.id.length > 72) throw Error('Invalid ID');
    if (ids.has(entry.id)) throw Error('Duplicate ID: ' + entry.id);
    ids.add(entry.id);
    for (const name of ['name','operator']) if (typeof entry[name] !== 'string' || entry[name].trim().length < 2 || entry[name].length > 80) throw Error('Invalid '+name);
    if (!kinds.has(entry.kind)) throw Error('Invalid kind');
    if (typeof entry.description !== 'string' || !entry.description.trim() || entry.description.length > 180) throw Error('Invalid description');
    if (!isPublicHttps(entry.url) || !isPublicHttps(entry.docs)) throw Error('Invalid public HTTPS URL');
    const key = entry.kind + ':' + new URL(entry.url).toString().replace(/\/$/, '');
    if (services.has(key)) throw Error('Duplicate URL: ' + entry.id);
    services.add(key);
  }
  return entries.length;
}
export function loadRegistry(dir = join(root,'registry')) {
  const network = JSON.parse(readFileSync(join(dir,'network.json'),'utf8'));
  const folder = join(dir,'nodes');
  const files = readdirSync(folder).filter(x => x.endsWith('.json')).sort();
  const entries = files.map(file => {
    const entry = JSON.parse(readFileSync(join(folder,file),'utf8'));
    if (file !== entry.id + '.json') throw Error('Filename mismatch: ' + file);
    return entry;
  });
  validateRegistry(network, entries);
  return {network,entries};
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { entries } = loadRegistry();
  console.log('PASS: ' + entries.length + ' valid public endpoints');
}
