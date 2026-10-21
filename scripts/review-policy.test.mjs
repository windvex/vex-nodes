import test from 'node:test';
import assert from 'node:assert/strict';
import {assessFiles,parseNewEntries,normalizeOwner} from './review-policy.mjs';
const file={filename:'registry/nodes/partner-evm.json',status:'added',sha:'a'.repeat(40),changes:10,additions:10,deletions:0};
const entry={id:'partner-evm',name:'Partner RPC',operator:'Partner',kind:'evm',url:'https://rpc.partnervex.org',docs:'https://partnervex.org',description:'Public EVM RPC'};
test('accept new node JSON in correct directory',()=>assert.equal(assessFiles([file]),true));
test('refuse changes to code/workflow/existing nodes',()=>{
  for(const bad of [
    {...file, filename:'scripts/validate-registry.mjs'},
    {...file, filename:'.github/workflows/auto-review.yml'},
    {...file, status:'modified'},
    {...file, filename:'registry/nodes/../network.json'}
  ])assert.throws(()=>assessFiles([bad]),/new registry|new node|Auto-review/);
});
test('refuse oversized or duplicate file changes',()=>{
  assert.throws(()=>assessFiles([file,file]),/Duplicate/);
  assert.throws(()=>assessFiles([{...file,changes:800}]),/Unexpectedly large/);
});
test('reject pre-existing IDs and untrusted URLs',()=>{
  assert.deepEqual(parseNewEntries([file],[JSON.stringify(entry)]).map(x=>x.id),['partner-evm']);
  assert.throws(()=>parseNewEntries([file],[JSON.stringify({...entry,id:'wind-evm'})]),/match filename/);
  assert.throws(()=>parseNewEntries([file],[JSON.stringify({...entry,url:'https://127.0.0.1'})]),/URL/);
  assert.throws(()=>parseNewEntries([file],[JSON.stringify({...entry,operator:'P',description:''})]),/operator/);
});
test('login normalization guards against unsafe strings',()=>{
  assert.equal(normalizeOwner('Windvex'),'windvex');
  assert.throws(()=>normalizeOwner('hello/../../repo'),/Invalid/);
});
