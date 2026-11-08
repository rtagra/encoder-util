// hex-base64.html — Hex <-> Base64, both directions.
function hexToBytes(hex){
  let s=hex.trim().replace(/^0x/i,'').replace(/\s+/g,'');
  if(!/^[0-9a-fA-F]*$/.test(s)) throw new Error('Not valid hex — only 0-9, a-f allowed.');
  if(s.length%2) throw new Error('Hex must have an even number of digits.');
  const bytes=new Uint8Array(s.length/2);
  for(let i=0;i<bytes.length;i++) bytes[i]=parseInt(s.slice(i*2,i*2+2),16);
  return bytes;
}
function bytesToHex(bytes){ return [...bytes].map(b=>b.toString(16).padStart(2,'0')).join(''); }
function hexToB64(){
  clearError('hex-error');
  try{
    const bytes=hexToBytes($('hex-input').value);
    let out=b64urlEncode(bytes);
    if(!$('hex-urlsafe').checked){
      // b64urlEncode is URL-safe; convert back to standard Base64 with padding
      out=out.replace(/-/g,'+').replace(/_/g,'/');
      while(out.length%4) out+='=';
    }
    $('hex-output').value=out;
  }catch(e){ showError('hex-error',e.message); }
}
function b64ToHex(){
  clearError('hex-error');
  try{
    let s=$('hex-input').value.trim().replace(/\s+/g,'');
    // Accept standard or URL-safe Base64
    const bytes=b64urlDecode(s.replace(/\+/g,'-').replace(/\//g,'_'));
    $('hex-output').value=bytesToHex(bytes);
  }catch(e){ showError('hex-error','Decode failed: '+e.message+' — not valid Base64.'); }
}
function swapHex(){ const a=$('hex-input'),b=$('hex-output'); const t=a.value; a.value=b.value; b.value=t; }
