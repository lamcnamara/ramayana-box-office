(() => {
  'use strict';
  const {asOf, releases, markets, world, directory} = JSON.parse(document.getElementById('atlas-data').textContent);
  const $ = id => document.getElementById('atlas-' + id);
  const map = $('map'), stage = $('stage'), slider = $('day'), chooser = $('find'), tip = $('tip');
  const svgNS = 'http://www.w3.org/2000/svg';
  const dayMs = 86400000;
  const released = Object.entries(releases).filter(([,r]) => r.status === 'released');
  const first = released.map(([,r]) => r.date).sort()[0];
  const index = date => Math.round((Date.parse(date) - Date.parse(first)) / dayMs);
  const iso = i => new Date(Date.parse(first) + i * dayMs).toISOString().slice(0,10);
  const short = new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',timeZone:'UTC'});
  const long = new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
  const fmt = (date, style=short) => style.format(new Date(date));
  const sorted = Object.keys(releases).sort((a,b) => releases[a].name.localeCompare(releases[b].name,'en'));
  const pilotCodes = Object.keys(markets);
  const shapes = new Map(), bars = new Map(), cards = new Map();
  let day = asOf, unit = 'USD', rate = 94, timer = null, selected = '', hovered = '';
  let pointer = null, drag = null, skipClick = false;
  let zoom = 1, center = [500,250];
  slider.max = String(index(asOf));
  function element(tag, cls, content) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (content !== undefined) node.textContent = content;
    return node;
  }
  function svg(tag, attrs, parent) {
    const node = document.createElementNS(svgNS,tag);
    for (const [k,v] of Object.entries(attrs)) node.setAttribute(k,v);
    parent.append(node);
    return node;
  }
  function sourceLink(text, url) {
    const a = element('a','',text);
    a.href = url;
    return a;
  }
  function openOn(code) {
    const r = releases[code];
    return r && r.status === 'released' && r.date <= day;
  }
  function releaseText(code) {
    const r = releases[code];
    if (!r || !r.date) return 'Opening date unconfirmed';
    if (!openOn(code)) {
      if (r.status === 'scheduled') return 'Scheduled for ' + fmt(r.date);
      return r.dateType === 'by' ? 'First verified screening by ' + fmt(r.date) : 'Opens ' + fmt(r.date);
    }
    return (r.dateType === 'by' ? 'In cinemas by ' : 'Opened ') + fmt(r.date);
  }
  function current(code) {
    return openOn(code) ? markets[code]?.rows.findLast(row => row.date <= day) : undefined;
  }
  function directoryReport(code) {
    if (!openOn(code)) return null;
    const rows = directory[code]?.rows.filter(r => r.date <= day);
    if (!rows?.length) return null;
    const latest = rows.filter(r => r.date === rows.at(-1).date);
    return latest.find(r => r.kind === 'cumulative' && r.unit !== 'admissions') ||
      latest.find(r => r.kind === 'cumulative') || latest[0];
  }
  function usd(value, nativeUnit) { return nativeUnit === 'USD' ? value : value * 1e7 / rate; }
  function figure(value, nativeUnit) {
    let amount = value;
    if (unit !== nativeUnit) amount = unit === 'USD' ? usd(value,nativeUnit) : value * rate / 1e7;
    if (unit === 'INR_CR') {
      const digits = amount > 0 && amount < .01 ? 4 : 2;
      return '₹' + amount.toLocaleString('en-IN',{minimumFractionDigits:digits, maximumFractionDigits:digits}) + ' cr';
    }
    return 'US$' + Math.round(amount).toLocaleString('en-US');
  }
  function freshness(row) {
    if (!row) return '';
    const age = index(day) - index(row.date);
    return age ? 'Through ' + fmt(row.date) + ' · ' + age + (age === 1 ? ' day old' : ' days old') : 'Through ' + fmt(row.date) + ' · current';
  }
  function emptyGross(code) {
    return openOn(code) ? 'Awaiting first report' : 'Before release';
  }
  function directoryLine(r) {
    const kinds = {cumulative:'Cumulative',weekend:'Weekend',week:'Week',day:'Day'};
    return (kinds[r.kind] || r.kind) + ' · ' + r.value + ' · through ' + fmt(r.date) + (r.status ? ' · ' + r.status : '');
  }
  function describe(code) {
    const m = markets[code], row = current(code), report = directoryReport(code);
    const lines = [releaseText(code)];
    if (row) {
      lines.push(figure(row.cumulative,m.unit) + ' cumulative', freshness(row));
      if (m.cadence === 'weekend') lines.push('Weekend ending ' + fmt(row.date) + ' · ' + figure(row.weekend,m.unit));
      else if (day === row.date) lines.push('Daily gross · ' + figure(row.daily,m.unit));
      else lines.push('Selected-day gross pending');
    } else if (m) lines.push(emptyGross(code));
    else if (report) lines.push(directoryLine(report));
    else if (openOn(code)) lines.push('No dated figure in this replay');
    return lines;
  }
  function build() {
    for (const path of world.neutralPaths || []) svg('path',{d:path,class:'atlas-country'},$('land'));
    const dots = [];
    const small = new Set('SG MT BH HK MO SC MU RE QA CY LU LC KY TT BB AG GD KN VC AW CW VI GU GP MQ MV BN'.split(' '));
    for (const [code, geo] of Object.entries(world.countries)) {
      const nodes = [];
      shapes.set(code,nodes);
      if (geo.path) nodes.push(svg('path',{d:geo.path,'fill-rule':'evenodd', 'data-code':code},$('land')));
      if (releases[code] && (!geo.path || small.has(code))) dots.push([code,geo]);
    }
    for (const [code,geo] of dots) shapes.get(code).push(svg('circle',{
      cx:geo.point[0], cy:geo.point[1], r:2.8, 'data-code':code, 'data-dot':'1'
    },$('land')));
    for (const code of sorted) chooser.append(new Option(releases[code].name,code));
    for (const code of pilotCodes) {
      const root = svg('g',{class:'atlas-mark','data-code':code},$('bars'));
      bars.set(code,{
        root, lead:svg('line',{class:'lead'},root), column:svg('rect',{class:'column',x:-5,y:0,width:10,height:0},root),
        baseline:svg('line',{class:'baseline',x1:-7,x2:7,y1:0,y2:0},root),
        origin:svg('circle',{class:'origin',cx:0,cy:0,r:1.7},root),
        name:svg('text',{class:'map-name'},root), value:svg('text',{class:'map-amount'},root),
        stamp:svg('text',{class:'map-stamp'},root), hit:svg('rect',{class:'hit'},root)
      });
      const card = element('button','atlas-card');
      card.type = 'button';
      card.dataset.code = code;
      card.append(element('strong','',markets[code].name),element('span','atlas-figure'),
        element('small','atlas-stamp'),element('span','atlas-card-source',markets[code].cadence === 'weekend' ? 'Weekend reports' : 'Daily reports'));
      card.addEventListener('click',() => inspect(code));
      $('cards').append(card);
      cards.set(code,card);
    }
    const today = Number(slider.max), ticks = new Set([0,today]);
    for (let i=1;i<today;i++) if (new Date(iso(i)).getUTCDay() === 0 && today-i >= 3 && i >= 3) ticks.add(i);
    for (const i of [...ticks].sort((a,b) => a-b)) {
      const button = element('button','',fmt(iso(i))); button.type='button';
      button.style.left = (100*i/today) + '%'; button.addEventListener('click',() => seek(i,true));
      $('ticks').append(button);
    }
  }
  function renderShapes() {
    for (const [code,nodes] of shapes) {
      const r = releases[code];
      const active = openOn(code);
      const opening = active && r.dateType === 'exact' && r.date === day;
      for (const node of nodes) {
        node.setAttribute('class','atlas-country' + (active ? ' open' : '') + (opening ? ' today' : '') +
          (code === selected ? ' selected' : '') + (code === hovered ? ' active' : '') + (node.dataset.dot ? ' atlas-point' : ''));
        if (r) node.dataset.release = r.status;
      }
    }
  }
  function positionBars() {
    const matrix = map.getScreenCTM(), scale = matrix?.a;
    if (!scale || !Number.isFinite(scale)) return;
    const frame = map.getBoundingClientRect(), labels = [];
    const max = Math.max(...pilotCodes.flatMap(code => markets[code].rows.map(r => usd(r.cumulative,markets[code].unit))));
    const top = Math.min(108,135*scale/zoom);
    for (const [code, b] of bars) {
      const m = markets[code], row = current(code), [x,y] = world.countries[code].point;
      const px = x*scale + matrix.e - frame.left, py = y*scale + matrix.f - frame.top;
      const visible = openOn(code) && px >= 0 && px <= frame.width && py >= 0 && py <= frame.height;
      b.root.style.display = visible ? '' : 'none';
      if (!visible) continue;
      const height = row && max ? usd(row.cumulative,m.unit)/max*top : 0;
      b.root.setAttribute('transform','translate('+x+' '+y+') scale('+(1/scale)+')');
      b.column.setAttribute('y',-height);
      b.column.setAttribute('height',height);
      b.name.textContent = m.name;
      b.value.textContent = row ? figure(row.cumulative,m.unit) : 'Pending';
      b.stamp.textContent = row ? 'Through ' + fmt(row.date) : '';
      const half = Math.max(42,...[b.name,b.value,b.stamp].map(t => t.getComputedTextLength()/2)) + 3;
      const h = row ? 41 : 29;
      const clamp = (n,lo,hi) => Math.max(lo,Math.min(n,hi));
      // Measure in screen pixels so zoom and narrow viewports retain readable labels.
      const candidates = [[0,5],[0,49],[-half-8,6],[half+8,6],[-half-8,51],[half+8,51],[0,95]];
      let best, leastOverlap = Infinity;
      for (const [xShift,yShift] of candidates) {
        const left = clamp(px+xShift-half,3,frame.width-2*half-3);
        const topY = clamp(py+yShift,3,frame.height-h-3);
        const box = {left,top:topY,right:left+2*half,bottom:topY+h};
        const overlap = labels.reduce((sum,l) => sum +
          Math.max(0, Math.min(l.right,box.right)-Math.max(l.left,box.left)) *
          Math.max(0, Math.min(l.bottom,box.bottom)-Math.max(l.top,box.top)), 0);
        if (overlap < leastOverlap) {best=box;leastOverlap=overlap;}
        if (!overlap) break;
      }
      labels.push(best);
      const dx = best.left+half-px, dy = best.top+10-py;
      b.lead.setAttribute('x2',dx); b.lead.setAttribute('y2',dy-10);
      for (const [node,offset] of [[b.name,0],[b.value,14],[b.stamp,26]]) {
        node.setAttribute('x',dx); node.setAttribute('y',dy+offset); node.setAttribute('text-anchor','middle');
      }
      b.hit.setAttribute('x',dx-half); b.hit.setAttribute('y',dy-10);
      b.hit.setAttribute('width',2*half); b.hit.setAttribute('height',h);
    }
  }
  function view() {
    const w=1000/zoom, h=500/zoom;
    center = [Math.max(w/2,Math.min(1000-w/2,center[0])), Math.max(h/2,Math.min(500-h/2,center[1]))];
    map.setAttribute('viewBox',[center[0]-w/2,center[1]-h/2,w,h].join(' '));
    stage.classList.toggle('zoomed',zoom>1);
    $('zoom-out').disabled = zoom === 1; $('zoom-in').disabled = zoom >= 5; $('reset').disabled = zoom === 1;
    positionBars();
  }
  function selection() {
    const panel = $('selection'); panel.replaceChildren(); panel.hidden = !selected;
    for (const [code,card] of cards) card.setAttribute('aria-pressed',String(code === selected));
    if (!selected) return;
    const code=selected, r=releases[code], m=markets[code], row=current(code), report=directoryReport(code);
    const close=element('button','atlas-close','Close'); close.type='button';
    close.onclick=() => {inspect(''); chooser.focus();};
    panel.append(close,element('h4','',r?.name || world.countries[code].name),
      element('p','',describe(code).join(' · ')));
    if (r) {
      const evidence=element('p'); evidence.append(sourceLink(r.basis,r.source),' · '+r.note); panel.append(evidence);
    }
    if (row || report) {
      const source=element('p');
      source.append(sourceLink(row ? m.sourceName : report.sourceName,row ? row.sourceUrl || m.sourceUrl : report.sourceUrl));
      if (row) source.append(' · ' + (m.cadence === 'daily' ? 'Daily reporting' : 'Weekend reporting') + (code === 'IN' ? ' · trade estimate' : ''));
      panel.append(source);
    }
    if (directory[code]) {
      const a=element('a','','View dashboard market record'); a.href='#market-'+directory[code].id; panel.append(a);
    }
  }
  function showTip(code,client) {
    const name = releases[code]?.name || world.countries[code]?.name;
    if (!name || !client) {tip.hidden=true;return;}
    tip.replaceChildren(element('b','',name),...describe(code).map(t => element('span','',t)));
    tip.hidden=false;
    const rect=stage.getBoundingClientRect();
    const x=client.x-rect.left, y=client.y-rect.top;
    const left = x+14+tip.offsetWidth < rect.width ? x+14 : x-12-tip.offsetWidth;
    const top = y+14+tip.offsetHeight < rect.height ? y+14 : y-12-tip.offsetHeight;
    tip.style.left=Math.max(4,Math.min(rect.width-tip.offsetWidth-4,left))+'px';
    tip.style.top=Math.max(4,Math.min(rect.height-tip.offsetHeight-4,top))+'px';
  }
  function inspect(code) {
    stop();
    selected=code; chooser.value=releases[code] ? code : '';
    if (code) {
      if (zoom>1) {center=world.countries[code].point.slice();view();}
      $('announcement').textContent=(releases[code]?.name || world.countries[code].name)+'. '+describe(code).join('. ');
    }
    tip.hidden=true; renderShapes(); selection();
  }
  function controls() {
    $('play-text').textContent = timer ? 'Pause' : day === asOf ? 'Replay' : 'Play';
    $('play-icon').textContent = timer ? 'Ⅱ' : '▶';
    $('play').setAttribute('aria-label',timer ? 'Pause timeline' : day === asOf ? 'Replay from the first release' : 'Play timeline');
    $('prev').disabled=day === first; $('next').disabled=day === asOf;
  }
  function render() {
    const i=index(day); slider.value=i; slider.setAttribute('aria-valuetext',fmt(day,long));
    $('date').textContent=fmt(day,long);
    $('count').textContent=released.filter(([code]) => openOn(code)).length+' markets released';
    $('rate').textContent='₹'+rate.toLocaleString('en-IN')+' per US$ · dashboard rate';
    for (const [code,card] of cards) {
      const m=markets[code], row=current(code);
      card.children[1].textContent=row ? figure(row.cumulative,m.unit) : '—';
      card.children[2].textContent=row ? freshness(row) : emptyGross(code);
      card.children[2].classList.toggle('held',!!row && row.date < day);
    }
    for (const btn of document.querySelectorAll('[data-atlas-unit]')) btn.setAttribute('aria-pressed',String(btn.dataset.atlasUnit===unit));
    renderShapes(); positionBars(); selection(); controls();
    if (hovered && pointer) showTip(hovered,pointer);
  }
  function stop() {
    if (timer !== null) clearInterval(timer);
    timer=null; controls();
  }
  function seek(i,manual=false) {
    if (manual) stop();
    day=iso(Math.max(0,Math.min(Number(slider.max),i)));
    if (day===asOf) stop();
    render();
  }
  function togglePlay() {
    if (timer) {stop();return;}
    if (day===asOf) seek(0);
    timer=setInterval(() => seek(index(day)+1),1100); controls();
  }
  function changeZoom(next) {
    if (zoom===1 && next>1 && selected) center=world.countries[selected].point.slice();
    zoom=Math.min(5,Math.max(1,next)); view(); tip.hidden=true;
  }
  build(); view(); render();
  chooser.addEventListener('change',() => inspect(chooser.value));
  $('play').onclick=togglePlay;
  $('prev').onclick=() => seek(index(day)-1,true);
  $('next').onclick=() => seek(index(day)+1,true);
  slider.addEventListener('pointerdown',stop); slider.addEventListener('input',() => seek(Number(slider.value),true));
  for (const btn of document.querySelectorAll('[data-atlas-unit]')) btn.onclick=() => {unit=btn.dataset.atlasUnit;render();};
  $('zoom-in').onclick=() => changeZoom(zoom*1.6);
  $('zoom-out').onclick=() => changeZoom(zoom/1.6);
  $('reset').onclick=() => changeZoom(1);
  map.addEventListener('pointerdown',e => {
    skipClick=false;
    if (zoom>1 && e.button===0) drag={x:e.clientX,y:e.clientY,center:center.slice(),scale:map.getScreenCTM().a};
  });
  map.addEventListener('pointermove',e => {
    if (drag && e.buttons) {
      const dx=e.clientX-drag.x, dy=e.clientY-drag.y;
      if (Math.abs(dx)+Math.abs(dy)>5) {
        skipClick=true; map.setPointerCapture(e.pointerId); stage.classList.add('dragging');
        center=[drag.center[0]-dx/drag.scale,drag.center[1]-dy/drag.scale]; view(); tip.hidden=true;return;
      }
    }
    if (e.pointerType==='touch') return;
    const code=e.target.closest('[data-code]')?.dataset.code || '';
    if (hovered!==code) {hovered=code;renderShapes();}
    pointer={x:e.clientX,y:e.clientY}; showTip(code,pointer);
  });
  function endDrag(){drag=null;stage.classList.remove('dragging');}
  map.addEventListener('pointerup',endDrag); map.addEventListener('pointercancel',endDrag);
  map.addEventListener('pointerleave',() => {hovered='';pointer=null;tip.hidden=true;renderShapes();});
  map.addEventListener('click',e => {
    if (skipClick) return;
    const code=e.target.closest('[data-code]')?.dataset.code || '';
    inspect(code);
    if (code) showTip(code,{x:e.clientX,y:e.clientY});
  });
  document.addEventListener('keydown',e => {if (e.key==='Escape'){hovered='';pointer=null;tip.hidden=true;renderShapes();}});
  document.addEventListener('visibilitychange',() => {if (document.hidden) stop();});
  document.addEventListener('snapshot-rate',e => {rate=e.detail;render();});
  new ResizeObserver(positionBars).observe(stage);
})();
