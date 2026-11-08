// url-encoder.html
function doEncode(){
  clearError('url-error');
  const mode=document.querySelector('input[name="url-mode"]:checked').value;
  try{ $('url-output').value = mode==='component' ? encodeURIComponent($('url-input').value) : encodeURI($('url-input').value); }
  catch(e){ showError('url-error','Encode failed: '+e.message); }
}
function doDecode(){
  clearError('url-error');
  try{ $('url-output').value = decodeURIComponent($('url-input').value); }
  catch(e){ showError('url-error','Decode failed: '+e.message+' — check for a bad % sequence.'); }
}
function swapUrl(){ const a=$('url-input'),b=$('url-output'); const t=a.value; a.value=b.value; b.value=t; }
