/* Scoped only to the Escape Room document; never takes over another Hub activity. */
const CACHE='mlh-music-escape-v2';
const SHELL=['musicescape.html','desktop-layout.js','styles/desktop-layout.css','styles/hub-ui.css','styles/music-games.css','styles/hub-touch.css','music-escape/game.css','music-escape/objects/headphones.png','music-escape/objects/mug.png','music-escape/objects/chair.png','music-escape/objects/music-dictionary.png','music-escape/objects/order-clues/loose-sheet.png','music-escape/objects/order-clues/clipboard.png','music-escape/objects/order-clues/project-folder.png','music-escape/objects/order-clues/wastepaper-bin.png','music-escape/objects/order-clues/staffroom-post.png','music-escape/objects/order-clues/concert-programme.png','vendor/react/react.production.min.js','vendor/react/react-dom.production.min.js','shared/hub-input.js','shared/hub-touch.js','shared/hub-shell.js','shared/hub-menu.js','shared/hub-collections.js','shared/concept-level-priority.js','styles/hub-collections.css','ui-icons/audio-svgrepo-com.svg','ui-icons/pause.svg','ui-icons/levels.svg','ui-icons/tick.svg','ui-icons/customise.svg','shared/hub-audio.js','digital-question-papers/exam-audio.js','shared/hub-achievements.js','shared/music-games-practice.js','shared/hub-medal-stat.js','shared/shared-notation-config.js','reading-rhythms-core.js','audio/piano/salamander-browser-map.js','popup-piano-audio.js','music-escape/content.js','music-escape/core.js','music-escape/app.js','music-escape/object-effects.js','music-escape/school-exterior.png','music-escape/school-rooms.jpg','music-escape/room-objects/room-0/archive.png','music-escape/room-objects/room-0/mechanism.png','music-escape/room-objects/room-0/recording.png','music-escape/room-objects/room-0/exit.png','music-escape/room-objects/room-1/archive.png','music-escape/room-objects/room-1/mechanism.png','music-escape/room-objects/room-1/recording.png','music-escape/room-objects/room-1/exit.png','music-escape/room-objects/room-2/archive.png','music-escape/room-objects/room-2/mechanism.png','music-escape/room-objects/room-2/recording.png','music-escape/room-objects/room-2/exit.png','music-escape/room-objects/room-3/archive.png','music-escape/room-objects/room-3/mechanism.png','music-escape/room-objects/room-3/recording.png','music-escape/room-objects/room-3/exit.png','music-escape/room-objects/room-4/archive.png','music-escape/room-objects/room-4/mechanism.png','music-escape/room-objects/room-4/recording.png','music-escape/room-objects/room-4/exit.png','music-escape/room-objects/room-5/archive.png','music-escape/room-objects/room-5/mechanism.png','music-escape/room-objects/room-5/recording.png','music-escape/room-objects/room-5/exit.png','music-escape/room-objects/room-6/archive.png','music-escape/room-objects/room-6/mechanism.png','music-escape/room-objects/room-6/recording.png','music-escape/room-objects/room-6/exit.png','music-escape/room-objects/room-7/archive.png','music-escape/room-objects/room-7/mechanism.png','music-escape/room-objects/room-7/recording.png','music-escape/room-objects/room-7/exit.png','music-escape/room-objects/room-8/archive.png','music-escape/room-objects/room-8/mechanism.png','music-escape/room-objects/room-8/recording.png','music-escape/room-objects/room-8/exit.png','music-escape/practice-room.jpg','app-icons/music-escape.svg','fonts/Bravura.otf','footer.js','ui-icons/bronze.svg','ui-icons/silver.svg','ui-icons/gold.svg','ui-icons/diamond.svg','ui-icons/qr-code-svgrepo-com.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(async cache=>{await cache.addAll(SHELL);let found=false;for(const path of ['assets/site.css','vendor/tailwind/site.css']){const response=await fetch(path);if(response.ok){await cache.put(path,response);found=true;}}if(!found)throw Error('Site stylesheet unavailable');}).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{if(event.data?.type!=='prepare')return;event.waitUntil((async()=>{try{const cache=await caches.open(CACHE);for(const path of event.data.urls||[]){const url=new URL(path,self.registration.scope);if(url.origin!==self.location.origin||!url.pathname.includes('/audio/'))throw Error('Invalid audio asset');const response=await fetch(url);if(!response.ok)throw Error('An audio file could not be saved');await cache.put(url,response);}event.ports[0]?.postMessage({ok:true});}catch(error){event.ports[0]?.postMessage({ok:false,message:error.message});}})());});

async function cachedResponse(request, response) {
  const range = /^bytes=(\d*)-(\d*)$/i.exec(request.headers.get('range') || '');
  if (!range || (!range[1] && !range[2])) return response;

  const data = await response.arrayBuffer();
  const size = data.byteLength;
  const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
  const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
  if (start > end) {
    return new Response(null, {status: 416, headers: {'Content-Range': `bytes */${size}`}});
  }
  return new Response(data.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'audio/mp4',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

self.addEventListener('fetch', event => {
  const {request} = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (!url.pathname.includes('/audio/')) {
      try {
        const fresh = await fetch(request, {cache: 'no-cache'});
        if (fresh.ok) {
          await cache.put(request, fresh.clone());
          return fresh;
        }
      } catch {}
    }
    const cached = await cache.match(request) || await cache.match(request, {ignoreSearch: true});
    return cached ? cachedResponse(request, cached) : fetch(request);
  })());
});
