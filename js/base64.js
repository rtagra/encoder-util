// base64-encoder.html
function b64DoEncode(){
  clearError('b64-error');
  try{ $('b64-output').value=b64encode($('b64-input').value, $('b64-urlsafe').checked); }
  catch(e){ showError('b64-error','Encode failed: '+e.message); }
}
function b64DoDecode(){
  clearError('b64-error');
  try{ $('b64-output').value=b64decode($('b64-input').value, $('b64-urlsafe').checked); }
  catch(e){ showError('b64-error','Decode failed: '+e.message+' — not valid Base64.'); }
}
function swapB64(){ const a=$('b64-input'),b=$('b64-output'); const t=a.value; a.value=b.value; b.value=t; }
