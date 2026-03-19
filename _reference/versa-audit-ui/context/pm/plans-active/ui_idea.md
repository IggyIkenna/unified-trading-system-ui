bash -lc mkdir -p /mnt/data/ui_redesign_slides && cd /mnt/data/ui_redesign_slides && cat > build_deck.js <<'NODE' const
pptxgen = require('pptxgenjs'); const { warnIfSlideHasOverlaps, warnIfSlideElementsOutOfBounds, safeOuterShadow,
calcTextBox, } = require('/home/oai/skills/slides/pptxgenjs_helpers');

const pptx = new pptxgen(); pptx.layout = 'LAYOUT_WIDE'; pptx.author = 'OpenAI'; pptx.company = 'OpenAI'; pptx.subject =
'Unified Trading Platform — UI/UX Redesign Vision'; pptx.title = 'Unified Trading Platform — UI/UX Redesign Vision';
pptx.lang = 'en-US'; pptx.theme = { headFontFace: 'IBM Plex Sans', bodyFontFace: 'IBM Plex Sans', lang: 'en-US', };
pptx.defineLayout({ name: 'WIDE', width: 13.333, height: 7.5 }); pptx.layout = 'WIDE';

const C = { bg: '0A0A0B', panel: '111113', panel2: '18181B', line: '26262B', text: 'F5F7FA', muted: 'A3A3B2', cyan:
'22D3EE', cyanDim: '103B44', green: '4ADE80', blue: '60A5FA', purple: 'A78BFA', amber: 'FBBF24', red: 'F87171', white10:
'FFFFFF', };

const notes =
`[Sources]\n- User-provided redesign brief: “Unified Trading Platform — UI/UX Redesign Vision” (2026-03-17).\n- User-provided plans referenced by the brief: opus_findings_ui, ui_consolidation_ux_hardening, ui_navigation_ux_model.\n[/Sources]`;

function addBg(slide) { slide.background = { color: C.bg }; slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333,
h: 7.5, line: { color: C.bg, transparency: 100 }, fill: { color: C.bg } }); slide.addShape(pptx.ShapeType.rect, { x:
-0.6, y: 5.7, w: 3.8, h: 2.2, line: { color: C.cyan, transparency: 100 }, fill: { color: C.cyan, transparency: 90 } });
slide.addShape(pptx.ShapeType.rect, { x: 10.7, y: -0.2, w: 3.3, h: 2.0, line: { color: C.purple, transparency: 100 },
fill: { color: C.purple, transparency: 92 } }); }

function addTitle(slide, title, subtitle) { slide.addText(title, { x: 0.7, y: 0.48, w: 7.3, h: 0.42, fontFace: 'IBM Plex
Sans', fontSize: 24, bold: true, color: C.text, margin: 0 }); if (subtitle) { slide.addText(subtitle, { x: 0.7, y: 0.92,
w: 8.9, h: 0.32, fontFace: 'IBM Plex Sans', fontSize: 10.5, color: C.muted, margin: 0 }); } }

function panel(slide, x, y, w, h, opts={}) { const fill = opts.fill || C.panel; slide.addShape(pptx.ShapeType.roundRect,
{ x, y, w, h, rectRadius: 0.08, line: { color: opts.line || C.line, width: 1 }, fill: { color: fill }, shadow:
opts.shadow ? safeOuterShadow('000000', 0.3, 45, 1.2, 1) : undefined }); }

function pill(slide, x, y, w, label, color, fillTransparency=82) { slide.addShape(pptx.ShapeType.roundRect, { x, y, w,
h: 0.28, rectRadius: 0.1, line: { color, transparency: 70, width: 1 }, fill: { color, transparency: fillTransparency }
}); slide.addText(label, { x: x+0.08, y: y+0.055, w: w-0.16, h: 0.16, fontFace: 'IBM Plex Sans', fontSize: 8.2, bold:
true, color, align: 'center', margin: 0 }); }

function kpi(slide, x, y, w, h, title, value, sub, color) { panel(slide, x, y, w, h, { fill: C.panel2 });
slide.addText(title, { x: x+0.16, y: y+0.12, w: w-0.32, h: 0.18, fontFace: 'IBM Plex Sans', fontSize: 8.4, color:
C.muted, margin: 0 }); slide.addText(value, { x: x+0.16, y: y+0.34, w: w-0.32, h: 0.34, fontFace: 'JetBrains Mono',
fontSize: 18, bold: true, color, margin: 0 }); slide.addText(sub, { x: x+0.16, y: y+h-0.27, w: w-0.32, h: 0.16,
fontFace: 'IBM Plex Sans', fontSize: 8, color: C.muted, margin: 0 }); }

function addNavBar(slide, activeLabel) { panel(slide, 0.62, 0.18, 12.08, 0.38, { fill: '0D0E10' }); const items = [
['Trading', C.green], ['Strategy', C.blue], ['Markets', C.purple], ['Ops', C.amber], ['Config', C.cyan], ['ML', C.blue],
['Reports', C.muted] ]; let x = 0.88; items.forEach(([label, color]) => { const active = label === activeLabel; if
(active) { slide.addShape(pptx.ShapeType.roundRect, { x: x-0.08, y: 0.23, w: label==='Strategy'?1.08:
label==='Reports'?1.0:0.82, h: 0.24, rectRadius: 0.08, line: { color, transparency: 80, width: 1 }, fill: { color,
transparency: 86 } }); } slide.addText(label, { x, y: 0.28, w: label==='Strategy'?0.92: label==='Reports'?0.78:0.64, h:
0.12, fontFace: 'IBM Plex Sans', fontSize: 8.4, bold: active, color: active ? C.text : color, margin: 0 }); x +=
label==='Strategy' ? 1.06 : label==='Reports' ? 0.9 : 0.78; }); slide.addShape(pptx.ShapeType.roundRect, { x: 11.18, y:
0.23, w: 1.25, h: 0.24, rectRadius: 0.07, line: { color: C.line, width: 1 }, fill: { color: C.panel } });
slide.addText('⌕ Search', { x: 11.33, y: 0.285, w: 0.9, h: 0.1, fontFace: 'IBM Plex Sans', fontSize: 8, color: C.muted,
margin: 0 }); }

function addLifecycle(slide, activeIdx, y=0.74) { const steps =
['Design','Simulate','Promote','Run','Monitor','Explain','Reconcile']; let x = 0.86; steps.forEach((s, i) => { const
active = i === activeIdx; slide.addShape(pptx.ShapeType.ellipse, { x, y, w: 0.13, h: 0.13, line: { color: active ?
C.cyan : C.line, width: 1 }, fill: { color: active ? C.cyan : C.panel2 } }); slide.addText(s, { x: x+0.18, y: y-0.004,
w: 0.84, h: 0.14, fontFace: 'IBM Plex Sans', fontSize: 8.1, color: active ? C.text : C.muted, bold: active, margin: 0
}); if (i < steps.length-1) slide.addShape(pptx.ShapeType.line, { x: x+0.97, y: y+0.067, w: 0.38, h: 0, line: { color:
C.line, width: 1 } }); x += 1.38; }); }

function addBreadcrumb(slide, text) { panel(slide, 0.82, 1.04, 6.3, 0.30, { fill: '0D0E10' }); slide.addText(text, { x:
0.96, y: 1.11, w: 5.95, h: 0.12, fontFace: 'IBM Plex Sans', fontSize: 8.2, color: C.muted, margin: 0 }); }

function addMockTabs(slide, x, y, labels, active) { let xx = x; labels.forEach((l, i) => { const w = Math.max(0.62,
l.length \* 0.07 + 0.18); slide.addShape(pptx.ShapeType.roundRect, { x: xx, y, w, h: 0.24, rectRadius: 0.08, line: {
color: i===active ? C.cyan : C.line, width: 1 }, fill: { color: i===active ? C.cyan : C.panel, transparency: i===active
? 84 : 0 } }); slide.addText(l, { x: xx+0.08, y: y+0.055, w: w-0.16, h: 0.1, fontFace: 'IBM Plex Sans', fontSize: 8,
color: i===active ? C.text : C.muted, bold: i===active, margin: 0, align: 'center' }); xx += w + 0.08; }); }

function rowText(slide, x, y, cols, widths, colors, boldIdx=[], monoIdx=[]) { let xx = x; cols.forEach((c, i) => {
slide.addText(c, { x: xx, y, w: widths[i], h: 0.18, fontFace: monoIdx.includes(i) ? 'JetBrains Mono' : 'IBM Plex Sans',
fontSize: 8.2, bold: boldIdx.includes(i), color: colors[i] || C.text, margin: 0 }); xx += widths[i]; }); }

function addNotes(slide) { slide.addNotes(notes); }

// Slide 1 { const slide = pptx.addSlide(); addBg(slide); addNotes(slide); slide.addText('Unified Trading Platform', {
x: 0.78, y: 1.08, w: 6.6, h: 0.5, fontFace: 'IBM Plex Sans', fontSize: 28, bold: true, color: C.text, margin: 0 });
slide.addText('UI / UX redesign vision', { x: 0.78, y: 1.58, w: 4.4, h: 0.26, fontFace: 'IBM Plex Sans', fontSize: 15,
color: C.cyan, bold: true, margin: 0 }); slide.addText('From 11 disconnected tools to 4 daily-use surfaces + 3
specialist tools — organized by hierarchy, lifecycle, and deep-linking.', { x: 0.78, y: 1.95, w: 6.1, h: 0.44, fontFace:
'IBM Plex Sans', fontSize: 11.5, color: C.muted, margin: 0 }); pill(slide, 0.78, 2.54, 1.3, 'Plan 2026-03-17', C.cyan,
86); pill(slide, 2.2, 2.54, 1.16, 'Draft', C.green, 86); pill(slide, 3.48, 2.54, 1.6, 'Architecture + Design', C.blue,
86);

panel(slide, 7.3, 0.92, 5.28, 5.85, { fill: '0D0E10', shadow: true }); addNavBar(slide, 'Trading'); addLifecycle(slide,
3, 1.02); addBreadcrumb(slide, 'Odum Delta One > Blue Coast Capital > BTC Basis v3 > cfg-3.2.1'); kpi(slide, 7.66, 1.5,
1.08, 0.8, 'Firm PnL', '+$1.42m', '▲ +0.8% 1d', C.green); kpi(slide, 8.88, 1.5, 1.08, 0.8, 'Net Exp.', '$4.2m', '1.2x
levered', C.blue); kpi(slide, 10.1, 1.5, 1.08, 0.8, 'Margin', '82%', '$340k free', C.amber); kpi(slide, 11.32, 1.5, 0.9,
0.8, 'Alerts', '3', '2 high', C.red); panel(slide, 7.66, 2.5, 2.42, 2.25, { fill: C.panel }); slide.addText('Strategy
performance', { x: 7.84, y: 2.66, w: 1.3, h: 0.16, fontSize: 9.3, bold: true, color: C.text, margin: 0 }); const
stratRows = [ ['BTC Basis v3','● live','+$412k','2.1','4.1%'], ['ETH Staked','● live','+$289k','2.5','3.3%'], ['ML
Direction','▲ watch','-$18k','0.9','6.8%'], ['Sports Arb','● live','+$44k','1.6','1.8%'] ]; rowText(slide, 7.84, 2.96,
['Strategy','St','PnL','Sh','DD'], [0.88,0.36,0.48,0.3,0.28], [C.muted,C.muted,C.muted,C.muted,C.muted], [0]); let
yy=3.18;
stratRows.forEach(r=>{rowText(slide,7.84,yy,r,[0.88,0.36,0.48,0.3,0.28],[C.text,r[1].includes('▲')?C.amber:C.green,r[2].startsWith('-')?C.red:C.green,C.text,C.text],[0]);yy+=0.28;});
panel(slide, 10.26, 2.5, 2.0, 2.25, { fill: C.panel }); slide.addText('P&L + risk attribution', { x: 10.44, y: 2.66, w:
1.45, h: 0.16, fontSize: 9.3, bold: true, color: C.text, margin: 0 }); const
attrs=[['Funding','+$412k','$8.2m'],['Basis','+$355k','14 bps'],['Staking','+$145k','LTV .72'],['Delta','+$61k','$2.4m'],['Slippage','-$61k','—'],['Recon','-$18k','4 brks']];
rowText(slide,10.44,2.96,['Bucket','P&L','Risk'],[0.6,0.48,0.46],[C.muted,C.muted,C.muted],[0]); yy=3.18;
attrs.forEach(r=>{rowText(slide,10.44,yy,r,[0.6,0.48,0.46],[C.text,r[1].startsWith('-')?C.red:C.green,C.blue]);yy+=0.28;});
panel(slide,7.66,4.98,2.42,1.35,{fill:C.panel}); slide.addText('Alerts & incidents', { x: 7.84, y: 5.14, w: 1.1, h:
0.16, fontSize: 9.2, bold: true, color: C.text, margin: 0 }); slide.addText('● CRIT Kill switch armed\n▲ HIGH Feature
freshness lag\n▲ MED Recon break', { x: 7.84, y: 5.42, w: 1.9, h: 0.65, fontSize: 8.4, color: C.muted, breakLine: false,
margin: 0 }); panel(slide,10.26,4.98,2.0,1.35,{fill:C.panel}); slide.addText('Health & freshness', { x: 10.44, y: 5.14,
w: 1.2, h: 0.16, fontSize: 9.2, bold: true, color: C.text, margin: 0 }); slide.addText('features-d1 92s ▲\nexecution 2s
●\nrisk-exp 4s ●', { x: 10.44, y: 5.42, w: 1.2, h: 0.62, fontSize: 8.2, color: C.muted, margin: 0, fontFace:'JetBrains
Mono' });

slide.addText('Visual theme stays institutional. The change is structural: canonical homes, visible lifecycle, and zero
dead-end entities.', { x: 0.78, y: 6.48, w: 5.8, h: 0.34, fontFace: 'IBM Plex Sans', fontSize: 11, color: C.text,
italic: true, margin: 0 }); }

// Slide 2 { const slide = pptx.addSlide(); addBg(slide); addNotes(slide); addTitle(slide, 'The core insight', 'The
palette is already strong. The problem is information architecture.'); panel(slide, 0.72, 1.38, 5.9, 5.4, { fill:
'0D0E10' }); slide.addText('Before: 11 isolated UIs', { x: 0.92, y: 1.62, w: 2.2, h: 0.24, fontSize: 18, bold: true,
color: C.text, margin: 0 }); slide.addText('Duplicate deployments. Duplicate P&L. Duplicate alerts. Manual
port-hopping.', { x: 0.92, y: 1.94, w: 3.7, h: 0.28, fontSize: 10.2, color: C.muted, margin: 0 }); const messy = [
[1.0,2.45,1.55,0.62,'strategy-ui',C.blue], [2.9,2.3,1.6,0.62,'exec analytics',C.blue], [4.7,2.52,1.42,0.62,'trading
analytics',C.purple], [1.22,3.45,1.38,0.62,'deployment-ui',C.amber], [3.0,3.38,1.55,0.62,'logs dashboard',C.amber],
[4.72,3.54,1.26,0.62,'batch audit',C.amber], [1.15,4.48,1.45,0.62,'onboarding-ui',C.cyan], [2.98,4.62,1.5,0.62,'client
reporting',C.muted], [4.82,4.44,1.06,0.62,'settlement',C.muted], ];
messy.forEach(([x,y,w,h,label,color])=>{panel(slide,x,y,w,h,{fill:C.panel2});
slide.addText(label,{x:x+0.12,y:y+0.22,w:w-0.24,h:0.15,fontSize:8.4,color:C.text,align:'center',margin:0});}); //
chaotic connectors
[[2.55,2.76,0.36,0.0],[4.5,2.6,0.28,0.0],[2.62,3.76,0.38,-0.1],[4.58,3.75,0.18,0.04],[2.62,4.75,0.34,0.0],[4.46,4.76,0.32,0.0],[2.2,3.06,-0.75,0.38],[4.86,3.08,-0.12,0.5]].forEach(l=>slide.addShape(pptx.ShapeType.line,{x:l[0],y:l[1],w:l[2],h:l[3],line:{color:C.line,width:1,dashType:'dash'}}));
slide.addText('No workflow coherence\nNo entity hierarchy\nNo cross-UI navigation', { x: 0.92, y: 5.58, w: 2.2, h: 0.7,
fontSize: 11.5, bold: true, color: C.red, margin: 0 });

panel(slide, 6.82, 1.38, 5.82, 5.4, { fill: '0D0E10' }); slide.addText('After: one operating model', { x: 7.02, y: 1.62,
w: 2.7, h: 0.24, fontSize: 18, bold: true, color: C.text, margin: 0 }); slide.addText('4 daily-use surfaces + 3
specialist tools, connected by hierarchy, lifecycle, and deep links.', { x: 7.02, y: 1.94, w: 4.2, h: 0.28, fontSize:
10.2, color: C.muted, margin: 0 }); const surfaces=[ [7.1,2.45,2.55,0.84,'Trading\nCommand Center',C.green],
[9.95,2.45,2.3,0.84,'Strategy\nAnalytics',C.blue], [7.1,3.56,2.55,0.84,'Market\nIntelligence',C.purple],
[9.95,3.56,2.3,0.84,'Operations\nHub',C.amber] ];
surfaces.forEach(([x,y,w,h,label,color])=>{slide.addShape(pptx.ShapeType.roundRect,{x,y,w,h,rectRadius:0.08,line:{color,
width:1.5},fill:{color, transparency:88}});
slide.addText(label,{x:x+0.18,y:y+0.2,w:w-0.36,h:0.4,fontSize:12.8,bold:true,color:C.text,align:'center',valign:'mid',margin:0});});
const tools=[
[7.35,5.02,1.55,0.5,'Config',C.cyan],[9.15,5.02,1.25,0.5,'ML',C.blue],[10.6,5.02,1.58,0.5,'Reports',C.muted] ];
tools.forEach(([x,y,w,h,label,color])=>{slide.addShape(pptx.ShapeType.roundRect,{x,y,w,h,rectRadius:0.08,line:{color,width:1},fill:{color,transparency:90}});slide.addText(label,{x:x+0.08,y:y+0.17,w:w-0.16,h:0.12,fontSize:9.2,bold:true,color:C.text,align:'center',margin:0});});
// connectors
[[8.35,3.29,0,0.27],[11.1,3.29,0,0.27],[9.65,2.87,0.3,0],[9.65,3.98,0.3,0],[8.14,4.4,0.15,0.62],[10.02,4.4,0,0.62],[11.7,4.4,-0.1,0.62]].forEach(l=>slide.addShape(pptx.ShapeType.line,{x:l[0],y:l[1],w:l[2],h:l[3],line:{color:C.cyan,width:1.2}}));
pill(slide, 7.08, 5.84, 1.34, 'Hierarchy', C.cyan, 88); pill(slide, 8.54, 5.84, 1.22, 'Lifecycle', C.green, 88);
pill(slide, 9.88, 5.84, 1.56, 'Cross-linking', C.purple, 88); slide.addText('Citadel-grade difference: the complexity
stays; the navigation becomes legible.', { x: 7.02, y: 6.3, w: 4.7, h: 0.22, fontSize: 11.2, italic: true, color:
C.text, margin: 0 }); }

// Slide 3 { const slide = pptx.addSlide(); addBg(slide); addNotes(slide); addTitle(slide, 'Three organizing
principles', 'Entity-first navigation, lifecycle-aware flow, and one screen / one verb / one time horizon.'); const
boxes = [ [0.78,1.42,3.86,2.03,'1 Entity-first navigation','Every screen has one primary entity. Users move down Fund →
Client → Strategy → Config → Run, then switch lenses without losing context.',C.cyan], [4.74,1.42,3.86,2.03,'2
Lifecycle-aware flow','Design → Simulate → Promote → Run → Monitor → Explain → Reconcile is embedded as wayfinding, not
decoration.',C.green], [8.7,1.42,3.86,2.03,'3 One screen, one verb, one time horizon','Every view declares its dominant
verb and temporal mode, which stops analysis, action, and post-trade workflows from blurring together.',C.purple] ];
boxes.forEach(([x,y,w,h,title,body,color])=>{panel(slide,x,y,w,h,{fill:'0D0E10',shadow:true});
slide.addShape(pptx.ShapeType.line,{x:x+0.02,y:y+0.02,w:0,h:h-0.04,line:{color,width:3}});
slide.addText(title,{x:x+0.22,y:y+0.2,w:w-0.34,h:0.24,fontSize:15,bold:true,color:C.text,margin:0});
slide.addText(body,{x:x+0.22,y:y+0.58,w:w-0.36,h:1.0,fontSize:10.1,color:C.muted,margin:0});});

panel(slide, 0.78, 3.82, 6.35, 2.95, { fill:'0D0E10' }); slide.addText('Business hierarchy — the money', { x: 1.0, y:
4.06, w: 2.5, h: 0.22, fontSize: 16, bold: true, color: C.text, margin: 0 }); const chain =
['Fund','Client','Strategy','Config','Run']; let x = 1.04; chain.forEach((c,i)=>{
slide.addShape(pptx.ShapeType.roundRect,{x,y:4.52,w:0.98,h:0.42,rectRadius:0.08,line:{color:C.cyan,width:1},fill:{color:C.cyan,transparency:88}});
slide.addText(c,{x:x+0.08,y:4.67,w:0.82,h:0.12,fontSize:9,bold:true,color:C.text,align:'center',margin:0});
if(i<chain.length-1) slide.addShape(pptx.ShapeType.line,{x:x+0.98,y:4.73,w:0.34,h:0,line:{color:C.line,width:1.2}}); x
+= 1.32; }); slide.addText('Lenses', { x: 1.04, y: 5.32, w: 0.8, h: 0.12, fontSize: 8.4, color: C.muted, margin: 0 });
addMockTabs(slide, 1.04, 5.5, ['Positions','Orders','Fills','PnL','Recon','Timeline'], 3); slide.addText('The entity is
stable; the lens changes.', { x: 1.04, y: 6.13, w: 2.6, h: 0.16, fontSize: 11.5, italic: true, color: C.text, margin: 0
});

panel(slide, 7.35, 3.82, 5.2, 2.95, { fill:'0D0E10' }); slide.addText('Lifecycle rail — the operating flow', { x: 7.58,
y: 4.06, w: 2.9, h: 0.22, fontSize: 16, bold: true, color: C.text, margin: 0 }); addLifecycle(slide, 2, 4.62);
slide.addText('The UI should always answer two questions: Where am I? What comes next?', { x: 7.58, y: 5.28, w: 4.0, h:
0.18, fontSize: 10.5, color: C.muted, margin: 0 });
slide.addShape(pptx.ShapeType.roundRect,{x:7.58,y:5.66,w:1.18,h:0.52,rectRadius:0.08,line:{color:C.cyan,width:1},fill:{color:C.cyan,transparency:88}});
slide.addText('Current\nphase',
{x:7.82,y:5.84,w:0.6,h:0.18,fontSize:8.8,color:C.text,bold:true,align:'center',margin:0});
slide.addShape(pptx.ShapeType.roundRect,{x:9.06,y:5.66,w:1.54,h:0.52,rectRadius:0.08,line:{color:C.green,width:1},fill:{color:C.green,transparency:88}});
slide.addText('Natural next\naction',
{x:9.36,y:5.84,w:0.94,h:0.18,fontSize:8.8,color:C.text,bold:true,align:'center',margin:0});
slide.addShape(pptx.ShapeType.roundRect,{x:10.88,y:5.66,w:1.3,h:0.52,rectRadius:0.08,line:{color:C.purple,width:1},fill:{color:C.purple,transparency:88}});
slide.addText('Cross-surface\nportal',
{x:11.1,y:5.84,w:0.88,h:0.18,fontSize:8.8,color:C.text,bold:true,align:'center',margin:0}); }

// Slide 4 { const slide = pptx.addSlide(); addBg(slide); addNotes(slide); addTitle(slide, 'Platform architecture: 4
surfaces + 3 specialist tools', 'Daily-use surfaces anchor the trading day; specialist tools support configuration,
models, and client artifacts.'); const cards = [ [0.86,1.54,2.82,1.55,'Trading Command Center','Observe, intervene\nRun,
monitor\nFirst screen at 7am',C.green], [3.92,1.54,2.82,1.55,'Strategy Analytics','Design, simulate, promote\nBacktests

- DimensionalGrid',C.blue], [6.98,1.54,2.82,1.55,'Market Intelligence','Explain, reconcile\nP&L, latency,
  recon',C.purple], [10.04,1.54,2.42,1.55,'Operations Hub','Deploy, diagnose\nServices, jobs, logs',C.amber],
  [1.42,4.22,2.35,0.98,'Config & Onboarding','Controlled CRUD\nPublish typed configs',C.cyan], [5.06,4.22,1.92,0.98,'ML
  Platform','Experiments\nModel registry',C.blue], [8.76,4.22,2.9,0.98,'Reporting & Settlement','EOD positions\nReports,
  invoices, settlements',C.muted], ];
  cards.forEach(([x,y,w,h,title,body,color])=>{slide.addShape(pptx.ShapeType.roundRect,{x,y,w,h,rectRadius:0.09,line:{color,width:1.6},fill:{color,transparency:88},shadow:safeOuterShadow('000000',0.28,45,1,1)});
  slide.addText(title,{x:x+0.18,y:y+0.22,w:w-0.36,h:0.24,fontSize:14.2,bold:true,color:C.text,margin:0,align:'center'});
  slide.addText(body,{x:x+0.2,y:y+0.62,w:w-0.4,h:0.44,fontSize:9.6,color:C.muted,margin:0,align:'center'});}); //
  lifecycle mapping band panel(slide,0.86,3.45,11.6,0.45,{fill:'0D0E10'}); slide.addText('Lifecycle ownership',
  {x:1.0,y:3.61,w:1.2,h:0.12,fontSize:8.2,color:C.muted,margin:0}); addLifecycle(slide, -1, 3.57); // emphasize ranges
  using tinted bands
  slide.addShape(pptx.ShapeType.rect,{x:1.95,y:3.53,w:2.66,h:0.12,line:{color:C.blue,transparency:100},fill:{color:C.blue,transparency:72}});
  slide.addShape(pptx.ShapeType.rect,{x:5.99,y:3.53,w:1.72,h:0.12,line:{color:C.green,transparency:100},fill:{color:C.green,transparency:70}});
  slide.addShape(pptx.ShapeType.rect,{x:7.98,y:3.53,w:3.09,h:0.12,line:{color:C.purple,transparency:100},fill:{color:C.purple,transparency:70}});
  slide.addText('Keep surfaces canonical. Do not let tools grow duplicate analytics, duplicate deployments, or duplicate
  live state.', { x: 0.92, y: 6.34, w: 6.0, h: 0.18, fontSize: 11.5, italic: true, color: C.text, margin: 0 });
  slide.addText('Outcome: 7 repos, 7 ports, zero duplication.', { x: 8.44, y: 6.34, w: 3.3, h: 0.18, fontSize: 12.5,
  bold: true, color: C.cyan, margin: 0, align: 'right' }); }

// Slide 5 Command center concept { const slide = pptx.addSlide(); addBg(slide); addNotes(slide); addTitle(slide,
'Concept surface 01 — Trading Command Center', 'Live operating mode: what is happening right now, what is at risk, and
what can I do immediately?'); panel(slide,0.6,1.16,12.1,5.98,{fill:'0D0E10',shadow:true}); addNavBar(slide,'Trading');
addLifecycle(slide,3,1.02); addBreadcrumb(slide,'Odum Delta One > Blue Coast Capital > BTC Basis v3 > cfg-3.2.1'); //
KPI row kpi(slide,0.92,1.5,1.55,0.85,'Firm PnL','+$1.42m','▲ +0.8% 1d',C.green); kpi(slide,2.6,1.5,1.55,0.85,'Net
Exp.','$4.2m','1.2x levered',C.blue); kpi(slide,4.28,1.5,1.55,0.85,'Margin','82%','+$340k free',C.amber);
kpi(slide,5.96,1.5,1.55,0.85,'Live strats','24','18 healthy',C.green); kpi(slide,7.64,1.5,1.55,0.85,'Alerts','3 crit','2
high',C.red); // Strategy performance table panel(slide,0.92,2.62,5.0,2.46,{fill:C.panel}); slide.addText('Strategy
performance', { x: 1.12, y: 2.82, w: 1.65, h: 0.18, fontSize: 11.5, bold: true, color: C.text, margin: 0 });
slide.addText('Click strategy → analytics • click status → filtered live positions', { x: 3.1, y: 2.84, w: 2.6, h: 0.14,
fontSize: 7.8, color: C.muted, margin: 0, align: 'right' });
rowText(slide,1.12,3.18,['Strategy','St','PnL','Shrp','DD','Trend'],[1.5,0.48,0.65,0.42,0.36,0.7],[C.muted,C.muted,C.muted,C.muted,C.muted,C.muted],[0]);
const
rows=[['BTC Basis v3','● L','+$412k','2.1','4.1%','╱╲╱╲'],['ETH Staked','● L','+$289k','2.5','3.3%','╱╲╱'],['AAVE Lending','● L','+$91k','1.8','2.1%','╱╲'],['ML Direction','▲ W','-$18k','0.9','6.8%','╲╱╲'],['SPY ML Dir','● L','+$67k','1.4','3.9%','╱╲╱'],['Sports Arb','● L','+$44k','1.6','1.8%','╱╲']];
let yy=3.48;
rows.forEach(r=>{rowText(slide,1.12,yy,r,[1.5,0.48,0.65,0.42,0.36,0.7],[C.text,r[1].includes('▲')?C.amber:C.green,r[2].startsWith('-')?C.red:C.green,C.text,C.text,C.muted],[0],[5]);yy+=0.27;});
// Attribution pair panel(slide,6.16,2.62,3.0,2.46,{fill:C.panel}); slide.addText('P&L + risk attribution', { x: 6.36,
y: 2.82, w: 1.8, h: 0.18, fontSize: 11.5, bold: true, color: C.text, margin: 0 }); slide.addText('(same dimensions, two
sides)', { x: 7.62, y: 2.84, w: 1.3, h: 0.14, fontSize: 7.8, color: C.muted, margin: 0, align: 'right' });
rowText(slide,6.36,3.18,['Bucket','P&L','Exposure'],[0.9,0.62,0.78],[C.muted,C.muted,C.muted],[0]); const
riskRows=[['Funding','+$412k','$8.2m'],['Basis','+$355k','14 bps'],['Staking','+$145k','LTV .72'],['Delta','+$61k','$2.4m'],['Greeks','-$8k','Δ -0.98'],['Recon','-$18k','4 brks']];
yy=3.48;
riskRows.forEach(r=>{rowText(slide,6.36,yy,r,[0.9,0.62,0.78],[C.text,r[1].startsWith('-')?C.red:C.green,C.blue]);yy+=0.27;});
// Alerts & freshness panel(slide,9.38,2.62,2.98,1.56,{fill:C.panel}); slide.addText('Alerts & incidents', { x: 9.58, y:
2.82, w: 1.2, h: 0.16, fontSize: 11.5, bold: true, color: C.text, margin: 0 }); slide.addText('● CRIT Kill switch armed
— BTC Basis v3\n▲ HIGH Feature freshness 92s lag in EU shard\n▲ MED Recon break — Elysium SMA mismatch', { x: 9.58, y:
3.16, w: 2.4, h: 0.72, fontSize: 8.1, color: C.muted, margin: 0 }); panel(slide,9.38,4.38,2.98,0.70,{fill:C.panel});
slide.addText('Health & feature freshness', { x: 9.58, y: 4.58, w: 1.6, h: 0.16, fontSize: 11.2, bold: true, color:
C.text, margin: 0 }); slide.addText('features-d1 92s ▲ lag\nexecution 2s ● ok\nrisk-exp 4s ● ok', { x: 9.58, y: 4.86, w:
1.8, h: 0.46, fontSize: 8.0, color: C.muted, fontFace:'JetBrains Mono', margin: 0 }); // kill switch drawer
panel(slide,0.92,5.36,4.1,1.3,{fill:C.panel}); slide.addText('Kill switch / intervention panel', { x: 1.12, y: 5.58, w:
1.9, h: 0.18, fontSize: 11.5, bold: true, color: C.text, margin: 0 }); pill(slide,1.12,5.92,0.72,'Fund',C.cyan);
pill(slide,1.9,5.92,0.82,'Client',C.cyan); pill(slide,2.8,5.92,0.94,'Strategy',C.cyan);
pill(slide,3.82,5.92,0.72,'Venue',C.cyan); slide.addText('Pause strategy • Cancel orders • Flatten exposure • Disable
venue', { x: 1.12, y: 6.28, w: 3.6, h: 0.16, fontSize: 8.8, color: C.muted, margin: 0 }); // Callout
slide.addShape(pptx.ShapeType.roundRect,{x:11.32,y:5.62,w:1.04,h:0.68,rectRadius:0.08,line:{color:C.cyan,width:1.2},fill:{color:C.cyan,transparency:90}});
slide.addText('Why it feels\n“neat”',
{x:11.5,y:5.82,w:0.66,h:0.2,fontSize:9.4,color:C.text,bold:true,align:'center',margin:0});
slide.addShape(pptx.ShapeType.line,{x:10.9,y:5.96,w:-1.1,h:-1.1,line:{color:C.cyan,width:1.1,dashType:'dash'}}); }

// Slide 6 Strategy Analytics { const slide = pptx.addSlide(); addBg(slide); addNotes(slide); addTitle(slide, 'Concept
surface 02 — Strategy Analytics', 'The quant surface: catalogue → backtests → DimensionalGrid → candidate selection →
promotion to live.'); panel(slide,0.6,1.16,12.1,5.98,{fill:'0D0E10',shadow:true}); addNavBar(slide,'Strategy');
addLifecycle(slide,2,1.02); addBreadcrumb(slide,'Strategy Analytics > BTC Basis v3 > grid > selected candidates');
panel(slide,0.9,1.46,2.62,1.18,{fill:C.panel}); slide.addText('Catalogue', { x: 1.08, y: 1.66, w: 1.0, h: 0.18,
fontSize: 11.5, bold: true, color: C.text, margin: 0 }); slide.addText('BTC Basis v3\nETH Staked Basis\nAAVE Lending\nML
Direction', { x: 1.08, y: 1.98, w: 1.2, h: 0.62, fontSize: 8.4, color: C.muted, margin: 0 });
pill(slide,2.28,1.66,0.76,'DeFi',C.blue); pill(slide,2.28,1.98,0.76,'Live',C.green);
pill(slide,2.28,2.3,0.76,'Client',C.cyan); panel(slide,3.78,1.46,8.38,1.18,{fill:C.panel});
slide.addText('DimensionalGrid — the killer feature', { x: 3.98, y: 1.66, w: 2.4, h: 0.18, fontSize: 11.6, bold: true,
color: C.text, margin: 0 }); addMockTabs(slide, 4.0, 2.02, ['Instrument','Venue','Strategy','Date','Config'], 2);
pill(slide,10.36,1.68,0.9,'Heatmap',C.cyan); pill(slide,11.34,1.68,0.78,'Export',C.muted); // grid body
panel(slide,0.9,2.86,8.45,3.45,{fill:C.panel});
rowText(slide,1.08,3.1,['☐','Experiment','Strategy','Config','Venue','Shard','Sharpe','PnL'],[0.26,0.84,1.26,0.86,1.0,0.62,0.58,0.72],[C.muted,C.muted,C.muted,C.muted,C.muted,C.muted,C.muted,C.muted],[1]);
const
grid=[['☑','exp-221','BTC Basis v3','3.3.0-rc1','Bin/Bybit','2025Q4','2.1','+$1.8m'],['☑','exp-301','ETH Staked','2.5.0','Aave/HL','2026Q1','2.5','+$2.4m'],['☐','exp-222','BTC Basis v3','3.3.0-rc2','Bin/OKX','2026Q1','1.7','+$1.1m'],['☐','exp-711','ML Direction','5.1.2','Binance','2025H2','1.3','+$0.7m'],['☑','exp-402','Sports Arb','1.4.0','Books','2026Q1','1.6','+$0.3m']];
let yy=3.42; grid.forEach((r,idx)=>{if(idx<2||idx===4)
slide.addShape(pptx.ShapeType.rect,{x:1.02,y:yy-0.05,w:8.16,h:0.26,line:{color:C.cyan,transparency:100},fill:{color:C.cyan,transparency:95}});
rowText(slide,1.08,yy,r,[0.26,0.84,1.26,0.86,1.0,0.62,0.58,0.72],[r[0]==='☑'?C.green:C.muted,C.text,C.text,C.text,C.text,C.text,C.text,C.green],[2]);
yy+=0.44;}); panel(slide,1.08,5.68,6.7,0.42,{fill:'0D0E10'}); slide.addText('Selection toolbar (3 selected) Promote to
batch • Promote to live • Export CSV', { x: 1.3, y: 5.81, w: 6.2, h: 0.12, fontSize: 8.4, color: C.text, margin: 0 });
// promotion drawer panel(slide,9.58,2.86,2.58,3.45,{fill:C.panel}); slide.addText('Promotion package', { x: 9.78, y:
3.1, w: 1.5, h: 0.18, fontSize: 11.5, bold: true, color: C.text, margin: 0 }); slide.addText('Selected
candidates\nexp-221 BTC Basis v3\nexp-301 ETH Staked\nexp-402 Sports Arb', { x: 9.78, y: 3.44, w: 1.6, h: 0.78,
fontSize: 8.5, color: C.muted, margin: 0 }); slide.addText('Approval pack includes:\n• capacity estimate\n• drawdown\n•
regime notes\n• target env\n• owner + scope', { x: 9.78, y: 4.42, w: 1.78, h: 0.96, fontSize: 8.4, color: C.muted,
margin: 0 });
slide.addShape(pptx.ShapeType.roundRect,{x:9.78,y:5.58,w:1.96,h:0.42,rectRadius:0.08,line:{color:C.blue,width:1},fill:{color:C.blue,transparency:86}});
slide.addText('Cross-link to Ops deploy', { x: 10.02, y: 5.72, w: 1.48, h: 0.12, fontSize: 8.5, bold: true, color:
C.text, align:'center', margin: 0 });
slide.addShape(pptx.ShapeType.line,{x:8.9,y:5.78,w:0.56,h:0,line:{color:C.cyan,width:1.2,endArrowType:'triangle'}});
slide.addText('No auto-deploy. Promote creates a reviewed handoff.', { x: 0.94, y: 6.52, w: 4.6, h: 0.16, fontSize:
10.8, italic: true, color: C.text, margin: 0 }); }

// Slide 7 Markets + Ops { const slide = pptx.addSlide(); addBg(slide); addNotes(slide); addTitle(slide, 'Concept
surfaces 03–04 — Markets + Ops', 'Separate explanation from deployment, but connect them tightly through entity links,
correlation IDs, and context-preserving routes.'); panel(slide,0.72,1.34,5.88,5.75,{fill:'0D0E10',shadow:true});
panel(slide,6.74,1.34,5.88,5.75,{fill:'0D0E10',shadow:true}); // left market intelligence addNavBar(slide,'Markets');
addLifecycle(slide,5,1.02); slide.addText('Market Intelligence', { x: 0.98, y: 1.6, w: 2.0, h: 0.22, fontSize: 18, bold:
true, color: C.text, margin: 0 }); slide.addText('Explain P&L. Drill 5 levels. Reconcile residuals.', { x: 0.98, y: 1.9,
w: 2.6, h: 0.16, fontSize: 9.8, color: C.muted, margin: 0 }); addBreadcrumb(slide,'All > Blue Coast Capital > BTC Basis
v3'); panel(slide,0.98,2.2,5.36,2.28,{fill:C.panel}); slide.addText('P&L waterfall', { x: 1.18, y: 2.42, w: 1.2, h:
0.18, fontSize: 11.5, bold: true, color: C.text, margin: 0 }); const
wf=[['Funding',2.7,'+$412k'],['Carry',2.2,'+$355k'],['Basis',1.6,'+$188k'],['Staking',1.3,'+$145k'],['Delta',0.9,'+$61k'],['Slippage',0.8,'-$61k'],['Fees',0.58,'-$44k'],['Recon',0.34,'-$18k']];
let y=2.82; wf.forEach(r=>{slide.addText(r[0],{x:1.18,y,w:0.7,h:0.12,fontSize:8.2,color:C.muted,margin:0});
slide.addShape(pptx.ShapeType.rect,{x:1.98,y:y+0.02,w:r[1],h:0.12,line:{color:r[2].startsWith('-')?C.red:C.green,transparency:100},fill:{color:r[2].startsWith('-')?C.red:C.green}});
slide.addText(r[2],{x:4.95,y,w:0.8,h:0.12,fontSize:8.2,color:r[2].startsWith('-')?C.red:C.green,margin:0}); y+=0.2;});
panel(slide,0.98,4.72,2.52,1.36,{fill:C.panel}); slide.addText('Drill path',
{x:1.18,y:4.96,w:0.8,h:0.16,fontSize:10.5,bold:true,color:C.text,margin:0}); slide.addText('All → Client → Strategy\n→
Venue → Component', {x:1.18,y:5.28,w:1.2,h:0.48,fontSize:8.6,color:C.muted,margin:0});
panel(slide,3.82,4.72,2.52,1.36,{fill:C.panel}); slide.addText('Recon + latency',
{x:4.02,y:4.96,w:1.0,h:0.16,fontSize:10.5,bold:true,color:C.text,margin:0}); slide.addText('Residual bucket links
to\nopen recon cases + traces', {x:4.02,y:5.28,w:1.36,h:0.48,fontSize:8.6,color:C.muted,margin:0}); // right ops
slide.addText('Operations Hub', { x: 7.0, y: 1.6, w: 1.8, h: 0.22, fontSize: 18, bold: true, color: C.text, margin: 0
}); slide.addText('Deploy, observe, diagnose — never pretend to be the P&L home.', { x: 7.0, y: 1.9, w: 2.8, h: 0.16,
fontSize: 9.8, color: C.muted, margin: 0 }); panel(slide,7.0,2.2,5.36,1.3,{fill:C.panel}); slide.addText('Batch
summary + recent deploys', {x:7.2,y:2.42,w:1.8,h:0.18,fontSize:11.5,bold:true,color:C.text,margin:0}); slide.addText('●
47 done ▲ 3 failed ◎ 12 running\nexecution-service prod v31\nfeatures-delta-one prod v17\nrisk-and-exposure prod v12',
{x:7.2,y:2.76,w:1.8,h:0.64,fontSize:8.4,color:C.muted,margin:0}); panel(slide,7.0,3.76,2.62,2.32,{fill:C.panel});
slide.addText('Observe', {x:7.2,y:3.98,w:0.8,h:0.16,fontSize:10.8,bold:true,color:C.text,margin:0});
slide.addText('Jobs\nLogs\nEvents\nData health', {x:7.2,y:4.32,w:0.8,h:0.76,fontSize:8.8,color:C.muted,margin:0});
panel(slide,9.74,3.76,2.62,2.32,{fill:C.panel}); slide.addText('Compliance',
{x:9.94,y:3.98,w:0.9,h:0.16,fontSize:10.8,bold:true,color:C.text,margin:0}); slide.addText('Audit
trail\nCompliance\nCI/CD\nDeploy pre-fill from strategy',
{x:9.94,y:4.32,w:1.24,h:0.76,fontSize:8.8,color:C.muted,margin:0}); // bridge arrow
slide.addShape(pptx.ShapeType.line,{x:6.36,y:5.24,w:0.28,h:0,line:{color:C.cyan,width:1.4,endArrowType:'triangle'}});
slide.addText('Link analysis to deploys, traces, and incidents — but keep each truth surface clean.', { x: 4.1, y: 6.56,
w: 5.2, h: 0.18, fontSize: 11, italic: true, color: C.text, margin: 0, align: 'center' }); }

// Slide 8 implementation { const slide = pptx.addSlide(); addBg(slide); addNotes(slide); addTitle(slide,
'Implementation path', 'Refactor the shared language first, then collapse the duplicated surfaces behind it.');
panel(slide,0.78,1.36,4.18,5.78,{fill:'0D0E10',shadow:true}); slide.addText('Phase stack',
{x:1.02,y:1.64,w:1.2,h:0.2,fontSize:17,bold:true,color:C.text,margin:0}); const phases=[ ['P0','Shared
ui-kit','GlobalNavBar • LifecycleRail • BreadcrumbNav • EntityLink • CrossLink • DimensionalGrid • FilterBar'],
['P1','Remove /deployments pollution','Mount nav shell everywhere and replace plain-text entities with deep links'],
['P2–P5','Collapse duplicate UIs','Strategy merge • Ops merge • Settlement merge'], ['P6','Build canonical P&L
hierarchy','5-level drill-down + attribution + recon'], ['P7–P8','Hardening + config flows','FilterBars, breadcrumbs,
accessibility, real generator wiring'] ]; let y=2.08;
phases.forEach((p,i)=>{slide.addShape(pptx.ShapeType.roundRect,{x:1.02,y,w:3.7,h:0.72,rectRadius:0.08,line:{color:i===0?C.cyan:C.line,width:1},fill:{color:i===0?C.cyan:C.panel,transparency:i===0?88:0}});
slide.addText(p[0],{x:1.18,y:y+0.16,w:0.42,h:0.16,fontSize:10,bold:true,color:i===0?C.cyan:C.muted,margin:0});
slide.addText(p[1],{x:1.68,y:y+0.12,w:1.65,h:0.16,fontSize:10.5,bold:true,color:C.text,margin:0});
slide.addText(p[2],{x:1.68,y:y+0.34,w:2.8,h:0.22,fontSize:7.8,color:C.muted,margin:0}); y+=0.9;});
panel(slide,5.22,1.36,7.34,5.78,{fill:'0D0E10',shadow:true}); slide.addText('What “done” looks like',
{x:5.5,y:1.64,w:2.1,h:0.2,fontSize:17,bold:true,color:C.text,margin:0}); const doneCols=[ [5.54,2.08,2.1,'User
outcomes',['One answer to “what is happening right now?”','One canonical P&L home','One obvious next step in the
lifecycle']], [8.0,2.08,2.1,'System outcomes',['7 repos, 7 ports','Zero duplicated deployments routes','Cross-surface
context preserved by URL']], [10.46,2.08,1.84,'Design outcomes',['Institutional dark theme kept','Denser but calmer
layouts','Every entity is a portal']] ]; doneCols.forEach(c=>{panel(slide,c[0],c[1],c[2],2.05,{fill:C.panel});
slide.addText(c[3],{x:c[0]+0.18,y:c[1]+0.18,w:c[2]-0.36,h:0.16,fontSize:11.2,bold:true,color:C.text,margin:0}); let
yy=c[1]+0.52;
c[4].forEach(t=>{slide.addShape(pptx.ShapeType.line,{x:c[0]+0.2,y:yy+0.06,w:0.08,h:0,line:{color:C.cyan,width:2}});
slide.addText(t,{x:c[0]+0.34,y:yy,w:c[2]-0.5,h:0.18,fontSize:8.5,color:C.muted,margin:0}); yy+=0.42;});});
panel(slide,5.54,4.56,6.76,1.66,{fill:C.panel}); slide.addText('Final thesis',
{x:5.78,y:4.8,w:1.0,h:0.18,fontSize:11.4,bold:true,color:C.text,margin:0}); slide.addText('The redesign does not make
the trading system simpler. It makes the complexity legible: navigable via hierarchy, oriented by lifecycle, and
connected by deep links.', {x:5.78,y:5.18,w:5.96,h:0.42,fontSize:14,color:C.text,margin:0});
pill(slide,5.78,5.82,1.14,'Hierarchy',C.cyan,88); pill(slide,7.06,5.82,1.1,'Lifecycle',C.green,88);
pill(slide,8.3,5.82,1.38,'Cross-linking',C.purple,88); }

for (const s of pptx.\_slides) { warnIfSlideHasOverlaps(s, pptx); warnIfSlideElementsOutOfBounds(s, pptx); }

pptx.writeFile({ fileName: '/mnt/data/Unified_Trading_Platform_Redesign_Vision.pptx' }); NODE node build_deck.js
