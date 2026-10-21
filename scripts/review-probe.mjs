import { lookup, resolveTxt } from 'node:dns/promises';
import { isIP } from 'node:net';
import { request } from 'node:https';

function isPublicIpv4(address) {
  const bytes = address.split('.').map(Number);
  if (bytes.length !== 4 || bytes.some(x=>x<0||x>255||!Number.isInteger(x))) return false;
  const [a,b,c] = bytes;
  if (a===0||a===10||a===127||a>=224) return false;
  if (a===100 && b>=64 && b<=127) return false;
  if (a===169 && b===254) return false;
  if (a===172 && b>=16 && b<=31) return false;
  if (a===192 && (b===168 || (b===0 && (c===0 || c===2)))) return false;
  if (a===198 && ((b===18||b===19)||(b===51&&c===100))) return false;
  if (a===203 && b===0 && c===113) return false;
  if (a===255) return false;
  return true;
}
export function isPublicIp(address) {
  const family = isIP(address);
  if (family===4) return isPublicIpv4(address);
  if (family!==6) return false;
  // Global IPv6 only: 2000::/3. ULA, loopback, link-local and mapped v4 excluded.
  const first = Number.parseInt(address.slice(0,address.indexOf(':')),16);
  return Number.isFinite(first) && first>=0x2000 && first<=0x3fff;
}
export async function resolvePublicAddress(hostname,{resolve=lookup}={}) {
  if (!/^[a-z0-9.-]{4,253}$/i.test(hostname) || !hostname.includes('.') || hostname.includes('..') || hostname.endsWith('.')) throw Error('Invalid public hostname');
  const results = await resolve(hostname,{all:true,verbatim:true});
  if (!results?.length || results.length>32 || results.some(x=>!isPublicIp(x.address))) throw Error('DNS did not resolve exclusively to public addresses');
  const ipv4 = results.find(x=>x.family===4);
  return ipv4 || results[0];
}
export async function verifyOwnership(hostname,owner,{lookupTxt=resolveTxt}={}) {
  const key = '_vexnodes.'+hostname;
  let records;
  try { records = await lookupTxt(key); } catch { throw Error('Missing ownership TXT record at '+key); }
  const expected='vex-nodes=github:'+owner.toLowerCase();
  if (!records.some(parts=>parts.join('').toLowerCase().trim()===expected)) {
    throw Error('Expected TXT '+key+' = '+expected);
  }
}
export function getJson(url, options={}) {
  const parsed = new URL(url);
  if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.port||parsed.hash||parsed.search) throw Error('Only public HTTPS URLs allowed');
  const {ip,method='GET',body,timeoutMs=7500,maxBytes=120000} = options;
  if(!ip || !isPublicIp(ip.address)) throw Error('Missing pinned public IP');
  return new Promise((resolve,reject)=>{
    let done=false;
    const fail=(error)=>{if(!done){done=true;reject(error);}};
    const req=request(parsed,{
      method,
      headers:{'accept':'application/json','content-type':'application/json','user-agent':'VEXNodes-Registry-Review/1.0'},
      lookup:(name,params,callback)=>params.all ? callback(null,[{address:ip.address,family:ip.family}]) : callback(null,ip.address,ip.family),
      timeout:timeoutMs,
      maxRedirects:0
    },res=>{
      if((res.statusCode||0)<200||(res.statusCode||0)>299){res.resume();return fail(Error('Endpoint returned HTTP '+res.statusCode));}
      let size=0;const chunks=[];
      res.on('data',chunk=>{size+=chunk.length;if(size>maxBytes){req.destroy(Error('Response too large'));return;}chunks.push(chunk);});
      res.on('error',fail);
      res.on('end',()=>{
        if(done)return;
        try{const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));done=true;resolve(data);}
        catch{fail(Error('Endpoint returned invalid JSON'));}
      });
    });
    req.once('timeout',()=>req.destroy(Error('Request timed out')));
    req.once('error',fail);
    if(body!==undefined) req.write(JSON.stringify(body));
    req.end();
  });
}
export async function probeNode(node,{dnsLookup=resolvePublicAddress,requestJson=getJson}={}) {
  const parsed=new URL(node.url);
  const ip=await dnsLookup(parsed.hostname);
  const call=(url,options={})=>requestJson(url,{ip,...options});
  const start=performance.now();
  if(node.kind==='native'){
    const info=await call(new URL('/v1/chain/get_info',node.url).toString());
    if(info.chain_id!=='f9f432b1851b5c179d2091a96f593aaed50ec7466b74f89301f957a83e56ce1f'||
       !Number.isFinite(info.head_block_num)||!Number.isFinite(info.last_irreversible_block_num))throw Error('Incorrect Native chain identity or block data');
    const ts=Date.parse(info.head_block_time+'Z');
    if(!Number.isFinite(ts)||Math.abs(Date.now()-ts)>120000)throw Error('Native chain head is stale');
  } else if(node.kind==='evm'){
    const body=(method,id)=>({jsonrpc:'2.0',method,params:[],id});
    const [id,head]=await Promise.all([
      call(node.url,{method:'POST',body:body('eth_chainId',1)}),
      call(node.url,{method:'POST',body:body('eth_blockNumber',2)})
    ]);
    if(id.error||head.error||parseInt(id.result,16)!==6736||!Number.isFinite(parseInt(head.result,16))||parseInt(head.result,16)<1) throw Error('Incorrect EVM chain ID or block height');
  } else if(node.kind==='history') {
    const health=await call(new URL('/v2/health',node.url).toString());
    if(!Array.isArray(health.health)||health.health.length===0||health.health.some(x=>String(x.status).toUpperCase()!=='OK'))throw Error('Hyperion health check failed');
  } else throw Error('Unsupported node type');
  const latencyMs=Math.round(performance.now()-start);
  if(latencyMs>12000)throw Error('Endpoint too slow');
  return {latencyMs};
}
