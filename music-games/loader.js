/* On-demand scripts also work from file://; no runtime JSX compiler is required. */
(() => {
  const requests = new Map(), activities = new Map();
  const engineFor = mode => ['quiz','gameshow-quiz','true-or-false','match-up','type-the-answer','group-sort','complete-the-sentence','matching-pairs','rank-order','wordsearch','crossword','labelled-diagram'].includes(mode) ? 'learning' : 'arcade';
  function script(url) {
    if (requests.has(url)) return requests.get(url);
    const pending = new Promise((resolve, reject) => {
      const element = document.createElement('script');
      element.src = url; element.async = true;
      element.onload = () => resolve();
      element.onerror = () => { element.remove(); requests.delete(url); reject(new Error('Could not load this game. Please try again.')); };
      document.head.appendChild(element);
    });
    requests.set(url, pending);
    return pending;
  }
  const styles = new Map();
  function style(file) {
    if (styles.has(file)) return styles.get(file);
    const pending = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = window.IGRuntimeStyles?.[file] || './' + file;
      link.onload = () => resolve();
      link.onerror = () => { link.remove(); styles.delete(file); reject(new Error('Could not load this screen’s appearance. Please try again.')); };
      const theme=document.querySelector?.('link[data-music-games-theme]');if(theme)theme.before(link);else document.head.appendChild(link);
    });
    styles.set(file, pending);
    return pending;
  }
  const bundle = name => script(window.IGRuntimeFiles[name]);
  function ready(kind, mode) {
    return kind === 'player' && Boolean(window.IGGameSession && (window.IGLearning?.[mode] || window.IGArcade?.[mode]) && (mode !== 'labelled-diagram' || window.IGLabelledDiagram));
  }
  async function load(kind, mode = 'quiz') {
    if (kind !== 'player') throw new Error('Unknown game screen.');
    {
      await Promise.all(['music-games/learning.css','music-games/arcade.css','music-games/content.css','music-games/preview-theme.css','music-games/diagram.css','music-games/player.css'].map(style));
      await Promise.all([bundle('media'), bundle('sounds'), bundle('timer')]);
      if (mode === 'labelled-diagram') {
        await bundle('diagram-core');
        await bundle('diagram');
      }
      await bundle(engineFor(mode));
      if (window.IGRuntimeFiles['level-test-core']) await bundle('level-test-core');
      await bundle('session');
    }
  }
  async function activity(id) {
    if (activities.has(id)) return window.IGCore.normalize(activities.get(id));
    const entry = window.IGActivityIndex.find(row => row.id === id);
    if (!entry) throw new Error('This activity is not in the library.');
    await script(entry.file);
    if (!activities.has(id)) throw new Error('This activity could not be loaded.');
    return window.IGCore.normalize(activities.get(id));
  }
  window.IGRuntime = { ready, load, activity, registerActivity(value) { activities.set(value.id, value); } };
})();
