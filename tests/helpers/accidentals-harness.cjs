const fs = require('node:fs');
const vm = require('node:vm');
const React = require('react');

module.exports = function (level = 'N5', react = React) {
  let seed = 8217;
  const math = Object.create(Math);
  math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2**32);
  const context = vm.createContext({
    React: react, Math: math, Date, URL, URLSearchParams, console,
    location: { search: '' }, MLH: { shell: {} }, navigator: { maxTouchPoints: 0 },
  });
  context.window = context;
  const sources = ['bravura-symbols.js', 'shared/shared-notation-config.js', 'shared/accidentals-selection.js'];
  if (level !== 'AH') sources.push('shared/accidentals-question-core.js', 'generated-runtimes/accidentals-notation.js');
  for (const file of sources) vm.runInContext(fs.readFileSync(file, 'utf8'), context);
  const page = level === 'AH' ? 'enharmonicequivalents' : 'accidentals';
  const code = fs.readFileSync('generated-runtimes/' + page + '-1.js', 'utf8');
  const exported = level === 'AH'
    ? '{ makeQuestion, enharmonicCandidates, pitchOf, stepFor, DEFAULT_OPTIONS, ScoreArea }'
    : '{ makeQuestion, effectiveAccidental: MLH.AccidentalsQuestionCore.create().effectiveAccidental, DEFAULT_ACCIDENTALS, DEFAULT_QUESTION_TYPES, rhythmInfo: MLH.AccidentalsQuestionCore.create().rhythmInfo, ...MLH.AccidentalsNotation }';
  return vm.runInContext(code.slice(0, code.lastIndexOf('ReactDOM.createRoot')) + ';(' + exported + ')', context);
};
const Babel=require('@babel/standalone');module.exports.functions=function(level='N5'){const html=fs.readFileSync(level==='AH'?'enharmonicequivalents.html':'accidentals.html','utf8').matchAll(/<script type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/g),source=Array.from(html,match=>match[1]).join("\n"),functions={};function visit(node){if(!node||typeof node!=='object')return;if(node.type==='FunctionDeclaration')functions[node.id.name]=source.slice(node.start,node.end);for(const [key,value]of Object.entries(node))if(key!=='loc'){if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);}}visit(Babel.transform(source,{presets:['react'],ast:true,code:false}).ast);return functions;};
