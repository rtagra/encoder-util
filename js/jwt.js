// jwt-encoder.html + jwt-decoder.html — shared JWT logic.
function toggleSecret(inputId){
  const el=$(inputId); el.type = el.type==='password' ? 'text' : 'password';
}
async function jwtEncode(){
  clearError('jwt-error');
  let header,payload;
  try{ header=JSON.parse($('jwt-header').value); payload=JSON.parse($('jwt-payload').value); }
  catch(e){ showError('jwt-error','Invalid JSON: '+e.message); return; }
  const alg=$('jwt-alg').value;
  header.alg=alg; header.typ=header.typ||'JWT';
  const secret=$('jwt-secret').value;
  if(!secret){ showError('jwt-error','Secret is required — it is a parameter for signing, type it in the Secret field.'); return; }
  const h=b64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const p=b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const data=h+'.'+p;
  try{
    const sig=await hmacSign(alg,secret,data);
    $('jwt-output').value=data+'.'+sig;
  }catch(e){ showError('jwt-error','Sign failed: '+e.message); }
}
function jwtDecode(){
  clearError('jwt-error');
  const token=$('jwt-token').value.trim();
  const parts=token.split('.');
  if(parts.length!==3){ showError('jwt-error','Not a JWT — expected header.payload.signature (3 parts).'); return; }
  try{
    const header=JSON.parse(b64urlDecodeText(parts[0]));
    const payload=JSON.parse(b64urlDecodeText(parts[1]));
    $('jwt-header-out').innerHTML=renderJsonTable(header);
    $('jwt-payload-out').innerHTML=renderJsonTable(payload);
    $('jwt-result').style.display='block';
    $('jwt-verify-result').textContent='';
    // Store for verify step
    window._jwt={header,payload,signingInput:parts[0]+'.'+parts[1],signature:parts[2]};
  }catch(e){ showError('jwt-error','Decode failed: '+e.message); }
}
async function jwtVerify(){
  if(!window._jwt){ showError('jwt-error','Decode a token first.'); return; }
  const secret=$('jwt-secret').value;
  if(!secret){ showError('jwt-error','Secret is required to verify — type it in the Secret field.'); return; }
  const alg=window._jwt.header.alg;
  if(!alg || !alg.startsWith('HS')){ $('jwt-verify-result').textContent='Cannot verify in-browser: alg is '+(alg||'missing')+', only HS256/HS384/HS512 are supported here.'; $('jwt-verify-result').className='bad'; return; }
  const ok=await hmacVerify(alg,secret,window._jwt.signingInput,window._jwt.signature);
  const el=$('jwt-verify-result');
  el.textContent = ok ? '✓ Signature valid' : '✗ Signature invalid — wrong secret, or token was changed.';
  el.className = ok ? 'ok' : 'bad';
}
