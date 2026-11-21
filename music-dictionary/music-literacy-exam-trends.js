(function(root,factory){
 const trends=factory();
 if(typeof module==='object'&&module.exports)module.exports=trends;
 else root.MLHMusicLiteracyExamTrends=trends;
})(typeof globalThis==='object'?globalThis:this,function(){
 // Reviewed papers and task numbers are indexed in data/analysis/music-literacy-yearly.json.
 // Map the skill assessed by the prompt and marking instructions, including accepted
 // alternatives. A skill used only in the printed score or supplied in the prompt is excluded.
 const reports={
  N5:{label:'National 5',slug:'national5',years:[2014,2015,2016,2017,2018,2019,2022,2023,2024,2025,2026]},
  H:{label:'Higher',slug:'higher',years:[2015,2016,2017,2018,2019,2022,2023,2024,2025,2026]},
  AH:{label:'Advanced Higher',slug:'advanced-higher',years:[2016,2017,2018,2019,2022,2023,2024,2025,2026]},
 };
 const pitchReading='2015:3(e) 2017:3(e) 2019:3(c) 2022:3(b) 2024:3(e)';
 const higherChords='2015:4(f) 2017:4(e) 2018:3(f) 2019:3(c) 2022:4(c) 2023:4(f) 2024:4(e) 2025:4(b) 2026:4(c)';
 const evidence={
  'treble-lines':{N5:pitchReading},
  'treble-stave':{N5:pitchReading},
  'crotchet':{N5:'2014:3(c) 2018:3(f) 2025:3(c) 2026:3(e)',H:'2017:4(c) 2018:3(e)',AH:'2016:4(a) 2016:4(c) 2017:4(e) 2018:2(a)(i) 2023:5(b)(i) 2025:4(b)'},
  'minim':{N5:'2019:3(c) 2022:3(b) 2024:3(e)',AH:'2016:4(a)'},
  'dotted-minim':{N5:'2026:3(d)'},
  'barlines':{H:'2015:4(e) 2018:3(a) 2025:4(e)',AH:'2025:4(d)'},
  'forte':{N5:'2022:3(c)'},
  'piano':{N5:'2014:3(b) 2024:3(f) 2026:3(b)'},
  'quaver':{N5:'2017:3(d) 2017:3(e) 2017:3(f) 2018:3(c) 2023:3(c) 2024:3(d)',H:'2016:4(c) 2017:4(c) 2023:4(d) 2024:4(b)',AH:'2016:4(a) 2016:4(c) 2017:4(e) 2018:2(a)(i) 2019:4(a)(i) 2022:5(a)(ii) 2023:5(b)(i) 2025:2(a)(i) 2025:4(b)'},
  'semiquaver':{N5:'2019:3(e)',AH:'2017:4(e)'},
  'repeat-signs':{N5:'2014:3(d) 2023:3(f) 2025:3(e)',AH:'2023:2(b)(i) 2026:2(a)(ii)'},
  'mezzo-forte':{N5:'2022:3(c) 2026:3(b)'},
  'mezzo-piano':{N5:'2024:3(f) 2026:3(b)'},
  'tones-semitones-accidentals':{N5:'2015:3(e) 2016:3(d) 2017:3(e) 2023:3(e) 2025:3(d) 2026:3(c)',H:'2015:4(c)',AH:'2019:4(b)(i) 2022:2(b)(ii) 2023:4(c) 2024:2(c)(ii) 2026:4(b)'},
  'scales-key-signatures-n5':{N5:'2014:3(e) 2015:3(c) 2017:3(a) 2018:3(a) 2019:3(a) 2023:3(a) 2025:3(a)',H:'2016:4(a)'},
  'chords-n5':{N5:'2016:3(e) 2024:3(c)'},
  'leaps':{N5:'2022:3(d)'},
  'dotted-rhythms':{N5:'2017:3(d) 2018:3(c) 2023:3(d) 2026:3(d)',H:'2016:4(c) 2023:4(d)',AH:'2016:4(a) 2017:4(e)'},
  'dotted-crotchet':{N5:'2017:3(d) 2018:3(c) 2023:3(d)',H:'2016:4(c) 2023:4(d)',AH:'2016:4(a)'},
  'dotted-quaver':{AH:'2017:4(e)'},
  'treble-down-octave-bass':{H:'2015:4(a) 2016:4(f) 2017:4(f) 2018:3(b) 2019:3(f) 2022:4(f) 2023:4(b) 2024:4(d) 2025:4(c) 2026:4(a)'},
  'chords-i-iv-v-vi':{H:higherChords},
  'tonic-subdominant-dominant':{H:'2022:4(d) 2024:4(c) 2025:4(a)',AH:'2025:4(c)'},
  'naming-diatonic-intervals':{N5:'2016:3(d) 2022:3(d) 2023:3(e) 2025:3(d) 2026:3(c)',H:'2015:4(b) 2016:4(d) 2017:4(b) 2018:3(d) 2019:3(b) 2024:4(a) 2025:4(f) 2026:4(b)',AH:'2022:2(b)(i) 2025:5(d)(ii)'},
  'writing-diatonic-intervals':{H:'2022:4(b) 2023:4(a)',AH:'2023:4(d)'},
  'compound-time':{H:'2019:3(a) 2022:4(a)',AH:'2022:4(a)(i)'},
  'triplets':{H:'2018:3(e)',AH:'2022:5(a)(ii) 2024:4(b)(i) 2025:2(a)(i)'},
  'rests':{H:'2019:3(e) 2023:4(e) 2026:4(e)',AH:'2016:4(a) 2016:5(b) 2018:2(a)(i) 2019:2(a)(i)'},
  'da-capo':{H:'2024:4(f)'},
  'staccato':{AH:'2017:4(c)'},
  'bass-up-octave-treble':{AH:'2025:4(a)'},
  'rewriting-at-same-pitch':{AH:'2017:5(c) 2019:2(a)(iii) 2022:2(a)(ii) 2023:5(b)(ii) 2026:2(a)(iii)'},
  'enharmonic-equivalent':{AH:'2016:4(d)(ii) 2017:5(b) 2018:4(c) 2019:4(b)(ii) 2022:5(a)(i) 2023:4(b) 2024:4(a)(i) 2025:2(a)(ii)'},
  'scales-key-signatures-ah':{AH:'2016:5(a) 2017:5(a) 2018:4(a) 2022:4(b)(i) 2023:2(c)(ii) 2024:2(c)(i) 2026:2(a)(i)'},
  'triad-inversions':{AH:'2016:4(e)(i) 2016:4(e)(ii) 2022:2(a)(i) 2024:2(b) 2026:2(c)'},
  'chord-ii-first-inversion':{AH:'2016:4(e)(i) 2026:2(c)'},
  'chords-at-cadences':{H:higherChords,AH:'2019:2(a)(ii) 2022:4(a)(ii)'},
  'bass-line-from-chords':{AH:'2016:4(e)(ii) 2017:5(e) 2018:2(b) 2022:4(b)(iii) 2025:2(d)'},
  'diminished-seventh':{AH:'2025:5(d)(i) 2026:2(b)'},
  'dominant-seventh':{H:'2022:4(c)',AH:'2022:4(a)(ii)'},
  'added-sixth':{AH:'2017:4(b)'},
  'augmented-triad':{AH:'2018:2(d)'},
  'tritone':{AH:'2019:4(a)(ii) 2024:4(a)(ii) 2026:4(c)'},
  'augmented-fourth':{AH:'2019:4(a)(ii) 2026:4(c)'},
  'diminished-fifth':{AH:'2024:4(a)(ii)'},
  'ottava':{AH:'2019:4(c) 2022:4(b)(ii) 2023:2(c)(i)'},
  'ties':{AH:'2016:5(c) 2025:2(c)(i) 2026:2(a)(iv)'},
  'five-four':{AH:'2018:2(c)(i) 2026:4(a)'},
  'time-changes':{H:'2026:4(f)'},
  'dal-segno':{AH:'2023:2(b)(i)'},
 };
 const index=new Map();
 for(const [id,exams] of Object.entries(evidence)){
  for(const [exam,references] of Object.entries(exams)){
   const papers=new Map();
   const {label,slug}=reports[exam];
   for(const reference of references.split(' ')){
    const [yearText,number]=reference.split(':');
    const year=Number(yearText);
    const questionId='q'+number.match(/^\d+/)[0];
    if(!papers.has(year))papers.set(year,[]);
    papers.get(year).push({
     id:'q'+number.replace(/[()]/g,''),
     number,
     paperTitle:label+' Music '+year,
     href:'./digital-question-papers/digitalquestionpapers.html?paper='+slug+'-'+year+'&question='+questionId,
    });
   }
   index.set(exam+'-'+id,papers);
  }
 }
 function entry(exam,id){
  const years=[...(index.get(exam+'-'+id)?.keys()||[])];
  return {count:years.length,years};
 }
 function questionsFor(exam,year,id){
  return index.get(exam+'-'+id)?.get(year)||[];
 }
 return {reports,evidence,entry,questionsFor};
});
