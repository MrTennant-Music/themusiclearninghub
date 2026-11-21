(() => {
  const {createElement:h} = React;
  document.getElementById('recorderContent').className = MLH.shell.pageContentClass;
  document.getElementById('recorderPanel').className = MLH.shell.mainShellClass;
  const headerRoot = ReactDOM.createRoot(document.getElementById('recorderHeader'));
  MLH.renderAssessmentHeader = (worksheetMode = false, worksheetEnabled = true, zoom = null) => headerRoot.render(h(MLH.AppHeader, {
    worksheetMode,
    icon:'./app-icons/performing-assessment-icon.svg',
    title:'Digital Performance Assessment',
    subtitle:'Record performing assessments, feedback and marks.',
    profileUsesSharedSettings:false,
    profileShowQr:false,
    worksheetConfig:worksheetEnabled ? ()=>{ window.MLH.openAssessmentWorksheet(); return null; } : undefined
  }, zoom && h('div', {className:'recorder-sheet-zoom', role:'group', 'aria-label':'Assessment sheet zoom'},
    h('img', {src:'./ui-icons/zoom-in.svg', alt:''}),
    h('button', {type:'button', 'aria-label':'Zoom out', title:'Zoom out', disabled:zoom.percent <= zoom.min, onClick:()=>zoom.onStep(-1)}, '−'),
    h('output', {'aria-label':'Zoom level'}, `${zoom.percent}%`),
    h('button', {type:'button', 'aria-label':'Zoom in', title:'Zoom in', disabled:zoom.percent >= zoom.max, onClick:()=>zoom.onStep(1)}, '+')
  )));
  MLH.renderAssessmentDateMenu = (element, groups, onSelect) => {
    const root = ReactDOM.createRoot(element);
    root.render(h(MLH.MenuPanel, { title:element.dataset.menuTitle, dataMenuPanel:true },
      groups.map(({heading, choices}, index) => {
        const dateChoices = choices.filter(choice => choice.date !== 'all');
        const allDates = choices.find(choice => choice.date === 'all');
        const levels = Object.fromEntries(dateChoices.map((choice, i) => [`date-${i}`, {
          label:choice.label,
          description:choice.description,
          icon:h('img', { src:'./ui-icons/calendar.svg', alt:'', className:'h-7 w-7 object-contain' })
        }]));
        const active = dateChoices.findIndex(choice => choice.active);
        return h(React.Fragment, {key:index},
          heading && h(MLH.MenuSubheading, null, heading),
          dateChoices.length > 0 && h(MLH.LevelMenu, {
            levels,
            activeLevel:`date-${active}`,
            updateUrl:false,
            onSelect: key => onSelect(dateChoices[Number(key.slice(5))])
          }),
          h('button', {
            type:'button',
            className:'recorder-show-all-dates',
            'aria-pressed':allDates.active,
            onClick:() => onSelect(allDates)
          }, 'Show All')
        );
      })
    ));
    return () => root.unmount();
  };
  MLH.renderAssessmentFilterMenu = (element, fields) => {
    const root = ReactDOM.createRoot(element);
    root.render(h(MLH.MenuPanel, { title:'Filter', position:'right-0', dataMenuPanel:true },
      h('div', {className:'recorder-roster-filters'},
        fields.map(({key, label, options, value}) => h('label', {key},
          h('span', null, label),
          h('select', {'data-pupil-filter':key, defaultValue:value},
            h('option', {value:''}, 'Any'),
            options.map(option => h('option', { key:option, value:option }, option))
          )
        )),
        h('button', {type:'button', className:MLH.ToolbarButtonClass, 'data-clear-pupil-filters':true}, 'Clear')
      )
    ));
    return () => root.unmount();
  };
  MLH.renderAssessmentHeader();
})();
