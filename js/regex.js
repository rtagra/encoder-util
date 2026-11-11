// regex-tester.html — regex tester with match highlighting and replace.
// Browser-only: RegExp in your browser, nothing leaves the browser.
function _rxFlags(){
  var f = '';
  ['g','i','m','s','u'].forEach(function(flag){
    var el = $('rx-flag-' + flag); if(el && el.checked) f += flag;
  });
  return f;
}
function _rxEscape(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function _rxBuild(){
  var pattern = $('rx-pattern').value;
  if(!pattern) throw new Error('Enter a regular expression.');
  return new RegExp(pattern, _rxFlags());
}
function rxTest(){
  clearError('rx-error'); $('rx-status').textContent = '';
  var text = $('rx-text').value;
  try{
    var re = _rxBuild();
    var matches = text.matchAll ? [...text.matchAll(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'))] : [];
    // matchAll needs /g; if user didn't set it, still show first match
    if(matches.length === 0){
      var m = re.exec(text);
      if(m) matches = [m];
    }
    $('rx-status').textContent = matches.length + (matches.length === 1 ? ' match' : ' matches');
    $('rx-status').className = 'good';
    var html = _rxEscape(text), offset = 0;
    // highlight by rebuilding from matches (works when /g is on)
    if(re.flags.includes('g') && matches.length){
      html = ''; var last = 0;
      matches.forEach(function(m){
        html += _rxEscape(text.slice(last, m.index));
        html += '<mark>' + _rxEscape(m[0]) + '</mark>';
        last = m.index + m[0].length;
      });
      html += _rxEscape(text.slice(last));
    }
    $('rx-highlight').innerHTML = html || '<span class="muted">No text to highlight.</span>';
    var list = matches.map(function(m, i){
      var groups = m.slice(1).map(function(g, gi){ return 'Group ' + (gi+1) + ': ' + (g === undefined ? '(not matched)' : JSON.stringify(g)); });
      return (i+1) + '. ' + JSON.stringify(m[0]) + ' at index ' + m.index + (groups.length ? ' — ' + groups.join(', ') : '');
    }).join('\n');
    $('rx-matches').value = list || 'No matches.';
  }catch(e){ showError('rx-error', 'Invalid regex: ' + e.message); }
}
function rxReplace(){
  clearError('rx-error');
  try{
    var re = _rxBuild();
    var out = $('rx-text').value.replace(re, $('rx-replacement').value);
    $('rx-output').value = out;
    $('rx-status').textContent = 'Replaced.';
    $('rx-status').className = 'good';
  }catch(e){ showError('rx-error', 'Invalid regex: ' + e.message); }
}
function rxSample(){
  $('rx-pattern').value = '\\b([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+\\.[A-Za-z]{2,})\\b';
  $('rx-flag-g').checked = true;
  $('rx-text').value = 'Contact ronald@example.com or bossing@encoder-util.dev for help.';
  $('rx-replacement').value = '$1 [at] $2';
  rxTest();
}
function rxClear(){
  $('rx-pattern').value = ''; $('rx-text').value = ''; $('rx-replacement').value = '';
  $('rx-output').value = ''; $('rx-matches').value = '';
  $('rx-highlight').innerHTML = ''; clearError('rx-error'); $('rx-status').textContent = '';
}
