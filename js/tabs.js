// encoder-util — shared tab switching for the combined pages.
// Each combined page has a .tabs bar (buttons with data-tab="id") and
// matching <section class="tab-panel" id="id"> panels.
// - Clicking a tab shows its panel and updates the URL hash, so every
//   tool stays directly linkable, e.g. encoders.html#base64
// - Loading with a hash (or using back/forward) activates that tab.
// - Fires a window 'encoderutil:tab' event ({id}) on every activation;
//   json-api.html listens for it to lazily initialise Swagger UI only
//   when the OpenAPI tab is first shown (it renders badly while hidden).
// All client-side, no external dependencies.
function activateTab(id, updateHash){
  var btns = document.querySelectorAll('.tab-btn');
  var panels = document.querySelectorAll('.tab-panel');
  var found = false;
  panels.forEach(function(panel){
    var active = panel.id === id;
    panel.classList.toggle('active', active);
    if(active) found = true;
  });
  if(!found) return false;
  btns.forEach(function(btn){
    var active = btn.getAttribute('data-tab') === id;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  if(updateHash && location.hash !== '#' + id){
    history.replaceState(null, '', '#' + id);
  }
  window.dispatchEvent(new CustomEvent('encoderutil:tab', {detail: {id: id}}));
  return true;
}
function tabFromHash(){
  var id = location.hash ? location.hash.slice(1) : '';
  return document.getElementById(id) && document.getElementById(id).classList.contains('tab-panel') ? id : null;
}
function initTabs(){
  var first = document.querySelector('.tab-panel');
  if(!first) return;
  var id = tabFromHash() || first.id;
  activateTab(id, false);
  if(!location.hash) history.replaceState(null, '', '#' + id);
  document.querySelectorAll('.tab-btn').forEach(function(btn){
    btn.addEventListener('click', function(){ activateTab(btn.getAttribute('data-tab'), true); });
  });
  window.addEventListener('hashchange', function(){
    var next = tabFromHash();
    if(next) activateTab(next, false);
  });
}
initTabs();
