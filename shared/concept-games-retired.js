/* Retired game picker: keep bookmarks useful at the relocated activities. */
(()=>{
 const current=new URL(location.href),q=current.searchParams,id=q.get('activity')||'';
 const entry=window.IGActivityIndex?.find(a=>a.id===id),game=q.get('game')||entry?.template||'';
 const level=['N3','N4','N5','H','AH'].includes(q.get('level'))?q.get('level'):'N3';
 let page='./conceptsort.html';
 if(game==='rank-order'||/-order-\d+$/.test(id))page=/rhythm-lengths|music-literacy/.test(id)?'./rhythmsums.html':'./conceptquiz.html';
 if(['quiz','match-up','true-or-false','complete-the-sentence'].includes(game))page='./conceptquiz.html';
 const label=window.MusicDictionaryLabelData?.games.find(g=>g.id===id);
 if(game==='labelled-diagram'||label)page=label?'./music-dictionary/musicdictionaryconcept.html':'./music-dictionary/musicdictionary.html';
 const target=new URL(page,document.baseURI);target.searchParams.set('level',level);
 if(page==='./conceptsort.html'){target.search=current.search;target.hash=current.hash;target.searchParams.delete('game');}
 if(page==='./rhythmsums.html')target.searchParams.set('mode','order');
 if(page==='./conceptquiz.html'&&(game==='rank-order'||/-order-\d+$/.test(id)))target.searchParams.set('formats','order');
 if(label){target.searchParams.set('concept',label.conceptIds[0]);target.searchParams.set('label',id);}
 location.replace(target.href);
})();
