// json-formatter.html — JSON formatter / validator / minifier.
// Browser-only: JSON.parse / JSON.stringify, nothing leaves the browser.
function _jsonIndent(){
  var s = $('json-indent'); if(!s) return 2;
  return s.value === 'tab' ? '\t' : parseInt(s.value, 10);
}
function _jsonSortKeys(v){
  if(Array.isArray(v)) return v.map(_jsonSortKeys);
  if(v && typeof v === 'object'){
    var o = {};
    Object.keys(v).sort().forEach(function(k){ o[k] = _jsonSortKeys(v[k]); });
    return o;
  }
  return v;
}
function _jsonParse(){
  var text = $('json-input').value;
  if(!text.trim()) throw new Error('Input is empty — paste some JSON.');
  return JSON.parse(text);
}
function _jsonStats(v, out){
  var keys = (v && typeof v === 'object') ? Object.keys(v).length : 0;
  var type = Array.isArray(v) ? 'array' : (v === null ? 'null' : typeof v);
  $('json-status').textContent = 'Valid JSON — ' + type + (keys ? ', ' + keys + ' top-level keys' : '') + ', ' + out.length + ' characters.';
  $('json-status').className = 'good';
}
function jsonFormat(){
  clearError('json-error');
  try{
    var v = _jsonParse();
    if($('json-sort') && $('json-sort').checked) v = _jsonSortKeys(v);
    var out = JSON.stringify(v, null, _jsonIndent());
    $('json-output').value = out;
    _jsonStats(v, out);
  }catch(e){ showError('json-error', 'Invalid JSON: ' + e.message); $('json-status').textContent = ''; }
}
function jsonMinify(){
  clearError('json-error');
  try{
    var v = _jsonParse();
    if($('json-sort') && $('json-sort').checked) v = _jsonSortKeys(v);
    var out = JSON.stringify(v);
    $('json-output').value = out;
    _jsonStats(v, out);
  }catch(e){ showError('json-error', 'Invalid JSON: ' + e.message); $('json-status').textContent = ''; }
}
function jsonValidate(){
  clearError('json-error');
  try{
    var v = _jsonParse();
    $('json-status').textContent = 'Valid JSON.';
    $('json-status').className = 'good';
    _jsonStats(v, $('json-input').value);
  }catch(e){ showError('json-error', 'Invalid JSON: ' + e.message); $('json-status').textContent = ''; }
}
function jsonSample(){
  $('json-input').value = '{\n  "name": "Ronald",\n  "role": "Principal Engineer",\n  "tools": ["URL", "Base64", "JWT"],\n  "active": true,\n  "score": 42\n}';
  jsonFormat();
}
function jsonClear(){
  $('json-input').value = ''; $('json-output').value = '';
  clearError('json-error'); $('json-status').textContent = '';
}
