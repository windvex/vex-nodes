import { readFileSync } from 'node:fs';
import { assessFiles, parseNewEntries, normalizeOwner } from './review-policy.mjs';
import { resolvePublicAddress, verifyOwnership, probeNode } from './review-probe.mjs';

const token=process.env.GITHUB_TOKEN;
const event=process.env.GITHUB_EVENT_PATH && JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));
const repo=process.env.GITHUB_REPOSITORY;
const marker='<!-- vex-nodes-auto-review -->';
if(!token||!event?.number||!repo||repo!=='windvex/vex-nodes')throw Error('Trusted GitHub PR event required');

async function github(method,path,body) {
  const res=await fetch('https://api.github.com'+path,{
    method,headers:{accept:'application/vnd.github+json',authorization:'Bearer '+token,'x-github-api-version':'2022-11-28','user-agent':'vex-nodes-reviewer'},
    ...(body===undefined?{}:{body:JSON.stringify(body)})
  });
  if(!res.ok)throw Error('GitHub '+method+' '+path+' returned '+res.status+': '+(await res.text()).slice(0,500));
  return res.status===204?null:res.json();
}
async function note(message) {
  const path='/repos/'+repo+'/issues/'+event.number+'/comments';
  const comments=await github('GET',path+'?per_page=100');
  const existing=comments.find(x=>x.user?.type==='Bot' && x.body?.includes(marker));
  const body=marker+'\n'+message;
  try {
    if(existing)await github('PATCH','/repos/'+repo+'/issues/comments/'+existing.id,{body});
    else await github('POST',path,{body});
  } catch(e) {console.warn('Unable to post review comment:',e.message);}
}
async function graphql(query,variables) {
  const res=await fetch('https://api.github.com/graphql',{method:'POST',headers:{'authorization':'Bearer '+token,'content-type':'application/json','user-agent':'vex-nodes-reviewer'},body:JSON.stringify({query,variables})});
  if(!res.ok)throw Error('GitHub GraphQL HTTP '+res.status);
  const data=await res.json();
  if(data.errors?.length)throw Error('GitHub auto-merge: '+data.errors.map(x=>x.message).join('; '));
  return data.data;
}
const main=async()=>{
  const pr=await github('GET','/repos/'+repo+'/pulls/'+event.number);
  if(pr.state!=='open'||pr.draft)throw Error('PR must be open and marked ready for review');
  if(pr.base.repo.full_name!==repo||pr.base.ref!=='main')throw Error('PR must target main');
  if(!pr.head?.sha||!pr.head.repo?.full_name)throw Error('Head repository unavailable');
  if(pr.changed_files<1||pr.changed_files>3)throw Error('Only 1–3 new node files per PR can auto-merge');
  const originalSha=pr.head.sha;
  const owner=normalizeOwner(pr.user.login);
  const files=await github('GET','/repos/'+repo+'/pulls/'+pr.number+'/files?per_page=100');
  if(files.length!==pr.changed_files)throw Error('File list is incomplete');
  assessFiles(files);
  const sources=await Promise.all(files.map(async (file)=>{
    if(!/^[a-f0-9]{40}$/.test(file.sha))throw Error('Invalid file hash');
    const path='/repos/'+pr.head.repo.full_name+'/git/blobs/'+file.sha;
    const blob=await github('GET',path);
    if(blob.encoding!=='base64'||typeof blob.content!=='string'||blob.size>12000)throw Error('Node JSON cannot be read safely');
    return Buffer.from(blob.content.replace(/\s/g,''),'base64').toString('utf8');
  }));
  const additions=parseNewEntries(files,sources);
  for(const node of additions) {
    const hostname=new URL(node.url).hostname;
    await resolvePublicAddress(hostname);
    await verifyOwnership(hostname,owner);
    console.log('Domain verified:',hostname,owner);
    // Two independent checks to reduce intermittent or spoofed responses.
    const first=await probeNode(node);
    await new Promise(resolve=>setTimeout(resolve,1200));
    const second=await probeNode(node);
    console.log('RPC verified:',node.id,first.latencyMs+'ms',second.latencyMs+'ms');
  }
  const current=await github('GET','/repos/'+repo+'/pulls/'+pr.number);
  if(current.head.sha!==originalSha||current.state!=='open'||current.base.ref!=='main'||current.draft)throw Error('PR changed during validation; a new review is required');
  await graphql('mutation($id:ID!){enablePullRequestAutoMerge(input:{pullRequestId:$id,mergeMethod:SQUASH}){pullRequest{number,autoMergeRequest{enabledAt}}}}',{id:current.node_id});
  await note('✅ **Automatic review passed.** Domain ownership and Vexanium chain responses were verified. GitHub will merge this PR automatically after the required checks pass.\n\n'+additions.map(node=>'- '+node.id+' — '+node.kind).join('\n'));
};
try {await main();}
catch(error) {
  const reason=String(error?.message||error).slice(0,600);
  console.error('Auto-review blocked:',reason);
  await note('⛔ **Automatic review blocked.** '+reason+'\n\nUpdate the PR or provide the required DNS proof, then push a new commit to re-run verification. Changes outside new node JSON files need maintainer review.');
  process.exitCode=1;
}
