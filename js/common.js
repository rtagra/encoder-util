// encoder-util — shared helpers. All client-side, nothing leaves the browser.
function $(id){return document.getElementById(id)}
function copyText(id){
  const el=$(id); if(!el) return;
  const v=el.value!==undefined?el.value:el.textContent;
  navigator.clipboard.writeText(v).then(()=>{const b=document.querySelector(`[data-copy="${id}"]`); if(b){const t=b.textContent;b.textContent='Copied!';setTimeout(()=>b.textContent=t,1200)}});
}
function showError(id,msg){const e=$(id); if(e){e.textContent=msg; e.className='bad'}}
function clearError(id){const e=$(id); if(e){e.textContent=''; e.className=''}}
// UTF-8 safe Base64
function b64encode(str,urlSafe){
  const bytes=new TextEncoder().encode(str);
  let bin=''; bytes.forEach(b=>bin+=String.fromCharCode(b));
  let out=btoa(bin);
  if(urlSafe) out=out.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  return out;
}
function b64decode(str,urlSafe){
  let s=str.trim();
  if(urlSafe) s=s.replace(/-/g,'+').replace(/_/g,'/');
  s=s.replace(/\s/g,'');
  while(s.length%4) s+='=';
  const bin=atob(s);
  const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function b64urlEncode(bytes){ // bytes: Uint8Array
  let bin=''; bytes.forEach(b=>bin+=String.fromCharCode(b));
  return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function b64urlDecode(str){
  let s=str.replace(/-/g,'+').replace(/_/g,'/');
  while(s.length%4) s+='=';
  const bin=atob(s);
  return Uint8Array.from(bin,c=>c.charCodeAt(0));
}
function b64urlDecodeText(str){ return new TextDecoder().decode(b64urlDecode(str)); }
// Human-readable timestamp, local browser time + relative time.
// Used as a hover tooltip (title attribute) on exp / iat / nbf values.
function humanTime(unixSeconds){
  const d=new Date(unixSeconds*1000);
  const local=d.toLocaleString(undefined,{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',timeZoneName:'short'});
  const diff=Math.round((d-Date.now())/1000);
  const abs=Math.abs(diff);
  const rel=abs<60?abs+'s':abs<3600?Math.round(abs/60)+'m':abs<86400?Math.round(abs/3600)+'h':Math.round(abs/86400)+'d';
  const when=diff>=0?'in '+rel:rel+' ago';
  return local+' ('+when+')';
}
function tsSpan(value){
  // value is a unix-seconds number; hover shows human-readable local time.
  return '<span class="ts" title="'+humanTime(value)+'">'+value+'</span>';
}
function renderJsonTable(obj){
  let rows='';
  for(const [k,v] of Object.entries(obj)){
    let shown;
    if((k==='exp'||k==='iat'||k==='nbf')&&typeof v==='number') shown=tsSpan(v);
    else if(typeof v==='object') shown='<code>'+JSON.stringify(v)+'</code>';
    else shown=String(v);
    rows+='<tr><td><code>'+k+'</code></td><td>'+shown+'</td></tr>';
  }
  return '<table><tr><th>Claim</th><th>Value — hover exp / iat / nbf for human-readable time</th></tr>'+rows+'</table>';
}
async function hmacSign(alg,secret,data){
  const hash={HS256:'SHA-256',HS384:'SHA-384',HS512:'SHA-512'}[alg];
  if(!hash) throw new Error('Unsupported alg: '+alg);
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash},false,['sign','verify']);
  const sig=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(data));
  return b64urlEncode(new Uint8Array(sig));
}
async function hmacVerify(alg,secret,data,signatureB64url){
  const hash={HS256:'SHA-256',HS384:'SHA-384',HS512:'SHA-512'}[alg];
  if(!hash) return false;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash},false,['sign','verify']);
  const sig=b64urlDecode(signatureB64url);
  return crypto.subtle.verify('HMAC',key,sig,new TextEncoder().encode(data));
}
