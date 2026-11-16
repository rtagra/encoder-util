// cidr-calculator.html — IPv4 CIDR calculator + IP-in-range check.
// Browser-only: all math in your browser, nothing leaves the browser.
function _cidrParseIp(s){
  var parts = String(s || '').trim().split('.');
  if(parts.length !== 4) throw new Error('Enter an IPv4 address like 192.168.1.50.');
  var octets = parts.map(function(p){
    if(!/^\d+$/.test(p)) throw new Error('IPv4 octets must be numbers 0-255.');
    var n = parseInt(p, 10);
    if(n < 0 || n > 255) throw new Error('IPv4 octet out of range: ' + p + ' (0-255).');
    return n;
  });
  return ((octets[0] << 24) >>> 0) + (octets[1] << 16) + (octets[2] << 8) + octets[3];
}
function _cidrIpStr(n){
  n = n >>> 0;
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}
function _cidrBin(n){
  return _cidrIpStr(n).split('.').map(function(o){
    return ('00000000' + parseInt(o, 10).toString(2)).slice(-8);
  }).join('.');
}
function cidrCalc(){
  clearError('cidr-error'); $('cidr-status').textContent = ''; $('cidr-check').textContent = ''; $('cidr-check').className = '';
  var cidr = $('cidr-input').value.trim();
  var checkIp = $('cidr-check-ip').value.trim();
  try{
    if(!cidr) throw new Error('Enter a CIDR range like 192.168.1.0/24.');
    var m = cidr.match(/^(.+)\/(\d{1,2})$/);
    if(!m) throw new Error('Enter a CIDR range like 192.168.1.0/24 (IP/prefix).');
    var ipNum = _cidrParseIp(m[1]);
    var prefix = parseInt(m[2], 10);
    if(prefix < 0 || prefix > 32) throw new Error('Prefix must be 0-32.');
    var mask = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0;
    var network = (ipNum & mask) >>> 0;
    var broadcast = (network | (~mask >>> 0)) >>> 0;
    var hostBits = 32 - prefix;
    var total = Math.pow(2, hostBits);
    var usable, first, last;
    if(prefix === 32){ usable = 1; first = network; last = network; }
    else if(prefix === 31){ usable = 2; first = network; last = broadcast; }
    else { usable = total - 2; first = network + 1; last = broadcast - 1; }
    var rows = [
      ['CIDR', _cidrIpStr(network) + '/' + prefix],
      ['Subnet mask', _cidrIpStr(mask)],
      ['Wildcard mask', _cidrIpStr((~mask >>> 0))],
      ['Network address', _cidrIpStr(network)],
      ['Broadcast address', _cidrIpStr(broadcast)],
      ['First usable host', _cidrIpStr(first)],
      ['Last usable host', _cidrIpStr(last)],
      ['Total addresses', total.toLocaleString()],
      ['Usable hosts', usable.toLocaleString()],
      ['Prefix / host bits', '/' + prefix + ' — ' + hostBits + ' host bits'],
      ['Network (binary)', _cidrBin(network)],
      ['Mask (binary)', _cidrBin(mask)]
    ];
    $('cidr-results').innerHTML = '<table><tr><th>Field</th><th>Value</th></tr>' + rows.map(function(r){
      return '<tr><td><code>' + r[0] + '</code></td><td>' + r[1] + '</td></tr>';
    }).join('') + '</table>';
    $('cidr-status').textContent = 'Calculated.';
    $('cidr-status').className = 'ok';
    if(checkIp){
      var checkNum = _cidrParseIp(checkIp);
      var inside = checkNum >= network && checkNum <= broadcast;
      var inUsable = prefix === 32 ? inside : prefix === 31 ? inside : (checkNum >= first && checkNum <= last);
      $('cidr-check').textContent = inside
        ? '✓ ' + checkIp + ' IS in ' + _cidrIpStr(network) + '/' + prefix + (inUsable ? ' (usable host).' : ' — but it is the network/broadcast address, not a usable host.')
        : '✗ ' + checkIp + ' is NOT in ' + _cidrIpStr(network) + '/' + prefix + '.';
      $('cidr-check').className = inside ? 'ok' : 'bad';
    }
  }catch(e){ showError('cidr-error', e.message); $('cidr-results').innerHTML = ''; }
}
function cidrSample(){
  $('cidr-input').value = '192.168.1.0/24';
  $('cidr-check-ip').value = '192.168.1.50';
  cidrCalc();
}
function cidrSampleNo(){
  $('cidr-input').value = '10.0.0.0/8';
  $('cidr-check-ip').value = '192.168.1.1';
  cidrCalc();
}
function cidrClear(){
  $('cidr-input').value = ''; $('cidr-check-ip').value = '';
  $('cidr-results').innerHTML = ''; clearError('cidr-error');
  $('cidr-status').textContent = ''; $('cidr-check').textContent = ''; $('cidr-check').className = '';
}
