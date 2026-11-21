/* SoundCloud uses hosted widgets; no audio is downloaded. */
const plain = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0,500);
function trackUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !['soundcloud.com','www.soundcloud.com'].includes(url.hostname) || url.port || url.username || url.password || !/^\/[^/]+\/[^/]+\/?$/.test(url.pathname) || /^\/(search|discover|you|settings|pages|terms|privacy)\//.test(url.pathname)) throw Error('Paste a public SoundCloud track link, such as https://soundcloud.com/artist/track.');
  return 'https://soundcloud.com' + url.pathname.replace(/\/$/,'');
}
function playerUrl(source) {
  return 'https://w.soundcloud.com/player/?' + new URLSearchParams({ url: trackUrl(source), auto_play: 'false', hide_related: 'true', show_comments: 'false', show_user: 'true', show_reposts: 'false', visual: 'false' });
}
async function resolveSoundCloud(source) {
  const sourceUrl = trackUrl(source);
  const response = await fetch('https://soundcloud.com/oembed?' + new URLSearchParams({ format:'json', url:sourceUrl, maxheight:'166' }), { signal:AbortSignal.timeout(20000) });
  if (!response.ok) throw Error('This track cannot be embedded. Choose a public track with embedding enabled.');
  const data = await response.json();
  if (data.type !== 'rich' || !/https:\/\/w\.soundcloud\.com\/player\//.test(data.html || '')) throw Error('SoundCloud did not provide an embedded player for this track.');
  return { provider:'soundcloud', name:plain(data.title) || 'SoundCloud track', credit:plain(data.author_name), sourceUrl, embedUrl:playerUrl(sourceUrl) };
}
let cachedToken, tokenExpires=0, tokenRequest;
async function accessToken() {
  if (cachedToken && Date.now() < tokenExpires) return cachedToken;
  if (tokenRequest) return tokenRequest;
  tokenRequest = (async()=>{
    const response = await fetch('https://secure.soundcloud.com/oauth/token', { method:'POST', headers:{ Authorization:'Basic '+Buffer.from(process.env.SOUNDCLOUD_CLIENT_ID+':'+process.env.SOUNDCLOUD_CLIENT_SECRET).toString('base64'), 'Content-Type':'application/x-www-form-urlencoded' }, body:'grant_type=client_credentials', signal:AbortSignal.timeout(20000) });
    if (!response.ok) throw Error('SoundCloud search credentials could not be verified. You can still paste a track link.');
    const data=await response.json();
    if(!data.access_token) throw Error('SoundCloud search could not be authorised.');
    cachedToken=data.access_token;tokenExpires=Date.now()+Math.max(0,Number(data.expires_in || 3600)-60)*1000;
    return cachedToken;
  })();
  try{return await tokenRequest;}finally{tokenRequest=null;}
}
async function searchSoundCloud(query,offset=0) {
  const term=String(query || '').trim().slice(0,500);
  if (/^https?:\/\//i.test(term)) {
    const media=await resolveSoundCloud(term);
    return {images:[{id:media.sourceUrl,media:{type:'audio',...media}}],nextOffset:null};
  }
  const externalSearchUrl='https://soundcloud.com/search/sounds?'+new URLSearchParams({q:term});
  if(!process.env.SOUNDCLOUD_CLIENT_ID || !process.env.SOUNDCLOUD_CLIENT_SECRET) return {images:[],nextOffset:null,externalSearchUrl,notice:'Open SoundCloud search, then paste a public track link above to preview and add it.'};
  const response=await fetch('https://api.soundcloud.com/tracks?'+new URLSearchParams({q:term,limit:'24',offset:String(Math.max(0,Math.min(10000,Number(offset)||0))),linked_partitioning:'true',access:'playable'}),{headers:{Authorization:'OAuth '+await accessToken()},signal:AbortSignal.timeout(25000)});
  if(!response.ok) throw Error('SoundCloud search is unavailable. You can still paste a track link.');
  const data=await response.json(),tracks=Array.isArray(data)?data:data.collection || [];
  return {images:tracks.filter(track=>track.permalink_url && !['none','me'].includes(track.embeddable_by) && track.sharing!=='private' && track.access!=='blocked').map(track=>({id:'soundcloud-'+(track.urn || track.id),media:{type:'audio',provider:'soundcloud',name:plain(track.title),sourceUrl:trackUrl(track.permalink_url),credit:plain(track.user?.username),embedUrl:playerUrl(track.permalink_url)}})),nextOffset:data.next_href?Number(offset)+24:null};
}
module.exports={trackUrl,playerUrl,resolveSoundCloud,searchSoundCloud};
