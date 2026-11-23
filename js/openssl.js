// openssl.html — OpenSSL-compatible password-based encryption (AES-256-CBC).
// Interoperable with `openssl enc -aes-256-cbc -salt`:
//   encrypt: echo -n "hello" | openssl enc -aes-256-cbc -salt -pbkdf2 -iter 10000 -a -pass pass:SECRET
//   decrypt: echo "<base64>" | openssl enc -d -aes-256-cbc -salt -pbkdf2 -iter 10000 -a -pass pass:SECRET
//   legacy (no -pbkdf2): drop -pbkdf2 and -iter, KDF is EVP_BytesToKey with
//   SHA-256 — that is the default digest since openssl 1.1.1. Very old files
//   (openssl < 1.1.1, or -md md5) use EVP_BytesToKey with MD5 instead.
// Format: "Salted__" + 8-byte salt + ciphertext, Base64-encoded (openssl -a format,
// newlines in the Base64 are ignored on decrypt). AES-CBC via Web Crypto
// (needs https:// or http://localhost, not file://). MD5 is pure JS because
// crypto.subtle does not offer it — needed only for the legacy KDF.
// Browser-only: everything runs in your browser. No server, nothing is sent anywhere.
// Warning: AES-CBC has no authentication — a tampered ciphertext decrypts to
// garbage (or fails on padding) instead of being detected. For new designs
// prefer an AEAD mode (AES-GCM); this tool exists for openssl interop.

// --- MD5 over raw bytes (RFC 1321), returns Uint8Array(16) ---
function md5Bytes(bytes) {
  function leftRotate(x, c) { return (x << c) | (x >>> (32 - c)); }
  function add32(a, b) { return (a + b) >>> 0; }
  var K = [], S = [7,12,17,22, 7,12,17,22, 7,12,17,22, 7,12,17,22,
                   5,9,14,20, 5,9,14,20, 5,9,14,20, 5,9,14,20,
                   4,11,16,23, 4,11,16,23, 4,11,16,23, 4,11,16,23,
                   6,10,15,21, 6,10,15,21, 6,10,15,21, 6,10,15,21];
  for (var n = 0; n < 64; n++) K[n] = Math.floor(Math.abs(Math.sin(n + 1)) * 4294967296) >>> 0;
  var bitLen = bytes.length * 8;
  var padded = Array.from(bytes);
  padded.push(0x80);
  while (padded.length % 64 !== 56) padded.push(0);
  for (var l = 0; l < 8; l++) padded.push((bitLen / Math.pow(2, l * 8)) & 0xff);
  var a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  for (var off = 0; off < padded.length; off += 64) {
    var M = [];
    for (var j = 0; j < 16; j++) {
      M[j] = (padded[off + j * 4]) | (padded[off + j * 4 + 1] << 8) |
             (padded[off + j * 4 + 2] << 16) | (padded[off + j * 4 + 3] << 24);
    }
    var a = a0, b = b0, c = c0, d = d0;
    for (var k = 0; k < 64; k++) {
      var F, g;
      if (k < 16)      { F = (b & c) | (~b & d); g = k; }
      else if (k < 32) { F = (d & b) | (~d & c); g = (5 * k + 1) % 16; }
      else if (k < 48) { F = b ^ c ^ d; g = (3 * k + 5) % 16; }
      else             { F = c ^ (b | ~d); g = (7 * k) % 16; }
      F = add32(add32(add32(F, a), K[k]), M[g]);
      a = d; d = c; c = b;
      b = add32(b, leftRotate(F, S[k]));
    }
    a0 = add32(a0, a); b0 = add32(b0, b); c0 = add32(c0, c); d0 = add32(d0, d);
  }
  var out = new Uint8Array(16);
  [a0, b0, c0, d0].forEach(function (w, i) {
    for (var k = 0; k < 4; k++) out[i * 4 + k] = (w >>> (k * 8)) & 0xff;
  });
  return out;
}

// --- OpenSSL EVP_BytesToKey (legacy KDF): D_i = Hash(D_{i-1} || password || salt) ---
// hashFn: async (Uint8Array) => Uint8Array digest. MD5 is the pure-JS one
// above; SHA-256 uses Web Crypto. Key = first 32 bytes, IV = next 16.
async function evpBytesToKey(passwordBytes, salt, hashFn) {
  var out = new Uint8Array(0), prev = new Uint8Array(0);
  while (out.length < 48) {
    var input = new Uint8Array(prev.length + passwordBytes.length + salt.length);
    input.set(prev, 0);
    input.set(passwordBytes, prev.length);
    input.set(salt, prev.length + passwordBytes.length);
    prev = await hashFn(input);
    var next = new Uint8Array(out.length + prev.length);
    next.set(out, 0); next.set(prev, out.length);
    out = next;
  }
  return { key: out.slice(0, 32), iv: out.slice(32, 48) };
}
async function sha256Bytes(bytes) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
}

// --- Base64 over raw bytes (btoa/atob need a binary string; chunked for large inputs) ---
function b64encodeBytes(bytes) {
  var bin = '';
  for (var i = 0; i < bytes.length; i += 8192) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
  }
  return btoa(bin);
}
function b64decodeBytes(str) {
  var s = str.replace(/\s/g, '');
  var bin = atob(s);
  return Uint8Array.from(bin, function (c) { return c.charCodeAt(0); });
}

async function opensslDerive(password, salt, kdf, iterations) {
  var pwBytes = new TextEncoder().encode(password);
  if (kdf === 'evp-sha256') return evpBytesToKey(pwBytes, salt, sha256Bytes);
  if (kdf === 'evp-md5') return evpBytesToKey(pwBytes, salt, async function (b) { return md5Bytes(b); });
  var baseKey = await crypto.subtle.importKey('raw', pwBytes, 'PBKDF2', false, ['deriveBits']);
  var bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt, iterations: iterations, hash: 'SHA-256' },
    baseKey, 48 * 8);
  var out = new Uint8Array(bits);
  return { key: out.slice(0, 32), iv: out.slice(32, 48) };
}

async function opensslEncrypt() {
  clearError('openssl-error');
  $('openssl-status').textContent = '';
  try {
    var password = $('openssl-password').value;
    var plain = $('openssl-plain').value;
    if (!password) throw new Error('Enter a password.');
    if (!plain) throw new Error('Enter some plaintext to encrypt.');
    var kdf = $('openssl-kdf').value;
    var iterations = Math.max(1, parseInt($('openssl-iter').value, 10) || 10000);
    var salt = new Uint8Array(8);
    crypto.getRandomValues(salt);
    var kv = await opensslDerive(password, salt, kdf, iterations);
    var key = await crypto.subtle.importKey('raw', kv.key, { name: 'AES-CBC' }, false, ['encrypt']);
    var ct = new Uint8Array(await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv: kv.iv }, key, new TextEncoder().encode(plain)));
    var out = new Uint8Array(8 + 8 + ct.length);
    out.set(new TextEncoder().encode('Salted__'), 0);
    out.set(salt, 8);
    out.set(ct, 16);
    $('openssl-cipher').value = b64encodeBytes(out);
    $('openssl-status').textContent = 'Encrypted — AES-256-CBC, ' +
      (kdf === 'pbkdf2' ? 'PBKDF2-SHA256, ' + iterations.toLocaleString() + ' iterations.'
       : kdf === 'evp-sha256' ? 'legacy EVP_BytesToKey/SHA-256.'
       : 'legacy EVP_BytesToKey/MD5.');
    $('openssl-status').className = 'ok';
  } catch (e) { showError('openssl-error', e.message); }
}

async function opensslDecrypt() {
  clearError('openssl-error');
  $('openssl-status').textContent = '';
  try {
    var password = $('openssl-password').value;
    var b64 = $('openssl-cipher').value.trim();
    if (!password) throw new Error('Enter the password used to encrypt.');
    if (!b64) throw new Error('Paste the Base64 ciphertext to decrypt.');
    var kdf = $('openssl-kdf').value;
    var iterations = Math.max(1, parseInt($('openssl-iter').value, 10) || 10000);
    var raw;
    try { raw = b64decodeBytes(b64); }
    catch (e) { throw new Error('Ciphertext is not valid Base64.'); }
    if (raw.length < 32 || new TextDecoder().decode(raw.slice(0, 8)) !== 'Salted__') {
      throw new Error('Not an openssl salted format — expected Base64 of "Salted__" + 8-byte salt + ciphertext.');
    }
    var salt = raw.slice(8, 16);
    var ct = raw.slice(16);
    if (ct.length % 16 !== 0) throw new Error('Ciphertext length is not a multiple of 16 bytes — corrupted or truncated.');
    var kv = await opensslDerive(password, salt, kdf, iterations);
    var key = await crypto.subtle.importKey('raw', kv.key, { name: 'AES-CBC' }, false, ['decrypt']);
    var pt;
    try { pt = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: kv.iv }, key, ct); }
    catch (e) { throw new Error('Decryption failed — wrong password, wrong KDF / iteration count, or corrupted data.'); }
    $('openssl-plain').value = new TextDecoder().decode(pt);
    $('openssl-status').textContent = 'Decrypted.';
    $('openssl-status').className = 'ok';
  } catch (e) { showError('openssl-error', e.message); }
}

function opensslSample() {
  $('openssl-password').value = 'correct horse battery staple';
  $('openssl-plain').value = 'hello openssl — this text was encrypted in your browser';
  $('openssl-cipher').value = '';
  opensslEncrypt();
}
function opensslClear() {
  $('openssl-plain').value = '';
  $('openssl-cipher').value = '';
  $('openssl-status').textContent = '';
  clearError('openssl-error');
}
function opensslKdfChanged() {
  var legacy = $('openssl-kdf').value !== 'pbkdf2';
  $('openssl-iter').disabled = legacy;
  $('openssl-iter-note').textContent = legacy
    ? 'Iterations are ignored for the legacy KDFs (EVP_BytesToKey uses 1 hash round).'
    : 'PBKDF2 iterations — must match the -iter used on the openssl command line.';
}
