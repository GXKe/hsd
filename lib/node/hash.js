/*!
 * rpc.js - bitcoind-compatible json rpc for hsd.
 * Copyright (c) 2017-2018, Christopher Jeffrey (MIT License).
 * https://github.com/handshake-org/hsd
 */

'use strict';

const Headers = require('../primitives/headers');
const BLAKE2b = require('bcrypto/lib/blake2b');
const SHA3 = require('bcrypto/lib/sha3');

function HexString2Bytes(str) {
    var pos = 0;
    var len = str.length;
    if (len % 2 != 0) {
      return null;
    }
    len /= 2;
    var arrBytes = new Array();
    for (var i = 0; i < len; i++) {
      var s = str.substr(pos, 2);
      var v = parseInt(s, 16);
      arrBytes.push(v);
      pos += 2;
    }
    return arrBytes;
  }

function Bytes2HexString(arrBytes) {
    var str = "";
  for (var i = 0; i < arrBytes.length; i++) {
      var tmp;
      var num=arrBytes[i];
      if (num < 0) {
      //此处填坑，当byte因为符合位导致数值为负时候，需要对数据进行处理
        tmp =(255+num+1).toString(16);
    } else {
        tmp = num.toString(16);
    }
    if (tmp.length == 1) {
        tmp = "0" + tmp;
    }
    str += tmp;
  }
  return str;
}
    
function print_hdr_hash(data) {
  console.log("hash hdr", Bytes2HexString(data))
  if (data.length !== 256)
    return [false, 'invalid-data-length'];
  const hdr = Headers.fromMiner(data);

  const prehead = hdr.toPrehead();

  console.log("nonce", hdr.nonce)
  console.log("time", hdr.time)
  console.log("prevBlock", Bytes2HexString(hdr.prevBlock))
  console.log("treeRoot", Bytes2HexString(hdr.treeRoot))
  console.log("_maskHash", Bytes2HexString(hdr._maskHash))
  console.log("extraNonce", Bytes2HexString(hdr.extraNonce))
  console.log("reservedRoot", Bytes2HexString(hdr.reservedRoot))
  console.log("witnessRoot", Bytes2HexString(hdr.witnessRoot))
  console.log("merkleRoot", Bytes2HexString(hdr.merkleRoot))
  console.log("version", hdr.version)
  console.log("bits", hdr.bits)

  console.log("prehead", Bytes2HexString(prehead))
  console.log("toSubhead", Bytes2HexString(hdr.toSubhead()))
  console.log("subHash", Bytes2HexString(hdr.subHash()))
  console.log("maskHash", Bytes2HexString(hdr.maskHash()))
  console.log("commitHash", Bytes2HexString(hdr.commitHash()))
  console.log("toPrehead", Bytes2HexString(hdr.toPrehead()))


  // 128 bytes (output as BLAKE2b-512).
  const left = BLAKE2b.digest(prehead, 64);
  console.log("left", Bytes2HexString(left))


  // 128 + 8 = 136 bytes.
  const right = SHA3.multi(data, hdr.padding(8));
  console.log("right", Bytes2HexString(right))

  let hash = hdr.shareHash()
  console.log("hash hdr2", Bytes2HexString(hash))
  for (let i = 0; i < 32; i++)
    hash[i] ^= hdr.mask[i];
  console.log("mask hdr", Bytes2HexString(hash))
  return Bytes2HexString(hash)
}

module.exports = print_hdr_hash;