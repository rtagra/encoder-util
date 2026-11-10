// openapi.html — OpenAPI renderer + editor, fully self-contained.
// Vendored Swagger UI 5.34.1 + js-yaml 4.1.0 live in vendor/ — no CDN,
// no external script at runtime. Your spec never leaves your browser
// (except if you click "Try it out", which sends a request from your
// browser to the API server you chose — only use test APIs).
// This page intentionally has NO Google Tag Manager tag, so no page
// view is sent while you work on bank specs. See GOOGLE_TAG.md.
var _openapiTimer = null;
function _parseSpec(text){
  var t = text.trim();
  if(!t) throw new Error('Spec is empty — paste an OpenAPI YAML or JSON document.');
  if(t[0] === '{') return JSON.parse(t);
  return jsyaml.load(t);
}
function renderOpenApi(){
  clearError('openapi-error');
  var text = $('openapi-input').value;
  var spec;
  try{ spec = _parseSpec(text); }
  catch(e){ showError('openapi-error', 'Cannot parse spec: ' + e.message); return; }
  if(!spec || typeof spec !== 'object' || !spec.openapi){
    showError('openapi-error', 'Not an OpenAPI document — expected an "openapi: 3.x.x" field at the top.');
    return;
  }
  try{
    window.SwaggerUIBundle({
      spec: spec,
      dom_id: '#swagger-ui',
      presets: [window.SwaggerUIBundle.presets.apis, window.SwaggerUIStandalonePreset],
      layout: 'StandaloneLayout',
      deepLinking: true
    });
  }catch(e){ showError('openapi-error', 'Swagger UI failed to render: ' + e.message); }
}
function onOpenApiInput(){
  clearTimeout(_openapiTimer);
  _openapiTimer = setTimeout(renderOpenApi, 500);
}
function openApiInit(){
  renderOpenApi();
}
