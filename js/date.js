// date-formatter.html — date formatter for Java, Python, JavaScript, Go, C#, PHP.
// Browser-only: everything is computed in your browser, nothing leaves it.
var DATE_PRESETS = [
  {name:'ISO 8601', js:'2026-11-11T09:40:00', py:'%Y-%m-%dT%H:%M:%S', java:'yyyy-MM-dd\'T\'HH:mm:ss', go:'2006-01-02T15:04:05', cs:'yyyy-MM-dd\'T\'HH:mm:ss', php:'Y-m-d\\TH:i:s'},
  {name:'Date + time', js:'2026-11-11 09:40:00', py:'%Y-%m-%d %H:%M:%S', java:'yyyy-MM-dd HH:mm:ss', go:'2006-01-02 15:04:05', cs:'yyyy-MM-dd HH:mm:ss', php:'Y-m-d H:i:s'},
  {name:'Date only', js:'2026-11-11', py:'%Y-%m-%d', java:'yyyy-MM-dd', go:'2006-01-02', cs:'yyyy-MM-dd', php:'Y-m-d'},
  {name:'US date + time', js:'11/11/2026, 09:40 AM', py:'%m/%d/%Y, %I:%M %p', java:'MM/dd/yyyy, hh:mm a', go:'01/02/2006, 03:04 PM', cs:'MM/dd/yyyy, hh:mm tt', php:'m/d/Y, h:i A'},
  {name:'Long date', js:'Wednesday, 11 November 2026', py:'%A, %d %B %Y', java:'EEEE, dd MMMM yyyy', go:'Monday, 02 January 2006', cs:'dddd, dd MMMM yyyy', php:'l, d F Y'},
  {name:'Unix timestamp (seconds)', js:'1794351600', py:'1794351600', java:'1794351600', go:'1794351600', cs:'1794351600', php:'1794351600'},
];
var DATE_LANGS = [
  {id:'js', name:'JavaScript'},
  {id:'py', name:'Python'},
  {id:'java', name:'Java'},
  {id:'go', name:'Go'},
  {id:'cs', name:'C#'},
  {id:'php', name:'PHP'},
];
function _pad(n){ return String(n).padStart(2, '0'); }
function _dateValue(){
  var v = $('date-input').value;
  var d = v ? new Date(v) : new Date();
  if(isNaN(d)) throw new Error('Invalid date — pick a date and time.');
  return d;
}
function _formatFor(d, presetIdx, langId){
  var p = DATE_PRESETS[presetIdx];
  if(p.name === 'Unix timestamp (seconds)') return String(Math.floor(d.getTime() / 1000));
  var y = d.getFullYear(), mo = _pad(d.getMonth() + 1), da = _pad(d.getDate());
  var h = _pad(d.getHours()), mi = _pad(d.getMinutes()), s = _pad(d.getSeconds());
  var h12 = d.getHours() % 12 || 12, ampm = d.getHours() < 12 ? 'AM' : 'PM';
  var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var map = {
    'ISO 8601': y + '-' + mo + '-' + da + 'T' + h + ':' + mi + ':' + s,
    'Date + time': y + '-' + mo + '-' + da + ' ' + h + ':' + mi + ':' + s,
    'Date only': y + '-' + mo + '-' + da,
    'US date + time': mo + '/' + da + '/' + y + ', ' + _pad(h12) + ':' + mi + ' ' + ampm,
    'Long date': days[d.getDay()] + ', ' + da + ' ' + months[d.getMonth()] + ' ' + y,
  };
  return map[p.name] || '';
}
function dateRender(){
  clearError('date-error'); $('date-status').textContent = '';
  try{
    var d = _dateValue();
    var presetIdx = parseInt($('date-preset').value, 10);
    var rows = DATE_LANGS.map(function(l){
      var pattern = DATE_PRESETS[presetIdx][l.id];
      return '<tr><td><strong>' + l.name + '</strong></td><td><code>' + pattern + '</code></td><td><code>' + _formatFor(d, presetIdx, l.id) + '</code></td></tr>';
    }).join('');
    $('date-table').innerHTML = '<table><tr><th>Language</th><th>Format pattern</th><th>Formatted date</th></tr>' + rows + '</table>';
    $('date-status').textContent = 'Formatted: ' + d.toString();
    $('date-status').className = 'good';
  }catch(e){ showError('date-error', e.message); }
}
function dateNow(){
  var d = new Date();
  var v = d.getFullYear() + '-' + _pad(d.getMonth()+1) + '-' + _pad(d.getDate()) + 'T' + _pad(d.getHours()) + ':' + _pad(d.getMinutes());
  $('date-input').value = v;
  dateRender();
}
