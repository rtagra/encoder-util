// md5-hasher.html — MD5 hash (RFC 1321), pure JS.
// Browsers have no native MD5 (crypto.subtle does not offer it), so this
// is a self-contained implementation. Test vectors:
//   md5Hex("") = d41d8cd98f00b204e9800998ecf8427e
//   md5Hex("hello") = 5d41402abc4b2a76b9719d911017c592
//   md5Hex("The quick brown fox jumps over the lazy dog") = 9e107d9d372bb6826bd81d3542a419d6
function md5Hex(str) {
  function leftRotate(x, c) { return (x << c) | (x >>> (32 - c)); }
  function add32(a, b) { return (a + b) >>> 0; }
  var K = [], S = [7,12,17,22, 7,12,17,22, 7,12,17,22, 7,12,17,22,
                   5,9,14,20, 5,9,14,20, 5,9,14,20, 5,9,14,20,
                   4,11,16,23, 4,11,16,23, 4,11,16,23, 4,11,16,23,
                   6,10,15,21, 6,10,15,21, 6,10,15,21, 6,10,15,21];
  for (var n = 0; n < 64; n++) K[n] = Math.floor(Math.abs(Math.sin(n + 1)) * 4294967296) >>> 0;
  // Pad the message: 0x80, then zeros to 56 mod 64 bytes, then 64-bit little-endian bit length
  var bytes = new TextEncoder().encode(str);
  var bitLen = bytes.length * 8;
  var padded = [];
  for (var i = 0; i < bytes.length; i++) padded.push(bytes[i]);
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
  function hexWord(n) {
    var s = '';
    for (var k = 0; k < 4; k++) s += ('0' + ((n >>> (k * 8)) & 0xff).toString(16)).slice(-2);
    return s;
  }
  return hexWord(a0) + hexWord(b0) + hexWord(c0) + hexWord(d0);
}
function computeMd5() {
  clearError('md5-error');
  try {
    var out = md5Hex($('md5-input').value);
    $('md5-output').value = $('md5-upper').checked ? out.toUpperCase() : out;
  } catch (e) { showError('md5-error', e.message); }
}
