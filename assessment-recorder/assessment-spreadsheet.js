/* Populate the styled workbook template locally; pupil text is always literal text. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.AssessmentSpreadsheet=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const xml=value=>String(value??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
  function cell(address,style,value){
    const attributes=`r="${address}" s="${style}"`;
    if(value===''||value==null) return `<x:c ${attributes}/>`;
    if(typeof value==='number'&&Number.isFinite(value)) return `<x:c ${attributes} t="n"><x:v>${value}</x:v></x:c>`;
    return `<x:c ${attributes} t="inlineStr"><x:is><x:t xml:space="preserve">${xml(value)}</x:t></x:is></x:c>`;
  }
  async function create(JSZip,template,rows,{className='',assessmentName=''}={}){
    if(!rows.length||rows.some(row=>row.length!==9)) throw Error('The assessment spreadsheet data is incomplete.');
    const zip=await JSZip.loadAsync(template);
    const sheetPath='xl/worksheets/sheet1.xml';
    let sheet=await zip.file(sheetPath).async('string');
    const data=rows.slice(1);
    const lastRow=Math.max(6,5+data.length);
    const patterns=[6,7].map(row=>{
      const pattern=sheet.match(new RegExp(`<x:row r="${row}"[^>]*>[\\s\\S]*?</x:row>`))?.[0];
      const styles=Array.from(pattern?.matchAll(/<x:c r="([A-I])\d+" s="(\d+)"/g)||[],match=>match[2]);
      if(styles.length!==9) throw Error('The spreadsheet template could not be read. Refresh and try again.');
      return styles;
    });
    const headers=Array.from(sheet.matchAll(/<x:row r="([1-5])"[^>]*>[\s\S]*?<\/x:row>/g),match=>match[0]);
    const body=(data.length?data:[Array(9).fill('')]).map((row,index)=>{
      const number=index+6;
      return `<x:row r="${number}" ht="26" customHeight="1">${row.map((value,column)=>cell(`${String.fromCharCode(65+column)}${number}`,patterns[index%2][column],value)).join('')}</x:row>`;
    }).join('');
    sheet=sheet.replace(/<x:sheetData>[\s\S]*?<\/x:sheetData>/,`<x:sheetData>${headers.join('')}${body}</x:sheetData>`);
    sheet=sheet.replace(/<x:c r="A3" s="(\d+)"[^>]*>[\s\S]*?<\/x:c>/,(_,style)=>cell('A3',style,`${className} · ${assessmentName}`));
    sheet=sheet.replace(/sqref="([EHI])6:[EHI]7"/g,(_,column)=>`sqref="${column}6:${column}${lastRow}"`);
    zip.file(sheetPath,sheet);
    const tablePath='xl/tables/table1.xml';
    const table=await zip.file(tablePath).async('string');
    zip.file(tablePath,table.replaceAll('A5:I7',`A5:I${lastRow}`));
    return zip.generateAsync({type:'uint8array',compression:'DEFLATE'});
  }
  return {create};
});
