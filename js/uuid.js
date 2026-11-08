// uuid-generator.html — uses crypto.randomUUID() (v4). v7 is built manually.
function uuidv7(){
  // UUIDv7: 48-bit unix ms timestamp + version 7 + variant + random.
  const ms=Date.now();
  const bytes=new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[0]=(ms/2**40)&0xff; bytes[1]=(ms/2**32)&0xff; bytes[2]=(ms/2**24)&0xff;
  bytes[3]=(ms/2**16)&0xff; bytes[4]=(ms/2**8)&0xff; bytes[5]=ms&0xff;
  bytes[6]=(bytes[6]&0x0f)|0x70; // version 7
  bytes[8]=(bytes[8]&0x3f)|0x80; // variant 10
  const h=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
  return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
}
function genUuids(){
  clearError('uuid-error');
  const count=Math.min(100,Math.max(1,parseInt($('uuid-count').value)||1));
  const version=$('uuid-version').value;
  const hyphens=$('uuid-hyphens').checked;
  const upper=$('uuid-upper').checked;
  const out=[];
  for(let i=0;i<count;i++){
    let u = version==='v7' ? uuidv7() : crypto.randomUUID();
    if(!hyphens) u=u.replace(/-/g,'');
    if(upper) u=u.toUpperCase();
    out.push(u);
  }
  $('uuid-output').value=out.join('\n');
}
