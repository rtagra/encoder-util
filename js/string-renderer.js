// string-renderer.html — renders a string read-only. Output is never editable.
function renderString(){
  clearError('str-error');
  const input=$('str-input').value;
  const mode=document.querySelector('input[name="str-mode"]:checked').value;
  let out=input;
  if(mode==='escaped') out=input.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  if(mode==='json') out=JSON.stringify(input);
  // Render as text (not HTML) so the output is a faithful, read-only view.
  const el=$('str-output');
  el.textContent=out;
  const bytes=new TextEncoder().encode(input).length;
  const lines=input?input.split('\n').length:0;
  const words=input.trim()?input.trim().split(/\s+/).length:0;
  $('str-stats').textContent=bytes+' bytes · '+input.length+' characters · '+lines+' lines · '+words+' words';
}
