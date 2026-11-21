/* Record each distinct music game screen in normal browser history. */
(function(root){
  function create(history,location,onNavigate,options={}){
    
    let current=options.initialView||'library';
    let home=location.pathname+location.search;
    const entry=current==='activity'&&/^#(?:playnote|activity)=/.test(location.hash||'')?home+location.hash:home;
    history.replaceState({...history.state,playnoteView:current,playnoteEntry:history.state?.playnoteEntry==='detail'?'detail':'root'},'',entry);
    function navigate(next){
      if(next===current)return;
      const state = {...history.state, playnoteView:next};
      history[options.replaceScreens?'replaceState':'pushState'](state,'',next==='library'?home:location.pathname+location.search);
      current=next;
      onNavigate(next);
    }
    function pop(event){
      current=event.state?.playnoteView||'library';
      onNavigate(current);
    }
    function replaceLibraryUrl(url){
      if(current!=='library')return false;
      // Level, game and topic pickers are one choosing screen in history.
      home=url;
      history.replaceState({...history.state,playnoteView:'library'},'',url);
      return true;
    }
    function replaceActivityUrl(url){
      // A compressed share link may finish after the user has already left.
      if(current!=='activity' || history.state?.playnoteView!=='activity')return false;
      history.replaceState({...history.state},'',url);
      return true;
    }
    return {navigate,pop,replaceLibraryUrl,replaceActivityUrl};
  }
  
  const api={create};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.IGNavigation=api;
})(typeof window!=='undefined'?window:globalThis);
