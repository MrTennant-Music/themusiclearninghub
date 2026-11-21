(() => {
  window.IGReadMediaFile = async function readMediaFile(file, expectedType) {
    const audioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/ogg'];
    const extension = (file.name || '').split('.').pop().toLowerCase();
    const audioType = audioTypes.includes(file.type) ? file.type : ({ mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', aac: 'audio/aac', ogg: 'audio/ogg' })[extension];
    const mime = expectedType === 'audio' || file.type.startsWith('audio/') || (!file.type && audioType) ? audioType : file.type;
    if (expectedType === 'audio' && !audioType) throw Error('Choose an MP3, WAV, M4A, AAC or OGG audio file.');
    const type = mime?.split('/')[0];
    if (!['image', 'audio', 'video'].includes(type) || mime === 'image/svg+xml') throw Error('Use a photo, GIF, audio or video file.');
    const limit = type === 'audio' ? 15 : 20;
    if (!file.size || file.size > limit * 1024 * 1024) throw Error(`${type === 'audio' ? 'Audio files' : 'Files'} must be ${limit} MB or smaller.`);
    const src = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(Error('This file could not be read.'));
      reader.readAsDataURL(file.slice(0, file.size, mime));
    });
    return window.IGCore.safeMedia({ type, src, name: file.name });
  };
  window.IGMedia = function Media({
    media
  }) {
    const [failed, setFailed] = React.useState(false);
    React.useEffect(() => setFailed(false), [media?.src]);
    if (!media) return null;
    if (failed) return <span className="ig-muted" role="status">Media could not be loaded.</span>;
    const props = {
      src: media.src,
      onError: () => setFailed(true)
    };
    const credit = media.sourceUrl && <a className="ig-image-credit" href={media.sourceUrl} target="_blank" rel="noopener noreferrer" title={[media.credit, media.license].filter(Boolean).join(' · ')}>{media.type === 'audio' ? 'Audio credit' : 'Image credit'}</a>;
    if (media.type === 'image') return <><img {...props} className="ig-media-image" alt={media.name || 'Activity image'} draggable="false" />{credit}</>;
    if (media.type === 'audio') return <><audio {...props} controls preload="metadata" aria-label={media.name || 'Audio clip'} />{credit}</>;
    if (media.type === 'video') return <video {...props} controls preload="metadata" playsInline aria-label={media.name || 'Video clip'} />;
    return null;
  };
})();
