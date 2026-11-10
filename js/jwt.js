// jwt.html — single JWT tool, jwt.io style.
// Paste a token -> it decodes into editable header / payload.
// Edit the header / payload (or secret / algorithm) -> it re-signs the token.
// Both directions live in one page; no separate encode / decode pages.
function toggleSecret(inputId){
  const el=$(inputId); el.type = el.type==='password' ? 'text' : 'password';
}
let _jwtUpdating = false; // guard against token<->claims update loops
let _jwtLast = {header:null, payload:null, signingInput:null, signature:null};

function _pretty(obj){ return JSON.stringify(obj, null, 2); }

function _renderDecoded(){
  try{
    const header=JSON.parse($('jwt-header').value);
    const payload=JSON.parse($('jwt-payload').value);
    $('jwt-header-out').innerHTML=renderJsonTable(header);
    $('jwt-payload-out').innerHTML=renderJsonTable(payload);
    $('jwt-decoded').style.display='block';
    // Keep the algorithm selector in sync with the header
    if(header.alg && $('jwt-alg').value!==header.alg) $('jwt-alg').value=header.alg;
  }catch(e){ /* invalid JSON while typing — leave the last good table up */ }
}

// Token -> claims. Called on paste / typing in the token box, and by Decode.
function jwtDecode(){
  clearError('jwt-error');
  const token=$('jwt-token').value.trim();
  if(!token){ $('jwt-decoded').style.display='none'; return; }
  const parts=token.split('.');
  if(parts.length!==3){ showError('jwt-error','Not a JWT — expected header.payload.signature (3 parts).'); return; }
  try{
    const header=JSON.parse(b64urlDecodeText(parts[0]));
    const payload=JSON.parse(b64urlDecodeText(parts[1]));
    _jwtUpdating=true;
    $('jwt-header').value=_pretty(header);
    $('jwt-payload').value=_pretty(payload);
    if(header.alg) $('jwt-alg').value=header.alg;
    _jwtUpdating=false;
    _jwtLast={header,payload,signingInput:parts[0]+'.'+parts[1],signature:parts[2]};
    _renderDecoded();
    $('jwt-verify-result').textContent='';
    jwtVerify(true); // verify silently if a secret is already typed
  }catch(e){ showError('jwt-error','Decode failed: '+e.message); }
}

// Claims -> token. Called on editing header / payload / alg / secret.
async function jwtEncode(){
  clearError('jwt-error');
  let header,payload;
  try{ header=JSON.parse($('jwt-header').value); payload=JSON.parse($('jwt-payload').value); }
  catch(e){ showError('jwt-error','Invalid JSON: '+e.message); return; }
  const alg=$('jwt-alg').value;
  header.alg=alg; header.typ=header.typ||'JWT';
  const secret=$('jwt-secret').value;
  const h=b64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const p=b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const data=h+'.'+p;
  _renderDecoded();
  if(!secret){
    // No secret yet: show the unsigned token so the user can see the shape,
    // and let them paste a secret to sign it.
    _jwtUpdating=true;
    $('jwt-token').value=data+'.';
    _jwtUpdating=false;
    _jwtLast={header,payload,signingInput:data,signature:''};
    $('jwt-verify-result').textContent='Type a secret to sign this token.';
    $('jwt-verify-result').className='muted';
    return;
  }
  try{
    const sig=await hmacSign(alg,secret,data);
    _jwtUpdating=true;
    $('jwt-token').value=data+'.'+sig;
    _jwtUpdating=false;
    _jwtLast={header,payload,signingInput:data,signature:sig};
    jwtVerify(true);
  }catch(e){ showError('jwt-error','Sign failed: '+e.message); }
}

async function jwtVerify(silent){
  const el=$('jwt-verify-result');
  if(!_jwtLast.signingInput || !_jwtLast.signature){
    if(!silent){ showError('jwt-error','Decode or sign a token first.'); }
    return;
  }
  const secret=$('jwt-secret').value;
  if(!secret){ if(!silent) showError('jwt-error','Secret is required to verify — type it in the Secret field.'); return; }
  const alg=_jwtLast.header && _jwtLast.header.alg;
  if(!alg || !alg.startsWith('HS')){ el.textContent='Cannot verify in-browser: alg is '+(alg||'missing')+', only HS256/HS384/HS512 are supported here.'; el.className='bad'; return; }
  const ok=await hmacVerify(alg,secret,_jwtLast.signingInput,_jwtLast.signature);
  el.textContent = ok ? '✓ Signature valid' : '✗ Signature invalid — wrong secret, or token was changed.';
  el.className = ok ? 'ok' : 'bad';
}
// Live wiring: token edits decode, claim edits re-sign (when a secret is set).
function onJwtTokenInput(){ if(!_jwtUpdating) jwtDecode(); }
function onJwtClaimsInput(){ if(_jwtUpdating) return; _renderDecoded(); if($('jwt-secret').value) jwtEncode(); }
// Seed the page with the example token, like jwt.io does.
async function jwtInit(){
  $('jwt-token').value='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlJvbmFsZCIsImlhdCI6MTc5NDEwMDAwMCwiZXhwIjoxNzk0MTAzNjAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  jwtDecode();
}
