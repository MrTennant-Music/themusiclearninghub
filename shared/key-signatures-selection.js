(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.KEY_SIGNATURES_SELECTION=api;})(typeof window==='object'?window:globalThis,function(){
 function create(random=Math.random){const bags=new Map();function pick(name,items){const id=name+JSON.stringify(items);let bag=bags.get(id);if(!bag?.values.length){const values=items.slice();for(let i=values.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[values[i],values[j]]=[values[j],values[i]];}if(bag&&values.length>1&&JSON.stringify(values.at(-1))===bag.last){const i=values.findIndex(v=>JSON.stringify(v)!==bag.last);if(i>=0)[values[i],values[values.length-1]]=[values.at(-1),values[i]];}bag={values,last:bag?.last};bags.set(id,bag);}const value=bag.values.pop();bag.last=JSON.stringify(value);return value;}
    function plan(level, keys) {
      const signature = (key) => JSON.stringify(key.signature);
      const canChange = level === "AH" && new Set(keys.map(signature)).size > 1;
      const change = canChange && pick("change/" + level, Array.from({ length: 25 }, (_, i) => i < 7));
      const type = change ? "identify-key-change" : "identify-key";
      const key = pick(level + "/" + type + "/answer", keys);
      const startKey = change
        ? pick(level + "/start/" + key.id, keys.filter((item) => signature(item) !== signature(key)))
        : null;
      const identifyMode = change ? "buttons" : pick(level + "/input", Array.from({ length: 20 }, (_, i) => i < 7 ? "typed" : "buttons"));
      return { type, key, startKey, identifyMode };
    }
    return { pick, plan };
  }

  function normaliseKeys(availableIds, saved) {
    if (!Array.isArray(saved)) return availableIds;
    const selected = availableIds.filter((id) => saved.includes(id));
    return selected.length ? selected : availableIds;
  }
 return {create,normaliseKeys};
});
