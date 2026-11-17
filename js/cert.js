// cert-formatter.html — PEM wrap / unwrap.
// Browser-only: all work in your browser, nothing leaves the browser.
// RFC 7468: generators MUST wrap Base64 at exactly 64 chars per line
// (except the final line). Parsers MAY accept other line sizes.
// This tool re-wraps any PEM block (or raw Base64) at the chosen width,
// or unwraps it to a single line. It does not parse the DER inside,
// so it works for CERTIFICATE, PRIVATE KEY, PUBLIC KEY, CSR, etc.
function _certWrap(b64, width){
  if(width <= 0) return b64;
  var out = [];
  for(var i = 0; i < b64.length; i += width) out.push(b64.slice(i, i + width));
  return out.join('\n');
}
function _certCleanB64(s){
  // Normalise URL-safe Base64 to standard, strip all whitespace.
  return String(s || '').replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
}
function _certParse(input){
  // Returns [{label, b64}] — one entry per PEM block, or one raw entry.
  var blocks = [];
  var re = /-----BEGIN ([A-Z0-9 ]+)-----\s*([\s\S]*?)\s*-----END \1-----/g;
  var m;
  while((m = re.exec(input)) !== null){
    blocks.push({label: m[1].trim(), b64: _certCleanB64(m[2])});
  }
  if(blocks.length) return blocks;
  var raw = _certCleanB64(input);
  if(!raw) return [];
  return [{label: '', b64: raw}];
}
function _certValidate(b64){
  if(!b64) throw new Error('Paste a PEM block or Base64 — e.g. -----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----');
  if(!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) throw new Error('Invalid Base64: only A–Z, a–z, 0–9, +, / and up to 2 trailing = are allowed.');
  if(b64.length % 4 !== 0) throw new Error('Invalid Base64 length: length must be a multiple of 4 (add = padding if needed).');
  try{ atob(b64); }catch(e){ throw new Error('Invalid Base64: ' + e.message); }
}
function _certLabel(){
  var sel = $('cert-label');
  return (sel && sel.value) ? sel.value : 'CERTIFICATE';
}
function certFormat(){
  clearError('cert-error'); $('cert-status').textContent = ''; $('cert-status').className = '';
  var input = $('cert-input').value;
  var width = parseInt(($('cert-width') || {}).value, 10);
  if(isNaN(width) || width < 1) width = 64;
  if(width > 1024) width = 1024;
  try{
    var blocks = _certParse(input);
    if(!blocks.length) throw new Error('Paste a PEM block or Base64 — e.g. -----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----');
    var out = blocks.map(function(b){
      _certValidate(b.b64);
      var label = b.label || _certLabel();
      var body = $('cert-headers') && !$('cert-headers').checked ? b.b64 : _certWrap(b.b64, width);
      if($('cert-headers') && !$('cert-headers').checked) return body;
      return '-----BEGIN ' + label + '-----\n' + body + '\n-----END ' + label + '-----';
    }).join('\n');
    $('cert-output').value = out;
    var totalB64 = blocks.reduce(function(n, b){ return n + b.b64.length; }, 0);
    var derBytes = Math.floor(totalB64 * 3 / 4);
    var lines = out.split('\n').length;
    $('cert-status').textContent = 'Formatted: ' + blocks.length + (blocks.length === 1 ? ' block' : ' blocks') + ', ' + totalB64 + ' Base64 chars, ~' + derBytes + ' DER bytes, ' + lines + ' lines at ' + width + ' chars/line' + (width === 64 ? ' (RFC 7468).' : '.');
    $('cert-status').className = 'ok';
  }catch(e){ showError('cert-error', e.message); $('cert-output').value = ''; }
}
function certUnwrap(){
  clearError('cert-error'); $('cert-status').textContent = ''; $('cert-status').className = '';
  var input = $('cert-input').value;
  try{
    var blocks = _certParse(input);
    if(!blocks.length) throw new Error('Paste a PEM block or Base64 first.');
    var out = blocks.map(function(b){
      _certValidate(b.b64);
      var label = b.label || _certLabel();
      if($('cert-headers') && !$('cert-headers').checked) return b.b64;
      return '-----BEGIN ' + label + '-----\n' + b.b64 + '\n-----END ' + label + '-----';
    }).join('\n');
    $('cert-output').value = out;
    $('cert-status').textContent = 'Unwrapped to a single line per block.';
    $('cert-status').className = 'ok';
  }catch(e){ showError('cert-error', e.message); $('cert-output').value = ''; }
}
function certSample(){
  // Real self-signed test certificate (CN=test.example, 1 day, generated
  // with openssl for this sample only) — pasted here as a single line,
  // which is exactly the problem this tool fixes.
  $('cert-input').value = '-----BEGIN CERTIFICATE----- MIIDDjCCAfagAwIBAgITTWYDFytSRj/AG/096rM+m46HejANBgkqhkiG9w0BAQsFADAXMRUwEwYDVQQDDAx0ZXN0LmV4YW1wbGUwHhcNMjYxMTE3MDkxOTMxWhcNMjYxMTE4MDkxOTMxWjAXMRUwEwYDVQQDDAx0ZXN0LmV4YW1wbGUwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCVgNvf0sedYc2gRKfeX6pOPl6Hh0tX8WRY3OTUXKcvETQKQUMJKFsBVr4+Fwns6OS3iif3gcl34CPAltCgggQhPLApdbEkXfyH7FzZ0y4EEDb8PmFhIwExRteLN0KFg8xPEwkoJyCdmGbfc/ZGoUCNxYMAXIHBk3idYRsQSSklvCA8ZqEJ8YJfKE9KJ70hQ0lAL5SHiOJcA4Bptb0X+I4ohCl6kjmmAgSGhmJwDbcuY3V5M8pvHHeozCumiOOe40d4EyqMi3KHRDoGaYNiGm/YRFZZLsvwk54Sfg4pJ6EM09Jh8RMCkaKn7mn+LpmVJHIF2TsVGLdu/9oFzPSBE9Z9AgMBAAGjUzBRMB0GA1UdDgQWBBTpvdVK3OlkwqJjeS+e7Dg36K40SDAfBgNVHSMEGDAWgBTpvdVK3OlkwqJjeS+e7Dg36K40SDAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQBmKM6eO0D8aK5MkPV2iHp1DgxsJ6kHMq5SLxQ07w+6zgfsq+C/miao/415hmQp6eDifxzGijZw6pVR52bWvUOWjo3UOVbJuvuyDXzeE5UBYb0izSiUjo0ggA3HygPhQJCvPeMOgp7WS30NM7KwTcXk30rv6zWPuofEtezXRBcrg5d3o0Msv1XHYpwLWVcssqkwQJRhnRATJ9G1fDya+6/YnqSfj+D40QsRrN01AKVbojg/v1mRZCgAoJtM64ELVCLMyavX1Pks46ttA4fbN8QzzFYkPAn56dYEf61GuxHiEZC5R7ILyD8zSVmA6P2XOnC0Gl8YCTmazAIu8KBA9COg -----END CERTIFICATE-----';
  certFormat();
}
function certClear(){
  $('cert-input').value = ''; $('cert-output').value = '';
  clearError('cert-error'); $('cert-status').textContent = ''; $('cert-status').className = '';
}
