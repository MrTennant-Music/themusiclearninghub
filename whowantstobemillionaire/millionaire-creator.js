const CUSTOM_SETS = window.MILLIONAIRE_CUSTOM_SETS;
const CREATOR_RESUME_KEY = "mlh-millionaire-creator-resume";
const CREATOR_PRIZES = ["£100", "£200", "£300", "£500", "£1,000", "£2,000", "£4,000", "£8,000", "£16,000", "£32,000", "£64,000", "£125,000", "£250,000", "£500,000", "£1 MILLION"];

function readCreatorResume() {
  try {
    const saved = JSON.parse(localStorage.getItem(CREATOR_RESUME_KEY) || "null");
    return saved && typeof saved.setId === "string" ? saved : null;
  } catch {
    return null;
  }
}

function clearCreatorResume() {
  try { localStorage.removeItem(CREATOR_RESUME_KEY); } catch {}
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function blobToDataUrl(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length)));
  }
  return `data:${blob.type || "application/octet-stream"};base64,${btoa(binary)}`;
}

async function makePlayOnlyQuestion(question) {
  const copy = {
    prompt: question.prompt,
    answers: question.answers,
    correctAnswerIndex: question.correctAnswerIndex,
    hint: question.hint,
    youtubeUrl: question.youtubeUrl || "",
    media: null,
  };
  if (question.image?.blob instanceof Blob) {
    copy.media = { type: "image", src: await blobToDataUrl(question.image.blob), alt: question.imageAlt || "Question image", sourceUrl: question.image.sourceUrl || "", credit: question.image.credit || "", license: question.image.license || "" };
  } else if (question.audio?.blob instanceof Blob) {
    copy.media = { type: "audio", src: await blobToDataUrl(question.audio.blob), sourceUrl: question.audio.sourceUrl || "", credit: question.audio.credit || "", license: question.audio.license || "" };
  }
  return copy;
}

async function getPlayOnlyAsset(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Could not load ${path}.`);
    return blobToDataUrl(await response.blob());
  } catch {
    return "";
  }
}

async function buildPlayOnlyHtml(set) {
  const game = {
    title: set.title,
    shuffle: set.shuffleVariants || [],
    questions: await Promise.all(set.questions.map(makePlayOnlyQuestion)),
    versions: await Promise.all((set.variants || []).map((versions) => Promise.all(versions.map(makePlayOnlyQuestion)))),
    assets: Object.fromEntries(await Promise.all([
      ["logo", "whowantstobemillionaire/millionairelogo new.svg"],
      ["background", "whowantstobemillionaire/gameback-optimized.webp"],
      ["fifty", "whowantstobemillionaire/50.50.svg"],
      ["hint", "whowantstobemillionaire/hint.svg"],
      ["switch", "whowantstobemillionaire/switch.svg"],
      ["tick", "ui-icons/tick.svg"],
    ].map(async ([name, path]) => [name, await getPlayOnlyAsset(path)]))),
  };
  const gameJson = JSON.stringify(game).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Millionaire</title><link rel="icon" href="${game.assets.logo}">
<style>
*{box-sizing:border-box}body{min-width:320px;margin:0;background:#06133b;color:#fff;font-family:Arial,sans-serif}.play-only-page{min-height:100vh;padding:22px;background:radial-gradient(circle at 50% 0,#143f9b22,transparent 45%),#06133b}.play-only-board{width:min(1180px,100%);min-height:680px;margin:auto;overflow:hidden;border:2px solid #2b69d2;border-radius:20px;background:#06153d}.play-only-grid{display:grid;min-height:680px;grid-template-columns:minmax(0,1fr) 270px}.play-only-stage{position:relative;display:grid;min-height:680px;grid-template-rows:auto minmax(210px,1fr) auto auto;gap:14px;padding:24px;background:linear-gradient(#02061388,#02061366),var(--background) center/cover}.play-only-title{margin:0;color:#fff;font-size:36px;font-weight:900;text-align:center;text-shadow:0 2px 5px #000}.play-only-hint{display:flex;min-height:44px;align-items:center;justify-content:center;gap:12px;border:1px solid #f5bf28;border-radius:12px;background:#030619d9;padding:10px 18px;color:#f7c846;font-size:14px;font-weight:800}.play-only-hint span{color:#fff}.play-only-media{display:grid;min-height:140px;place-items:center;border:2px solid #cbd5e1;border-radius:16px;background:#03091ad9;padding:14px}.play-only-media img{max-width:100%;max-height:270px;border-radius:10px}.play-only-media audio{width:min(100%,460px)}.play-only-media a{border:1px solid #7db4ff;border-radius:10px;background:#1647a4;padding:12px 17px;color:#fff;font-weight:800;text-decoration:none}.play-only-question{position:relative;margin:0;border:2px solid #fff;border-radius:7px;background:linear-gradient(90deg,#06082d,#173e9a);padding:18px 42px;color:#fff;font-size:34px;font-weight:900;line-height:1.1;text-align:center;text-shadow:0 2px 4px #000}.play-only-answers{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.play-only-answer{min-height:58px;border:2px solid #fff;border-radius:8px;background:linear-gradient(90deg,#030629,#1745a5);padding:12px 18px;color:#fff;font:inherit;font-size:23px;font-weight:900;cursor:pointer;text-shadow:0 2px 4px #000}.play-only-answer:hover:not(:disabled){filter:brightness(1.2)}.play-only-answer.is-correct{border-color:#b7f7d0;background:#15803d}.play-only-answer.is-wrong{border-color:#fecaca;background:#b91c1c}.play-only-answer.is-hidden{visibility:hidden}.play-only-tools{display:flex;justify-content:center;gap:14px;margin-top:2px}.play-only-lifeline{display:grid;width:82px;height:49px;place-items:center;border:0;background:transparent;cursor:pointer}.play-only-lifeline img{display:block;max-width:100%;max-height:100%;filter:drop-shadow(0 2px 4px #000)}.play-only-lifeline:disabled{opacity:.35;cursor:default}.play-only-message{min-height:24px;margin:0;color:#fff;font-weight:800;text-align:center}.play-only-next{display:block;margin:10px auto 0;border:1px solid #fff;border-radius:10px;background:#f5ae19;padding:11px 18px;color:#111d4d;font:inherit;font-weight:900;cursor:pointer}.play-only-ladder{display:flex;flex-direction:column;justify-content:space-between;background:linear-gradient(90deg,#02051d,#123c9c);padding:16px 12px}.play-only-ladder-icons{display:flex;justify-content:center;gap:6px;margin-bottom:10px}.play-only-ladder-icons img{width:76px;height:48px;object-fit:contain}.play-only-prizes{display:flex;flex:1;flex-direction:column;justify-content:space-between}.play-only-prize{display:flex;align-items:center;justify-content:space-between;min-height:30px;padding:2px 11px;color:#f6c453;font-family:Georgia,serif;font-size:23px;font-weight:900;white-space:nowrap}.play-only-prize.is-safe{color:#fff}.play-only-prize.is-current{border:1px solid #ffe6a0;border-radius:7px;background:linear-gradient(#ffc84b,#ee8a00);color:#07133d}.play-only-prize.is-complete::after{content:'✓';color:#21d66b;font-family:Arial,sans-serif;font-size:15px}.play-only-cover{display:grid;min-height:640px;place-items:center;background:#06153d}.play-only-cover img{width:260px;height:auto}.play-only-end{display:grid;min-height:620px;place-items:center;align-content:center;gap:16px;text-align:center}.play-only-end h1{margin:0;font-size:50px}.play-only-end h2{margin:0;color:#f6c453;font-size:54px}
</style></head><body><main class="game" id="app"><section class="play-only-cover"><img src="${game.assets.logo}" alt="Who Wants to Be a Millionaire?"></section></main><script>
const game=${gameJson};const PRIZES=['£100','£200','£300','£500','£1,000','£2,000','£4,000','£8,000','£16,000','£32,000','£64,000','£125,000','£250,000','£500,000','£1 MILLION'];let stage=0,current=null,locked=false,fifty=false,hint=false,switched=false,completed=[];
const app=document.getElementById('app');document.title=game.title+' – Play Only';
function pickQuestion(index,avoid,forceDifferent=false){const options=[game.questions[index],...(game.versions[index]||[])];const allowed=options.filter((_,i)=>i!==avoid);const pool=allowed.length?allowed:options;const selected=forceDifferent||game.shuffle[index]!==false?pool[Math.floor(Math.random()*pool.length)]:options[0];return {question:selected,index:options.indexOf(selected)};}
function startStage(){const picked=pickQuestion(stage);current=picked.question;current.optionIndex=picked.index;locked=false;fifty=false;hint=false;switched=false;render();}
function escapeHtml(value){const el=document.createElement('div');el.textContent=value||'';return el.innerHTML}
function mediaCredit(q){return q.media?.sourceUrl?'<a class="millionaire-media-credit" target="_blank" rel="noopener" href="'+escapeHtml(q.media.sourceUrl)+'" title="'+escapeHtml([q.media.credit,q.media.license].filter(Boolean).join(' · '))+'">Media credit</a>':''}
function mediaMarkup(q){if(q.media?.type==='image')return '<div class="play-only-media"><img src="'+q.media.src+'" alt="'+escapeHtml(q.media.alt)+'">'+mediaCredit(q)+'</div>';if(q.media?.type==='audio')return '<div class="play-only-media"><audio controls src="'+q.media.src+'"></audio>'+mediaCredit(q)+'</div>';if(q.youtubeUrl)return '<div class="play-only-media"><a target="_blank" rel="noopener" href="'+escapeHtml(q.youtubeUrl)+'">Open video</a></div>';return '<div class="play-only-media"></div>'}
function ladderMarkup(){return '<aside class="play-only-ladder"><div class="play-only-ladder-icons">'+[['fifty','50:50'],['hint','Hint'],['switch','Switch']].map(([icon,label])=>game.assets[icon]?'<img src="'+game.assets[icon]+'" alt="'+label+'">':'').join('')+'</div><div class="play-only-prizes">'+PRIZES.map((prize,index)=>'<div class="play-only-prize '+(index===stage?'is-current ':'')+(completed.includes(index)?'is-complete ':'')+([4,9,14].includes(index)?'is-safe':'')+'"><span>'+(index+1)+'</span><span>'+prize+'</span></div>').reverse().join('')+'</div></aside>'}
function render(){if(stage>=game.questions.length){app.innerHTML='<section class="play-only-board play-only-end"><img src="'+game.assets.logo+'" alt="Who Wants to Be a Millionaire?"><h1>'+escapeHtml(game.title)+'</h1><h2>You reached £1 million!</h2><button class="play-only-next" id="restart">Play again</button></section>';document.getElementById('restart').onclick=()=>{stage=0;completed=[];startStage()};return}const q=current;const wrong=q.answers.map((_,i)=>i).filter(i=>i!==q.correctAnswerIndex);const hidden=fifty?wrong.slice(0,2):[];app.className='play-only-page';app.style.setProperty('--background',game.assets.background?'url('+game.assets.background+')':'none');app.innerHTML='<section class="play-only-board"><div class="play-only-grid"><section class="play-only-stage"><h1 class="play-only-title">'+escapeHtml(game.title)+'</h1>'+(hint&&q.hint?'<p class="play-only-hint">Hint <span>'+escapeHtml(q.hint)+'</span></p>':'')+mediaMarkup(q)+'<h2 class="play-only-question">'+escapeHtml(q.prompt)+'</h2><div><div class="play-only-answers">'+q.answers.map((answer,i)=>'<button class="play-only-answer '+(hidden.includes(i)?'is-hidden':'')+'" data-answer="'+i+'">'+String.fromCharCode(65+i)+': '+escapeHtml(answer)+'</button>').join('')+'</div><div class="play-only-tools"><button class="play-only-lifeline" id="hint" title="Hint" '+(hint?'disabled':'')+'>'+(game.assets.hint?'<img src="'+game.assets.hint+'" alt="Hint">':'Hint')+'</button><button class="play-only-lifeline" id="fifty" title="50:50" '+(fifty?'disabled':'')+'>'+(game.assets.fifty?'<img src="'+game.assets.fifty+'" alt="50:50">':'50:50')+'</button><button class="play-only-lifeline" id="switch" title="Switch question" '+(switched?'disabled':'')+'>'+(game.assets.switch?'<img src="'+game.assets.switch+'" alt="Switch">':'Switch')+'</button></div><p class="play-only-message" id="message"></p></div></section>'+ladderMarkup()+'</div></section>';document.querySelectorAll('[data-answer]').forEach(button=>button.onclick=()=>answer(Number(button.dataset.answer)));document.getElementById('hint').onclick=()=>{hint=true;render()};document.getElementById('fifty').onclick=()=>{fifty=true;render()};document.getElementById('switch').onclick=()=>{const picked=pickQuestion(stage,current.optionIndex,true);current=picked.question;current.optionIndex=picked.index;switched=true;render()};}
function answer(index){if(locked)return;locked=true;const correct=index===current.correctAnswerIndex;const buttons=document.querySelectorAll('[data-answer]');buttons.forEach(button=>{const i=Number(button.dataset.answer);if(i===current.correctAnswerIndex)button.classList.add('is-correct');else if(i===index)button.classList.add('is-wrong');button.disabled=true});const message=document.getElementById('message');message.textContent=correct?'Correct!':'Not quite.';const next=document.createElement('button');next.className='play-only-next';next.textContent=correct?(stage===game.questions.length-1?'Finish':'Next question'):'Try again';next.onclick=()=>{if(correct){completed.push(stage);stage++}else{stage=0;completed=[]}startStage()};message.after(next)}startStage();
</script></body></html>`;
}

function CreatorDialog({ title, onClose, children, actions, destructive = false, variant }) {
  const mediaLibrary = variant === "image-bank";
  const titleId = React.useId();
  const dialogRef = React.useRef(null);
  const previousFocus = React.useRef(document.activeElement);
  React.useEffect(() => {
    const dialog = dialogRef.current;
    const focusable = () => [...dialog.querySelectorAll("button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex='-1'])")];
    window.setTimeout(() => (focusable()[0] || dialog)?.focus(), 0);
    function onKeyDown(event) {
      if (event.key === "Escape" && !destructive) { event.preventDefault(); onClose?.(); return; }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus.current?.focus?.({ preventScroll: true });
    };
  }, [onClose, destructive]);
  const dialog = <div className={`millionaire-dialog-backdrop${mediaLibrary ? " ig-modal-backdrop ig-image-bank-backdrop" : ""}`} onPointerDown={(event) => {
    if (event.target === event.currentTarget && !destructive) onClose?.();
  }}>
    <section ref={dialogRef} className={`millionaire-dialog millionaire-creator-dialog${mediaLibrary ? " ig-modal ig-image-bank-modal" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex="-1">
      {mediaLibrary && <button type="button" className="ig-modal-close" aria-label="Close" onClick={onClose}>×</button>}
      <h2 id={titleId}>{title}</h2>
      {children}
      {!mediaLibrary && <div className="millionaire-dialog-actions">{actions}</div>}
    </section>
  </div>;
  return mediaLibrary ? ReactDOM.createPortal(dialog, document.fullscreenElement || document.body) : dialog;
}

function CreatorFrame({ title, subtitle, onBack, children, actions = null, popover = false }) {
  const headingRef = React.useRef(null);
  React.useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [title]);
  const content = <>
    <header className="millionaire-creator-header">
      {!popover && <button type="button" className="millionaire-secondary millionaire-creator-main-menu" onClick={onBack}>← Back to Main Menu</button>}
      <div>
        <h2 ref={headingRef} tabIndex="-1">{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="millionaire-creator-header-actions">{actions}</div>
    </header>
    {children}
    {popover && <div className="millionaire-rules-actions millionaire-creator-library-back-actions">
      <button type="button" className="millionaire-secondary millionaire-play millionaire-opening-play millionaire-back-button millionaire-creator-main-menu" onClick={onBack}><span className="millionaire-opening-play-label">Back</span></button>
    </div>}
  </>;
  return <section className={`millionaire-creator-screen${popover ? " is-popover" : ""}`}>
    {popover ? <div className="millionaire-setup-card millionaire-rules-card millionaire-creator-library-card">{content}</div> : content}
  </section>;
}

function CreatorStatus({ children, role = "status" }) {
  return <div className="millionaire-creator-status" role={role}>{children}</div>;
}

function formatEditedDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function CreatorMediaCredit({ media }) {
  return media?.sourceUrl ? <a className="millionaire-media-credit" href={media.sourceUrl} target="_blank" rel="noopener noreferrer" title={[media.credit, media.license].filter(Boolean).join(' · ')}>Media credit</a> : null;
}
function CreatorInlineMedia({ question, onEditYoutube, onUpdate, onError }) {
  const imageInputRef = React.useRef(null);
  const audioInputRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const [libraryKind, setLibraryKind] = React.useState(null);
  const imageUrl = React.useMemo(
    () => question.type === "image" && question.image?.blob instanceof Blob ? URL.createObjectURL(question.image.blob) : "",
    [question.type, question.image?.blob],
  );
  const audioUrl = React.useMemo(
    () => question.type === "audio" && question.audio?.blob instanceof Blob ? URL.createObjectURL(question.audio.blob) : "",
    [question.type, question.audio?.blob],
  );
  React.useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);
  React.useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);
  const youtubeUrl = question.type === "youtube" ? CUSTOM_SETS.youtubeEmbedUrl(question.youtubeUrl) : "";

  function imageMimeType(file) {
    if (CUSTOM_SETS.IMAGE_MIME_TYPES.includes(file?.type)) return file.type;
    const extension = String(file?.name || "").split(".").pop().toLowerCase();
    return ({ png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp" })[extension] || "";
  }

  function audioMimeType(file) {
    if (CUSTOM_SETS.AUDIO_MIME_TYPES.includes(file?.type)) return file.type;
    const extension = String(file?.name || "").split(".").pop().toLowerCase();
    return ({ mp3: "audio/mpeg", wav: "audio/wav", m4a: "audio/mp4", aac: "audio/aac", ogg: "audio/ogg" })[extension] || "";
  }

  function useImageFile(file) {
    if (!file) return;
    const type = imageMimeType(file);
    if (!type) {
      onError("Choose a supported image file.");
      return;
    }
    const limit = CUSTOM_SETS.LIMITS.imageBytes;
    if (!file.size || file.size > limit) {
      onError(`Image files must be smaller than ${Math.round(limit / 1024 / 1024)} MB.`);
      return;
    }
    const media = {
      id: CUSTOM_SETS.uniqueId("media"),
      name: file.name,
      type,
      size: file.size,
      duration: null,
      blob: file,
    };
    onUpdate({ type: "image", image: media, audio: null, youtubeUrl: "" });
  }

  function useYoutubeLink(value) {
    const link = String(value || "").trim();
    if (!CUSTOM_SETS.youtubeVideoId(link)) return false;
    onUpdate({ type: "youtube", youtubeUrl: link, image: null, imageAlt: "", audio: null });
    return true;
  }

  function chooseFile(event) {
    useImageFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function useAudioFile(file) {
    if (!file) return;
    const type = audioMimeType(file);
    if (!type) {
      onError("Choose a supported audio file.");
      return;
    }
    const limit = CUSTOM_SETS.LIMITS.audioBytes;
    if (!file.size || file.size > limit) {
      onError(`Audio files must be smaller than ${Math.round(limit / 1024 / 1024)} MB.`);
      return;
    }
    onUpdate({
      type: "audio",
      image: null,
      imageAlt: "",
      youtubeUrl: "",
      audio: { id: CUSTOM_SETS.uniqueId("media"), name: file.name, type, size: file.size, duration: null, blob: file },
    });
  }

  function chooseAudioFile(event) {
    useAudioFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function useDroppedFile(file) {
    if (imageMimeType(file)) return useImageFile(file);
    if (audioMimeType(file)) return useAudioFile(file);
    onError("Drop a supported image or audio file, or a valid YouTube link.");
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      useDroppedFile(file);
      return;
    }
    const link = event.dataTransfer.getData("text/uri-list") || event.dataTransfer.getData("text/plain");
    if (!useYoutubeLink(link)) onError("Drop a supported image file or valid YouTube link.");
  }

  function handlePaste(event) {
    const link = event.clipboardData.getData("text/plain");
    if (!useYoutubeLink(link)) return;
    event.preventDefault();
  }

  if (imageUrl) return <div className="millionaire-creator-media-preview"><img src={imageUrl} alt={question.imageAlt || "Question image preview"} /><CreatorMediaCredit media={question.image} /></div>;
  if (audioUrl) return <div className="millionaire-creator-media-preview is-audio"><audio controls preload="metadata" src={audioUrl} aria-label="Question audio preview" /><CreatorMediaCredit media={question.audio} /></div>;
  if (youtubeUrl) return <div className="millionaire-creator-media-preview is-youtube"><iframe src={youtubeUrl} title="Question video preview" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /><button type="button" className="millionaire-secondary" onClick={onEditYoutube}>Edit YouTube link</button></div>;
  return <><div
    className={`millionaire-creator-empty-media${dragging ? " is-dragging" : ""}`}
    tabIndex="0"
    onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
    onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; setDragging(true); }}
    onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
    onDrop={handleDrop}
    onPaste={handlePaste}
    aria-label="Add an image, audio or YouTube link"
  >
    <input ref={imageInputRef} type="file" accept={`${CUSTOM_SETS.IMAGE_MIME_TYPES.join(",")},.png,.jpg,.jpeg,.gif,.webp`} hidden onChange={chooseFile} />
    <input ref={audioInputRef} type="file" accept={`${CUSTOM_SETS.AUDIO_MIME_TYPES.join(",")},.mp3,.wav,.m4a,.aac,.ogg`} hidden onChange={chooseAudioFile} />
    <p className="millionaire-creator-media-heading">Add optional media:</p>
    <div className="millionaire-creator-media-kinds">
      <button type="button" onClick={() => setLibraryKind("image")}><img src="ui-icons/image.svg" alt="" /><span>Image</span></button>
      <button type="button" onClick={() => setLibraryKind("audio")}><img src="ui-icons/audio.svg" alt="" /><span>Audio</span></button>
      <button type="button" onClick={() => { onUpdate({ type: "youtube", youtubeUrl: "", image: null, imageAlt: "", audio: null }); onEditYoutube(); }}><img src="ui-icons/youtube.svg" alt="" /><span>YouTube</span></button>
    </div>
  </div>{libraryKind && <window.MillionaireMediaLibrary type={libraryKind} Modal={CreatorDialog} onClose={() => setLibraryKind(null)} onChange={media => onUpdate(libraryKind === "image" ? { type: "image", image: media, audio: null, youtubeUrl: "" } : { type: "audio", image: null, imageAlt: "", audio: media, youtubeUrl: "" })} />}</>;
}

function CreatorInlineEditor({
  set,
  questionIndex,
  variantIndex,
  setVariantIndex,
  setQuestionIndex,
  updateTitle,
  updateQuestion,
  onSave,
  onExit,
  onEditYoutube,
  onMediaError,
  onAddVariant,
  onRemoveVariant,
  onToggleShuffle,
  PrizeLadderComponent,
}) {
  const variants = [set.questions[questionIndex], ...(set.variants?.[questionIndex] || [])];
  const shuffleQuestions = set.shuffleVariants?.every((value) => value === true);
  const question = variants[variantIndex] || variants[0];
  const completedStages = set.questions.slice(0, CUSTOM_SETS.QUESTION_COUNT)
    .flatMap((item, index) => [item, ...(set.variants?.[index] || [])].filter((variant) => CUSTOM_SETS.validateQuestion(variant).length === 0).length >= CUSTOM_SETS.MIN_COMPLETE_VARIANTS ? [index + 1] : []);
  const incompleteStages = set.questions.slice(0, CUSTOM_SETS.QUESTION_COUNT)
    .flatMap((item, index) => [item, ...(set.variants?.[index] || [])].some(CUSTOM_SETS.hasQuestionContent) && !completedStages.includes(index + 1) ? [index + 1] : []);
  const warningDetails = set.questions.slice(0, CUSTOM_SETS.QUESTION_COUNT).reduce((details, item, index) => {
    const stageQuestions = [item, ...(set.variants?.[index] || [])];
    const contentQuestions = stageQuestions.filter(CUSTOM_SETS.hasQuestionContent);
    const issues = [];
    if (stageQuestions.length < CUSTOM_SETS.MIN_COMPLETE_VARIANTS) issues.push("At least one alternative question required");
    if (contentQuestions.some((candidate) => !String(candidate?.hint || "").trim())) issues.push("Hint missing");
    if (contentQuestions.some((candidate) => !Number.isInteger(candidate?.correctAnswerIndex) || candidate.correctAnswerIndex < 0 || candidate.correctAnswerIndex > 3)) issues.push("Correct answer missing");
    if (contentQuestions.some((candidate) => !String(candidate?.prompt || "").trim() || !Array.isArray(candidate?.answers) || candidate.answers.some((answer) => !String(answer || "").trim()))) issues.push("Missing information");
    details[index + 1] = issues;
    return details;
  }, {});
  const [toolbarReady, setToolbarReady] = React.useState(false);
  const [titleDraft, setTitleDraft] = React.useState(set.title);
  const [customiseOpen, setCustomiseOpen] = React.useState(false);
  const [guideOpen, setGuideOpen] = React.useState(false);
  const customiseRef = React.useRef(null);
  React.useEffect(() => { setToolbarReady(true); }, []);
  React.useEffect(() => { setTitleDraft(set.title); }, [set.id, set.title]);
  React.useEffect(() => {
    if (!customiseOpen) return undefined;
    const closeMenu = (event) => {
      if (event.key === "Escape") setCustomiseOpen(false);
      if (event.type === "mousedown" && !customiseRef.current?.contains(event.target) && !event.target.closest(".millionaire-creator-customise-menu")) setCustomiseOpen(false);
    };
    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeMenu);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeMenu);
    };
  }, [customiseOpen]);
  const leftTarget = toolbarReady ? document.getElementById("millionaire-creator-toolbar-left") : null;
  const rightTarget = toolbarReady ? document.getElementById("millionaire-creator-toolbar-right") : null;
  const hasInsertedMedia = (question.type === "image" && Boolean(question.image?.blob))
    || (question.type === "audio" && Boolean(question.audio?.blob))
    || (question.type === "youtube" && Boolean(CUSTOM_SETS.youtubeVideoId(question.youtubeUrl)));
  const hintEditorId = `millionaire-creator-hint-${question.id}`;
  const hintEditorRef = React.useRef(null);
  React.useLayoutEffect(() => {
    const editor = hintEditorRef.current;
    if (!editor) return;
    editor.style.height = "auto";
    editor.style.height = `${editor.scrollHeight}px`;
  }, [question.id, question.hint]);
  const toolbar = <>
    {leftTarget && ReactDOM.createPortal(
      <>
        <label className="millionaire-creator-toolbar-name">
          <span className="millionaire-creator-toolbar-name-label">Name</span>
          <input
            className={`millionaire-creator-toolbar-title${titleDraft.length > 48 ? " is-very-long" : titleDraft.length > 30 ? " is-long" : ""}`}
            type="text"
            value={titleDraft}
            aria-label="Question set title"
            title="Edit the question set name"
            onChange={(event) => setTitleDraft(event.target.value)}
            onBlur={(event) => {
              const title = event.target.value.trim() || "Untitled Set";
              setTitleDraft(title);
              if (title !== set.title) updateTitle(title);
            }}
            onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
          />
        </label>
        <div className="hub-menu-anchor relative millionaire-creator-customise-anchor" ref={customiseRef}>
          <button type="button" className="millionaire-creator-toolbar-customise" aria-label="Customise question" title="Customise question" aria-expanded={customiseOpen} data-menu-trigger={true} onClick={() => setCustomiseOpen((open) => !open)}><img src="ui-icons/customise.svg" alt="" aria-hidden="true" /></button>
          {customiseOpen && <window.MLH.MenuPanel title="Customise" position="left-0" variant="customise" dataMenuPanel={true} className="millionaire-creator-customise-menu">
            <div className="millionaire-creator-shuffle-menu-option">
              <button type="button" className={`millionaire-creator-shuffle-toggle${shuffleQuestions ? " is-on" : ""}`} aria-pressed={shuffleQuestions} onClick={() => onToggleShuffle(!shuffleQuestions)}><span>Shuffle Questions</span><span className="millionaire-creator-shuffle-toggle-track" aria-hidden="true"><span /></span></button>
              <p>The game will randomly choose between the available questions at each prize level every time a game is played. When it is off, Question 1 is used every time.</p>
            </div>
            {window.HubCollections.menu("millionaire")}
          </window.MLH.MenuPanel>}
        </div>
        <button type="button" className={`millionaire-creator-toolbar-guide${guideOpen ? " is-active" : ""}`} aria-label={guideOpen ? "Hide help guide" : "Show help guide"} title={guideOpen ? "Hide help guide" : "Show help guide"} aria-pressed={guideOpen} onClick={() => setGuideOpen((open) => !open)}><img src="ui-icons/guide.svg" alt="" aria-hidden="true" /></button>
      </>,
      leftTarget,
    )}
    {rightTarget && ReactDOM.createPortal(
      <div className="millionaire-creator-toolbar-actions">
        <button type="button" className="is-primary millionaire-creator-toolbar-done" onClick={onExit}>Done</button>
      </div>,
      rightTarget,
    )}
  </>;

  const answerRows = [question.answers.slice(0, 2), question.answers.slice(2, 4)];
  const lifelines = <div className="millionaire-lifelines millionaire-ladder-lifelines" aria-label="Creator lifeline preview">
    <button type="button" className="millionaire-lifeline" disabled aria-label="50:50 unavailable in the editor"><span className="millionaire-lifeline-badge"><img className="millionaire-lifeline-icon" src="whowantstobemillionaire/50.50.svg" alt="" /></span></button>
    <button type="button" className="millionaire-lifeline" disabled aria-label="Hint lifeline preview"><span className="millionaire-lifeline-badge"><img className="millionaire-lifeline-icon" src="whowantstobemillionaire/hint.svg" alt="" /></span></button>
    <button type="button" className="millionaire-lifeline" disabled aria-label="Switch lifeline preview"><span className="millionaire-lifeline-badge"><img className="millionaire-lifeline-icon" src="whowantstobemillionaire/switch.svg" alt="" /></span></button>
  </div>;

  return <>
    {toolbar}
    <section className="millionaire-creator-game-editor" aria-label={`Editing ${set.title}, prize level ${questionIndex + 1}, Question ${variantIndex + 1}`}>
      <div className="millionaire-game-grid">
        <section className="millionaire-play-area">
          <div className="millionaire-question-panel">
            <label className="millionaire-inline-hint millionaire-creator-inline-hint-editor" htmlFor={hintEditorId}>
              <strong>Hint</strong>
              <textarea ref={hintEditorRef} id={hintEditorId} rows="1" value={question.hint} onChange={(event) => updateQuestion({ hint: event.target.value })} placeholder="Type the hint here" />
            </label>
            <div className="millionaire-question-media">
              {hasInsertedMedia
                ? <div className="millionaire-creator-media-frame">
                  <button type="button" className="millionaire-creator-remove-media" aria-label="Remove media" title="Remove media" onClick={() => updateQuestion({ type: "text", image: null, imageAlt: "", audio: null, youtubeUrl: "" })}><img src="ui-icons/bin.svg" alt="" aria-hidden="true" /></button>
                  <CreatorInlineMedia question={question} onEditYoutube={onEditYoutube} onUpdate={updateQuestion} onError={onMediaError} />
                </div>
                : <CreatorInlineMedia question={question} onEditYoutube={onEditYoutube} onUpdate={updateQuestion} onError={onMediaError} />}
            </div>
            <div className="millionaire-question-rail"><div className="millionaire-question-bar">
              <textarea className="millionaire-creator-inline-question" aria-label="Question text" rows="1" value={question.prompt} onChange={(event) => updateQuestion({ prompt: event.target.value })} placeholder="Type the question here" />
            </div></div>
          </div>
          <div className="millionaire-answers millionaire-creator-inline-answers" role="group" aria-label="Editable answer choices">
            {answerRows.map((row, rowIndex) => <div className="millionaire-answer-row" key={rowIndex}>{row.map((answer, columnIndex) => {
              const answerIndex = rowIndex * 2 + columnIndex;
              const letter = ["A", "B", "C", "D"][answerIndex];
              const isCorrect = question.correctAnswerIndex === answerIndex;
              return <div className="millionaire-creator-answer-slot" key={letter}>
                <label className={`millionaire-answer${isCorrect ? " is-creator-correct" : ""}`}>
                  <span className="millionaire-answer-content">
                    <span className="millionaire-answer-diamond" aria-hidden="true">◆</span>
                    <span className="millionaire-answer-letter">{letter}:</span>
                    <input type="text" value={answer} onChange={(event) => {
                      const answers = [...question.answers];
                      answers[answerIndex] = event.target.value;
                      updateQuestion({ answers });
                    }} aria-label={`Answer ${letter}`} placeholder={`Answer ${letter}`} />
                  </span>
                </label>
                <button type="button" className={`millionaire-creator-correct-tick${isCorrect ? " is-active" : ""}`} aria-label={`Mark Answer ${letter} as correct`} aria-pressed={isCorrect} onClick={() => updateQuestion({ correctAnswerIndex: answerIndex })}>
                  <img src="ui-icons/tick.svg" alt="" aria-hidden="true" />
                </button>
              </div>;
            })}</div>)}
          </div>
          <div className="millionaire-creator-variant-bar" aria-label="Questions at this prize level">
            {variants.map((item, index) => {
              const canDelete = index > 1 && variants.length > 2;
              const isRequiredQuestion = index < CUSTOM_SETS.MIN_COMPLETE_VARIANTS;
              const isComplete = CUSTOM_SETS.validateQuestion(item).length === 0;
              const label = `Question ${index + 1}`;
              return <React.Fragment key={item.id}><span className="millionaire-creator-variant-control"><button type="button" className={`${index === variantIndex ? "is-current" : ""}${canDelete ? " has-delete" : ""}`} onClick={() => setVariantIndex(index)}><span className="millionaire-creator-variant-prize"><span>{questionIndex + 1}</span><span className="millionaire-creator-variant-prize-diamond" aria-hidden="true">◆</span><span>{CREATOR_PRIZES[questionIndex]}</span></span><span className="millionaire-creator-variant-question-label">{label}</span></button>{canDelete && <button type="button" className="millionaire-creator-delete-variant-hit" aria-label={`Delete ${label}`} title={`Delete ${label}`} onClick={() => onRemoveVariant(index)}><img src="ui-icons/bin.svg" alt="" aria-hidden="true" /></button>}{isRequiredQuestion && <span className="millionaire-creator-required-question-status" title={isComplete ? `${label} is complete` : `${label} needs attention`}><span>Required</span><img src={isComplete ? "ui-icons/tick.svg" : "ui-icons/warning.svg"} alt={isComplete ? `${label} complete` : `${label} needs attention`} /></span>}</span></React.Fragment>;
            })}
            {variants.length < CUSTOM_SETS.MAX_VARIANTS && <button type="button" className="millionaire-creator-add-variant" aria-label="Add question" title="Add question" onClick={onAddVariant}><img src="ui-icons/plus.svg" alt="" aria-hidden="true" /></button>}
          </div>
        </section>
        {PrizeLadderComponent && <PrizeLadderComponent currentIndex={questionIndex} correctCount={0} completedStages={completedStages} incompleteStages={incompleteStages} warningDetails={warningDetails} controls={lifelines} onSelect={setQuestionIndex} />}
      </div>
      {guideOpen && <div className="millionaire-creator-guide-overlay" aria-live="polite">
        <p className="millionaire-creator-guide-callout is-hint"><strong>Hint</strong> Add a clue pupils can reveal during the game.</p>
        <p className="millionaire-creator-guide-callout is-media"><strong>Media</strong> Add an image, audio file or YouTube video.</p>
        <p className="millionaire-creator-guide-callout is-question"><strong>Question and answers</strong> Type the question, then add four answers and tick the correct one.</p>
        <p className="millionaire-creator-guide-callout is-variants"><strong>Questions at this prize level</strong> Every prize level needs at least two complete questions. Add up to five different questions; Shuffle Questions chooses one each game, and Switch can move to another one.</p>
        <div className="millionaire-creator-guide-callout is-ladder"><strong>Question ladder</strong><span className="millionaire-creator-guide-ladder-key"><span className="is-empty" aria-hidden="true">–</span><span>Not started</span><img className="is-warning" src="ui-icons/warning.svg" alt="" aria-hidden="true" /><span>Needs more information</span><img className="is-complete" src="ui-icons/tick.svg" alt="" aria-hidden="true" /><span>Ready to play</span></span><span className="millionaire-creator-guide-ladder-copy">Select a prize row to edit that question.</span></div>
      </div>}
    </section>
  </>;
}

function MillionaireCreator({ onBack, onPlay, PrizeLadderComponent, onEditingChange }) {
  const repositoryRef = React.useRef(new CUSTOM_SETS.QuestionSetRepository());
  const [screen, setScreen] = React.useState("library");
  const [sets, setSets] = React.useState([]);
  const [currentSet, setCurrentSet] = React.useState(null);
  const currentSetRef = React.useRef(null);
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const [variantIndex, setVariantIndex] = React.useState(0);
  const [dialog, setDialog] = React.useState(null);
  const [status, setStatus] = React.useState("Loading question sets…");
  const [saveState, setSaveState] = React.useState("");
  const [dirtyVersion, setDirtyVersion] = React.useState(0);
  const [imported, setImported] = React.useState(false);
  const [readinessOpenId, setReadinessOpenId] = React.useState(null);
  const [downloadOpenId, setDownloadOpenId] = React.useState(null);
  const [downloadMenuPosition, setDownloadMenuPosition] = React.useState(null);
  const importInputRef = React.useRef(null);
  const saveTimerRef = React.useRef(null);
  const importConfirmationTimerRef = React.useRef(null);
  const enterEditor = () => {
    onEditingChange?.(true);
    setScreen("editor");
  };

  React.useEffect(() => { currentSetRef.current = currentSet; }, [currentSet]);
  React.useEffect(() => { onEditingChange?.(screen === "editor"); }, [screen, onEditingChange]);
  React.useEffect(() => () => onEditingChange?.(false), [onEditingChange]);
  React.useEffect(() => {
    if (!downloadOpenId) return undefined;
    const dismissDownloadMenu = (event) => {
      if (event.key === "Escape") { setDownloadOpenId(null); return; }
      if (event.type !== "pointerdown") return;
      const target = event.target;
      if (target instanceof Element && (target.closest(".millionaire-download-options") || target.closest(".millionaire-download-menu"))) return;
      setDownloadOpenId(null);
    };
    document.addEventListener("pointerdown", dismissDownloadMenu);
    document.addEventListener("keydown", dismissDownloadMenu);
    return () => {
      document.removeEventListener("pointerdown", dismissDownloadMenu);
      document.removeEventListener("keydown", dismissDownloadMenu);
    };
  }, [downloadOpenId]);
  React.useEffect(() => {
    async function initialiseCreator() {
      try {
        const starter = await repositoryRef.current.get(CUSTOM_SETS.S1_ORCHESTRA_STARTER_ID);
        if (!starter) await repositoryRef.current.save(await CUSTOM_SETS.loadOrchestraStarterSet(), { touch: false });
        else {
          const migratedStarter = CUSTOM_SETS.migrateS1OrchestraStarterSet(starter);
          const refreshedStarter = CUSTOM_SETS.refreshOrchestraStarterSet(migratedStarter);
          const reorderedStarter = CUSTOM_SETS.moveOrchestraReedQuestions(refreshedStarter);
          const shuffledStarter = CUSTOM_SETS.shuffleOrchestraStarterAnswers(reorderedStarter);
          const renamedStarter = CUSTOM_SETS.renameOrchestraStarterSet(shuffledStarter);
          if (renamedStarter !== starter) await repositoryRef.current.save(renamedStarter, { touch: false });
        }
      } catch (error) {
        handleError(error);
      }
      await refreshLibrary();
      const resume = readCreatorResume();
      if (!resume) return;
      try {
        const set = await repositoryRef.current.get(resume.setId);
        if (!set) {
          clearCreatorResume();
          return;
        }
        const restoredQuestionIndex = Math.min(Math.max(Number(resume.questionIndex) || 0, 0), set.questions.length - 1);
        setCurrentSet(set);
        currentSetRef.current = set;
        setQuestionIndex(restoredQuestionIndex);
        setDirtyVersion(0);
        setSaveState("Saved.");
        setStatus(`Editing “${set.title}”.`);
        enterEditor();
      } catch (error) {
        clearCreatorResume();
        handleError(error, "The game you were editing could not be reopened.");
      }
    }
    initialiseCreator();
    return () => {
      window.clearTimeout(saveTimerRef.current);
      window.clearTimeout(importConfirmationTimerRef.current);
    };
  }, []);
  React.useEffect(() => {
    if (screen !== "editor" || !currentSet?.id) return;
    try {
      localStorage.setItem(CREATOR_RESUME_KEY, JSON.stringify({ setId: currentSet.id, questionIndex }));
    } catch {}
  }, [screen, currentSet?.id, questionIndex]);
  React.useEffect(() => {
    if (!currentSet || screen !== "editor" || !dirtyVersion) return undefined;
    window.clearTimeout(saveTimerRef.current);
    setSaveState("Saving…");
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        const saved = await repositoryRef.current.save(currentSetRef.current);
        currentSetRef.current = saved;
        setCurrentSet(saved);
        setSaveState("Saved.");
      } catch (error) {
        handleError(error, "Save failed. Your unsaved changes remain on this screen.");
        setSaveState("Save failed.");
      }
    }, 700);
    return () => window.clearTimeout(saveTimerRef.current);
  }, [dirtyVersion, screen]);

  function handleError(error, message = null) {
    console.error("Millionaire custom-set error.", error);
    const storageMessage = error?.name === "QuotaExceededError"
      ? "Browser storage is full. Remove some saved media or download and delete an older set."
      : error?.message === "Browser storage is unavailable."
        ? "Browser storage is unavailable. Check that private browsing or browser settings are not blocking storage."
        : message || error?.message || "Something went wrong. Please try again.";
    setStatus(storageMessage);
  }

  async function refreshLibrary(message = "") {
    try {
      const next = await repositoryRef.current.list();
      setSets(next);
      setStatus(message || (next.length ? `${next.length} saved question set${next.length === 1 ? "" : "s"}.` : "No custom question sets have been saved yet."));
    } catch (error) {
      handleError(error);
    }
  }

  function updateCurrent(updater) {
    setCurrentSet((existing) => {
      const next = typeof updater === "function" ? updater(existing) : updater;
      currentSetRef.current = next;
      return next;
    });
    setDirtyVersion((version) => version + 1);
  }

  function updateQuestion(patch) {
    updateCurrent((set) => ({
      ...set,
      questions: set.questions.map((question, index) => index === questionIndex && variantIndex === 0 ? { ...question, ...patch } : question),
      variants: (set.variants || []).map((stageVariants, index) => index === questionIndex && variantIndex > 0
        ? stageVariants.map((question, index) => index === variantIndex - 1 ? { ...question, ...patch } : question)
        : stageVariants),
    }));
  }

  function updateTitle(title) {
    updateCurrent((set) => ({ ...set, title }));
  }

  async function flushSave() {
    window.clearTimeout(saveTimerRef.current);
    if (!currentSetRef.current) return null;
    setSaveState("Saving…");
    try {
      const saved = await repositoryRef.current.save(currentSetRef.current);
      currentSetRef.current = saved;
      setCurrentSet(saved);
      setSaveState("Saved.");
      return saved;
    } catch (error) {
      handleError(error, "Save failed. Your unsaved changes remain on this screen.");
      setSaveState("Save failed.");
      return null;
    }
  }

  function requestCreate() {
    setDialog({ type: "create", name: "" });
  }

  async function createNewSet() {
    const name = String(dialog.name || "").trim();
    if (!name) {
      setDialog((value) => ({ ...value, error: "Enter a name for the question set." }));
      return;
    }
    try {
      const saved = await repositoryRef.current.save(CUSTOM_SETS.createSet(name), { touch: false });
      setCurrentSet(saved);
      currentSetRef.current = saved;
      setQuestionIndex(0);
      setDirtyVersion(0);
      setSaveState("Saved.");
      setStatus(`Editing “${saved.title}”.`);
      setDialog(null);
      enterEditor();
      localStorage.setItem("mlh-millionaire-last-custom-set", saved.id);
    } catch (error) {
      handleError(error);
    }
  }

  async function editSet(id) {
    try {
      const set = await repositoryRef.current.get(id);
      if (!set) throw new Error("The question set could not be found.");
      if (set.playOnly) throw new Error("This is a play-only game and cannot be edited.");
      setCurrentSet(set);
      currentSetRef.current = set;
      setQuestionIndex(0);
      setDirtyVersion(0);
      setSaveState("Saved.");
      setStatus(`Editing “${set.title}”.`);
      enterEditor();
      localStorage.setItem("mlh-millionaire-last-custom-set", set.id);
    } catch (error) {
      handleError(error);
    }
  }

  async function deleteSet() {
    try {
      await repositoryRef.current.delete(dialog.id);
      const title = dialog.title;
      setDialog(null);
      await refreshLibrary(`Deleted “${title}” and its stored media.`);
    } catch (error) {
      handleError(error);
    }
  }

  async function duplicateSet(id) {
    try {
      const copy = await repositoryRef.current.duplicate(id);
      await refreshLibrary(`Created “${copy.title}”.`);
    } catch (error) {
      handleError(error);
    }
  }

  async function downloadEditableSet(id) {
    try {
      setStatus("Preparing download…");
      const set = await repositoryRef.current.get(id);
      if (!set) throw new Error("The question set could not be found.");
      const exported = await CUSTOM_SETS.exportSet(set);
      downloadBlob(exported.blob, exported.filename);
      setStatus(`Downloaded editable “${set.title}”.`);
    } catch (error) {
      handleError(error, "The question set could not be downloaded.");
    }
  }

  async function downloadPlayOnlySet(id) {
    try {
      setStatus("Preparing play-only version…");
      const set = await repositoryRef.current.get(id);
      if (!set) throw new Error("The question set could not be found.");
      const exported = await CUSTOM_SETS.exportSet(set, undefined, { playOnly: true });
      downloadBlob(exported.blob, exported.filename);
      setStatus(`Downloaded play-only “${set.title}”.`);
    } catch (error) {
      handleError(error, "The play-only version could not be downloaded.");
    }
  }

  async function playSet(id) {
    try {
      const set = await repositoryRef.current.get(id);
      if (!set) throw new Error("The question set could not be found.");
      const validation = CUSTOM_SETS.validateSet(set);
      if (!validation.valid) {
        setStatus(`“${set.title}” cannot be played until every prize level has two complete questions.`);
        return;
      }
      await onPlay(set);
    } catch (error) {
      handleError(error, "The question set could not be started.");
    }
  }

  async function saveAndExit() {
    const saved = await flushSave();
    if (!saved) return;
    clearCreatorResume();
    setCurrentSet(null);
    currentSetRef.current = null;
    setScreen("library");
    await refreshLibrary(`Saved “${saved.title}”.`);
  }

  async function saveOnly() {
    return flushSave();
  }

  async function backToMain() {
    if (screen === "editor" && currentSetRef.current && dirtyVersion) {
      const saved = await flushSave();
      if (!saved) return;
    }
    clearCreatorResume();
    onBack();
  }

  function addVariant() {
    const stage = questionIndex;
    const nextVariantIndex = (currentSetRef.current.variants?.[stage] || []).length + 1;
    updateCurrent((set) => ({
      ...set,
      variants: (set.variants || []).map((stageVariants, index) => index === stage
        ? [...stageVariants, CUSTOM_SETS.emptyQuestion(stage + 1)]
        : stageVariants),
    }));
    setVariantIndex(nextVariantIndex);
  }

  function removeVariant(variantToRemove) {
    if (!Number.isInteger(variantToRemove) || variantToRemove === 0) return;
    const stage = questionIndex;
    const stageVariants = currentSetRef.current.variants?.[stage] || [];
    if (stageVariants.length <= 1 || variantToRemove > stageVariants.length) return;
    updateCurrent((set) => ({
      ...set,
      variants: (set.variants || []).map((items, index) => index === stage
        ? items.filter((_, itemIndex) => itemIndex !== variantToRemove - 1)
        : items),
    }));
    if (variantIndex === variantToRemove) setVariantIndex(Math.max(0, variantToRemove - 1));
    else if (variantIndex > variantToRemove) setVariantIndex(variantIndex - 1);
  }

  function toggleShuffleVariants(checked) {
    updateCurrent((set) => ({
      ...set,
      shuffleVariants: Array.from({ length: CUSTOM_SETS.QUESTION_COUNT }, () => checked),
    }));
  }

  async function chooseImport(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    window.clearTimeout(importConfirmationTimerRef.current);
    setImported(false);
    if (!file.name.toLowerCase().endsWith(".millionaire-set")) {
      setStatus("Choose a file ending in .millionaire-set.");
      return;
    }
    setStatus("Checking imported question set…");
    try {
      const result = await CUSTOM_SETS.importPackage(file);
      const collision = await repositoryRef.current.idExists(result.set.id);
      let set = result.set;
      if (collision) {
        set = CUSTOM_SETS.normaliseSet(set, { regenerateIds: true });
        set.title = `${result.set.title} – Copy`;
      }
      await repositoryRef.current.save(set, { touch: false });
      await refreshLibrary();
      setImported(true);
      importConfirmationTimerRef.current = window.setTimeout(() => setImported(false), 1000);
    } catch (error) {
      handleError(error, "The selected file could not be imported.");
    }
  }

  function LibraryScreen() {
    return <CreatorFrame popover title="Create" onBack={backToMain}>
      <div className="millionaire-creator-library-layout">
        <section className="millionaire-creator-library-panel millionaire-creator-instructions" aria-labelledby="millionaire-creator-instructions-title">
          <h3 id="millionaire-creator-instructions-title">Instructions</h3>
          <div className="millionaire-creator-instructions-list">
            <p><strong>Create:</strong> Build 15 multiple-choice prize levels. Each prize level needs four answers, one correct answer, and at least two complete questions. You can add up to five questions at each prize level.</p>
            <p><strong>Add media:</strong> Optionally add an image, audio clip or YouTube video to each question.</p>
            <p><strong>Manage:</strong> Use the buttons beside a game to play, edit, copy, download or delete it.</p>
            <p><strong>Share:</strong> Download your game and send it to others. They choose <strong>Create &amp; Import</strong>, select <strong>Import</strong>, then choose the downloaded file and press <strong>Play</strong>.</p>
            <p><strong>Play-only files:</strong> With these files, others can play these games but cannot edit, copy or download them.</p>
            <p><strong>Save:</strong> Games are saved in this browser. Download a copy before clearing browser data or changing device.</p>
          </div>
        </section>
        <section className={`millionaire-creator-library-panel millionaire-created-games-panel${sets.length ? "" : " is-empty"}`} aria-labelledby="millionaire-created-games-title">
          <h3 id="millionaire-created-games-title">Created games</h3>
          <div className={`millionaire-set-library${sets.length ? "" : " is-empty"}`}>
            {sets.length ? sets.map((set) => {
              const summary = CUSTOM_SETS.setSummary(set);
              const incompleteCount = summary.incompleteCount;
              const longTitle = set.title.length > 16;
              return <article className="millionaire-set-card" key={set.id}>
                <div className="millionaire-set-card-heading">
                  <img className="millionaire-set-card-thumbnail" src="whowantstobemillionaire/millionairelogo new.svg" alt="" aria-hidden="true" />
                  <div><h4 className={set.title.length > 24 ? "is-very-long" : longTitle ? "is-long" : ""} title={set.title}>{longTitle ? <span className="millionaire-set-title-marquee"><span>{set.title}</span><span aria-hidden="true">{set.title}</span></span> : set.title}</h4><p>{formatEditedDate(set.updatedAt)}</p></div>
                  {summary.playable
                    ? <span className="millionaire-readiness is-ready">Playable</span>
                    : <div className={`millionaire-readiness-tooltip-wrap${readinessOpenId === set.id ? " is-open" : ""}`}>
                      <button
                        type="button"
                        className="millionaire-readiness is-draft"
                        aria-expanded={readinessOpenId === set.id}
                        aria-describedby={`millionaire-readiness-tooltip-${set.id}`}
                        onClick={() => setReadinessOpenId((openId) => openId === set.id ? null : set.id)}
                        onBlur={() => setReadinessOpenId(null)}
                      >
                        Not playable
                      </button>
                      <div className="millionaire-readiness-tooltip" id={`millionaire-readiness-tooltip-${set.id}`} role="tooltip">
                        <span>{incompleteCount} {incompleteCount === 1 ? "question" : "questions"} incomplete</span>
                      </div>
                    </div>}
                </div>
                <div className="millionaire-set-actions">
                  <button type="button" className="millionaire-primary millionaire-set-icon-button" disabled={!summary.playable} aria-label="Play" title={!summary.playable ? "Complete two questions for each of the 15 prize levels before playing." : "Play"} onClick={() => playSet(set.id)}><span className="millionaire-set-action-icon hub-playback-glyph is-play" aria-hidden="true"></span></button>
                  <button type="button" className="millionaire-secondary millionaire-set-icon-button" aria-label="Edit" title={set.playOnly ? "Play-only games cannot be edited." : "Edit"} disabled={set.playOnly} onClick={() => editSet(set.id)}><img className="millionaire-set-action-icon" src="ui-icons/rename.svg" alt="" /></button>
                  <button type="button" className="millionaire-secondary millionaire-set-icon-button" aria-label="Duplicate" title={set.playOnly ? "Play-only games cannot be duplicated." : "Duplicate"} disabled={set.playOnly} onClick={() => duplicateSet(set.id)}><img className="millionaire-set-action-icon" src="ui-icons/copy.svg" alt="" /></button>
                  <div className={`millionaire-download-menu${downloadOpenId === set.id ? " is-open" : ""}`}>
                    <button type="button" className="millionaire-secondary millionaire-set-icon-button" aria-label="Download" title={set.playOnly ? "Play-only games cannot be downloaded." : "Download"} disabled={set.playOnly} aria-expanded={downloadOpenId === set.id} onClick={(event) => {
                      if (downloadOpenId === set.id) {
                        setDownloadOpenId(null);
                        return;
                      }
                      const rect = event.currentTarget.getBoundingClientRect();
                      setDownloadMenuPosition({ left: rect.left, top: rect.bottom + 8 });
                      setDownloadOpenId(set.id);
                    }}><img className="millionaire-set-action-icon" src="ui-icons/download.svg" alt="" /></button>
                    {!set.playOnly && downloadOpenId === set.id && downloadMenuPosition && ReactDOM.createPortal(<div className="millionaire-download-options" role="menu" style={downloadMenuPosition}>
                      <p className="millionaire-download-options-heading">Version:</p>
                      <button type="button" role="menuitem" onClick={() => { setDownloadOpenId(null); downloadPlayOnlySet(set.id); }}><span className="hub-playback-glyph is-play" aria-hidden="true"></span>Play</button>
                      {!set.playOnly && <button type="button" className="is-editable" role="menuitem" onClick={() => { setDownloadOpenId(null); downloadEditableSet(set.id); }}><img src="ui-icons/rename.svg" alt="" aria-hidden="true" />Play &amp; Edit</button>}
                    </div>, document.body)}
                  </div>
                  <button type="button" className="millionaire-secondary millionaire-set-icon-button is-danger" aria-label="Delete" title="Delete" onClick={() => setDialog({ type: "delete", id: set.id, title: set.title })}><img className="millionaire-set-action-icon" src="ui-icons/bin.svg" alt="" /></button>
                </div>
              </article>;
            }) : <p className="millionaire-created-games-empty">Empty</p>}
          </div>
        </section>
      </div>
      <div className="millionaire-library-actions">
        <button type="button" className="millionaire-secondary millionaire-play millionaire-opening-play millionaire-import-button" onClick={() => importInputRef.current?.click()}><span className="millionaire-opening-play-label" aria-live="polite">{imported ? "Imported!" : "Import"}</span></button>
        <button type="button" className="millionaire-primary millionaire-play millionaire-opening-play" onClick={requestCreate}><span className="millionaire-opening-play-label">Create</span></button>
        <input ref={importInputRef} hidden type="file" accept=".millionaire-set,application/zip" onChange={chooseImport} />
      </div>
    </CreatorFrame>;
  }

  const renderedScreen = screen === "editor" && currentSet ? <CreatorInlineEditor
    set={currentSet}
    questionIndex={questionIndex}
    variantIndex={variantIndex}
    setVariantIndex={setVariantIndex}
    setQuestionIndex={(index) => { setQuestionIndex(index); setVariantIndex(0); }}
    updateTitle={updateTitle}
    updateQuestion={updateQuestion}
    onSave={saveOnly}
    onExit={saveAndExit}
    onEditYoutube={() => setDialog({ type: "youtube" })}
    onMediaError={setStatus}
    onAddVariant={addVariant}
    onRemoveVariant={removeVariant}
    onToggleShuffle={toggleShuffleVariants}
    PrizeLadderComponent={PrizeLadderComponent}
  /> : LibraryScreen();

  return <>
    {renderedScreen}
    {dialog?.type === "create" && <CreatorDialog title="Create Game" onClose={() => setDialog(null)} actions={<><button type="button" className="millionaire-secondary" onClick={() => setDialog(null)}>Cancel</button><button type="button" className="millionaire-primary" onClick={createNewSet}>Create</button></>}>
      <label className="millionaire-creator-field">Name<input type="text" value={dialog.name} placeholder="For example, S1 Orchestra" onChange={(event) => setDialog({ ...dialog, name: event.target.value, error: "" })} onKeyDown={(event) => { if (event.key === "Enter") createNewSet(); }} /></label>
      {dialog.error && <p className="millionaire-field-error" role="alert">{dialog.error}</p>}
    </CreatorDialog>}
    {dialog?.type === "delete" && <CreatorDialog destructive title={`Delete “${dialog.title}”?`} onClose={() => setDialog(null)} actions={<><button type="button" className="millionaire-secondary" onClick={() => setDialog(null)}>Cancel</button><button type="button" className="millionaire-primary is-danger" onClick={deleteSet}>Delete</button></>}>
      <p className="millionaire-creator-instruction-copy">This cannot be undone unless you have downloaded a copy.</p>
    </CreatorDialog>}
    {dialog?.type === "youtube" && currentSet && (() => {
      const question = currentSet.questions[questionIndex];
      const youtubeInvalid = question.youtubeUrl && !CUSTOM_SETS.youtubeVideoId(question.youtubeUrl);
      return <CreatorDialog title="YouTube" onClose={() => setDialog(null)} actions={<button type="button" className="millionaire-primary" onClick={() => setDialog(null)}>Done</button>}>
        <div className="millionaire-youtube-editor">
          <label className="millionaire-creator-field">Paste URL below:
            <input type="url" value={question.youtubeUrl} onChange={(event) => updateQuestion({ type: "youtube", youtubeUrl: event.target.value, image: null, imageAlt: "", audio: null })} placeholder="https://www.youtube.com/watch?v=…" />
          </label>
          {youtubeInvalid && <p className="millionaire-field-error" role="alert">Enter a valid YouTube video link.</p>}
        </div>
      </CreatorDialog>;
    })()}
  </>;
}

window.MillionaireCreator = MillionaireCreator;
