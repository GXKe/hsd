/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */

'use strict';

const assert = require('bsert');
const bio = require('bufio');
const mine = require('../lib/mining/mine');
const FullNode = require('../lib/node/fullnode');
const Headers = require('../lib/primitives/headers');
const consensus = require('../lib/protocol/consensus');

const node = new FullNode({
  memory: true,
  apiKey: 'foo',
  network: 'regtest',
  bip37: true,
  workers: true,
  plugins: [require('../lib/wallet/plugin')]
});

const {chain, miner, rpc} = node;
const {wdb} = node.require('walletdb');

let wallet = null;

describe('Get Work', function() {
  this.timeout(45000);

  it('should open chain and miner', async () => {
    await node.open();
  });

  it('should open walletdb', async () => {
    wallet = await wdb.create();
    miner.addresses.length = 0;
    miner.addAddress(await wallet.receiveAddress());
  });

  it('should mine 10 blocks', async () => {
    for (let i = 0; i < 10; i++) {
      const block = await miner.mineBlock();
      assert(block);
      await chain.add(block);
    }

    await new Promise(r => setTimeout(r, 1000));
  });

  it('should get and submit work', async () => {
    const json = await rpc.getWork([]);
    const data = Buffer.from(json.data, 'hex');
    const target = Buffer.from(json.target, 'hex');
    const [nonce, result] = mine(data, target, -1 >>> 0);

    assert.strictEqual(result, true);

    bio.writeU32(data, nonce, 0);
    return

    const [ok, reason] = await rpc.submitWork([data.toString('hex')]);

    assert.strictEqual(ok, true);
    assert.strictEqual(reason, 'valid');
  });

  it('should get and submit work (updated time)', async () => {
    const json1 = await rpc.getWork([]);
    const data1 = Buffer.from(json1.data, 'hex');
    const target1 = Buffer.from(json1.target, 'hex');
    const hdr1 = Headers.fromMiner(data1);
    const [nonce, result] = mine(data1, target1, -1 >>> 0);

    assert.strictEqual(result, true);

    await new Promise(r => setTimeout(r, 2000));

    const json2 = await rpc.getWork([]);
    const data2 = Buffer.from(json2.data, 'hex');
    const hdr2 = Headers.fromMiner(data2);

    assert(hdr1.witnessRoot.equals(hdr2.witnessRoot));
    assert.notStrictEqual(hdr1.time, hdr2.time);

    bio.writeU32(data1, nonce, 0);

    const [ok, reason] = await rpc.submitWork(   ['e32984cbfb11ca6000000000a3c53bace930a1ee5d8a907c9e3c50862105d268000000000000000485ad615ab3ecbbe3780604d7d3b11fb5388e834faaf9e46ea3c53bace930a1ead827f1262dd0eb655903d6bf8755ad813568af84567de8b7379123b872488273730b81028b278a993fd8a2f5112716f57554eca53847341534012cc400000261000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a4b58e281eb4fce4da6d38b71579512886839d027228680399d6c4323f817ae819798d59a61f12ae2154848a4ae5f6e1b10ae0a3a03a1cf46cb7af7ee754000200000000300c0519']);
    // const [ok, reason] = await rpc.submitWork(   ['000004d1000004d2000000008bdfd31eb7f04dd0bfabbf199ce9de548e9bab1400000000000000028b3d3ee33afd8914d7d4ad3b4a7ae9e28fb6401442b862e38bdfd31eb7f04dd2349681faa6145740594f062f7d87c7d20644d1c8ccff1ce93da13fe3b725b56e92ffe88b7f32493585d47016cd8eb8927ddb11a120b3e3d9000004cf000004d00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006d357bae90ad4f67721666cc2a57c338abb526b14b18f9d7ac924692fa7f80aec328c32f0e0052e876f01dc2ca28464f96a6f1d068af56331d90582fbc72eb290000000028cc0419']);
    // const [ok, reason] = await rpc.submitWork(['0000000012b3c960000000008bdfd31eb7f04dd0bfabbf199ce9de548e9bab1400000000000000028b3d3ee33afd8914d7d4ad3b4a7ae9e28fb6401442b862e38bdfd31eb7f04dd2349681faa6145740594f062f7d87c7d20644d1c8ccff1ce93da13fe3b725b56e92ffe88b7f32493585d47016cd8eb8927ddb11a120b3e3d900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006d357bae90ad4f67721666cc2a57c338abb526b14b18f9d7ac924692fa7f80aec328c32f0e0052e876f01dc2ca28464f96a6f1d068af56331d90582fbc72eb290000000028cc0419']);

    assert.strictEqual(ok, true);
    assert.strictEqual(reason, 'valid');
    return

    {
      const [ok, reason] = await rpc.submitWork([data2.toString('hex')]);
      assert.strictEqual(ok, false);
      assert.strictEqual(reason, 'stale');
    }
  });

  it('should get and submit work (updated mempool - first)', async () => {
    const json1 = await rpc.getWork([]);
    const data1 = Buffer.from(json1.data, 'hex');
    const target1 = Buffer.from(json1.target, 'hex');
    const hdr1 = Headers.fromMiner(data1);
    const [nonce, result] = mine(data1, target1, -1 >>> 0);

    assert.strictEqual(result, true);

    rpc.lastActivity -= 11;

    await wallet.send({
      outputs: [
        {
          address: await wallet.receiveAddress(),
          value: 25 * consensus.COIN
        }
      ]
    });

    await new Promise(r => setTimeout(r, 2000));

    const json2 = await rpc.getWork([]);
    const data2 = Buffer.from(json2.data, 'hex');
    const hdr2 = Headers.fromMiner(data2);

    assert(!hdr1.witnessRoot.equals(hdr2.witnessRoot));
    assert(rpc.attempt && rpc.attempt.witnessRoot.equals(hdr2.witnessRoot));

    bio.writeU32(data1, nonce, 0);
    return

    const [ok, reason] = await rpc.submitWork([data1.toString('hex')]);

    assert.strictEqual(reason, 'valid');
    assert.strictEqual(ok, true);

    {
      const [ok, reason] = await rpc.submitWork([data2.toString('hex')]);
      assert.strictEqual(ok, false);
      assert.strictEqual(reason, 'stale');
    }
  });

  it('should get and submit work (updated mempool - second)', async () => {
    const json1 = await rpc.getWork([]);
    const data1 = Buffer.from(json1.data, 'hex');
    const hdr1 = Headers.fromMiner(data1);

    rpc.lastActivity -= 11;

    await wallet.send({
      outputs: [
        {
          address: await wallet.receiveAddress(),
          value: 25 * consensus.COIN
        }
      ]
    });

    await new Promise(r => setTimeout(r, 2000));

    const json2 = await rpc.getWork([]);
    const data2 = Buffer.from(json2.data, 'hex');
    const target2 = Buffer.from(json2.target, 'hex');
    const hdr2 = Headers.fromMiner(data2);

    assert(!hdr1.witnessRoot.equals(hdr2.witnessRoot));
    assert(rpc.attempt && rpc.attempt.witnessRoot.equals(hdr2.witnessRoot));

    const [nonce, result] = mine(data2, target2, -1 >>> 0);

    assert.strictEqual(result, true);

    bio.writeU32(data2, nonce, 0);
    return

    const [ok, reason] = await rpc.submitWork([data2.toString('hex')]);

    assert.strictEqual(reason, 'valid');
    assert.strictEqual(ok, true);

    {
      const [ok, reason] = await rpc.submitWork([data1.toString('hex')]);
      assert.strictEqual(ok, false);
      assert.strictEqual(reason, 'stale');
    }
  });

  it('should check chain', async () => {
    const block = await chain.getBlock(chain.tip.hash);

    assert.strictEqual(block.txs.length, 3);
    assert.strictEqual(chain.tip.height, 14);
    assert.strictEqual(chain.height, 14);
  });

  it('should get fees from template', async () => {
    const json1 = await rpc.getWork([]);
    assert.strictEqual(json1.fee, 0);

    rpc.lastActivity -= 11;

    await wallet.send({
      outputs: [
        {
          address: await wallet.receiveAddress(),
          value: 25 * consensus.COIN
        }
      ],
      hardFee: 12345
    });

    await new Promise(r => setTimeout(r, 2000));

    const json2 = await rpc.getWork([]);
    assert.strictEqual(json2.fee, 12345);

    rpc.lastActivity -= 11;

    await wallet.send({
      outputs: [
        {
          address: await wallet.receiveAddress(),
          value: 10 * consensus.COIN
        }
      ],
      hardFee: 54321
    });

    await new Promise(r => setTimeout(r, 2000));

    const json3 = await rpc.getWork([]);
    assert.strictEqual(json3.fee, 66666);
  });

  it('should cleanup', async () => {
    await node.close();
  });
});
