// sha256-base64.html — SHA-256 via Web Crypto, hex + Base64 output.
// Test vectors:
//   SHA-256("hello") hex = 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
//   SHA-256("hello") Base64 = LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=
//   SHA-256("") hex = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
// Requires a secure context (https:// or http://localhost) for crypto.subtle.
function bytesToHex(bytes) { return [...bytes].map(b => b.toString(16).padStart(2, '0')).join(''); }
async function computeSha256() {
  clearError('sha-error');
  try {
    if (!crypto.subtle) throw new Error('Web Crypto is not available — open this page over https:// or http://localhost, not file://');
    var data = new TextEncoder().encode($('sha-input').value);
    var hash = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
    $('sha-hex').value = $('sha-upper').checked ? bytesToHex(hash).toUpperCase() : bytesToHex(hash);
    var b64 = b64urlEncode(hash).replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    $('sha-b64').value = $('sha-urlsafe').checked ? b64urlEncode(hash) : b64;
  } catch (e) { showError('sha-error', e.message); }
}
