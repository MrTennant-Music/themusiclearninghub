(async () => {
  if(window.IGStartupReady){try{await window.IGStartupReady;}catch(error){const root=document.getElementById('root');root.textContent=error.message;const reload=document.createElement('button');reload.textContent='Reload';reload.onclick=()=>location.reload();root.appendChild(reload);return;}}
  const {
      useState,
      useEffect,
      useRef
    } = React,
    C = window.IGCore;
  const userActivityCollectionsEnabled = false;
  const appConfig = window.MLHMusicGames?.apps[document.body.dataset.gameApp] || null;
  const fixedGame = appConfig?.templates.length === 1 ? appConfig.templates[0] : '';
  const isConceptSort = fixedGame === 'group-sort';
  const isCollectionGame = isConceptSort || ['crossword', 'wordsearch'].includes(fixedGame);
  const isWordPuzzle = ['crossword', 'wordsearch'].includes(fixedGame);
  const requestedSort = isConceptSort ? new URLSearchParams(location.search) : null;
  const legacySortEditor = requestedSort?.get('create') === '1'
    ? { id: requestedSort.get('editSort') } : null;
  const initialSortEditor = isConceptSort ? legacySortEditor || history.state?.sortEditor || null : null;
  if (legacySortEditor) {
    const url = new URL(location.href);
    url.searchParams.delete('create');
    url.searchParams.delete('editSort');
    const { collectionDraft, ...state } = history.state || {};
    history.replaceState({ ...state, sortEditor: initialSortEditor, sortEditorDraft: collectionDraft }, '', url);
  }
  if (requestedSort?.has('builtInCollection') || requestedSort?.has('myCollection') || requestedSort?.has('collections')) {
    const url = new URL(location.href);
    for (const key of ['builtInCollection', 'myCollection', 'collectionCatalogueLevel', 'collections']) {
      url.searchParams.delete(key);
    }
    history.replaceState(history.state, '', url);
  }
  if (isConceptSort && requestedSort.get('source') === 'hub' && requestedSort.has('activity') && !C.SEEDS.some(activity => activity.id === requestedSort.get('activity'))) {
    const target = new URL('./conceptsort.html', document.baseURI);
    target.searchParams.set('level', C.qualificationLevels.includes(requestedSort.get('level')) ? requestedSort.get('level') : 'N3');
    location.replace(target.href);
    return;
  }
  const connectionsPractice = appConfig?.id === 'connections' && !new URLSearchParams(location.search).has('collections') && (!new URLSearchParams(location.search).has('activity') || new URLSearchParams(location.search).get('practice') === '1' || /^(?:hub|generated)-(?:n[345]|h|ah)-connections-/.test(new URLSearchParams(location.search).get('activity') || '') || C.SEEDS.some(a => a.id === new URLSearchParams(location.search).get('activity') && a._builtin && window.MLHGameCollections.visibleInLibrary(a))) && !/^#(?:playnote|activity)=/.test(location.hash);
  const sortPractice = isConceptSort && !requestedSort.has('activity') && !/^#(?:playnote|activity)=/.test(location.hash);
  const wordPuzzlePractice = isWordPuzzle && !new URLSearchParams(location.search).has('activity') && !/^#(?:playnote|activity)=/.test(location.hash);
  const wordPuzzleParams = new URLSearchParams(location.search);
  const literacyScope = wordPuzzlePractice && wordPuzzleParams.get('literacy');
  const hasLiteracyScope = literacyScope === 'level' || literacyScope === 'cumulative';
  const requestedWordCategory = wordPuzzleParams.get('category');
  const initialWordCategory = hasLiteracyScope ? 5 : /^[0-4]$/.test(requestedWordCategory) ? Number(requestedWordCategory) : null;
  const WordPuzzleCollectionsContext = React.createContext(null);
  const playerPage = document.body.dataset.igPage === 'player' || connectionsPractice || wordPuzzlePractice || sortPractice || Boolean(appConfig && (new URLSearchParams(location.search).has('activity') || /^#(?:playnote|activity)=/.test(location.hash)));
  const catalogueHref = appConfig?.href || "./conceptsort.html";
  const publicTitle = appConfig?.title || 'Concept Sort';
  const initialView = isConceptSort && !initialSortEditor && window.MLHSort.factsEnabled && history.state?.playnoteView==='facts' ? 'facts' : playerPage ? 'activity' : fixedGame && history.state?.playnoteView === 'collection' && history.state?.collectionDraft?.collectionEdition === window.MLHGameCollections.collectionEdition ? 'collection' : 'library';
  const clone = x => JSON.parse(JSON.stringify(x));
  const template = id => C.TEMPLATES.find(t => t.id === id) || C.TEMPLATES[0];
  const stamp = s => new Date(s).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  function Artwork({
    id,
    activity,
    compact = false,
    catalogue = false
  }) {
    return <span className={`ig-template-art ${compact ? 'is-compact' : ''} ${compact || catalogue ? 'is-silhouette' : ''}`} aria-hidden="true">{(compact || catalogue) && window.IGTemplateSilhouette ? <window.IGTemplateSilhouette id={id} /> : window.IGTemplateArt ? <window.IGTemplateArt id={id} activity={activity} compact={compact} /> : <img src="./ui-icons/quiz.svg" alt="" style={{
        width: 32,
        height: 32
      }} />}</span>;
  }
  
  function readFavouriteIds(storage) {
    try {
      const value = JSON.parse(storage.getItem('ig-favourites') || '[]');
      return Array.isArray(value) ? [...new Set(value.filter(id => typeof id === 'string' && id))] : [];
    } catch {
      return [];
    }
  }
  function toggleFavouriteId(ids, id) {
    return ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id];
  }
  const classroomSeed = window.MLH.classroomActivities?.seed(location.search) ?? null;
  const classroomRace = window.MLH.classroomActivities?.isRace?.(location.search);
  const retryRace = window.MLH.classroomActivities?.isRetryRace?.();
  const classroomPractice = classroomSeed !== null && new URLSearchParams(location.search).has('classroomPractice');
  const classroomProgress = window.MLH.classroomActivities?.progressStorage?.();
  const showPracticeControls = classroomSeed === null || classroomPractice;
  const activityHasAudio = activity => activity?.sortRecipe?.type === 'styles' ||
    activity?.items?.some(item => item.media?.type === 'audio' || item.answerMedia?.type === 'audio');
  const classroomShuffle = classroomSeed === null ? C.shuffle
    : items => C.shuffle(items, window.MLH.classroomActivities.random(classroomSeed));
  function ActivityCard({
    activity,
    saved,
    favourite,
    onFavourite,
    onOpen,
    onDragActivity,
    onDragActivityEnd
  }) {
    return <div className="ig-activity-card" draggable={saved} onDragStart={event => {
      if (!saved || event.target.closest('.ig-activity-actions')) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('application/x-playnote-activity', activity.id);
      onDragActivity(activity.id);
    }} onDragEnd={onDragActivityEnd}><button type="button" className="ig-activity-open" aria-label={`Open ${activity.title}`} onClick={() => onOpen(activity)} /><div className="ig-activity-copy"><h3>{activity.title}</h3><div className="ig-activity-meta-row"><span className="ig-activity-format"><span className={`ig-activity-type-badge${activity.specialMode === 'level-test' ? ' ig-level-test-badge' : ''}`}><span className="ig-library-game-icon"><window.IGTemplateSilhouette id={activity.template} /></span><span>{template(activity.template).name}</span></span><span className="ig-activity-details">{['N3', 'N4', 'N5', 'H', 'AH'].includes(activity.level) && <span className="ig-level-symbol ig-activity-level-symbol" aria-label={`Level ${activity.level}`}>{activity.level}</span>}{saved && <time className="ig-activity-level-symbol ig-activity-date" dateTime={activity.updatedAt}>{new Date(activity.updatedAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                  timeZone: 'Europe/London'
                }).replaceAll('/', '.')}</time>}</span></span><div className="ig-activity-actions"><button type="button" className="ig-activity-favourite" aria-label={`${favourite ? 'Remove' : 'Add'} ${activity.title} ${favourite ? 'from' : 'to'} favourites`} aria-pressed={Boolean(favourite)} title={favourite ? 'Remove from favourites' : 'Add to favourites'} onClick={() => onFavourite(activity.id)}><svg viewBox="0 0 24 24" width="22" height="22" fill={favourite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 2.8 5.7 6.3.9-4.5 4.4 1 6.3-5.6-3-5.6 3 1-6.3L2.9 9.6l6.3-.9z" /></svg></button></div></div></div></div>;
  }
  function Modal({
    title,
    onClose,
    children,
    variant,
    hideTitle = false,
    inline = false
  }) {
    const ref = useRef(null);
    useEffect(() => {
      const dialog = ref.current;
      const old = inline ? dialog.closest('.ig-resource-card')?.querySelector('[data-profile-customise]') : document.activeElement;
      const isolated = [];
      if (inline) {
        for (let branch = dialog; branch.parentElement !== document.body; branch = branch.parentElement) {
          for (const sibling of branch.parentElement.children) {
            if (sibling === branch || !(sibling instanceof HTMLElement) || sibling.inert) continue;
            sibling.inert = true;
            isolated.push(sibling);
          }
        }
      }
      dialog.focus({ preventScroll: inline });
      return () => {
        isolated.forEach(element => { element.inert = false; });
        old?.focus?.({ preventScroll: inline });
      };
    }, []);
    const content = <div className={`ig-modal-backdrop ${inline ? 'ig-sort-editor-backdrop' : ''} ${variant === 'qr' ? 'ig-qr-backdrop' : ''} ${variant === 'image-bank' ? 'ig-image-bank-backdrop' : ''}`} onMouseDown={e => {
      if (e.target === e.currentTarget) onClose();
    }}><section ref={ref} className={`ig-modal ${variant === 'qr' ? 'ig-qr-modal' : ''} ${variant === 'delete' ? 'ig-delete-modal' : ''} ${variant === 'folder' ? 'ig-modal-folder' : ''} ${variant === 'image-bank' ? 'ig-image-bank-modal' : ''}`} tabIndex="-1" role="dialog" aria-modal="true" aria-label={title} onKeyDown={e => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'Tab') {
          const f = [...ref.current.querySelectorAll('button,input,select,textarea,a[href]')].filter(n => !n.disabled && n.getClientRects().length);
          if (e.shiftKey && (document.activeElement === f[0] || document.activeElement === ref.current)) {
            e.preventDefault();
            f.at(-1)?.focus();
          } else if (!e.shiftKey && document.activeElement === f.at(-1)) {
            e.preventDefault();
            f[0]?.focus();
          }
        }
      }}>{!inline && <button className="ig-modal-close" aria-label="Close" onClick={onClose}>{"\xD7"}</button>}{!hideTitle && <h2>{title}</h2>}{children}</section></div>;
    return inline ? content : ReactDOM.createPortal(content, document.fullscreenElement || document.body);
  }
  function GameToolbar({
    activity,
    mode,
    onRestart,
    onLevel,
    levels,
    onSkip,
    onCustomise,
    sortLevel,
    classroomPractice = false
  }) {
    const generatedSort=activity.tags?.includes('generated-sort');
    const savedSort = fixedGame === 'group-sort' && !generatedSort;
    const showTitle = !onSkip && !generatedSort && !activity.tags?.includes('random-' + fixedGame);
    const collectionLevel = sortLevel ?? activity.level;
    const clearLink = showTitle && !classroomPractice && window.HubCollections?.clearCollectionLink(activity.title, collectionLevel);
    const collectionLink = savedSort && clearLink && onLevel ? React.cloneElement(clearLink, {
      onClick: event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        onLevel(collectionLevel, 'elements');
      }
    }) : clearLink;
    function openCatalogue(level, game) {
      const target = new URL(catalogueHref, document.baseURI || new URL('../', location.href).href);
      if (C.qualificationLevels.includes(level)) target.searchParams.set('level', level);
      if (game) target.searchParams.set('game', game);
      if (isCollectionGame && !savedSort && window.MLHGameMedals?.isUserCollection(activity)) target.searchParams.set('collections', '1');
      if (fixedGame) location.replace(target.href);else location.assign(target.href);
    }
    return <div className="ig-resource-toolbar hub-toolbar relative z-20"><div className="hub-toolbar-left">{fixedGame ? <LibraryLevelPicker level={collectionLevel} onLevel={onLevel} levels={levels} collectionLink={collectionLink} onCustomise={onCustomise} disabled={classroomPractice} showCollectionsMenu={!classroomPractice} onBack={onLevel || classroomPractice ? undefined : () => openCatalogue(activity.level, mode)} /> : <NavigationBackButton label="Back to collections" onClick={() => openCatalogue(activity.level, mode)} />}</div>{showTitle && !collectionLink ? <h2 className="ig-game-toolbar-title">{activity.title}</h2> : <span aria-hidden="true" />}{onSkip || generatedSort ? <div className="ig-toolbar-skip"><window.MLH.SkipButton onClick={onSkip || onRestart} icon={<img src="./ui-icons/next.svg" alt="" aria-hidden="true" className="h-[27.8px] w-[27.8px] object-contain" />} /></div> : fixedGame ? <button type="button" className={`${window.MLH.ToolbarButtonClass} ig-toolbar-restart gap-2`} onClick={onRestart}><img src="./ui-icons/restart.svg" alt="" aria-hidden="true" />Restart</button> : <span aria-hidden="true" />}</div>;
  }
  function ConnectionsLoader() {
    return <div role="status" aria-live="polite" aria-busy="true" className="ig-connection-loading-board"><img src="./ui-icons/load.svg" alt="Loading" className="question-loading-logo" /></div>;
  }
  function LazyScreen({
    kind,
    mode,
    children
  }) {
    const [ready, setReady] = useState(window.IGRuntime.ready(kind, mode) ? `${kind}:${mode}` : '');
    const [failure, setFailure] = useState('');
    const [retry, setRetry] = useState(0);
    useEffect(() => {
      let current = true;
      setFailure('');
      window.IGRuntime.load(kind, mode).then(() => {
        if (current) setReady(`${kind}:${mode}`);
      }).catch(error => {
        if (current) setFailure(error.message);
      });
      return () => {
        current = false;
      };
    }, [kind, mode, retry]);
    if (failure) return <div className="ig-panel" role="alert">{failure}<button type="button" onClick={() => setRetry(value => value + 1)}>{"Try again"}</button></div>;
    return ready === `${kind}:${mode}` && window.IGRuntime.ready(kind, mode) ? children() : appConfig?.id === 'connections' && kind === 'player' ? <ConnectionsLoader /> : <p className="ig-muted" role="status">{"Loading "}{"game"}{"\u2026"}</p>;
  }
  const libraryLevels = {
    N3: {
      label: 'National 3'
    },
    N4: {
      label: 'National 4'
    },
    N5: {
      label: 'National 5'
    },
    H: {
      label: 'Higher'
    },
    AH: {
      label: 'Advanced Higher'
    }
  };
  const gameChoices = appConfig?.templates || ['matching-pairs', 'crossword', 'group-sort', 'wordsearch'];
  function LibraryLevelPicker({
    level,
    onLevel,
    onBack,
    backText,
    backLabel = 'Back to collections',
    collectionLink,
    onCustomise,
    levels = libraryLevels,
    showCollectionsMenu = true,
    disabled = false
  }) {
    const wordPuzzleCollections = React.useContext(WordPuzzleCollectionsContext);
    const [open, setOpen] = useState(false),
      [customiseOpen, setCustomiseOpen] = useState(false),
      anchor = useRef(null);
    useEffect(() => {
      const close = event => {
        if (!anchor.current?.contains(event.target) && !event.target.closest?.('#library-level-menu, #music-game-customise-menu')) {
          setOpen(false);
          setCustomiseOpen(false);
        }
      };
      document.addEventListener('pointerdown', close);
      return () => document.removeEventListener('pointerdown', close);
    }, []);
    return <div className="ig-game-level-controls" ref={anchor} onKeyDown={event => {
      if (event.key === 'Escape') {
        setOpen(false);
        setCustomiseOpen(false);
      }
    }}><div className="hub-menu-anchor relative ig-library-level-picker">{onBack ? <NavigationBackButton label={backLabel} text={backText} onClick={onBack} /> : <window.MLH.LevelButton icon={<img src="./ui-icons/levels.svg" alt="" className="h-[26px] w-[28px]" />} activeLevel={level} activeLabel={levels[level]?.label || 'Select Level'} disabled={disabled} onClick={() => {
          setCustomiseOpen(false);
          setOpen(value => !value);
        }} dataMenuTrigger={true} expanded={open} ariaControls="library-level-menu" />}{open && <window.MLH.MenuPanel id="library-level-menu" title="Level" position="left-0" dataMenuPanel={true}><window.MLH.LevelMenu activeLevel={level} levels={levels} updateUrl={!isWordPuzzle} onSelect={id => {
            setOpen(false);
            onLevel(id);
          }} /></window.MLH.MenuPanel>}</div>{showCollectionsMenu && fixedGame && wordPuzzleCollections?.menu && <div className="hub-menu-anchor relative">
      <window.MLH.CustomiseButton icon={<img src="./ui-icons/customise.svg" alt="" aria-hidden="true" className="h-[21px] w-[21px] object-contain" />} onClick={() => {
        setOpen(false);
        if (!customiseOpen) onCustomise?.();
        setCustomiseOpen(value => !value);
      }} dataMenuTrigger={true} expanded={customiseOpen} ariaControls="music-game-customise-menu" />
      {customiseOpen && <window.MLH.MenuPanel id="music-game-customise-menu" title="Customise" position="left-0" variant="customise" dataMenuPanel={true} footer={wordPuzzleCollections.footer && <div className="ig-sort-create-footer" onClick={() => setCustomiseOpen(false)}>{wordPuzzleCollections.footer}</div>}>
        <div onClick={() => setCustomiseOpen(false)}>{wordPuzzleCollections.menu}</div>
      </window.MLH.MenuPanel>}
    </div>}{collectionLink}</div>;
  }
  function NavigationBackButton({
    label,
    onClick,
    text = 'Back'
  }) {
    return <button type="button" className={`${window.MLH.ToolbarButtonClass} ig-back-button gap-2`} aria-label={label} onClick={onClick}><img src="./ui-icons/next.svg" alt="" aria-hidden="true" /><span>{text}</span></button>;
  }
  function JourneyPath({
    level,
    stage,
    onLevel,
    onStage
  }) {
    return <nav className="ig-journey-path" aria-label="Collection navigation">{stage === 'packs' && !fixedGame ? <NavigationBackButton label="Back to games" onClick={() => onStage('games')} /> : <LibraryLevelPicker level={level} onLevel={onLevel} showCollectionsMenu={!isCollectionGame} backText={isCollectionGame ? publicTitle : undefined} backLabel="Back to game" onBack={isCollectionGame ? () => {
      const target = new URL(catalogueHref, document.baseURI);
      target.searchParams.set('level', level);
      location.assign(target.href);
    } : undefined} />}</nav>;
  }
  function topicGroup(activity) {
    const title = String(activity.title || '').replace(/\s+\d+$/, '').trim();
    if (['Music Literacy', 'Reading Music', 'Rhythm Lengths'].includes(title)) return 'Music Literacy';
    if (['Instruments', 'Orchestra', 'Piano Keys', 'Bass Guitar Strings and Frets', 'Guitar Strings and Frets', 'Parts of the Bass Guitar', 'Parts of the Drum Kit', 'Parts of the Guitar'].includes(title)) return 'Instruments';
    if (['Styles', 'Jazz and Popular Music', 'Scottish Music', 'World Music', 'Renaissance', 'Baroque', 'Classical', 'Romantic', '20th Century / Modern'].includes(title)) return 'Styles and Periods';
    return 'Music Concepts';
  }
  function groupTopics(activities) {
    const names = ['Music Literacy', 'Music Concepts', 'Styles and Periods', 'Instruments'];
    return names.map(title => ({
      title,
      items: activities.filter(activity => topicGroup(activity) === title).sort((a, b) => Number(b.specialMode === 'level-test') - Number(a.specialMode === 'level-test'))
    })).filter(group => group.items.length);
  }
  function MusicalFactsEditor({level,onBack}) {
    const F=window.MLHFacts,original=F.catalogue(),draft=history.state?.musicalFactsDraft;
    const restored=draft?.dirty?draft:null;
    const [overrides,setOverrides]=useState(()=>restored?{...F.read(),...Object.fromEntries((restored.changedIds||Object.keys(restored.overrides)).map(id=>[id,restored.overrides[id]]))}:F.read());
    const [baseline,setBaseline]=useState(()=>restored?.baseline||F.read()),[changedIds,setChangedIds]=useState(()=>restored?.changedIds||Object.keys(restored?.overrides||{}));
    const [current,setCurrent]=useState(()=>draft?.current||original.find(c=>c.level===level)?.id||original[0].id);
    const [query,setQuery]=useState(draft?.query||''),[dirty,setDirty]=useState(Boolean(draft?.dirty)),[message,setMessage]=useState(''),[failure,setFailure]=useState('');
    const [showDeleted,setShowDeleted]=useState(false);
    const concept=original.find(c=>c.id===current)||original[0],deleted=overrides[concept.id]?.deleted===true,facts=(deleted?overrides[concept.id].facts:overrides[concept.id])||concept.facts;
    const active=original.filter(c=>!overrides[c.id]?.deleted);
    const total=active.reduce((sum,c)=>sum+(overrides[c.id]||c.facts).filter(f=>f.text.trim()).length,0);
    useEffect(()=>{history.replaceState({...history.state,musicalFactsDraft:{overrides,baseline,changedIds,current,query,dirty}},'');},[overrides,baseline,changedIds,current,query,dirty]);
    useEffect(()=>{function update(event){if(event.key!==F.storageKey||dirty)return;try{const latest=F.read();setOverrides(latest);setBaseline(latest);}catch(error){setFailure(error.message);}}window.addEventListener('storage',update);return()=>window.removeEventListener('storage',update);},[dirty]);
    function change(next){setOverrides(value=>({...value,[concept.id]:next}));setChangedIds(value=>[...new Set([...value,concept.id])]);setDirty(true);setMessage('');setFailure('');}
    function save(){try{const valid=F.saveChanges(Object.fromEntries(changedIds.map(id=>[id,overrides[id]])),baseline);setOverrides(valid);setBaseline(valid);setChangedIds([]);setDirty(false);setFailure('');setMessage('Saved in this browser. New Facts games will use your changes.');}catch(error){setFailure(error.message);}}
    function reloadSaved(){const latest=F.read();setOverrides(latest);setBaseline(latest);setChangedIds([]);setDirty(false);setFailure('');setMessage('Loaded the latest saved facts.');}
    async function importFacts(event){const file=event.target.files?.[0];if(!file)return;try{const next=F.importBackup(JSON.parse(await file.text()));setBaseline(F.read());setOverrides(next);setChangedIds(Object.keys(next));setDirty(true);setFailure('');setMessage('Backup loaded. Select Save to apply these facts and deletions.');}catch(error){setFailure(error.message);}finally{event.target.value='';}}
    function download(){try{F.download({...F.read(),...Object.fromEntries(changedIds.map(id=>[id,overrides[id]]))});setFailure('');}catch(error){setFailure(error.message);}}
    return <section className="ig-library-main ig-panel ig-facts-editor" aria-label="Edit Facts"><div className="ig-builder-toolbar"><NavigationBackButton label="Back to collections" text="Collections" onClick={onBack}/><h2>Facts</h2><label className={window.MLH.ToolbarButtonClass+' ig-facts-import'}>Import Facts<input type="file" aria-label="Import Facts" accept=".json,application/json" onChange={importFacts}/></label><button type="button" className={window.MLH.ToolbarButtonClass} onClick={download}>Download Facts</button><button type="button" className={`${window.MLH.ToolbarButtonClass} ig-primary`} disabled={!dirty} onClick={save}>Save</button></div><p className="ig-collection-subtitle">{active.length} concepts · {total} facts. Edit the facts used in every new four-group game.</p><p className="ig-facts-save-note">Save keeps your changes in this browser. Download Facts creates a backup of the complete fact bank.</p>{failure&&<div role="alert" className="ig-error">{failure}{failure.includes('changed in another tab')&&<button type="button" className={window.MLH.ToolbarButtonClass} onClick={reloadSaved}>Reload Saved Facts</button>}</div>}{message&&<p role="status" className="ig-facts-saved">{message}</p>}<div className="ig-facts-editor-layout"><aside aria-label="Facts concepts"><input type="search" aria-label="Find a concept" placeholder="Find a concept" value={query} onChange={event=>setQuery(event.target.value)}/><label className="ig-facts-show-deleted"><input type="checkbox" checked={showDeleted} onChange={event=>{const next=event.target.checked;setShowDeleted(next);const first=original.find(c=>Boolean(overrides[c.id]?.deleted)===next);if(first)setCurrent(first.id);}}/>Show Deleted Concepts</label><div className="ig-facts-concept-list">{original.filter(c=>showDeleted?overrides[c.id]?.deleted:!overrides[c.id]?.deleted).filter(c=>(c.name+' '+(libraryLevels[c.level]?.label||c.level)).toLowerCase().includes(query.trim().toLowerCase())).map(c=><button key={c.id} type="button" className={overrides[c.id]?.deleted?'ig-facts-concept-deleted':''} aria-pressed={current===c.id} onClick={()=>{setCurrent(c.id);setFailure('');}}><strong>{c.name}</strong><small>{c.level} · {overrides[c.id]?.deleted?'Deleted':(overrides[c.id]||c.facts).filter(f=>f.text.trim()).length+' facts'}</small></button>)}</div></aside><section aria-label={'Facts for '+concept.name}><div className="ig-facts-concept-heading"><h3>{concept.name}<small>{libraryLevels[concept.level]?.label||concept.level}</small></h3><button type="button" className={window.MLH.ToolbarButtonClass+' '+(deleted?'':'ig-facts-delete')} onClick={()=>change(deleted?facts:{deleted:true,facts})}>{deleted?'Restore Concept':'Delete Concept'}</button></div>{deleted?<p>This concept is deleted from Facts at every level. Its facts are kept so you can restore it. Select Save to apply your changes.</p>:<React.Fragment><p>Every fact below is included whenever this concept is chosen. Identical facts also accept their other matching headings at the same level. Keep at least one fact, or delete this concept.</p><table className="ig-facts-edit-table"><thead><tr><th>No.</th><th>Fact</th><th>Also accepted under</th><th><span className="sr-only">Remove</span></th></tr></thead><tbody>{facts.map((fact,index)=><tr key={index}><th scope="row">{index+1}</th><td><textarea aria-label={'Fact '+(index+1)} value={fact.text} maxLength={1000} onChange={event=>change(facts.map((row,i)=>i===index?{...row,text:event.target.value}:row))}/></td><td><div className="ig-facts-alternatives">{(fact.also||[]).filter(id=>original.find(c=>c.id===id)?.level===concept.level&&!overrides[id]?.deleted).map(id=><button key={id} type="button" aria-label={'Remove alternative '+original.find(c=>c.id===id)?.name+' for fact '+(index+1)} onClick={()=>change(facts.map((row,i)=>i===index?{...row,also:row.also.filter(value=>value!==id)}:row))}>{original.find(c=>c.id===id)?.name} ×</button>)}</div><select aria-label={'Add accepted concept for fact '+(index+1)} value="" onChange={event=>{const id=event.target.value;if(id)change(facts.map((row,i)=>i===index?{...row,also:[...(row.also||[]),id]}:row));}}><option value="">Add concept…</option>{original.filter(c=>c.level===concept.level&&!overrides[c.id]?.deleted&&c.id!==concept.id&&!(fact.also||[]).includes(c.id)).map(c=><option key={c.id} value={c.id}>{c.name} ({c.level})</option>)}</select></td><td><button type="button" className={window.MLH.ToolbarButtonClass} aria-label={'Remove fact '+(index+1)} disabled={facts.length<=1} onClick={()=>change(facts.filter((_,i)=>i!==index))}>Remove</button></td></tr>)}</tbody></table><button type="button" className={window.MLH.ToolbarButtonClass} onClick={()=>change([...facts,{id:concept.id+'-new-'+facts.length,text:'',also:[]}])}>Add Fact</button></React.Fragment>}</section></div></section>;
  }
  function CollectionBuilder({
    level,
    initial,
    onBack,
    onSave,
    inOverlay = false
  }) {
    const G = window.MLHGameCollections,
      D = G.data,
      connections = fixedGame === 'matching-pairs',
      sorting = isConceptSort,
      grouped = connections || sorting;
    useEffect(() => {
      if (inOverlay) return;
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    }, [inOverlay]);
    const draft = inOverlay ? history.state?.sortEditorDraft : history.state?.playnoteView === 'collection' ? history.state?.collectionDraft : null;
    const restored = draft?.template === fixedGame && draft.collectionEdition === G.collectionEdition && (draft.initial?.id ?? null) === (initial?.id ?? null) ? draft : null;
    const [name, setName] = useState(restored?.name ?? initial?.title ?? ''),
      [ids, setIds] = useState(() => sorting ? [] : restored?.ids ?? initial?.sourceConceptIds?.filter(id => D.concepts.some(concept => concept.id === id)) ?? []),
      [failure, setFailure] = useState(''),
      [busy, setBusy] = useState(false),
      [activeGroup, setActiveGroup] = useState(restored?.activeGroup ?? 0);
    const initialGroups = [...new Set(initial?.items.map(item => item.group) || [])];
    const defaultGroupName = index => 'Group ' + (index + 1);
    const [groupNames, setGroups] = useState(() => {
      const savedNames = restored?.groups ?? (grouped && initialGroups.length >= 2 ? initialGroups : null);
      if (!sorting) return savedNames ?? ['Group 1', 'Group 2', 'Group 3', 'Group 4'];
      return restored?.sortGroupNames ?? savedNames?.map(name => /^Group [1-9]\d*$/.test(name) ? null : name) ?? [null, null];
    });
    const groups = sorting ? groupNames.map((name, index) => name ?? defaultGroupName(index)) : groupNames;
    const [assignments, setAssignments] = useState(() => restored?.assignments ?? Object.fromEntries((initial?.items || []).map(item => [item.sourceConceptId, initialGroups.indexOf(item.group)])));
    const [customCards, setCustomCards] = useState(() => {
      if (!sorting) return [];
      // Keep existing concept cards editable and preserve their source while the text matches.
      if (restored) {
        const selectedIds = restored.ids || [];
        if (!selectedIds.length) return restored.customCards || [];
        const concepts = new Map([...D.concepts, ...G.literacyConcepts('ALL')].map(concept => [concept.id, concept.name]));
        return selectedIds.flatMap(id => {
          const text = concepts.get(id);
          return text ? [{ text, group: restored.assignments[id], sourceConceptId: id, originalText: text }] : [];
        }).concat(restored.customCards || []);
      }
      return (initial?.items || []).map(item => {
        const text = item.prompt || item.answer;
        return {
          text,
          group: initialGroups.indexOf(item.group),
          ...(item.sourceConceptId ? { sourceConceptId: item.sourceConceptId, originalText: text } : {})
        };
      });
    });
    const activeCustomCards = customCards.flatMap((card, index) => card.group === activeGroup ? [{ card, index }] : []);
    const blankCard = { text: '', group: activeGroup };
    const defaultCustomCards = Array.from({ length: 4 }, () => blankCard);
    const visibleCustomCards = activeCustomCards.length ? activeCustomCards : defaultCustomCards.map(card => ({ card, index: null }));
    const filledCustom=customCards.filter(card=>card.text.trim());
    const cardCount=ids.length+(sorting?filledCustom.length:0);
    const groupCount=index=>sorting ? filledCustom.filter(card=>card.group===index).length : ids.filter(id=>assignments[id]===index).length;
    const sortCardLimit = C.LIMITS.sortItems;
    const remainingSortCards = Math.max(0, Math.min(sortCardLimit - cardCount, G.sortGroupLimit - groupCount(activeGroup)));
    let sortValidation = '';
    if (sorting) {
      const counts = groups.map((_, index) => groupCount(index));
      if (groups.some(group => !C.canonical(group)) || new Set(groups.map(C.canonical)).size !== groups.length) {
        sortValidation = 'Give each group a different name.';
      } else if (counts.some(count => count > G.sortGroupLimit)) {
        sortValidation = 'Each group can contain up to ' + G.sortGroupLimit + ' cards.';
      } else if (counts.includes(0)) {
        sortValidation = 'Add at least one card to each group.';
      }
    }
    useEffect(() => {
      const collectionDraft = {
          template: fixedGame,
          collectionEdition: G.collectionEdition,
          initial: initial || null,
          name,
          ids,
          ...(sorting ? { sortGroupNames: groupNames } : { groups: groupNames }),
          assignments,
          customCards,
          activeGroup
      };
      history.replaceState(inOverlay
        ? { ...history.state, sortEditorDraft: collectionDraft }
        : { ...history.state, playnoteView: 'collection', collectionDraft }, '');
    }, [inOverlay, initial, name, ids, groupNames, assignments, customCards, activeGroup]);
    const cols = sorting ? [] : G.columns('ALL', fixedGame);
    function toggle(id) {
      setFailure('');
      if (ids.includes(id)) {
        setIds(ids.filter(value => value !== id));
        setAssignments(current => {
          const next = {
            ...current
          };
          delete next[id];
          return next;
        });
        return;
      }
      if (connections && ids.filter(value => assignments[value] === activeGroup).length >= 4) {
        setFailure('Choose another group to add more concepts.');
        return;
      }
      if (!connections && cardCount >= 15) {
        setFailure('A puzzle can contain up to 15 concepts.');
        return;
      }
      setIds([...ids, id]);
      if (grouped) setAssignments({
        ...assignments,
        [id]: activeGroup
      });
    }
    async function submit(event) {
      event.preventDefault();
      setFailure('');
      setBusy(true);
      try {
        const sourceCards = sorting ? filledCustom.filter(card => card.sourceConceptId && card.text.trim() === card.originalText) : [];
        const sourceCardSet = new Set(sourceCards);
        const activity = G.make({
          id: initial?.id,
          name,
          level: sorting && initial ? initial.level : level,
          template: fixedGame,
          ids: sorting ? sourceCards.map(card => card.sourceConceptId) : ids,
          groups,
          assignments: sorting ? Object.fromEntries(sourceCards.map(card => [card.sourceConceptId, card.group])) : assignments,
          customCards: sorting ? filledCustom.filter(card => !sourceCardSet.has(card)) : [],
          scope: 'ALL'
        });
        await onSave(activity);
      } catch (error) {
        setFailure(error.message);
      } finally {
        setBusy(false);
      }
    }
    const creatingSortGroups = sorting;
    function addGroup() {
      setGroups([...groupNames, null]);
      setActiveGroup(groups.length);
    }
    function removeGroup(index) {
      const remainingGroup = group => group > index ? group - 1 : group;
      setCustomCards(cards => cards.filter(card => card.group !== index).map(card => ({ ...card, group: remainingGroup(card.group) })));
      setGroups(groupNames.filter((_, i) => i !== index));
      setActiveGroup(activeGroup === index ? Math.min(index, groups.length - 2) : remainingGroup(activeGroup));
    }
    const conceptGrid = !sorting && (
      <div className="mc-table-wrap"><table className="mc-table"><caption className="sr-only">{"All levels concepts grouped by musical element"}</caption><thead><tr>{D.categories.map(cat => <th key={cat} scope="col">{cat}</th>)}</tr></thead><tbody><tr>{cols.map((list, i) => <td key={i}><ul>{list.map(c => <li key={c.id}><div className="mc-quiz-select-row"><input className="mc-quiz-checkbox" type="checkbox" aria-label={'Select ' + c.name} checked={ids.includes(c.id)} disabled={busy || isCollectionGame && cardCount >= 15 && !ids.includes(c.id) || grouped && ids.includes(c.id) && assignments[c.id] !== activeGroup} onChange={() => toggle(c.id)} /><a className="mc-levelled-link" href={`./music-dictionary/musicdictionaryconcept.html?concept=${encodeURIComponent(c.id)}&level=${D.codes[D.levels.indexOf(c.level)]}`} target="_blank" rel="noopener"><span className="mc-concept-name">{c.name}{grouped && ids.includes(c.id) && <small>{groups[assignments[c.id]]}</small>}</span><span className="mc-level-badge">{D.codes[D.levels.indexOf(c.level)]}</span></a></div></li>)}</ul></td>)}</tr></tbody></table></div>
    );
    return (
      <section className={`ig-library-main ig-panel ig-collection-builder ig-quiz-builder${connections ? ' ig-connections-builder' : ''}${sorting ? ' ig-sort-builder' : ''}`} aria-label={creatingSortGroups ? 'Concept Sort editor' : undefined} aria-labelledby={creatingSortGroups ? undefined : 'ig-collection-builder-heading'}>
        <div className={`ig-builder-toolbar${creatingSortGroups ? ' is-centred-sort-name' : ''}`}>
          {inOverlay ? <window.MLH.ToolbarButton label="Cancel" onClick={onBack} />
            : <LibraryLevelPicker level={level} onBack={onBack} backText="Collections" showCollectionsMenu={!isCollectionGame} />}
          {!creatingSortGroups && <h2 id="ig-collection-builder-heading">{initial ? 'Edit Collection' : 'Create Collection'}</h2>}
          <label className="ig-builder-name">
            <span className={sorting && !creatingSortGroups ? undefined : 'sr-only'}>{sorting ? 'Sort name' : 'Collection name'}</span>
            <input form="ig-game-collection-form" aria-label={sorting ? undefined : 'Name'} placeholder={!sorting || creatingSortGroups ? 'Name' : undefined} value={name} onChange={event => setName(event.target.value)} maxLength={160} required />
          </label>
          <button type="submit" form="ig-game-collection-form" className={`${window.MLH.ToolbarButtonClass} ig-primary`} disabled={(connections ? ids.length !== 16 : isCollectionGame ? cardCount < (sorting ? 2 : 5) || cardCount > (sorting ? sortCardLimit : 15) : !ids.length) || !name.trim() || busy || Boolean(sortValidation)}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
        <p className="ig-collection-subtitle">
          {connections ? 'Choose four related concepts for each group, and give each group a name.' : sorting ? 'Choose a group, then write words, phrases or definitions that belong in it.' : fixedGame === 'crossword' ? 'Choose between 5 and 15 concepts to include in your crossword.' : 'Choose between 5 and 15 concepts to include in your word search.'}
        </p>
        <form id="ig-game-collection-form" onSubmit={submit}>
          {grouped && <div className="ig-builder-groups">
            <div role="group" aria-label={sorting ? "Sort groups" : "Connections groups"}>
              {groups.map((group, i) => {
                const count = groupCount(i);
                const groupName = group.trim() || defaultGroupName(i);
                if (sorting) return <div key={i} className="ig-sort-group-card">
                  <button type="button" className="ig-sort-group-select" aria-pressed={activeGroup === i} aria-label={`${groupName}, ${count} of ${G.sortGroupLimit} cards`} onClick={() => setActiveGroup(i)}>
                    <span className="ig-builder-group-count">{count}/{G.sortGroupLimit}</span>
                  </button>
                  <input type="text" aria-label={defaultGroupName(i) + ' name'} placeholder={defaultGroupName(i)} value={group} maxLength={80} disabled={busy}
                    onFocus={() => setActiveGroup(i)}
                    onChange={event => {
                      const value = event.target.value;
                      setGroups(current => current.map((name, index) => index === i ? (value === defaultGroupName(i) ? null : value) : name));
                    }}
                    onKeyDown={event => {
                      if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                        event.preventDefault();
                        event.currentTarget.previousElementSibling.focus();
                      }
                    }} />
                  <button type="button" className="ig-sort-group-remove" aria-label={'Remove ' + groupName} title={'Remove ' + groupName + ' and its cards'} disabled={groups.length <= 2 || busy} onClick={() => removeGroup(i)}>
                    <img src="./ui-icons/bin.svg" alt="" />
                  </button>
                </div>;
                return <button key={i} type="button" aria-pressed={activeGroup === i} onClick={() => setActiveGroup(i)}>
                  <span>{group}</span>
                  <span className="ig-builder-group-count">{count}/4</span>
                </button>;
              })}
              {sorting && <button type="button" className="ig-sort-group-add" aria-label="Add Group" title="Add Group" disabled={groups.length >= 6 || busy} onClick={addGroup}>
                <img src="./ui-icons/plus.svg" alt="" />
              </button>}
            </div>
          </div>}
          {!sorting && <div className="ig-builder-actions">
            {connections && <label className="ig-builder-group-name">
              Group name
              <input aria-label="Group name" value={groups[activeGroup]} maxLength={80} onChange={event => setGroups(groups.map((group, i) => i === activeGroup ? event.target.value : group))} />
            </label>}
            <span role="status">{ids.length} {ids.length === 1 ? 'concept' : 'concepts'} selected</span>
            <button className={window.MLH.ToolbarButtonClass} type="button" onClick={() => {
              setIds([]);
              setCustomCards([]);
              setAssignments({});
              setFailure('');
            }} disabled={!cardCount || busy}>Remove All</button>
          </div>}
          {failure && <p className="ig-error" role="alert">{failure}</p>}
          {sorting && sortValidation && name.trim() && cardCount >= 2 && <p className="ig-error" role="status">{sortValidation}</p>}
          {sorting && <section className="ig-custom-sort-cards" aria-labelledby="ig-active-sort-group">
            <p id="ig-active-sort-group">Add cards to {groups[activeGroup]?.trim() || defaultGroupName(activeGroup)}.</p>
            <ul className="ig-custom-sort-card-list" role="list" key={activeGroup}>
              {visibleCustomCards.map(({ card, index }, rowIndex) => <li key={rowIndex}>
                <span className="ig-custom-sort-card-number" aria-hidden="true">{rowIndex + 1}</span>
                <input aria-label={'Card ' + (rowIndex + 1)} placeholder="Word or phrase" value={card.text} maxLength={160}
                  disabled={busy || (remainingSortCards === 0 && !card.text.trim())}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && !event.nativeEvent.isComposing) event.preventDefault();
                  }}
                  onChange={event => {
                    const updatedCard = { ...card, text: event.target.value };
                    setCustomCards(rows => index === null
                      ? [...rows, ...defaultCustomCards.map((blank, i) => i === rowIndex ? updatedCard : blank)]
                      : rows.map((row, i) => i === index ? updatedCard : row));
                  }} />
                <button type="button" className={window.MLH.ToolbarButtonClass + ' ig-sort-card-remove'}
                  aria-label={'Remove card ' + (rowIndex + 1)} title={'Remove card ' + (rowIndex + 1)}
                  onClick={() => setCustomCards(rows => rows.filter((_, i) => i !== index))} disabled={busy || index === null}>
                  <img src="./ui-icons/bin.svg" alt="" />
                </button>
              </li>)}
            </ul>
            <button type="button" className={window.MLH.ToolbarButtonClass + ' ig-sort-card-add'} aria-label="Add Card" title="Add Card"
              disabled={busy || activeCustomCards.length >= G.sortGroupLimit || remainingSortCards === 0}
              onClick={() => setCustomCards(rows => [...rows, ...(!activeCustomCards.length ? defaultCustomCards : []), blankCard])}>
              <img src="./ui-icons/plus.svg" alt="" />
            </button>
          </section>}
          {conceptGrid}
        </form>
      </section>
    );
  }
  function LibraryJourney({
    game,
    level,
    stage,
    onGame,
    onLevel,
    onStage,
    toolbarActions,
    favourites
  }) {
    return <section className="ig-library-journey" aria-label="Choose a level, game and collection"><div className="hub-toolbar ig-journey-toolbar"><JourneyPath game={game} level={level} stage={stage} onLevel={onLevel} onStage={onStage} />{fixedGame && <h2 className="ig-entry-heading">{"Choose Collection"}</h2>}{toolbarActions || <span aria-hidden="true" />}</div>{!fixedGame && <h2 className="ig-journey-heading">{stage === 'levels' ? 'Choose a Level' : stage === 'games' ? 'Choose a Game' : 'Choose a Collection'}</h2>}{stage === 'games' && <div className="ig-game-choice-grid">{gameChoices.map(id => <button type="button" className="ig-game-choice" key={id} onClick={() => onGame(id)}><Artwork id={id} catalogue={true} /><span className="ig-game-choice-copy"><strong>{template(id).name}</strong><span>{template(id).description}</span></span></button>)}<a className="ig-show-all-games" href={`${catalogueHref}?level=${encodeURIComponent(level)}&game=all`} onClick={event => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0) return;
          event.preventDefault();
          onGame('');
        }}>{"Show Collections"}</a></div>}{!fixedGame && stage === 'games' && favourites && <section className="ig-library-favourites" aria-label="Favourites"><h2>{"Favourites"}</h2>{favourites}</section>}</section>;
  }
  function App() {
    const [raceSubmitSlot,setRaceSubmitSlot]=useState(null);
    const [activities, setActivities] = useState([]),
      [loading, setLoading] = useState(true),
      [error, setError] = useState(''),
      [view, setViewState] = useState(initialView),
      [selected, setSelected] = useState(null),
      [sortEditor, setSortEditor] = useState(initialSortEditor),
      [sortEditorLoad, setSortEditorLoad] = useState(null),
      [collectionEdit, setCollectionEdit] = useState(() => initialView === 'collection' ? history.state?.collectionDraft?.initial || null : null),
      [mode, setMode] = useState('matching-pairs'),
      [options, setOptions] = useState({
        shuffle: true,
        timer: 0,
        difficulty: 'normal',
        theme: 'blue',
        sound: C.readSoundPreference()
      }),
      [search, setSearch] = useState(() => new URLSearchParams(location.search).get('q') || ''),
      [favouriteIds, setFavouriteIds] = useState(() => {
        try {
          return readFavouriteIds(localStorage);
        } catch {
          return [];
        }
      }),
      [gameFilter, setGameFilter] = useState(() => {
        const game = new URLSearchParams(location.search).get('game');
        return fixedGame || (gameChoices.includes(game) ? game : '');
      }),
      [libraryStage, setLibraryStage] = useState(() => {
        const query = new URLSearchParams(location.search);
        return Object.hasOwn(libraryLevels, query.get('level')) ? fixedGame || gameChoices.includes(query.get('game')) || query.get('game') === 'all' ? 'packs' : 'games' : fixedGame ? 'packs' : 'levels';
      }),
      [levelFilter, setLevelFilter] = useState(() => {
        const level = new URLSearchParams(location.search).get('level');
        return Object.hasOwn(libraryLevels, level) ? level : fixedGame ? 'N3' : '';
      }),
      [libraryView] = useState('tiles'),
      [folderState, setFolderState] = useState(() => {
        try {
          const value = JSON.parse(localStorage.getItem('ig-library-folders') || '{}');
          return {
            names: Array.isArray(value.names) ? value.names.filter(name => typeof name === 'string' && name.trim()).map(name => name.slice(0, 100)) : [],
            assignments: value.assignments && typeof value.assignments === 'object' && !Array.isArray(value.assignments) ? value.assignments : {}
          };
        } catch {
          return {
            names: [],
            assignments: {}
          };
        }
      }),
      [folderDialog, setFolderDialog] = useState(null),
      [folderName, setFolderName] = useState(''),
      [folderDrop, setFolderDrop] = useState(null),
      [folderError, setFolderError] = useState(''),
      [folderBusy, setFolderBusy] = useState(false),
      [playing, setPlaying] = useState(() => classroomProgress?.read('playing',false) === true),
      [attempt, setAttempt] = useState(0),
      [notice, setNotice] = useState(''),
      [pendingDelete, setPendingDelete] = useState(null),
      [share, setShare] = useState({
        key: '',
        url: '',
        error: ''
      });
    const [selectedLevelOnly, setSelectedLevelOnly] = useState(() =>
      wordPuzzleParams.get('selectedLevelOnly') === '1' ||
      isWordPuzzle && !wordPuzzleParams.has('category') && !hasLiteracyScope && wordPuzzleParams.get('includeBelow') === '0');
    const connectionRequest = useRef(0),
      connectionCycle = useRef(null),
      connectionGenerating = useRef(false);
    const connectionMedalEligible = Boolean(selected?.tags?.includes('generated-connections') &&
      !selected.tags.includes('literacy-connections') && !window.MLHGameMedals.isUserCollection(selected));
    const useConnectionScore = appConfig?.id === 'connections' ? window.MLH.usePersistentScoreState : useState;
    const [connectionGameScore, setConnectionGameScore] = useConnectionScore({
      correct: 0,
      attempted: 0,
      gameStreak: 0,
      bestStreak: 0
    }, 'score', {
      level: levelFilter || 'N3',
      scope: connectionMedalEligible ? 'connections-games-v1' : 'connections-custom-games-v1'
    });
    const connectionStreakSessions = useRef(new Set());
    React.useLayoutEffect(() => {
      if (appConfig?.id !== 'connections' || !selected) return;
      const context = selected.level + ':' + connectionMedalEligible;
      if (connectionStreakSessions.current.has(context)) return;
      connectionStreakSessions.current.add(context);
      setConnectionGameScore(window.MLHGamePractice.resetStreak);
    }, [selected?.level, connectionMedalEligible]);
    const connectionScore = {
      ...connectionGameScore,
      streak: connectionGameScore.gameStreak
    };
    const [connectionConfetti, setConnectionConfetti] = useState(0);
    function markConnectionGame(won) {
      const next = window.MLHGamePractice.gameResult(connectionGameScore, won);
      setConnectionGameScore(next);
      const medal = won && connectionMedalEligible ? window.MLHGamePractice.milestone(next.gameStreak) : null;
      if (medal) setConnectionConfetti(value => value + 1);
      return medal;
    }
    function resetConnections() {
      setConnectionGameScore({
        correct: 0,
        attempted: 0,
        gameStreak: 0,
        bestStreak: 0
      });
      setConnectionConfetti(0);
      setAttempt(value => value + 1);
    }
    function skipConnection() {
      setConnectionGameScore(window.MLHGamePractice.resetStreak);
      setConnectionConfetti(0);
      nextConnection();
    }
    const shareKey = JSON.stringify(view === 'activity' && selected ? C.convertTemplate({
      ...selected,
      options
    }, mode) : null);
    useEffect(() => {
      let current = true;
      window.IGSharing.createUrl(location.href, JSON.parse(shareKey)).then(url => {
        if (!current) return;
        setShare({
          key: shareKey,
          url,
          error: ''
        });
        const activity = JSON.parse(shareKey);
        const collection = activity?.tags?.includes('user-collection') && window.HubCollections?.selected();
        if (classroomSeed===null && activity && !(collection && activity.collectionId === collection.id) && !connectionsPractice && !activity.tags?.some(tag => ['random-crossword', 'category-crossword', 'random-wordsearch', 'category-wordsearch', 'generated-sort'].includes(tag))) {
          const target = new URL(url);
          if (!(playerPage && new URLSearchParams(location.search).has('activity')) && navigation.current?.replaceActivityUrl(target.pathname + target.search + target.hash)) {
            try {
              sessionStorage.setItem('ig-active-game-hash', target.hash);
            } catch {}
          }
        }
      }).catch(error => {
        if (current) setShare({
          key: shareKey,
          url: '',
          error: error.message
        });
      });
      return () => {
        current = false;
      };
    }, [shareKey, levelFilter, gameFilter, libraryStage]);
    const draggingActivity = useRef(null);
    const navigation = useRef(null);
    const initialHash = useRef(location.hash);
    useEffect(() => {
      if (playerPage && !selected) return;
      navigation.current = window.IGNavigation.create(history, location, next => {
        if (wordPuzzlePractice && next === 'library') {
          nextWordPuzzle();
          return;
        }
        setViewState(isConceptSort&&!window.MLHSort.factsEnabled&&next==='facts'?'library':next);
        if (next !== 'collection' && history.state?.collectionDraft) {
          const {
            collectionDraft,
            ...state
          } = history.state;
          history.replaceState(state, '');
        }
        if (next !== 'activity') {
          try {
            sessionStorage.removeItem('ig-active-game-hash');
          } catch {}
        }
        setPlaying(false);
        setNotice('');
      }, {
        initialView,
        replaceScreens: Boolean(fixedGame),

      });
      const pop = event => {
        navigation.current.pop(event);
        if (isConceptSort) setSortEditor(event.state?.sortEditor || null);
        if (!playerPage) {
          const query = new URLSearchParams(location.search);
          const level = Object.hasOwn(libraryLevels, query.get('level')) ? query.get('level') : fixedGame ? 'N3' : '';
          const game = fixedGame || (gameChoices.includes(query.get('game')) ? query.get('game') : '');
          setLevelFilter(level);
          setGameFilter(game);
          setLibraryStage(level ? game || query.get('game') === 'all' ? 'packs' : 'games' : 'levels');
          setSearch(query.get('q') || '');
        }
      };
      window.addEventListener('popstate', pop);
      return () => window.removeEventListener('popstate', pop);
    }, [playerPage ? selected?.id : null]);
    function navigateLibrary(stage, level = levelFilter, game = gameFilter) {
      const url = new URL(location.href);
      url.searchParams.delete('q');
      url.searchParams.delete('topic');
      if (stage === 'levels') url.searchParams.delete('level');else url.searchParams.set('level', level);
      if (stage === 'packs' && !fixedGame) url.searchParams.set('game', game || 'all');else url.searchParams.delete('game');
      if (url.href !== location.href) navigation.current?.replaceLibraryUrl(url.href);
      setLevelFilter(stage === 'levels' ? '' : level);
      setGameFilter(stage === 'packs' ? game : '');
      setLibraryStage(stage);
      setSearch('');
    }
    function openSortEditor(id) {
      const editor = { id: id || null };
      history.replaceState({ ...history.state, sortEditor: editor, sortEditorDraft: null }, '');
      setSortEditorLoad(null);
      setSortEditor(editor);
    }
    function returnToSort() {
      const { sortEditor, sortEditorDraft, ...state } = history.state || {};
      history.replaceState(state, '');
      setSortEditor(null);
    }
    useEffect(() => {
      if (!sortEditor?.id) return;
      let active = true;
      C.getActivity(sortEditor.id).then(activity => {
        if (activity?.template !== fixedGame) throw new Error('This sort is no longer saved in this browser.');
        if (active) setSortEditorLoad({ editor: sortEditor, activity });
      }).catch(error => {
        if (active) setSortEditorLoad({ editor: sortEditor, error: error.message });
      });
      return () => { active = false; };
    }, [sortEditor]);
    function setView(next) {
      if (wordPuzzlePractice && next === 'library') {
        nextWordPuzzle();
        return;
      }
      if (playerPage && next === 'library') {
        const target = new URL(catalogueHref, document.baseURI || new URL('../', location.href).href);
        target.searchParams.set('level', levelFilter);
        target.searchParams.set('game', mode);
        if (isCollectionGame && !isConceptSort) target.searchParams.set('collections', '1');
        if (fixedGame) location.replace(target.href);else location.assign(target.href);
        return;
      }
      if (navigation.current) navigation.current.navigate(next);else setViewState(isConceptSort&&!window.MLHSort.factsEnabled&&next==='facts'?'library':next);
    }
    const retiredHubActivities = new Set(['example-instrument-families', 'example-music-words', 'example-music-sentences', 'example-musical-order', 'hub-test-crossword', 'hub-test-match-up', 'hub-test-true-or-false', 'hub-test-type-the-answer', 'hub-test-wordsearch']);
    const sortCollections=isConceptSort?window.MLHSort.collections.map(row=>({id:`${row.level.toLowerCase()}-${row.type}`,title:row.title,level:row.level,template:'group-sort',sortType:row.type,itemCount:row.count,audio:row.audio,collectionEdition:window.MLHGameCollections.collectionEdition})):[];
    const all = [...sortCollections,...activities.filter(a => a.template !== 'type-the-answer' && !(isConceptSort&&!window.MLHSort.factsEnabled&&a.sortRecipe?.type==='facts')), ...C.SEEDS.filter(s => C.isHubLibraryTemplate(s.template) && !s.catalogueHidden && !retiredHubActivities.has(s.id) && !activities.some(a => a.id === s.id))].filter(activity => (!appConfig || appConfig.templates.includes(activity.template)) && (activity._stored || !fixedGame || isConceptSort || window.MLHGameCollections.visibleInLibrary(activity))).map(activity => activities.some(saved => saved.id === activity.id) && Object.prototype.hasOwnProperty.call(folderState.assignments, activity.id) ? {
      ...activity,
      folder: folderState.assignments[activity.id]
    } : activity);
    const ownFolder = activity => !activities.some(saved => saved.id === activity.id) ? '' : Object.prototype.hasOwnProperty.call(folderState.assignments, activity.id) ? folderState.assignments[activity.id] : activities.some(saved => saved.id === activity.id) && activity.folder && activity.folder !== 'Music examples' && activity.folder !== 'My Music Online' ? activity.folder : '';
    const folderNames = [...new Set([...folderState.names, ...activities.map(ownFolder).filter(Boolean)])].sort((a, b) => a.localeCompare(b, 'en-GB', {
      sensitivity: 'base',
      numeric: true
    }));
    function openFolderDialog() {
      setFolderDialog({});
      setFolderName('');
      setFolderError('');
    }
    async function submitFolder(event) {
      event.preventDefault();
      if (folderBusy) return;
      const name = folderName.trim();
      if (!name) {
        setFolderError('Enter a folder name.');
        return;
      }
      if (folderNames.some(existing => existing.toLocaleLowerCase('en-GB') === name.toLocaleLowerCase('en-GB'))) {
        setFolderError('A folder with this name already exists.');
        return;
      }
      const next = {
        ...folderState,
        names: [...folderState.names, name]
      };
      setFolderBusy(true);
      setFolderError('');
      try {
        localStorage.setItem('ig-library-folders', JSON.stringify(next));
        setFolderState(next);
        setFolderDialog(null);
      } catch (error) {
        setFolderError(error.message || 'The folder could not be saved.');
      } finally {
        setFolderBusy(false);
      }
    }
    function endFolderDrag() {
      draggingActivity.current = null;
      setFolderDrop(null);
    }
    async function dropInFolder(event, name) {
      const id = draggingActivity.current;
      const activity = activities.find(saved => saved.id === id);
      if (!activity || folderBusy || !folderNames.includes(name)) return;
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.open = true;
      endFolderDrag();
      if (ownFolder(activity) === name) return;
      const next = {
        ...folderState,
        assignments: {
          ...folderState.assignments,
          [id]: name
        }
      };
      setFolderBusy(true);
      try {
        localStorage.setItem('ig-library-folders', JSON.stringify(next));
        try {
          await C.saveActivity({
            ...(await resolveActivity(activity)),
            folder: name
          });
        } catch (error) {
          localStorage.setItem('ig-library-folders', JSON.stringify(folderState));
          throw error;
        }
        setFolderState(next);
        await reload();
      } catch (error) {
        setError(error.message || 'The activity could not be moved.');
      } finally {
        setFolderBusy(false);
      }
    }
    function toggleFavourite(id) {
      const next = toggleFavouriteId(favouriteIds, id);
      try {
        localStorage.setItem('ig-favourites', JSON.stringify(next));
        setFavouriteIds(next);
      } catch {
        setError('Your favourite could not be saved in this browser.');
      }
    }
    async function editCollection(activity) {
      if(isConceptSort&&window.MLHSort.factsEnabled&&activity.sortType==='facts'){setView('facts');return;}
      setError('');
      try {
        setCollectionEdit(await resolveActivity(activity));
        setView('collection');
      } catch (error) {
        setError(error.message);
      }
    }
    async function saveCollection(activity) {
      await C.saveActivity(activity);
      if (!isConceptSort) {
        try { window.HubCollections?.importActivities([activity]); } catch { /* The game copy is already saved. */ }
      }
      if (sortEditor) {
        await refreshSavedSorts();
        returnToSort();
        return;
      }
      await reload();
      setCollectionEdit(null);
      setView('library');
    }
    const audioBadge = <span className="ig-collection-audio-tag" role="img" aria-label="Contains audio"><img src="./ui-icons/audio-svgrepo-com.svg?v=20260722-smaller15" alt="" aria-hidden="true" /></span>;
    function renderActivityGrid(rows) {
      if (fixedGame) return <div className="ig-entry-list">{[...rows].sort((a, b) => Number(b.specialMode === 'level-test' || /All Concepts/.test(b.title)) - Number(a.specialMode === 'level-test' || /All Concepts/.test(a.title))).map(activity => <div key={activity.id} className="ig-entry-item"><button type="button" className="ig-entry-choice" onClick={() => open(activity)}>{(activity.audio || activity._builtin && activity.collectionId?.endsWith('-styles')) ? <span aria-hidden="true" style={{
              position: 'relative',
              width: 36,
              height: 36,
              flex: '0 0 36px'
            }}><img src="./music-dictionary/quiz-icons/styles-speaker.png" alt="" style={{
                position: 'absolute',
                width: 27.739,
                height: 31.987,
                left: 4.196,
                top: 1.319,
                filter: 'contrast(1.25)'
              }} /></span> : activity._builtin && activity.collectionEdition === window.MLHGameCollections.collectionEdition ? <span className="ig-entry-level-glyph" aria-label={libraryLevels[activity.level]?.label}>{activity.level}</span> : <img className="ig-entry-icon" src={appConfig.icon} alt="" aria-hidden="true" />}<span className="ig-entry-copy"><strong>{activity.title}{activity.audio && audioBadge}</strong>{!activity.audio && <span>{fixedGame === 'matching-pairs' ? `${Math.floor(activity.itemCount / 4)} groups of four` : isConceptSort ? `${activity.itemCount} concepts` : `${activity.itemCount} words`}</span>}</span><svg viewBox="0 0 24 24" aria-hidden="true" className="ig-entry-arrow"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg></button>{(activity._stored||activity.sortType==='facts') && <div className="ig-saved-actions"><button type="button" aria-label={`Edit ${activity.title}`} onClick={() => editCollection(activity)}>{"Edit"}</button>{activity._stored&&<button type="button" aria-label={`Delete ${activity.title}`} onClick={() => setPendingDelete(activity)}>{"Delete"}</button>}</div>}</div>)}</div>;
      return <div className={`ig-activity-grid ${libraryView === 'list' ? 'is-list' : ''}`}>{rows.map(a => <ActivityCard key={a.id} activity={a} saved={activities.some(saved => saved.id === a.id)} favourite={favouriteIds.includes(a.id)} onFavourite={toggleFavourite} onOpen={open} onDragActivity={id => {
          draggingActivity.current = id;
        }} onDragActivityEnd={endFolderDrag} />)}</div>;
    }
    function renderCollection(group) {
      if (!userActivityCollectionsEnabled) return renderActivityGrid(group.items);
      const folders = new Map(),
        unfiled = [];
      if (group.title === 'My Activities' && !search && !gameFilter && !levelFilter) folderNames.forEach(name => folders.set(name, []));
      group.items.forEach(activity => {
        const name = ownFolder(activity);
        if (!name) {
          unfiled.push(activity);
          return;
        }
        if (!folders.has(name)) folders.set(name, []);
        folders.get(name).push(activity);
      });
      if (!folders.size) return renderActivityGrid(unfiled);
      return <div className="ig-library-folders">{[...folders].sort(([a], [b]) => a.localeCompare(b, 'en-GB', {
          sensitivity: 'base',
          numeric: true
        })).map(([name, rows]) => <details className={`ig-library-folder${folderDrop === name ? ' is-drop-target' : ''}`} key={name} open={true} onDragOver={event => {
          if (folderBusy || !activities.some(saved => saved.id === draggingActivity.current)) return;
          event.preventDefault();
          event.stopPropagation();
          event.dataTransfer.dropEffect = 'move';
          setFolderDrop(name);
        }} onDragLeave={event => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFolderDrop(current => current === name ? null : current);
        }} onDrop={event => dropInFolder(event, name)}><summary><img src="./ui-icons/folder.svg" alt="" aria-hidden="true" /><span>{name}</span><span className="ig-folder-count">{rows.length}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 7 7-7 7" /></svg></summary>{rows.length ? renderActivityGrid(rows) : <p className="ig-folder-empty">{"Drag an activity from My Activities into this folder."}</p>}</details>)}{unfiled.length > 0 && renderActivityGrid(unfiled)}</div>;
    }
    const practiceLevels = Object.fromEntries(Object.entries(libraryLevels).filter(([code]) => window.MLHConnections.levels.includes(code)));
    async function nextConnection(requestedLevel = levelFilter, levelOnly = selectedLevelOnly) {
      if (connectionGenerating.current) return;
      connectionGenerating.current = true;
      const request = ++connectionRequest.current;
      setConnectionConfetti(0);
      const level = practiceLevels[requestedLevel] ? requestedLevel : Object.keys(practiceLevels)[0];
      setError('');
      const previousId = selected?.id || new URLSearchParams(location.search).get('activity');
      try {
        let activity;
        if (classroomSeed !== null || levelOnly) {
          activity = window.MLHConnections.create(level, classroomSeed === null ? previousId : null, classroomShuffle, levelOnly);
        } else {
          let cycle;
          const draw = previous => window.MLHConnections.draw(level, previous || connectionCycle.current, C.shuffle, previousId);
          try {
            cycle = await C.updatePracticeState('connections-group-cycle:' + level, draw);
          } catch {
            cycle = draw(connectionCycle.current);
          }
          connectionCycle.current = cycle;
          activity = window.MLHConnections.fromCycle(level, cycle);
          const names=new Map(window.MLHGameConcepts.concepts.map(concept=>[concept.id,concept.name]));
          activity=window.MLHLiteracyConnections.mix(activity,C.shuffle,window.MLHConnectionsBank.banks[level].groups.map(group=>group.conceptIds.map(id=>names.get(id))));
        }
        if (request !== connectionRequest.current) return;
        const url = new URL(location.href);
        url.hash = '';
        url.searchParams.set('practice', '1');
        if (levelOnly) url.searchParams.set('selectedLevelOnly', '1');
        else url.searchParams.delete('selectedLevelOnly');
        url.searchParams.set('activity', activity.id);
        url.searchParams.set('level', level);
        url.searchParams.set('game', 'matching-pairs');
        url.searchParams.set('source', 'hub');
        url.searchParams.delete('collection');
        if (classroomSeed === null) history.replaceState({
          ...history.state,
          playnoteView: 'activity'
        }, '', url);
        setLevelFilter(level);
        setSelectedLevelOnly(levelOnly);
        setSelected(activity);
        setMode('matching-pairs');
        setOptions(current => ({
          ...C.sessionOptions(activity, false),
          sound: current.sound
        }));
        setPlaying(true);
        setAttempt(n => n + 1);
        setViewState('activity');
      } catch (error) {
        setError(error.message || 'The next Connections question could not be loaded.');
      } finally {
        connectionGenerating.current = false;
      }
    }
    function nextSort(requestedLevel=levelFilter,requestedType=selected?.sortRecipe?.type||new URLSearchParams(location.search).get('type')||'elements',levelOnly=selectedLevelOnly){
      const level=C.qualificationLevels.includes(requestedLevel)?requestedLevel:'N3';
      try{
        const type=window.MLHSort.availableTypes(level).includes(requestedType)?requestedType:'elements';
        const activity=window.MLHSort.create({level,type,includeBelow:type!=='elements'||!levelOnly,cardCount:12,shuffle:classroomShuffle});
        const url=new URL(catalogueHref,document.baseURI);url.searchParams.set('level',level);url.searchParams.set('type',type);
        if (levelOnly) url.searchParams.set('selectedLevelOnly', '1');
        setSelectedLevelOnly(levelOnly);
        if (classroomSeed === null) history.replaceState({...history.state,playnoteView:'activity'},'',url);
        setLevelFilter(level);setSelected(activity);setMode('group-sort');setOptions(current=>({...C.sessionOptions(activity,false),sound:current.sound}));setPlaying(false);setAttempt(n=>n+1);setViewState('activity');setError('');
      }catch(error){setError(error.message);}
    }
    function wordPuzzleUrl(level, category, withBelow) {
      const url = new URL(catalogueHref, document.baseURI);
      url.searchParams.set('level', level);
      if (category === 5) url.searchParams.set('literacy', withBelow ? 'cumulative' : 'level');
      else {
        if (category !== null) url.searchParams.set('category', category);
        if (!withBelow) url.searchParams.set(category === null ? 'selectedLevelOnly' : 'includeBelow', category === null ? '1' : '0');
      }
      return url;
    }
    function selectWordPuzzleLevel(level) {
      if (!selected?.tags?.includes('random-' + fixedGame)) {
        location.assign(wordPuzzleUrl(level, null, !selectedLevelOnly).href);
        return;
      }
      nextWordPuzzle(level);
    }
    function nextWordPuzzle(requestedLevel = levelFilter, category = null, withBelow = category === null && !selectedLevelOnly) {
      const level = C.qualificationLevels.includes(requestedLevel) ? requestedLevel : 'N3';
      try {
        const activity = category === null ? window.MLHGameCollections.randomWordPuzzle(level, fixedGame, classroomShuffle, withBelow) : window.MLHGameCollections.categoryWordPuzzle(level, category, fixedGame, classroomShuffle, withBelow);
        const url = wordPuzzleUrl(level, category, withBelow);
        if (classroomSeed === null) history.replaceState({
          ...history.state,
          playnoteView: 'activity'
        }, '', url);
        setSearch('');
        setLevelFilter(level);
        if (category === null) setSelectedLevelOnly(!withBelow);
        setSelected(activity);
        setMode(fixedGame);
        setOptions(current => ({
          ...C.sessionOptions(activity, false),
          sound: current.sound
        }));
        setPlaying(false);
        setAttempt(n => n + 1);
        setViewState('activity');
        setError('');
      } catch (error) {
        setError(error.message);
      }
    }
    function restartWordPuzzle() {
      const collection = selected?.tags?.includes('user-collection') && window.HubCollections?.selected();
      if (collection && isWordPuzzle) {
        openSharedConceptCollection(collection, levelFilter);
        return;
      }
      if(isConceptSort){nextSort();return;}
      const category = selected?.tags?.find(tag => tag.startsWith(fixedGame + '-category:'));
      const categoryIndex = category ? Number(category.split(':')[1]) : null;
      const params = new URLSearchParams(location.search);
      nextWordPuzzle(levelFilter, categoryIndex, categoryIndex === 5 ? params.get('literacy') === 'cumulative'
        : categoryIndex === null ? !selectedLevelOnly : params.get('includeBelow') === '1');
    }
    function openSharedConceptCollection(collection, level) {
      const activity = window.MLHGameCollections.sharedConceptActivity(collection, level, fixedGame);
      setSelected(activity);
      setMode(fixedGame);
      setOptions(current => ({ ...C.sessionOptions(activity, false), sound: current.sound }));
      setAttempt(number => number + 1);
      setPlaying(false);
      setError('');
    }
    async function reload() {
      setActivities(await C.listActivitySummaries());
    }
    async function refreshSavedSorts() {
      try {
        const list = await C.listActivitySummaries();
        setActivities(list);
        const current = list.find(activity => activity.id === selected?.id);
        if (current && current.revision !== selected.revision) {
          const updated = await C.getActivity(current.id);
          if (updated && new URLSearchParams(location.search).get('activity') === current.id) {
            setSelected(updated);
            setPlaying(false);
            setAttempt(attempt => attempt + 1);
          }
        }
      } catch (error) {
        setError(error.message);
      }
    }
    useEffect(() => {
      if (!isConceptSort) return;
      function restoreFromCache(event) {
        if (event.persisted) refreshSavedSorts();
      }
      window.addEventListener('pageshow', restoreFromCache);
      return () => window.removeEventListener('pageshow', restoreFromCache);
    }, [selected]);
    useEffect(() => {
      Promise.all([C.listActivitySummaries().catch(error => {
        if (!playerPage) setError(error.message);
        return [];
      })]).then(async ([list, d]) => {
        setActivities(list);
        const collection = isWordPuzzle && window.HubCollections?.selected();
        if (collection) { openSharedConceptCollection(collection, levelFilter); return; }
        if (sortPractice) { nextSort(levelFilter); return; }
        if (wordPuzzlePractice) {
          nextWordPuzzle(levelFilter, initialWordCategory, hasLiteracyScope ? literacyScope === 'cumulative'
            : initialWordCategory === null ? !selectedLevelOnly : wordPuzzleParams.get('includeBelow') === '1');
          return;
        }
        if (connectionsPractice) {
          await nextConnection(levelFilter);
          return;
        }
        await openShared();
      }).catch(e => setError(e.message)).finally(() => setLoading(false));
      async function openShared() {
        try {
          let a;
          if (!playerPage && (initialHash.current.startsWith('#playnote=') || initialHash.current.startsWith('#activity='))) {
            const target = new URL(catalogueHref, document.baseURI || new URL('../', location.href).href);
            target.hash = initialHash.current;
            location.replace(target.href);
            return;
          }
          if (initialHash.current.startsWith('#playnote=')) a = await window.IGSharing.readHash(initialHash.current);else if (initialHash.current.startsWith('#activity=')) {
            const data = decodeURIComponent(escape(atob(initialHash.current.slice(10))));
            [a] = C.normalizeImport(data);
            a.id = C.sharedActivityId(a);
          }
          if (!a && playerPage) {
            const query = new URLSearchParams(location.search),
              id = query.get('activity');
            if (!id) throw new Error('Choose an activity from the library.');
            a = query.get('source') === 'hub' ? await window.IGRuntime.activity(id) : await C.getActivity(id);
            if (!a) throw new Error('This activity is no longer saved in this browser.');
          }
          if (!a) return;
          if(isConceptSort&&!window.MLHSort.factsEnabled&&a.sortRecipe?.type==='facts'){nextSort(a.level,'elements');return;}
          if (a.template === 'rank-order' && a.tags?.includes('Music Literacy')) {
            const target = new URL('./rhythmsums.html', document.baseURI);
            target.searchParams.set('level', a.level);
            target.searchParams.set('mode', 'order');
            location.replace(target.href);
            return;
          }
          if (appConfig && !appConfig.templates.includes(a.template) && window.MLHMusicGames.forTemplate(a.template).id !== appConfig.id) {
            const target = window.MLHMusicGames.activityUrl(document.baseURI, a, {
              source: new URLSearchParams(location.search).get('source') || 'saved',
              hash: initialHash.current
            });
            location.replace(target.href);
            return;
          }
          let reloadingCurrent = false;
          try {
            reloadingCurrent = sessionStorage.getItem('ig-active-game-hash') === initialHash.current;
          } catch {}
          if (isConceptSort && C.qualificationLevels.includes(requestedSort.get('level'))) {
            setLevelFilter(requestedSort.get('level'));
          } else if (appConfig && (C.qualificationLevels.includes(a.level) || isWordPuzzle && a.level === 'ALL')) {
            setLevelFilter(a.level);
          }
          setSelected(a);
          setMode(a.template);
          setOptions(C.sessionOptions(a, initialHash.current.startsWith('#playnote=') || initialHash.current.startsWith('#activity=')));
          setView('activity');
          if (!reloadingCurrent && initialHash.current && !fixedGame) setNotice('Shared activity opened. Download a copy to keep it.');
        } catch (error) {
          if (!playerPage) setView('library');
          setError(`Could not open activity: ${error.message || 'The link is invalid.'}`);
        }
      }
    }, []);
    async function resolveActivity(activity) {
      if (activity?._builtin) return window.IGRuntime.activity(activity.id);
      if (activity?._stored) {
        const stored = await C.getActivity(activity.id);
        if (!stored) throw new Error('This activity is no longer saved in this browser.');
        return {
          ...stored,
          folder: activity.folder ?? stored.folder
        };
      }
      return activity;
    }
    function open(activity) {
      if(isConceptSort&&activity.sortType){nextSort(activity.level,activity.sortType);return;}
      const target = new URL(window.MLHMusicGames?.forTemplate(activity.template).href || catalogueHref, document.baseURI || new URL('../', location.href).href);
      target.searchParams.set('activity', activity.id);
      target.searchParams.set('level', levelFilter);
      target.searchParams.set('game', activity.template);
      target.searchParams.set('source', activity._builtin ? 'hub' : 'saved');
      if (isWordPuzzle && target.href === location.href) return;
      if (fixedGame && !isWordPuzzle) location.replace(target.href);else location.assign(target.href);
    }
    function toggleAudio() {
      const sound = !options.sound;
      C.saveSoundPreference(sound);
      setOptions(value => ({
        ...value,
        sound
      }));
    }
    async function remove() {
      try {
        await C.deleteActivity(pendingDelete.id);
        await reload();
        setPendingDelete(null);
        if (isConceptSort) {
          if (selected?.id === pendingDelete.id) nextSort(levelFilter, 'elements');
        } else {
          setView('library');
        }
      } catch (e) {
        setError(e.message);
      }
    }
    const isSaved = selected && activities.some(a => a.id === selected.id);
    const results = classroomRace && activityHasAudio(selected)
      ? { ok: false, reason: window.MLH.classroomActivities.raceListeningMessage }
      : C.compatibility(mode, selected || {
      items: []
    });
    const filteredActivities = all.filter(a => isCollectionGame ? a._stored : (!gameFilter || a.template === gameFilter) && (!levelFilter || C.visibleAtLevel(a, levelFilter)) && `${a.title} ${a.description}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => a.title.localeCompare(b.title, 'en-GB', {
      sensitivity: 'base',
      numeric: true
    }));
    const favouriteActivities = all.filter(a => (!isCollectionGame || a._stored) && favouriteIds.includes(a.id) && (!levelFilter || C.visibleAtLevel(a, levelFilter))).sort((a, b) => a.title.localeCompare(b.title, 'en-GB', {
      sensitivity: 'base',
      numeric: true
    }));
    function wordPuzzleMenuRow({
      id,
      title,
      count,
      icon,
      audio,
      onClick,
      active
    }) {
      return <button key={id} type="button" className={"ig-crossword-menu-row" + (id === 'create' ? ' ig-crossword-menu-create' : '')} aria-current={active ? 'true' : undefined} onClick={onClick}>{icon && <span className="ig-crossword-menu-icon-frame"><img className="ig-crossword-menu-icon" src={icon} alt="" aria-hidden="true" /></span>}<span className="ig-crossword-menu-copy"><strong>{title}{audio && audioBadge}</strong>{count && <small>{count}{" "}{isConceptSort ? count === 1 ? 'concept' : 'concepts' : count === 1 ? 'word' : 'words'}</small>}</span>{active && <img className="ig-crossword-menu-tick" src="./ui-icons/tick.svg" alt="Selected" />}</button>;
    }
    const sortMenuCollections=isConceptSort?window.MLHSort.collections.filter(row=>row.level===levelFilter):[];
    const savedSorts = isConceptSort ? activities.filter(activity => activity.template === fixedGame)
      .sort((a, b) => a.title.localeCompare(b.title, 'en-GB', { numeric: true, sensitivity: 'base' })) : [];
    const sortElementsCount=isConceptSort?window.MLHSort.data.concepts.filter(concept=>concept.categories.some(group=>window.MLHSort.elements.includes(group))&&(selectedLevelOnly ? concept.level===levelFilter : C.qualificationLevels.indexOf(concept.level)<=C.qualificationLevels.indexOf(levelFilter))).length:0;
    const sortElementsSelected=selected?.sortRecipe?.type==='elements';
    const standardConnections = connectionsPractice && selected?.tags?.includes('generated-connections') &&
      !selected.tags.includes('literacy-connections') && !window.MLHGameMedals.isUserCollection(selected);
    const showScopeToggle = isConceptSort ? sortElementsSelected && selected?.tags?.includes('generated-sort') && !window.MLHGameMedals.isUserCollection(selected)
      : isWordPuzzle ? selected?.tags?.includes('random-' + fixedGame) : standardConnections;
    const scopeToggle = levelFilter !== 'N3' && showScopeToggle && <window.MLH.SelectedLevelOnlyToggle level={levelFilter} checked={selectedLevelOnly} onChange={() => {
      if (isConceptSort) nextSort(levelFilter, 'elements', !selectedLevelOnly);
      else if (isWordPuzzle) nextWordPuzzle(levelFilter, null, selectedLevelOnly);
      else nextConnection(levelFilter, !selectedLevelOnly);
    }} />;
    const wordPuzzleMenu = isConceptSort ? <div className="ig-crossword-collections-menu">
      {scopeToggle}
      <window.MLH.MenuSubheading>Sorts</window.MLH.MenuSubheading>
      {wordPuzzleMenuRow({id:'elements',title:'Headings',count:sortElementsCount,icon:'./ui-icons/concept-sort.svg',active:sortElementsSelected,onClick:()=>nextSort(levelFilter,'elements')})}
      {sortMenuCollections.map(row=>wordPuzzleMenuRow({id:row.type,title:row.title,count:row.count,icon:row.icon,audio:row.audio,active:selected?.sortRecipe?.type===row.type,onClick:()=>nextSort(levelFilter,row.type)}))}
      {savedSorts.length > 0 && <window.MLH.MenuSubheading>Custom Sorts</window.MLH.MenuSubheading>}
      {savedSorts.map(activity => <div className="ig-saved-sort-row" key={activity.id}>
        {wordPuzzleMenuRow({id:activity.id,title:activity.title,count:activity.itemCount,icon:'./ui-icons/concept-sort.svg',active:selected?.id===activity.id,onClick:()=>{ if (selected?.id !== activity.id) open(activity); }})}
        <button type="button" aria-label={'Edit ' + activity.title} title={'Edit ' + activity.title} onClick={() => openSortEditor(activity.id)}>
          <img src="./ui-icons/pencil.svg" alt="" />
        </button>
        <button type="button" aria-label={'Delete ' + activity.title} title={'Delete ' + activity.title} onClick={() => setPendingDelete(activity)}>
          <img src="./ui-icons/bin.svg" alt="" />
        </button>
      </div>)}
    </div> : isWordPuzzle ? <div className="ig-crossword-collections-menu">
      {scopeToggle}
      {window.HubCollections.menu(fixedGame, null, levelFilter)}
    </div> : scopeToggle;
    const sortMenuFooter = isConceptSort && <>
      <hr className="ig-sort-create-divider" />
      {wordPuzzleMenuRow({id:'create',title:'Create',onClick:()=>openSortEditor()})}
    </>;
    let classroomShareUrl;
    if (fixedGame && ['crosswords', 'wordsearch', 'conceptsort'].includes(appConfig?.id) &&
        selected && view === 'activity' && share.key === shareKey && share.url) {
      const url = new URL(share.url, location.href);
      if (activityHasAudio(selected)) {
        url.searchParams.set('classroomListening', '1');
      }
      classroomShareUrl = url.href;
    }
    return <WordPuzzleCollectionsContext.Provider value={{ menu: wordPuzzleMenu, footer: sortMenuFooter }}><div className={`${window.MLH.shell.pageShellClass} ig-workspace`}><window.MLH.AppHeader icon={appConfig?.icon || './app-icons/concept-quiz-icon.svg'} title={publicTitle} subtitle={appConfig?.subtitle || 'Practise music concepts with quizzes, matching and sorting games.'} worksheetConfig={['crossword','wordsearch'].includes(fixedGame) && selected && view === 'activity' ? async () => {
          await window.IGRuntime.load('player', fixedGame);
          return window.MLHWordPuzzleWorksheet.createConfig(selected, fixedGame, window.IGLearningPuzzles, C.shuffle);
        } : undefined} profileUsesSharedSettings={false} profileShowLabel={false} profileShareUrl={share.url || undefined} classroomActivityUrl={classroomShareUrl} profileShareDisabled={share.key !== shareKey || !share.url}>{fixedGame && view === 'activity' && (selected || appConfig?.id === 'connections') && <div id="ig-header-game-stats" className="ig-header-game-stats" />}</window.MLH.AppHeader><div className={`${window.MLH.shell.pageContentClass} ig-page-content`}><main className={`${window.MLH.shell.mainShellClass} ig-app ig-wordwall ig-view-${view}${fixedGame ? ' ig-dedicated-game' : ''}`}>{playerPage && !selected && (appConfig?.id === 'connections' && loading ? <section className="ig-resource-card ig-panel ig-connection-loading" aria-label="Loading Connections" aria-busy="true" style={{
              minHeight: window.MLHConnectionsRefresh?.placeholderHeight || 760
            }}><div className="ig-resource-toolbar hub-toolbar"><LibraryLevelPicker level={levelFilter} levels={practiceLevels} onLevel={() => {}} /><span /><div className="ig-toolbar-skip"><window.MLH.SkipButton disabled={true} icon={<img src="./ui-icons/next.svg" alt="" aria-hidden="true" className="h-[27.8px] w-[27.8px] object-contain" />} /></div></div><ConnectionsLoader /></section> : <p role="status">{loading ? 'Loading activity…' : <a href={catalogueHref}>{"Return to activities"}</a>}</p>)}{error && <div className="ig-alert" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError('')}>{"\xD7"}</button></div>}{share.key === shareKey && share.error && <p className="ig-alert" role="alert">{share.error}</p>}{view==='facts'&&isConceptSort&&window.MLHSort.factsEnabled?<MusicalFactsEditor level={levelFilter} onBack={()=>setView('library')}/>:view === 'collection' && fixedGame ? <CollectionBuilder key={collectionEdit?.id || 'new'} level={levelFilter} initial={collectionEdit} onBack={() => setView('library')} onSave={saveCollection} /> : view === 'library' ? <React.Fragment><section className="ig-library-layout"><div className="ig-library-main ig-panel"><LibraryJourney favourites={favouriteActivities.length ? renderActivityGrid(favouriteActivities) : null} toolbarActions={!isCollectionGame && libraryStage === 'packs' ? <div className="hub-toolbar ig-library-toolbar ig-journey-actions" aria-label="Collection controls"><input type="search" aria-label="Search" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} /></div> : null} game={gameFilter} level={levelFilter} stage={libraryStage} onStage={stage => navigateLibrary(stage)} onGame={id => navigateLibrary('packs', levelFilter, id)} onLevel={id => navigateLibrary(fixedGame ? 'packs' : 'games', id, fixedGame)} />{libraryStage === 'packs' && <React.Fragment>{loading ? <p>{"Loading your activities\u2026"}</p> : (userActivityCollectionsEnabled ? [{
                      title: 'The Music Learning Hub',
                      items: filteredActivities.filter(a => !activities.some(saved => saved.id === a.id))
                    }, {
                      title: 'My Activities',
                      items: filteredActivities.filter(a => activities.some(saved => saved.id === a.id))
                    }] : isCollectionGame ? [{title:'My Collections',items:filteredActivities}] : fixedGame ? [...(filteredActivities.some(a => !a._stored) ? [{
                      title: 'Collections',
                      items: filteredActivities.filter(a => !a._stored)
                    }] : []), {
                      title: 'My Collections',
                      items: filteredActivities.filter(a => a._stored)
                    }] : [{
                      title: 'Collections',
                      items: filteredActivities
                    }]).map(group => <section className="ig-library-group" key={group.title} aria-label={group.title}>{fixedGame ? <div className="ig-collections-heading"><h2>{group.title}</h2><p className="ig-collection-subtitle">{group.title === 'Collections' ? 'Choose a collection to start a game.' : 'Collections you have created.'}</p>{group.title === 'My Collections' && <button type="button" className="ig-primary" onClick={() => {
                          setCollectionEdit(null);
                          setView('collection');
                        }}>{"Create"}</button>}</div> : group.title !== 'Collections' && <div className="ig-library-title"><h2>{group.title}</h2><p className="ig-library-subtitle">{group.title === 'My Activities' ? 'Your activities are saved in this browser. Download them to keep a backup.' : 'Choose the collection you want to practise.'}</p>{group.title === 'My Activities' && <button type="button" className="ig-new-folder" onClick={() => openFolderDialog()}><img src="./ui-icons/folder.svg" alt="" aria-hidden="true" />{"Create Folder"}</button>}</div>}{group.items.length || group.title === 'My Activities' && folderNames.length && !search && !gameFilter && !levelFilter ? fixedGame ? renderActivityGrid(group.items) : group.title === 'Collections' ? <div className="ig-topic-groups">{groupTopics(group.items).map(topic => <section className="ig-topic-group" key={topic.title} aria-label={topic.title}><h3 className="ig-topic-heading"><span>{topic.title}</span><span className="ig-topic-count">{topic.items.length}</span></h3>{renderActivityGrid(topic.items)}</section>)}</div> : renderCollection(group) : fixedGame && group.title === 'My Collections' ? null : search || gameFilter || levelFilter ? <p className="ig-muted">{"No matching activities."}</p> : group.title === 'My Activities' ? <div className="ig-library-empty" aria-hidden="true" /> : <p className="ig-muted">{"No activities available."}</p>}</section>)}</React.Fragment>}</div></section></React.Fragment> : selected && <React.Fragment><div className="ig-resource-layout"><div className="ig-resource-main"><section className="ig-resource-card ig-panel">{showPracticeControls&&<GameToolbar activity={selected} mode={mode} classroomPractice={classroomPractice} onCustomise={isConceptSort ? refreshSavedSorts : undefined} sortLevel={isConceptSort ? levelFilter : undefined} onRestart={() => selected.tags?.some(tag => ['random-crossword', 'category-crossword', 'random-wordsearch', 'category-wordsearch', 'generated-sort'].includes(tag)) ? restartWordPuzzle() : setAttempt(n => n + 1)} onSkip={appConfig?.id === 'connections' ? skipConnection : undefined} onLevel={isConceptSort ? nextSort : isWordPuzzle ? selectWordPuzzleLevel : connectionsPractice ? level => nextConnection(level) : undefined} levels={connectionsPractice ? practiceLevels : undefined} />}<div className="ig-resource-game">
      {retryRace&&mode==='group-sort'&&<div data-timed-race-toolbar=""><div ref={setRaceSubmitSlot} className="timed-race-submit-slot"/></div>}
      {showPracticeControls && isWordPuzzle && !selected.tags?.includes('random-' + fixedGame) &&
        <h2 className="ig-fullscreen-collection-title hub-collection-toolbar-title">{window.HubCollections.clearCollectionLink(selected.title, selected.level)}</h2>}
      <LazyScreen kind="player" mode={mode}>{() => results.ok ? selected.specialMode === 'level-test' ? <window.IGLevelTestSession key={`${selected.id}-${attempt}`} activity={selected} /> : <window.IGGameSession raceSubmitSlot={raceSubmitSlot} connectionScore={appConfig?.id === 'connections' ? connectionScore : undefined} connectionConfetti={connectionConfetti} connectionMedalEligible={connectionMedalEligible} onConnectionComplete={markConnectionGame} externalControls={true} onNextQuestion={!showPracticeControls?undefined:appConfig?.id === 'connections' ? () => nextConnection() : selected.tags?.some(tag => ['random-crossword', 'category-crossword', 'random-wordsearch', 'category-wordsearch', 'generated-sort'].includes(tag)) ? () => restartWordPuzzle() : undefined} onAudio={toggleAudio} soundPreferenceResolved={true} active={playing} onStart={() => { classroomProgress?.write("playing",true); setPlaying(true); }} onRestart={retryRace ? () => setAttempt(n => n + 1) : !showPracticeControls?undefined:appConfig?.id === 'connections' ? resetConnections : selected.tags?.some(tag => ['random-crossword', 'category-crossword', 'random-wordsearch', 'category-wordsearch', 'generated-sort'].includes(tag)) ? () => restartWordPuzzle() : () => setAttempt(n => n + 1)} key={`${selected.id}-${mode}-${attempt}-${options.timer}-${options.shuffle}-${options.difficulty}`} activity={selected} mode={mode} options={classroomSeed===null?options:{...options,classroomSeed,...(retryRace?{timer:0,shuffle:true}:{})}} onExit={() => {
                          if (selected.tags?.some(tag => ['random-crossword', 'category-crossword', 'random-wordsearch', 'category-wordsearch', 'generated-sort'].includes(tag))) restartWordPuzzle();else {
                            setPlaying(false);
                            setAttempt(n => n + 1);
                          }
                        }} /> : <p className="ig-error">{results.reason}{" Edit content to use this template."}</p>}</LazyScreen>
      {isConceptSort && sortEditor && <Modal inline hideTitle title={sortEditor.id ? "Edit Sort" : "Create Sort"} onClose={returnToSort}>
        {!sortEditor.id || (sortEditorLoad?.editor === sortEditor && sortEditorLoad.activity)
          ? <CollectionBuilder key={sortEditor.id || 'new'} level={levelFilter} initial={sortEditor.id ? sortEditorLoad.activity : null} inOverlay onBack={returnToSort} onSave={saveCollection} />
          : <section className="ig-sort-editor-loading">
            <window.MLH.ToolbarButton label="Cancel" onClick={returnToSort} />
            {sortEditorLoad?.editor === sortEditor && sortEditorLoad.error
              ? <p role="alert">{sortEditorLoad.error}</p>
              : <p role="status">Loading sort…</p>}
          </section>}
      </Modal>}
      </div>{C.instructionsFor(selected, mode) && <p className="ig-game-instructions ig-game-instructions-below" aria-label="Instructions">{C.instructionsFor(selected, mode)}</p>}</section></div></div></React.Fragment>}</main></div>{folderDialog && <Modal title="Create folder" hideTitle={true} variant="folder" onClose={() => {
          if (!folderBusy) setFolderDialog(null);
        }}><form className="ig-folder-form" onSubmit={submitFolder}><label>{"Name"}<input autoFocus={true} value={folderName} maxLength={100} onChange={event => {
                setFolderName(event.target.value);
                setFolderError('');
              }} disabled={folderBusy} /></label>{folderError && <p className="ig-error" role="alert">{folderError}</p>}<div className="ig-inline ig-centred"><button type="button" disabled={folderBusy} onClick={() => setFolderDialog(null)}>{"Cancel"}</button><button type="submit" className="ig-primary" disabled={folderBusy || !folderName.trim()}>{folderBusy ? 'Saving…' : 'Create'}</button></div></form></Modal>}{pendingDelete && <Modal title={isConceptSort ? "Delete Sort" : "Delete Activity"} variant="delete" onClose={() => setPendingDelete(null)}><p>{"Delete \u201C"}{pendingDelete.title}{"\u201D from this browser?"}</p><div className="ig-inline ig-centred ig-delete-actions"><button onClick={() => setPendingDelete(null)}>{"Cancel"}</button><button className="ig-danger" onClick={remove}><img src="./ui-icons/bin.svg" alt="" aria-hidden="true" />{"Delete"}</button></div></Modal>}</div></WordPuzzleCollectionsContext.Provider>;
  }
  class Boundary extends React.Component {
    constructor(p) {
      super(p);
      this.state = {
        error: null
      };
    }
    static getDerivedStateFromError(error) {
      return {
        error
      };
    }
    render() {
      return this.state.error ? <div className="ig-app ig-alert"><h1>{"This game could not open the activity."}</h1><p>{this.state.error.message}</p><button onClick={() => location.reload()}>{"Reload"}</button></div> : this.props.children;
    }
  }
  ReactDOM.createRoot(document.getElementById('root')).render(<Boundary><App /></Boundary>);
})();
