(() => {
  'use strict';
  const libraryPath = '/personal/gw19tennantrobert1_glow_sch_uk/Documents/Other/Audio Concept Library/';
  const $ = id => document.getElementById(id);
  const h = React.createElement;
  const levelKeys = {'National 3':'N3','National 4':'N4','National 5':'N5','Higher':'H','Advanced Higher':'AH'};
  const headerRoot=ReactDOM.createRoot($('library-header'));
  function renderHeader() { headerRoot.render(h(window.MLH.AppHeader, {
    icon:'app-icons/audio-concept-library-icon.svg?v=20261102-music-play', title:'Concept Audio Library',
    subtitle:'Browse audio examples of music concepts.',
    profileUsesSharedSettings:false, profileShowLabel:false,
    profileShareUrl:window.location.href,
  })); }
  renderHeader();
  const starPath='m12 3 2.8 5.7 6.3.9-4.5 4.4 1 6.3-5.6-3-5.6 3 1-6.3L2.9 9.6l6.3-.9z';
  const favouriteKey=(concept,file)=>concept.path+'/'+file;
  let favourites=new Set();
  try {
    const stored=JSON.parse(window.localStorage.getItem('mlh-concept-audio-favourites') || '[]');
    if(Array.isArray(stored)) favourites=new Set(stored.filter(value=>typeof value==='string'));
  } catch {}
  // Shared favourites describe the sender's selected view, overriding this device's list.
  try {
    const params=new URLSearchParams(window.location.search);
    const shared=JSON.parse(params.get('favourites') || 'null');
    if(params.get('show')==='favourites' && Array.isArray(shared) && shared.every(key=>typeof key==='string')) favourites=new Set(shared);
  } catch {}
  function FilterMenu({id, title: menuTitle, glyph}) {
    const [open,setOpen] = React.useState(false);
    const [value,setValue] = React.useState($(id).value);
    const anchor = React.useRef(null);
    React.useEffect(() => {
      const close = event => { if (!anchor.current?.contains(event.target)) setOpen(false); };
      const escapeMenu = event => { if(open && event.key==='Escape') {setOpen(false);anchor.current?.querySelector('button')?.focus();} };
      const sync = () => setValue($(id).value);
      document.addEventListener('pointerdown',close);
      document.addEventListener('keydown',escapeMenu);
      $(id).addEventListener('change',sync);
      return () => {document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escapeMenu);$(id).removeEventListener('change',sync);};
    },[id,open]);
    const choose = next => {
      $(id).value=next;setValue(next);setOpen(false);
      const url=new URL(window.location.href);
      url.searchParams.set('level',levelKeys[next] || 'ALL');
      window.history.replaceState(null,'',url);
      $(id).dispatchEvent(new Event('input',{bubbles:true}));
      $(id).dispatchEvent(new Event('change',{bubbles:true}));
      anchor.current?.querySelector('button')?.focus();
    };
    const options = Array.from($(id).options);
    const label = options.find(option=>option.value===value)?.textContent || menuTitle;
    const keyFor = option => id==='library-level' ? levelKeys[option.value] || 'ALL' : option.value || 'ALL';
    const selectedKey = keyFor({value});
    const menuOptions = Object.fromEntries(options.map(option => [keyFor(option), {
      label:option.textContent,
      icon:id==='library-level' && option.value ? undefined : h('img',{src:`ui-icons/${option.value ? glyph : 'show-all'}.svg`,alt:'',className:'h-8 w-8 object-contain'}),
    }]));
    return h('div',{ref:anchor,className:'relative'},
      h(window.MLH.LevelButton,{activeLabel:label,activeLevel:selectedKey,icon:h('img',{src:`ui-icons/${value?'levels':'show-all'}.svg`,alt:'',className:'h-[26px] w-[28px] object-contain scale-[1.06]'}),dataMenuTrigger:true,onClick:()=>setOpen(!open)}),
      open && h(window.MLH.MenuPanel,{title:menuTitle,position:'left-0',dataMenuPanel:true},
        h(window.MLH.LevelMenu,{activeLevel:selectedKey,levels:menuOptions,updateUrl:false,
          onSelect:key=>choose(options.find(option=>keyFor(option)===key).value)})));
  }
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const title = filename => filename.replace(/^\d+\.\s*/, '').replace(/\.[^.]+$/, '');
  const conceptKey = value => value.toLocaleLowerCase().replace(/[^a-z0-9]/g,'');
  const dictionaryNames = new Map();
  for (const concept of window.MUSIC_CONCEPTS.concepts) {
    for (const name of [concept.name, ...concept.aliases]) {
      if (!dictionaryNames.has(conceptKey(name))) dictionaryNames.set(conceptKey(name),concept.name);
    }
  }
  const conceptName = value => dictionaryNames.get(conceptKey(value)) || value;
  function conceptSubtitle(value) {
    if (dictionaryNames.has(conceptKey(value))) return conceptName(value);
    const items=[];
    let start=0, depth=0;
    for (let index=0;index<value.length;index++) {
      if (value[index]==='(') depth++;
      if (value[index]===')') depth--;
      if (value[index]===',' && depth===0 && !/^\s*\d/.test(value.slice(index+1))) {
        items.push(value.slice(start,index).trim());start=index+1;
      }
    }
    items.push(value.slice(start).trim());
    return items.map(item=>conceptName(item).replace(/^([34]|Three|Four) Beats [Ii]n [Tt]he Bar$/, (_,beats)=>`${beats} beats in the bar`)).join(', ');
  }
  const isExample = filename => /^(?:(?:[34] Beats in the Bar|Multiple Concepts) - )?Example(?: \(\d+\))?(?: - |$)/i.test(title(filename));
  const movementLabel = value => value.replace(/\bmvt\./gi, 'm.');
  function excerptInfo(filename, concept) {
    const originalConcept=concepts.find(item=>item.path===concept.path) || concept;
    const metadata=originalConcept.fileMeta?.[filename];
    const beatCount=title(filename).match(/^([234]) Beats in the Bar - /i)?.[1];
    const displayConcepts = values => values.map(value => beatCount && /^2, 3 or 4 beats in the bar$/i.test(value) ? `${beatCount} beats in the bar` : value).join(', ');
    if (metadata && Array.isArray(metadata.concepts) && typeof metadata.title==='string') {
      const heading=metadata.title==='Example' ? `Unnamed ${originalConcept.files.filter(isExample).indexOf(filename)+1}` : metadata.title;
      return {heading:movementLabel(heading),artist:metadata.artist || '',subtitle:displayConcepts(metadata.concepts)};
    }
    let name=title(filename), subtitle=concept.concept;
    const beat=name.match(/^([234] Beats in the Bar) - /i);
    if (beat) { subtitle=beat[1]; name=name.slice(beat[0].length); }
    if (concept.concept==='Multiple Concepts') {
      name=name.replace(/^Multiple Concepts - /,'');
      const parts=name.split(' - ');
      const start=parts[0]==='Example' ? 1 : 2;
      let boundary=parts.findIndex((part,index)=>index>=start && concepts.some(c=>part===c.concept || part.startsWith(c.concept+',') || c.concept.startsWith(part+' - ')));
      if (boundary<0) boundary=parts.length-1;
      if (boundary>0) { subtitle=parts.slice(boundary).join(' - '); name=parts.slice(0,boundary).join(' - '); }
    } else if (name.endsWith(concept.concept)) {
      name=name.slice(0,-concept.concept.length).replace(/\s*-\s*$/,'').trim();
    }
    const parts=name.split(' - ');
    let heading=parts.length>1 ? parts.slice(1).join(' - ') : name;
    const artist=!isExample(filename) && parts.length>1 && !/^Piano Demonstrations?$/i.test(parts[0]) ? parts[0] : ''; 
    if (isExample(filename)) {
      const original=concepts.find(item=>item.path===concept.path) || concept;
      const examples=original.files.filter(isExample);
      heading=`Unnamed ${examples.indexOf(filename)+1}`;
    }
    return {heading:movementLabel(heading || 'Example'), artist, subtitle:Array.isArray(metadata?.concepts) ? displayConcepts(metadata.concepts) : conceptSubtitle(subtitle)};
  }
  // These credits name the source musical rather than a recording artist.
  const musicalCredits = new Set([
    '& Juliet', '42nd Street', 'Aladdin', 'All Shook Up', 'Annie',
    'Beauty And The Beast', 'Billy Elliot', 'Cats', 'Chicago', 'Company', 'Elf',
    'Fiddler on the Roof', 'Finian’s Rainbow', 'Frozen', 'Grease', 'Guys And Dolls',
    'Gypsy', 'Hairspray', 'Hamilton', 'Heathers', 'Jesus Christ Superstar',
    'Kiss of the Spider Woman', 'Legally Blonde', 'Legally Blonde The Musical',
    'Les Miserables', 'Little Shop Of Horrors', 'Made In Dagenham', 'Mamma Mia!',
    'Mary Poppins Returns', 'Me And My Girl', 'Miss Saigon', "Monty Python's Spamalot",
    'My Fair Lady', 'Oliver!', 'Pippin', 'Puttin’ On The Ritz', 'Rent',
    'School Of Rock', 'Selections From Carousel', 'Shrek', 'Sister Act', 'Six',
    'Sweeney Todd', 'Tangled', 'The Lion King', 'The Phantom Of The Opera',
    'The Rink', 'The Sound Of Music', 'The Wizard Of Oz', 'West Side Story', 'Wicked',
  ].map(name=>name.toLocaleLowerCase()));
  function isUnattributedArtist(artist) {
    return !artist || /^Piano demonstrations?$/i.test(artist.trim());
  }
  function publicSearchText(value) {
    return String(value || '').replace(/\bPiano demonstrations?\b/gi,' ');
  }
  function artistLabel(artist) {
    if (isUnattributedArtist(artist)) return '–';
    if (/^\[?anonymous\]?$/i.test(artist.trim())) return '<em>Anonymous</em>';
    return `<a class="library-artist-link" href="?artist=${encodeURIComponent(artist)}" data-library-artist="${escape(artist)}">${musicalCredits.has(artist.toLocaleLowerCase()) ? '<em>From</em> ' : ''}${escape(artist)}</a>`;
  }
  function excerptLabel(filename, concept) {
    const {heading,subtitle,artist}=excerptInfo(filename,concept);
    const artwork = !isExample(filename) && window.CONCEPT_AUDIO_ARTWORK?.artists[artist];
    const available = artwork && artwork.kind !== 'placeholder';
    const poster = available && artwork.kind === 'poster';
    const alt = available ? (poster ? 'Poster for ' : 'Portrait of ') + artist : '';
    const image = `<img class="library-artwork${available ? poster ? ' library-artwork-poster' : '' : ' library-artwork-placeholder'}" src="${escape(available ? artwork.src : 'ui-icons/assessment-cover-quavers.svg')}" alt="${escape(alt)}" loading="lazy" decoding="async" data-library-artwork style="object-position:${escape(artwork?.position || '50% 35%')}" />`;
    const imageCell = available && artwork.sourceUrl ? `<a class="library-artwork-wrap" href="${escape(artwork.sourceUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(alt+' — image source (opens in a new tab)')}" title="${escape(alt+' · '+(artwork.credit || 'Artist portrait')+' · '+(artwork.license || 'See image source for attribution'))}">${image}</a>` : `<span class="library-artwork-wrap">${image}</span>`;
    const saved=favourites.has(favouriteKey(concept,filename));
    const star=`<button type="button" class="library-favourite" data-favourite-key="${escape(favouriteKey(concept,filename))}" aria-pressed="${saved}" aria-label="${escape((saved?'Remove ':'Add ')+heading+(saved?' from':' to')+' favourites')}" title="${saved?'Remove from favourites':'Add to favourites'}"><svg viewBox="0 0 24 24" width="22" height="22" fill="${saved?'currentColor':'none'}" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="${starPath}"/></svg></button>`;
    return `<div class="library-excerpt-heading">${imageCell}<span class="library-excerpt-label"><a class="library-excerpt-link" href="${escape(fileUrl(concept,filename))}" target="_blank" rel="noopener noreferrer">${escape(heading || 'Example')}</a><span class="library-excerpt-concepts">${escape(subtitle)}</span></span>${star}</div>`;
  }
  const fileUrl = (concept, file) => {
    const url = new URL('https://glowscotland-my.sharepoint.com/my');
    url.searchParams.set('id', libraryPath + concept.path + '/' + file);
    url.searchParams.set('parent', libraryPath + concept.path);
    return url.href;
  };
  const downloadUrl = (concept,file) => {
    const url=new URL('https://glowscotland-my.sharepoint.com/personal/gw19tennantrobert1_glow_sch_uk/_layouts/15/download.aspx');
    const path=libraryPath+concept.path+'/'+file;
    url.searchParams.set('SourceUrl',path);
    return url.href;
  };
  let catalogueScrollPosition=0;
  let catalogueQuery='';
  const sharedSort=new URLSearchParams(window.location.search);
  let excerptSort={key:['name','artist','duration','size','level'].includes(sharedSort.get('sort')) ? sharedSort.get('sort') : 'name',direction:sharedSort.get('direction')==='-1' ? -1 : 1};
  const durationLabel = seconds => Number.isFinite(seconds) ? `${Math.floor(Math.round(seconds)/60)}:${String(Math.round(seconds)%60).padStart(2,'0')}` : '–';
  const sizeLabel = bytes => Number.isFinite(bytes) ? bytes>=1000000 ? `${(bytes/1000000).toFixed(2)} MB` : `${(bytes/1000).toFixed(1)} KB` : '–';
  const countLabel = (count,singular) => `${count.toLocaleString()} ${singular}${count===1 ? '' : 's'}`;
  let concepts = [], selectedPath = new URLSearchParams(window.location.search).get('concept');
  let selectedArtist = new URLSearchParams(window.location.search).get('artist') || '';
  const artistHistory=[];
  let favouritesReturnView=null;
  const sameArtist = (a,b) => a.trim().toLocaleLowerCase()===b.trim().toLocaleLowerCase();
  function rememberArtistView() {
    artistHistory.push({path:selectedPath,artist:selectedArtist,level:$('library-level').value,query:$('library-search').value,scroll:window.scrollY});
  }
  function searchTerms(value) {
    // Keep commas inside recognised names, such as Simple time (2/4, 3/4 and 4/4).
    return value.split('+').flatMap(group=>{
      const parts=group.split(',').map(part=>part.trim());
      const terms=[];
      for(let start=0;start<parts.length;) {
        let end=parts.length;
        while(end>start+1 && !dictionaryNames.has(conceptKey(parts.slice(start,end).join(', ')))) end--;
        const term=parts.slice(start,end).join(', ');
        if(term) terms.push(term);
        start=end;
      }
      return terms;
    });
  }
  function render() {
    const query = $('library-search').value.trim().toLocaleLowerCase();
    const level = $('library-level').value;
    $('library-level').dispatchEvent?.(new Event('change'));
    const detailView=Boolean(selectedPath || selectedArtist);
    if(detailView) $('library-favourites').value='';
    const favouritesOnly=$('library-favourites').value==='favourites';
    $('library-favourites-button').hidden=detailView;
    $('library-favourites-button').setAttribute('aria-pressed',String(favouritesOnly));
    const favouritesSelected=favouritesOnly && !selectedPath && !selectedArtist;
    const artistSelected=Boolean(selectedArtist && !selectedPath);
    const multipleSelected=selectedPath==='multiple-concepts';
    const terms=searchTerms(query);
    const matches = concepts.filter(c => (multipleSelected ? c.category==='Multiple Concepts' : (selectedArtist || favouritesOnly) && !selectedPath ? true : c.category!=='Multiple Concepts') && (!level || c.level === level) && (!selectedPath || multipleSelected || c.path===selectedPath)).map(c => {
      const conceptMatches = `${c.concept} ${c.level} ${c.category}`.toLocaleLowerCase().includes(query);
      const artistFiles=c.files.filter(f=>{
        if(favouritesOnly && !favourites.has(favouriteKey(c,f))) return false;
        if(selectedArtist && !sameArtist(excerptInfo(f,c).artist,selectedArtist)) return false;
        return true;
      });
      const files = !query || conceptMatches ? artistFiles : artistFiles.filter(f => {
        const info=excerptInfo(f,c);
        const text=[title(f),info.heading,isUnattributedArtist(info.artist) ? '' : info.artist,info.subtitle].map(publicSearchText).join(' ').toLocaleLowerCase();
        if(!multipleSelected) return text.includes(query);
        const tags=new Set((c.fileMeta?.[f]?.concepts || []).map(name=>conceptKey(conceptName(name))));
        return terms.every(term=>dictionaryNames.has(conceptKey(term)) ? tags.has(conceptKey(conceptName(term))) : text.includes(term));
      });
      return {...c, files, conceptMatches};
    }).filter(c => (!(selectedArtist || favouritesOnly) || selectedPath || c.files.length) && (multipleSelected || c.path===selectedPath || !query || c.conceptMatches || c.files.length));
    matches.sort((a,b) => (!level ? Object.keys(levelKeys).indexOf(a.level)-Object.keys(levelKeys).indexOf(b.level) : 0) || conceptName(a.concept).localeCompare(conceptName(b.concept)) || a.path.localeCompare(b.path));
    const selected = favouritesSelected ? {concept:'Favourites',files:matches.flatMap(c=>c.files)} : artistSelected ? {concept:selectedArtist,files:matches.flatMap(c=>c.files)} : multipleSelected ? {path:'multiple-concepts',concept:'Multiple Concepts',files:matches.flatMap(c=>c.files)} : matches.find(c => c.path === selectedPath);
    const showLevels=(multipleSelected || artistSelected || favouritesSelected) && !level;
    const pageUrl=new URL(window.location.href);
    pageUrl.searchParams.set('level',levelKeys[level] || 'ALL');
    if (selected?.path) pageUrl.searchParams.set('concept',selected.path);
    else pageUrl.searchParams.delete('concept');
    if(selectedArtist) pageUrl.searchParams.set('artist',selectedArtist);
    else pageUrl.searchParams.delete('artist');
    if(favouritesOnly) {
      pageUrl.searchParams.set('show','favourites');
      pageUrl.searchParams.set('favourites',JSON.stringify([...favourites]));
    } else {
      pageUrl.searchParams.delete('show');
      pageUrl.searchParams.delete('favourites');
    }
    pageUrl.searchParams.delete('includes');
    pageUrl.searchParams.delete('search');
    if(query) pageUrl.searchParams.set('search',$('library-search').value.trim());
    pageUrl.searchParams.set('sort',excerptSort.key);
    pageUrl.searchParams.set('direction',String(excerptSort.direction));
    window.history.replaceState(null,'',pageUrl);
    renderHeader();
    $('library-level-menu').hidden=Boolean(selectedPath || selectedArtist);
    $('library-back-control').hidden=!(selectedPath || selectedArtist);
    $('library-concept-title').hidden=!(selected || selectedArtist);
    $('library-concept-title').textContent=selected ? conceptName(selected.concept) : selectedArtist;
    const recordings = matches.reduce((sum,c) => sum+c.files.length,0);
    $('library-count').textContent = selected ? countLabel(selected.files.length,'excerpt') : `${countLabel(matches.length,'concept')} · ${countLabel(recordings,'excerpt')}`;
    $('library-search').placeholder = $('library-count').textContent;
    $('library-search').setAttribute('title',multipleSelected ? 'Separate concepts with a comma or +, for example Swing, Syncopation' : '');
    $('library-search').setAttribute('aria-label',selected ? `Search ${conceptName(selected.concept)}` : 'Search concepts, songs or artists');
    if (selected) {
      const files=(multipleSelected || artistSelected || favouritesSelected ? matches : [selected]).flatMap(concept=>concept.files.map(file=>({file,concept,...(concept.fileMeta?.[file] || {})}))).map((item,index)=>({...item,index}));
      if (excerptSort.key) files.sort((a,b)=>{
        if (excerptSort.key==='name' || excerptSort.key==='artist') {
          const field=excerptSort.key==='name' ? 'heading' : 'artist';
          const av=excerptInfo(a.file,a.concept)[field],bv=excerptInfo(b.file,b.concept)[field];
          if (!av || !bv) return av ? -1 : bv ? 1 : a.index-b.index;
          return excerptSort.direction*av.localeCompare(bv,undefined,{numeric:true}) || a.index-b.index;
        }
        if (excerptSort.key==='level') {
          const order=Object.keys(levelKeys);
          return excerptSort.direction*(order.indexOf(a.concept.level)-order.indexOf(b.concept.level)) || excerptInfo(a.file,a.concept).heading.localeCompare(excerptInfo(b.file,b.concept).heading,undefined,{numeric:true}) || a.index-b.index;
        }
        const av=a[excerptSort.key],bv=b[excerptSort.key];
        if (!Number.isFinite(av)) return Number.isFinite(bv) ? 1 : a.index-b.index;
        if (!Number.isFinite(bv)) return -1;
        return excerptSort.direction*(av-bv) || a.index-b.index;
      });
      const columns=[['name','Title'],['artist','Artist'],['duration','Duration'],['size','Size'],...(showLevels ? [['level','Level']] : [])];
      $('library-results').innerHTML = `<div class="mc-table-wrap"><table class="mc-table library-excerpt-table${showLevels ? ' library-excerpt-levels' : ''}"><caption class="sr-only">${escape(conceptName(selected.concept))} excerpts</caption><thead><tr><th scope="col" class="library-number-column"><span class="sr-only">Number</span></th>${columns.map(([key,label])=>`<th scope="col"${key==='level' ? ' class="library-level-heading"' : ''} aria-sort="${excerptSort.key===key ? excerptSort.direction===1 ? 'ascending' : 'descending' : 'none'}"><button type="button" data-excerpt-sort="${key}" aria-label="Sort by ${label}">${label}<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${excerptSort.key===key ? excerptSort.direction===1 ? 'M12 19V5m-5 5 5-5 5 5' : 'M12 5v14m-5-5 5 5 5-5' : 'M8 19V5m-4 4 4-4 4 4m4-4v14m-4-4 4 4 4-4'}"/></svg></button></th>`).join('')}<th scope="col" class="library-download-heading">Download</th></tr></thead><tbody>${files.length ? files.map((item,index)=>`<tr><td class="library-number-column">${index+1}</td><td>${excerptLabel(item.file,item.concept)}</td><td>${artistLabel(excerptInfo(item.file,item.concept).artist)}</td><td>${durationLabel(item.duration)}</td><td>${sizeLabel(item.size)}</td>${showLevels ? `<td class="library-excerpt-level"><span class="mc-level-badge" title="${escape(item.concept.level)}" aria-label="${escape(item.concept.level)}">${escape(levelKeys[item.concept.level])}</span></td>` : ''}<td><a class="library-download" href="${escape(downloadUrl(item.concept,item.file))}" target="_blank" rel="noopener noreferrer" aria-label="${escape('Download '+excerptInfo(item.file,item.concept).heading)}"><img src="ui-icons/audio-library-download.svg" alt="" aria-hidden="true" /></a></td></tr>`).join('') : `<tr><td colspan="${showLevels ? 7 : 6}">${query ? artistSelected ? 'No matching excerpts for this artist. Try another search.' : multipleSelected && terms.length>1 ? 'No excerpts feature all these concepts. Remove a concept or try another search.' : 'No matching excerpts in this concept. Try another search.' : favouritesOnly ? 'No favourites here yet.' : 'No excerpts catalogued yet.'}</td></tr>`}</tbody></table></div>`;
      return;
    }
    const categories = ['Styles','Melody and Harmony','Rhythm and Tempo','Texture, Structure and Form','Timbre'];
    $('library-results').innerHTML = matches.length ? `<div class="mc-table-wrap"><table class="mc-table"><caption class="sr-only">Audio concepts grouped by musical element</caption><thead><tr>${categories.map((category,index)=>`<th scope="col">${escape(window.MUSIC_CONCEPTS.categories[index])}</th>`).join('')}</tr></thead><tbody><tr>${categories.map(category=>`<td><ul>${matches.filter(c=>c.category===category).map(c=>`<li><a class="mc-levelled-link" href="?level=${escape(levelKeys[level] || 'ALL')}&amp;concept=${encodeURIComponent(c.path)}" data-concept-path="${escape(c.path)}"><span class="mc-concept-name">${escape(conceptName(c.concept))}</span>${!level ? `<span class="mc-link-badges"><span class="mc-level-badge" title="${escape(c.level)}" aria-label="${escape(c.level)}">${escape({'National 3':'N3','National 4':'N4','National 5':'N5','Higher':'H','Advanced Higher':'AH'}[c.level])}</span></span>` : ''}</a></li>`).join('')}</ul></td>`).join('')}</tr></tbody></table></div>` : '<p class="library-empty">No matching concepts or recordings. Try another search or choose a different level.</p>';
    if (concepts.some(c=>c.category==='Multiple Concepts' && (!level || c.level===level))) {
      $('library-results').insertAdjacentHTML('beforeend', `<div class="library-multiple-link">For excerpts featuring multiple concepts, click <a href="?level=${escape(levelKeys[level] || 'ALL')}&amp;concept=multiple-concepts" data-concept-path="multiple-concepts">here</a>.</div>`);
    }
  }
  $('library-favourites-button').addEventListener('click',()=>{
    if($('library-favourites').value==='favourites') {
      $('library-favourites').value='';
      const previous=favouritesReturnView;
      selectedPath=previous?.path || null;selectedArtist=previous?.artist || '';
      $('library-level').value=previous?.level || '';$('library-search').value=previous?.query || '';
      favouritesReturnView=null;render();window.scrollTo({top:previous?.scroll || 0,behavior:'instant'});
    } else {
      favouritesReturnView={path:selectedPath,artist:selectedArtist,level:$('library-level').value,query:$('library-search').value,scroll:window.scrollY};
      $('library-favourites').value='favourites';selectedPath=null;selectedArtist='';
      $('library-level').value='';$('library-search').value='';excerptSort={key:'name',direction:1};
      render();window.scrollTo({top:0,behavior:'instant'});
    }
  });
  $('library-filters').addEventListener('submit', e => e.preventDefault());
  $('library-results').addEventListener('error', event => {
    const image=event.target;
    if (!image.hasAttribute?.('data-library-artwork') || image.src.endsWith('/ui-icons/assessment-cover-quavers.svg')) return;
    image.className='library-artwork library-artwork-placeholder'; image.alt=''; image.src='ui-icons/assessment-cover-quavers.svg';
  }, true);
  $('library-filters').addEventListener('input', event => { if(event.target.id==='library-level') selectedPath=null; render(); });
  $('library-results').addEventListener('click', event => {
    const favourite=event.target.closest('[data-favourite-key]');
    if(favourite) {
      const key=favourite.dataset.favouriteKey;
      if(favourites.has(key)) favourites.delete(key);else favourites.add(key);
      try {window.localStorage.setItem('mlh-concept-audio-favourites',JSON.stringify([...favourites]));} catch {}
      render();
      Array.from($('library-results').querySelectorAll('[data-favourite-key]')).find(button=>button.dataset.favouriteKey===key)?.focus({preventScroll:true});
      return;
    }
    const artist=event.target.closest('[data-library-artist]');
    if(artist) {
      if(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();rememberArtistView();
      selectedArtist=artist.dataset.libraryArtist;selectedPath=null;
      $('library-level').value='';$('library-search').value='';
      render();$('library-back').focus({preventScroll:true});
      window.scrollTo({top:0,behavior:'instant'});return;
    }
    const sort=event.target.closest('[data-excerpt-sort]');
    if (sort) {
      const key=sort.dataset.excerptSort;
      excerptSort={key,direction:excerptSort.key===key ? -excerptSort.direction : 1};
      render();
      $('library-results').querySelector(`[data-excerpt-sort="${key}"]`).focus({preventScroll:true});
      return;
    }
    const concept = event.target.closest('[data-concept-path]');
    if (concept) {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if(selectedArtist) {rememberArtistView();$('library-level').value=concept.dataset.conceptLevel || ''; }
      catalogueScrollPosition=window.scrollY;
      catalogueQuery=$('library-search').value;
      $('library-search').value='';
      excerptSort={key:'name',direction:1};
      selectedPath=concept.dataset.conceptPath;
      render();
      $('library-back').focus({preventScroll:true});
      window.scrollTo({top:0,behavior:'instant'});
    }
  });
  $('library-back').addEventListener('click', () => {
    if(artistHistory.length) {
      const previous=artistHistory.pop();selectedPath=previous.path;selectedArtist=previous.artist;
      $('library-level').value=previous.level;$('library-search').value=previous.query;
      render();window.scrollTo({top:previous.scroll,behavior:'instant'});return;
    }
    if(selectedArtist) {
      if(selectedPath) selectedPath=null;else selectedArtist='';
      $('library-level').value='';$('library-search').value='';render();
      window.scrollTo({top:0,behavior:'instant'});return;
    }
    const previousPath=selectedPath;
    $('library-search').value=catalogueQuery;
    selectedPath=null;render();
    Array.from($('library-results').querySelectorAll('[data-concept-path]')).find(link=>link.dataset.conceptPath===previousPath)?.focus({preventScroll:true});
    window.scrollTo({top:catalogueScrollPosition,behavior:'instant'});
  });
  fetch('audio-concept-library-data.json?v=2e677102ba8d', {cache:'reload'}).then(response => {
    if (!response.ok) throw new Error('Catalogue unavailable');
    return response.json();
  }).then(data => {
    concepts=data.concepts;
    if(selectedPath && selectedPath!=='multiple-concepts' && !concepts.some(c=>c.path===selectedPath)) selectedPath=null;
    for (const [id, key] of [['library-level','level']]) {
      [...new Set(concepts.map(c=>c[key]))].forEach(value => $(id).add(new Option(value,value)));
    }
    $('library-level').value=Object.keys(levelKeys).find(level=>levelKeys[level]===new URLSearchParams(window.location.search).get('level')) || '';
    if(selectedArtist && !selectedPath) $('library-level').value='';
    const selectedConcept=concepts.find(c=>c.path===selectedPath);
    if(selectedConcept?.category==='Multiple Concepts') {
      selectedPath='multiple-concepts';
      $('library-level').value=selectedConcept.level;
      const url=new URL(window.location.href);
      url.searchParams.set('level',levelKeys[selectedConcept.level]);
      window.history.replaceState(null,'',url);
    }
    if(selectedConcept && $('library-level').value && $('library-level').value!==selectedConcept.level) {
      $('library-level').value=selectedConcept.level;
      const url=new URL(window.location.href);
      url.searchParams.set('level',levelKeys[selectedConcept.level]);
      window.history.replaceState(null,'',url);
    }
    const params=new URLSearchParams(window.location.search);
    $('library-search').value=params.get('search') || (selectedPath==='multiple-concepts' ? params.getAll('includes').map(conceptName).join(' + ') : '');
    $('library-favourites').value=new URLSearchParams(window.location.search).get('show')==='favourites' ? 'favourites' : '';
    $('library-favourites-button').disabled=false;
    $('library-search').disabled=false;
    for (const [id, title, glyph] of [['library-level','Level','levels']]) {
      ReactDOM.createRoot($(id+'-menu')).render(h(FilterMenu,{id,title,glyph}));
    }
    render();
  }).catch(() => { $('library-count').textContent='The catalogue could not be loaded.'; $('library-search').placeholder='Library unavailable'; $('library-search').disabled=true; $('library-results').innerHTML='<p class="library-empty" role="alert">The catalogue could not be loaded. Refresh the page to try again.</p>'; });
})();
