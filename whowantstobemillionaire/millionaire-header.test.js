const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
test('shared stat cards keep the Question medal menu while Time has no reset action',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../shared/hub-shell.js'),'utf8'),start=source.indexOf('  function ScoreStreakPanel('),end=source.indexOf('\n  MLH.AppHeader',start);
 function render(props,popover=null){
  let index=0;
  const React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity)}),useState:initial=>[index++===0?popover:initial,()=>{}],useRef:initial=>({current:initial}),useEffect(){},useLayoutEffect(){}};
  const context={React,MLH:{shell:{scoreTileClass:'tile',scoreTileActiveClass:'active'}},useClickAway(){}};
  vm.runInNewContext(source.slice(start,end)+';this.Panel=ScoreStreakPanel;',context);
  return context.Panel({assets:{bronze:'b',silver:'s',gold:'g',diamond:'d'},correct:2,attempted:2,accuracy:0,streak:2,bestStreak:4,resetScore(){},medalEligible:true,medalThresholdValues:[3,5,10,15],medalThresholdLabels:[3,5,10,15],...props});
 }
 const tree=render({scoreInteractive:false,scoreDisplay:{label:'Time',value:'1:23',subtitle:'\u00a0',fillPercent:0},streakDisplay:{label:'Question',value:'3/15',subtitle:'Best: 4'}},'score');
 const [time,question]=tree.children;
 assert.equal(time.props.role,undefined);assert.equal(time.props.tabIndex,undefined);assert.equal(time.props.onClick,undefined);
 assert.equal(question.props.role,'button');assert.equal(typeof question.props.onClick,'function');
 function all(node){return node&&typeof node==='object'?[node,...node.children.flatMap(all)]:[];}
 assert(!all(tree).some(node=>node.type==='button'&&node.children.includes('Reset')));
 assert.equal(render({}).children[0].props.role,'button','Other Hub activities keep their existing score control');
 const openMenu=all(render({scoreInteractive:false},'streak'));
 const popup=openMenu.find(node=>node.props.className?.includes('fixed-popover-button'));
 assert.equal(popup.props.style.width,'max-content','The dropdown must not squeeze medal icons to the stat-card width');
 const medals=openMenu.filter(node=>node.type==='img').map(node=>node.props.src);
 assert.deepEqual(Array.from(medals),['b','s','g','d']);
});
