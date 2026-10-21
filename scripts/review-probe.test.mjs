import test from 'node:test';
import assert from 'node:assert/strict';
import {isPublicIp,resolvePublicAddress,probeNode} from './review-probe.mjs';

test('reject IPv4 RFC1918, loopback, link local, CGNAT and documentation IPs',()=>{
  for(const ip of ['127.0.0.1','10.3.4.5','192.168.0.1','172.16.1.2','100.70.1.1','169.254.169.254','192.0.2.55','198.51.100.22','203.0.113.1','224.1.1.1'])
    assert.equal(isPublicIp(ip),false,ip);
  assert.equal(isPublicIp('1.1.1.1'),true);
  assert.equal(isPublicIp('2606:4700:4700::1111'),true);
  assert.equal(isPublicIp('::1'),false);
  assert.equal(isPublicIp('fd00::1'),false);
  assert.equal(isPublicIp('::ffff:127.0.0.1'),false);
});
test('DNS rejects a mixed public and private response',async()=>{
  await assert.rejects(resolvePublicAddress('rpc.example.org',{resolve:async()=>[{address:'1.1.1.1',family:4},{address:'127.0.0.1',family:4}]}),/public addresses/);
  assert.deepEqual(await resolvePublicAddress('rpc.example.org',{resolve:async()=>[{address:'1.1.1.1',family:4}]}),{address:'1.1.1.1',family:4});
});
test('EVM test requires correct chain ID and block height',async()=>{
  const item={kind:'evm',url:'https://rpc.vex.org'};
  const dnsLookup=async()=>({address:'1.1.1.1',family:4});
  const ok=async(url,{body})=>body.method==='eth_chainId'?{result:'0x1a50'}:{result:'0xabcdef'};
  assert.ok((await probeNode(item,{dnsLookup,requestJson:ok})).latencyMs>=0);
  await assert.rejects(probeNode(item,{dnsLookup,requestJson:async(url,{body})=>body.method==='eth_chainId'?{result:'0x1'}:{result:'0x123'}}),/Incorrect EVM/);
});
test('Native wrong chain and Hyperion unhealthy fail',async()=>{
  const dnsLookup=async()=>({address:'1.1.1.1',family:4});
  await assert.rejects(probeNode({kind:'native',url:'https://native.vex.org'},{dnsLookup,requestJson:async()=>({chain_id:'wrong',head_block_num:12,last_irreversible_block_num:10})}),/Incorrect Native/);
  await assert.rejects(probeNode({kind:'history',url:'https://history.vex.org'},{dnsLookup,requestJson:async()=>({health:[{status:'FAIL'}]})}),/Hyperion health/);
});
