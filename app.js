'use strict';
// ===== состояние
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}}};
let lang=store.get('usta_lang')||'ru'; if(!T[lang])lang='ru';
let token=store.get('usta_token');       // мастер
let ctoken=store.get('usta_ctoken');     // заказчик
let adminToken=store.get('usta_admin');
const role=()=>token?'master':(ctoken?'client':'guest');
const myTok=()=>token||ctoken;
const t=k=>T[lang][k]!==undefined?T[lang][k]:(T.ru[k]!==undefined?T.ru[k]:k);
const regName=k=>{const r=REGIONS.find(r=>r.k===k);return r?(lang==='ru'?r.ru:(lang==='kaa'&&k==='qr'?'Qaraqalpaqstan':r.uz)):''};
let loc={r:null,p:null};try{const j=JSON.parse(store.get('usta_loc')||'null');if(j&&REGIONS.some(r=>r.k===j.r))loc={r:j.r,p:j.p||null}}catch(e){}
const setLoc=(r,p)=>{loc={r:r||null,p:p||null};store.set('usta_loc',JSON.stringify(loc))};
const locLabel=()=>loc.p||(loc.r?regName(loc.r):t('allUz'));
const norm=s=>(s||'').toLowerCase().replace(/[ʻʼ’'`‘]/g,'').replace(/ö/g,'o').replace(/ğ/g,'g').replace(/ş/g,'sh').replace(/ç/g,'ch').replace(/ё/g,'е');
const where=m=>[m.place,m.district].filter(Boolean).join(', ');
const catName=s=>CATS[s]?CATS[s][lang]:s;

// ===== DOM
function h(tag,attrs,...kids){const e=document.createElement(tag);for(const k in attrs||{}){const v=attrs[k];if(v==null||v===false)continue;if(k==='html')e.innerHTML=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else if(k==='class')e.className=v;else e.setAttribute(k,v===true?'':v)}for(const c of kids.flat(Infinity)){if(c==null||c===false)continue;e.append(c.nodeType?c:document.createTextNode(c))}return e}
function set(el,...kids){el.replaceChildren(...kids.flat(Infinity).filter(k=>k!=null&&k!==false))}
const svg=(inner,size,stroke)=>h('span',{html:'<svg aria-hidden="true" width="'+(size||24)+'" height="'+(size||24)+'" viewBox="0 0 24 24" fill="none" stroke="'+(stroke||'#14201F')+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+inner+'</svg>',style:'display:flex'});
const fsvg=inner=>h('span',{html:'<svg aria-hidden="true" viewBox="0 0 24 24">'+inner+'</svg>',style:'display:flex'});
const I={back:'<path d="M15 5l-7 7 7 7"/>',next:'<path d="M9 5l7 7-7 7"/>',phone:'<path d="M5 4h4l2 5-2.500 1.500a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>',search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.500-3.500"/>',pin:'<path d="M12 21s7-6.200 7-11.500A7 7 0 005 9.500C5 14.800 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/>',down:'<path d="M6 9l6 6 6-6"/>',
 mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>',stop:'<rect x="6" y="6" width="12" height="12" rx="2"/>',send:'<path d="M4 12l16-8-6 16-2-6z"/>',plus:'<path d="M12 5v14M5 12h14"/>',img:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>',dots:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'};
const NI={home:'<path d="M12 2.600 2 11h3v9.400h5.200v-6h3.600v6H19V11h3z"/>',req:'<path d="M5 3h11l3 3v7h-2V7h-3V5H5v14h7v2H5a2 2 0 01-2-2V5a2 2 0 012-2zm2 5h8v2H7zm0 4h6v2H7z"/><path d="M18 14h2v3h3v2h-3v3h-2v-3h-3v-2h3z"/>',
 plus:'<path d="M4 4h12v3H4zm0 5h12v3H4zm0 5h8v3H4zM17 13h2.600v3.400H23V19h-3.400v3.400H17V19h-3.400v-2.600H17z"/>',chat:'<path d="M12 3C6.500 3 2 6.800 2 11.500c0 2.400 1.200 4.600 3.100 6.100L4 21.500l4.600-2.200c1.100.300 2.200.500 3.400.500 5.500 0 10-3.800 10-8.300S17.500 3 12 3z"/>',
 bell:'<path d="M12 22a2.500 2.500 0 002.500-2.500h-5A2.500 2.500 0 0012 22zm7-6V11a7 7 0 00-5.500-6.800V3a1.500 1.500 0 00-3 0v1.200A7 7 0 005 11v5l-2 2v1h18v-1z"/>',card:'<path d="M3 6a2 2 0 012-2h14a2 2 0 012 2v2H3zm0 4h18v8a2 2 0 01-2 2H5a2 2 0 01-2-2zm3 5v2h5v-2z"/>',
 user:'<circle cx="12" cy="8" r="4.500"/><path d="M3 21c0-4.500 4-7.500 9-7.500s9 3 9 7.500z"/>'};

// ===== сеть
async function api(path,opts){let r;try{r=await fetch(SB_URL+'/rest/v1/'+path,Object.assign({headers:{apikey:SB_KEY,Authorization:'Bearer '+SB_KEY,'Content-Type':'application/json'}},opts))}catch(e){throw new Error('net')}if(!r.ok)throw new Error('net');const txt=await r.text();return txt?JSON.parse(txt):null}
const rpc=(fn,args)=>api('rpc/'+fn,{method:'POST',body:JSON.stringify(args)});
const COLS='id,name,phone,category,district,about,experience_years,rating_sum,rating_count,region,place,verified,created_at,busy,boost_until';
const rate=m=>m.rating_count>0?'★ '+(m.rating_sum/m.rating_count).toFixed(1).replace('.',',')+' ('+m.rating_count+')':null;
function normPhone(v){const d=(v||'').replace(/\D/g,'');if(d.length===9)return '+998'+d;if(d.length>=11&&d.length<=15)return '+'+d;return null}
function fmtPhone(p){const m=/^\+(998|993)(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(p||'');if(m)return '+'+m[1]+' '+m[2]+' '+m[3]+' '+m[4]+' '+m[5];return p||''}
const initials=n=>(n||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase();
const sub=m=>[catName(m.category),m.experience_years!=null?t('exp')(m.experience_years):null].filter(Boolean).join(' · ');
const money=v=>String(v||'0').replace(/\D/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,' ');
const fmtDate=d=>new Date(d).toLocaleDateString(lang==='ru'?'ru-RU':'uz-UZ',{day:'numeric',month:'long'}).replace(/^(\d+)-/,'$1 ');
function ago(d){const s=(Date.now()-new Date(d).getTime())/1000,A=t('ago');if(s<90)return A.now;if(s<3600)return A.m(Math.round(s/60));if(s<86400)return A.h(Math.round(s/3600));return A.d(Math.round(s/86400))}
const boosted=m=>!!(m&&m.boost_until&&new Date(m.boost_until)>Date.now());
const isNewM=m=>!m.verified&&(m.rating_count||0)===0&&m.created_at&&(Date.now()-new Date(m.created_at).getTime())<30*864e5;

// ===== общие элементы
const app=document.getElementById('app');
const go=hash=>{if(location.hash===hash)render();else location.hash=hash};
const loading=()=>h('p',{class:'muted center'},t('load'));
const errBox=k=>h('div',{class:'err',role:'alert'},t('e_'+k)!=='e_'+k?t('e_'+k):t('e_net'));
const okBox=s=>h('div',{class:'ok',role:'status'},s);
function header(title,backTo,extra){return h('div',{class:'top'},h('div',{class:'row'},backTo?h('a',{class:'back',href:backTo,'aria-label':t('back')},svg(I.back,22,'#fff')):null,h('h1',{},title),extra||null))}
function field(id,label,el,hint){return h('div',{class:'f'},h('label',{for:id},label),el,hint?h('div',{class:'hint'},hint):null)}
function catSelect(val,id){return h('select',{id:id||'f-cat',required:true},val?null:h('option',{value:''},t('choose')),GROUPS.map(g=>h('optgroup',{label:g[lang]},g.c.map(s=>h('option',{value:s,selected:s===val},catName(s))))))}
function expVal(v){const n=parseInt(v,10);return Number.isFinite(n)&&n>=0&&n<=70?n:null}
const badgeV=()=>h('span',{class:'badge b-g'},'✓ '+t('verified'));
const badgeN=()=>h('span',{class:'badge b-b'},t('isNew'));
const badgeTop=()=>h('span',{class:'badge b-top'},'★ '+t('top'));
const statusChip=m=>h('span',{class:'stat-chip '+(m.busy?'is-busy':'is-free')},m.busy?t('busy'):t('free'));
const rankSort=rows=>rows.map((m,i)=>[m,i]).sort((a,b)=>(boosted(b[0])-boosted(a[0]))||((a[0].busy?1:0)-(b[0].busy?1:0))||(a[1]-b[1])).map(x=>x[0]);
function masterCard(m){return h('div',{class:'card'+(boosted(m)?' topcard':'')},h('a',{class:'info',href:'#/m/'+m.id},h('span',{class:'ava'},initials(m.name)),h('span',{class:'txt'},h('b',{},m.name,' ',boosted(m)?badgeTop():null,' ',m.verified?badgeV():(isNewM(m)?badgeN():null)),h('span',{},sub(m)),where(m)?h('span',{},where(m)):null,h('span',{class:'row',style:'gap:8px;flex-wrap:wrap'},statusChip(m),rate(m)?h('span',{class:'rate'},rate(m)):null))),h('a',{class:'call-round',href:'tel:'+m.phone,'aria-label':t('call')+': '+m.name,onclick:()=>logEv(m.id,'call')},svg(I.phone,22,'#fff')))}
function logEv(id,kind){rpc('log_event',{p_master:id,p_kind:kind}).catch(()=>{})}
function locFields(rv,pv){
 const rs=h('select',{id:'f-region',required:true},h('option',{value:''},t('choose')),REGIONS.map(r=>h('option',{value:r.k,selected:r.k===rv},regName(r.k))));
 const ps=h('select',{id:'f-place',required:true});
 const fill=v=>{const r=REGIONS.find(x=>x.k===rs.value);set(ps,h('option',{value:''},t('choose')),r?r.p.map(pl=>h('option',{value:pl,selected:pl===v},pl)):null)};
 rs.addEventListener('change',()=>fill());fill(pv);return {rs,ps};
}
function lightbox(src){const o=h('div',{class:'lb',role:'dialog','aria-label':t('photos'),onclick:()=>o.remove()},h('img',{src,alt:''}),h('button',{class:'btn ghost',type:'button'},t('close')));document.body.append(o)}
function photoGrid(photos,onDel){return h('div',{class:'pgrid'},photos.map(p=>{const src='data:image/jpeg;base64,'+p.data;return h('div',{class:'ph'},h('button',{class:'phb',type:'button','aria-label':t('photos'),onclick:()=>lightbox(src)},h('img',{src,alt:'',loading:'lazy'})),onDel?h('button',{class:'phx',type:'button','aria-label':t('delS'),onclick:()=>onDel(p)},'×'):null)}))}
function shrink(file){return new Promise((res,rej)=>{const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{URL.revokeObjectURL(url);let q=.72,max=1100,out='';for(let i=0;i<4;i++){const k=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*k));c.height=Math.max(1,Math.round(img.height*k));const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);out=c.toDataURL('image/jpeg',q).split(',')[1]||'';if(out&&out.length<=380000)break;max*=.75;q-=.08}out&&out.length<=380000?res(out):rej(new Error('bad_photo'))};img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('bad_photo'))};img.src=url})}
const audioEl=(b64,mime)=>h('audio',{controls:true,preload:'none',src:'data:'+(mime||'audio/webm').split(';')[0]+';base64,'+b64,class:'aud'});
async function copyText(txt,note,okMsg){try{await navigator.clipboard.writeText(txt);note.textContent=okMsg}catch(e){note.textContent=txt}}

// ===== голос
function recorder(onDone,onErr){
 let mr=null,chunks=[],timer=null,sec=0;const label=h('span',{class:'rectime'});
 const btn=h('button',{type:'button',class:'micbtn','aria-label':t('micHint')},svg(I.mic,22));
 const stopAll=()=>{clearInterval(timer);if(mr&&mr.stream)mr.stream.getTracks().forEach(x=>x.stop())};
 btn.addEventListener('click',async()=>{
  if(mr&&mr.state==='recording'){mr.stop();return}
  if(!navigator.mediaDevices||!window.MediaRecorder){onErr('mic');return}
  let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){onErr('mic');return}
  const types=['audio/webm;codecs=opus','audio/ogg;codecs=opus','audio/mp4','audio/webm'];const type=types.find(x=>MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(x))||'';
  try{mr=new MediaRecorder(stream,type?{mimeType:type,audioBitsPerSecond:24000}:undefined)}catch(e){stream.getTracks().forEach(x=>x.stop());onErr('mic');return}
  mr.stream=stream;chunks=[];sec=0;
  mr.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
  mr.onstop=()=>{stopAll();btn.classList.remove('on');set(btn,svg(I.mic,22));label.textContent='';
   const blob=new Blob(chunks,{type:mr.mimeType||type||'audio/webm'});if(blob.size<800)return;
   const fr=new FileReader();fr.onload=()=>{const b64=String(fr.result).split(',')[1]||'';if(b64.length>700000){onErr('bad_input2');return}onDone(b64,(mr.mimeType||type||'audio/webm').replace(/\s/g,''))};fr.readAsDataURL(blob)};
  mr.start();btn.classList.add('on');set(btn,svg(I.stop,20,'#fff'));
  timer=setInterval(()=>{sec++;label.textContent='0:'+String(sec).padStart(2,'0');if(sec>=59&&mr.state==='recording')mr.stop()},1000);
 });
 return {btn,label};
}

// ===== определение услуги по тексту
const KW={plumber:['кран','смесит','труб','унитаз','канализ','сантех','теч','водопров','раковин','jomrak','jumrak','quvur','santex','unitaz','suv oq'],electrician:['свет','розет','провод','электр','выключат','щиток','люстр','лампоч','elektr','rozetka','chiroq','simlar'],
 aircon:['кондиц','konditsion','kondision','kondicion'],roofer:['крыш','кровл','шифер','tom yop','shifer','tomni'],tiler:['плитк','кафел','kafel','plitka'],painter:['покрас','краск','маляр','boyoq','boyash'],plasterer:['штукатур','шпакл','suvoq'],
 mason:['кладк','кирпич','gisht','блок'],concrete:['бетон','стяжк','фундамент','beton','fundament'],carpenter:['доск','плотни','деревян','yogoch','taxta'],welder:['свар','payvand','kepser'],windows:['окн','двер','deraza','eshik'],
 furniture:['мебел','шкаф','диван','mebel'],appliance:['стирал','холодил','духовк','muzlatgich','kir yuv','texnika'],mechanic:['машин','двигат','мотор','mashina','dvigatel','avto'],tire:['шин','колес','balon','gildirak'],
 locksmith:['замок','замка','ключ','qulf','kalit'],gas:['газов','газа ','газ ','gaz'],heating:['отоплен','котел','котёл','радиатор','qozon','isitish','batareya'],mover:['переезд','грузчик','перевез','yuk tash'],cleaning:['уборк','tozala','мойк окон'],
 phone:['телефон','смартфон','экран','telefon','ekran'],computer:['компьют','ноутбук','kompyuter','noutbuk'],tv:['телевиз','антенн','televizor','antenna'],well:['скважин','quduq'],ceilings:['потолк','potolok','shift'],flooring:['ламинат','линолеум','laminat','пол '],drywall:['гипсокарт','gipsokarton']};
function guessCat(text){const s=' '+norm(text)+' ';let best=null,score=0;for(const k in KW){let c=0;for(const w of KW[k])if(s.includes(norm(w)))c++;if(c>score){score=c;best=k}}return best}

// ===== нижнее меню и счётчики
let BADGES={};let badgeTimer=null;
function navBar(active){
 const r=role();
 const av=h('span',{class:'av'},r==='guest'?fsvg(NI.user):initials(me.name||'?'));
 const items=r==='master'?[['#/',NI.home,'home'],['#/feed',NI.bell,'feed',BADGES.feed],['#/chats',NI.chat,'chats',BADGES.chats],['#/sub',NI.card,'sub',BADGES.sub_days!=null&&BADGES.sub_days<=3?'!':null],['#/me',null,'me']]
  :[['#/',NI.home,'home'],['#/req',NI.req,'req',BADGES.requests],['#/new',NI.plus,'new'],['#/chats',NI.chat,'chats',BADGES.chats],['#/me',null,'me']];
 const labels={home:t('back')&&'Usta',feed:t('feedT'),chats:t('chats'),sub:t('subT'),me:t('guestT'),req:t('myReqs'),new:t('newReq')};
 const nav=h('nav',{class:'nav','aria-label':'Menu'},items.map(([href,icon,key,badge])=>h('a',{href,class:key===active?'on':null,'aria-label':labels[key],'aria-current':key===active?'page':null},icon?fsvg(icon):av,badge?h('span',{class:'nb'},badge>99?'99+':String(badge)):null)));
 nav.dataset.active=active;return nav;
}
async function refreshBadges(){
 if(role()==='guest'){BADGES={};return}
 try{const b=await rpc('badges',{p_token:myTok()});if(b&&!b.error){const changed=JSON.stringify(b)!==JSON.stringify(BADGES);BADGES=b;if(changed){const n=document.querySelector('nav.nav');if(n)n.replaceWith(navBar(n.dataset.active))}}
  else if(b&&b.error==='no_session'){logoutLocal()}}catch(e){}
}
function shell(active,...parts){set(app,...parts,navBar(active));app.classList.add('withnav')}
function plain(...parts){set(app,...parts);app.classList.remove('withnav')}

// ===== профиль текущего пользователя
let me={};
async function loadMe(){
 me={};
 if(token){try{const m=await rpc('my_master',{p_token:token});if(m)me=m;else{token=null;store.set('usta_token',null)}}catch(e){}}
 else if(ctoken){try{const c=await rpc('client_me',{p_token:ctoken});if(c)me=c;else{ctoken=null;store.set('usta_ctoken',null)}}catch(e){}}
}
function logoutLocal(){token=null;ctoken=null;store.set('usta_token',null);store.set('usta_ctoken',null);me={};BADGES={}}

// ===== главная
async function viewHome(){
 const input=h('input',{id:'q',type:'search',placeholder:t('search'),'aria-label':t('search'),enterkeyhint:'search'});
 const form=h('form',{class:'search',role:'search',onsubmit:e=>{e.preventDefault();const q=input.value.trim();if(q)go('#/s/'+encodeURIComponent(q))}},svg(I.search,20,'#56625F'),input);
 const r=role();
 const hero=r==='master'?h('div',{class:'hero'},h('b',{},t('masterHeroT')),h('span',{},t('masterHeroS')(BADGES.feed||0)),h('a',{class:'btn dark',href:'#/feed'},t('masterHeroBtn')))
  :h('div',{class:'hero'},h('b',{},t('heroT')),h('span',{},t('heroS')),h('a',{class:'btn dark',href:'#/new'},t('heroBtn')));
 const POP=['electrician','plumber','aircon','tiler','roofer','mason','handyman'];
 const grid=h('div',{class:'grid4'},POP.map(s=>h('a',{class:'cat4',href:'#/c/'+s},h('span',{class:'ico4'},svg(CATS[s].i,26)),h('span',{},catName(s)))),h('a',{class:'cat4',href:'#/cats'},h('span',{class:'ico4 dark'},svg(I.dots,26,'#FFC21A')),h('span',{},t('allServices'))));
 const mine=h('div',{}),top=h('div',{});
 shell('home',h('div',{class:'top'},h('div',{class:'row between'},h('div',{class:'row'},h('div',{class:'logo'},'U'),h('div',{class:'brand'},'Usta')),r==='master'?null:h('a',{class:'me',href:r==='guest'?'#/mreg':'#/me'},t('iam'))),
   h('a',{class:'locbtn',href:'#/loc'},svg(I.pin,18,'#FFC21A'),h('span',{},locLabel()),svg(I.down,16,'#E6EAE8')),form),
  h('main',{},hero,h('h3',{class:'gh'},t('popular')),grid,mine,top));
 if(r==='client'){try{const ms=await rpc('my_masters',{p_token:ctoken});if(ms&&ms.length)set(mine,h('div',{class:'row between'},h('h3',{class:'gh'},t('myMasters'))),ms.slice(0,3).map(m=>h('div',{class:'card col'},h('a',{class:'info',href:'#/m/'+m.id},h('span',{class:'ava'},initials(m.name)),h('span',{class:'txt'},h('b',{},m.name,' ',m.verified?badgeV():null),h('span',{},[catName(m.category),rate(m)].filter(Boolean).join(' · ')))),
   h('div',{class:'row'},h('a',{class:'btn ghost sm',href:'tel:'+m.phone,onclick:()=>logEv(m.id,'call')},t('call')),h('a',{class:'btn yellow sm',href:'#/new/'+m.category},t('orderAgain'))),
   m.reviewed?null:h('a',{class:'linkbtn',href:'#/rev/'+m.id},'★ '+t('rateMaster')))))}catch(e){}}
 try{let q='masters?select='+COLS+'&rating_count=gt.0&order=rating_count.desc&limit=5';if(loc.r)q+='&region=eq.'+loc.r;const rows=await api(q);if(rows&&rows.length)set(top,h('h3',{class:'gh'},t('topNear')),rows.map(masterCard))}catch(e){}
}
function viewCats(){
 shell('home',header(t('allServices'),'#/'),h('main',{},GROUPS.map(g=>[h('h3',{class:'gh'},g[lang]),h('div',{class:'grid'},g.c.map(s=>h('a',{class:'cat',href:'#/c/'+s},h('span',{class:'ico'},svg(CATS[s].i)),h('span',{},catName(s)))))])));
}
async function viewList(slug,query){
 const box=h('main',{},loading());
 shell('home',header(query!=null?t('results'):catName(slug),'#/'),box);
 const scopes=[];
 if(loc.p)scopes.push({l:loc.p,f:'&region=eq.'+loc.r+'&place=eq.'+encodeURIComponent(loc.p)});
 if(loc.r)scopes.push({l:regName(loc.r),f:'&region=eq.'+loc.r});
 scopes.push({l:t('allUz'),f:''});
 const load=async i=>{
  const chips=h('div',{class:'filters',role:'group','aria-label':t('placeL')},scopes.map((sc,j)=>h('button',{class:'fchip',type:'button','aria-pressed':String(i===j),onclick:()=>load(j)},sc.l)),h('a',{class:'fchip',href:'#/loc'},t('otherLoc')));
  set(box,chips,loading());
  try{
   let rows=await api('masters?select='+COLS+(query==null?'&category=eq.'+encodeURIComponent(slug):'')+scopes[i].f+'&order=verified.desc,rating_count.desc,created_at.desc&limit=1000');
   if(query!=null){const q=norm(query);rows=rows.filter(m=>{const r=REGIONS.find(x=>x.k===m.region);return [m.name,m.about,m.district,m.place,r&&r.uz,r&&r.ru].concat(CATS[m.category]?['ru','uz','tk','kaa'].map(l=>CATS[m.category][l]):[]).some(v=>norm(v).includes(q))})}
   rows=rankSort(rows);
   if(query!=null&&!rows.length&&i<scopes.length-1){load(i+1);return}
   set(box,chips,rows.length?rows.map(masterCard):[h('p',{class:'muted center'},query!=null?t('emptyS'):t('empty')),i<scopes.length-1?h('button',{class:'btn ghost',type:'button',onclick:()=>load(i+1)},t('widen')+': '+scopes[i+1].l):null,
    role()!=='master'?h('a',{class:'cta',href:query==null?'#/new/'+slug:'#/new'},h('span',{},h('b',{},t('heroT')),h('small',{},t('heroS'))),svg(I.next)):null]);
  }catch(e){set(box,chips,errBox('net'))}
 };
 load(0);
}
function viewLoc(){
 let sel=null;const box=h('main',{});
 const q=h('input',{id:'loc-q',type:'search',placeholder:t('locFind'),'aria-label':t('locFind')});
 const back='#/';
 const pick=(r,p)=>{setLoc(r,p);go(back)};
 const item=(label,fn,strong)=>h('button',{class:'litem'+(strong?' strong':''),type:'button',onclick:fn},h('span',{},label),svg(I.next,18,'#56625F'));
 const draw=()=>{const sq=norm(q.value.trim());
  if(sq){const hits=[];for(const r of REGIONS){if(norm(r.uz).includes(sq)||norm(r.ru).includes(sq))hits.push(item(regName(r.k),()=>pick(r.k,null),true));for(const pl of r.p)if(norm(pl).includes(sq))hits.push(item(pl+' · '+regName(r.k),()=>pick(r.k,pl)))}
   set(box,hits.length?hits.slice(0,40):h('p',{class:'muted center'},t('emptyS')));return}
  if(sel){const r=REGIONS.find(x=>x.k===sel);set(box,h('button',{class:'fchip',type:'button',style:'align-self:flex-start',onclick:()=>{sel=null;draw()}},'‹ '+t('regionL')),item(t('allRegion')+': '+regName(sel),()=>pick(sel,null),true),r.p.map(pl=>item(pl,()=>pick(sel,pl))));return}
  set(box,item(t('allUz'),()=>pick(null,null),true),REGIONS.map(r=>item(regName(r.k),()=>{sel=r.k;draw();window.scrollTo(0,0)})));
 };
 q.addEventListener('input',draw);
 plain(h('div',{class:'top'},h('div',{class:'row'},h('a',{class:'back',href:back,'aria-label':t('back')},svg(I.back,22,'#fff')),h('h1',{},t('chooseLoc'))),h('label',{class:'search'},svg(I.search,20,'#56625F'),q)),box);draw();
}

// ===== профиль мастера (для заказчика)
async function isAdmin(){if(adminToken)return true;return !!(me&&me.is_admin)}
async function viewMaster(id){
 shell('home',header(t('profile'),'#/'),h('main',{},loading()));
 let m;
 try{const rows=await api('masters?select='+COLS+'&id=eq.'+encodeURIComponent(id));if(!rows.length){shell('home',header(t('profile'),'#/'),h('main',{},errBox('notfound')));return}m=rows[0]}
 catch(e){shell('home',header(t('profile'),'#/'),h('main',{},errBox('net')));return}
 if(!(token&&me.id===m.id))logEv(m.id,'view');
 const note=h('div',{class:'hint center','aria-live':'polite'});
 const photoBox=h('div',{}),revBox=h('div',{class:'panel'},loading()),rateBox=h('div',{});
 set(app,h('div',{class:'top'},h('a',{class:'back',href:'#/c/'+m.category,'aria-label':t('back')},svg(I.back,22,'#fff')),
   h('div',{class:'hero2'},h('div',{class:'ava big'},initials(m.name)),h('div',{class:'txt'},h('h1',{},m.name),h('div',{class:'sub'},sub(m)),where(m)?h('div',{class:'sub'},where(m)):null,h('div',{class:'row',style:'gap:8px;flex-wrap:wrap'},statusChip(m),boosted(m)?badgeTop():null,m.verified?badgeV():(isNewM(m)?badgeN():null))))),
  h('main',{},h('div',{class:'panel'},h('div',{class:'phone'},fmtPhone(m.phone)),h('button',{class:'btn ghost',type:'button',onclick:()=>copyText(m.phone,note,t('copied'))},t('copy')),note),m.about?h('div',{class:'panel'},h('h3',{},t('about')),h('p',{},m.about)):null,rateBox,photoBox,revBox,role()!=='master'?h('a',{class:'linkbtn center muted2',href:'#/complain/'+m.id},'⚠ '+t('complain')):null),
  h('div',{class:'bar'},role()!=='master'?h('div',{class:'row'},h('a',{class:'btn green',href:'tel:'+m.phone,onclick:()=>logEv(m.id,'call')},svg(I.phone,22,'#fff'),t('call')),h('a',{class:'btn yellow',href:'#/new/'+m.category,style:'flex:0 0 auto;width:auto'},'+')):h('a',{class:'btn green',href:'tel:'+m.phone},svg(I.phone,22,'#fff'),t('call'))));
 app.classList.remove('withnav');
 const admin=await isAdmin();const mid=encodeURIComponent(m.id);const atok=adminToken||token;
 const loadPhotos=async()=>{try{const ps=await api('master_photos?select=id,data&master_id=eq.'+mid+'&order=created_at');set(photoBox,ps.length?h('div',{class:'panel'},h('h3',{},t('photos')),photoGrid(ps,admin?async p=>{try{await rpc('admin_delete_photo',{p_token:atok,p_id:p.id})}catch(e){}loadPhotos()}:null)):null)}catch(e){}};
 const loadReviews=async()=>{
  let rs=[];try{rs=await api('reviews?select=id,author,rating,body,tags,created_at&master_id=eq.'+mid+'&order=created_at.desc&limit=100')}catch(e){}
  set(revBox,h('h3',{},t('reviews')+(rs.length?' · '+rs.length:'')),rs.length?rs.map(r=>h('div',{class:'rev'},h('div',{class:'row between'},h('b',{},r.author),h('span',{class:'rate','aria-label':t('rating')+' '+r.rating},'★'.repeat(r.rating)+'☆'.repeat(5-r.rating))),
   r.tags&&r.tags.length?h('div',{class:'row',style:'gap:6px;flex-wrap:wrap'},r.tags.map(x=>h('span',{class:'badge b-y'},t('tag_'+x)))):null,r.body?h('p',{},r.body):null,h('div',{class:'hint'},fmtDate(r.created_at)),
   admin?h('button',{class:'btn danger',type:'button',onclick:async()=>{try{await rpc('admin_delete_review',{p_token:atok,p_id:r.id})}catch(e){}loadReviews()}},t('delS')):null)):h('p',{class:'muted'},t('noReviews')),h('div',{class:'hint'},t('reviewsNote')));
 };
 loadPhotos();loadReviews();
 try{const R=await rpc('master_rating',{p_master:m.id});if(R&&R.count>0)set(rateBox,ratingPanel(R))}catch(e){}
}
const fmt1=v=>v==null?'—':Number(v).toFixed(1).replace('.',',');
function ratingPanel(R){
 const max=Math.max(1,...R.dist);
 return h('div',{class:'panel ratep'},h('div',{class:'row',style:'gap:16px;align-items:center'},h('div',{class:'bigrate'},h('b',{},fmt1(R.avg)),h('span',{},t('outOf5')),h('span',{class:'stars-s','aria-hidden':'true'},'★'.repeat(Math.round(R.avg))+'☆'.repeat(5-Math.round(R.avg))),h('span',{class:'hint'},t('reviewsN')(R.count))),
   h('div',{class:'dist'},[5,4,3,2,1].map((n,i)=>h('div',{class:'drow'},h('span',{},String(n)),h('span',{class:'dbar'},h('i',{style:'width:'+Math.round(R.dist[i]/max*100)+'%'})),h('span',{class:'dn'},String(R.dist[i])))))),
  h('div',{class:'crit'},['quality','time','price','polite'].map(k=>R[k]!=null?h('div',{class:'crow'},h('span',{},t('q_'+k)),h('span',{class:'cbar'},h('i',{style:'width:'+Math.round(R[k]/5*100)+'%'})),h('b',{},fmt1(R[k]))):null)));
}

// ===== жалоба
let afterLogin=null;
function viewComplain(mid){
 if(!ctoken){afterLogin='#/complain/'+mid;go('#/login');return}
 let reason=null;const msg=h('div',{'aria-live':'polite'});
 const box=h('div',{class:'col gap'});
 const draw=()=>set(box,['no_show','rude','price','quality','fraud','other'].map(r=>h('button',{type:'button',class:'plan','aria-pressed':String(reason===r),onclick:()=>{reason=r;draw()}},h('span',{},t('r_'+r)),h('span',{class:'radio'}))));draw();
 const body=h('textarea',{id:'cmp-body',maxlength:600,placeholder:t('complainPh'),rows:4});
 const send=h('button',{class:'btn danger solid',type:'button',onclick:async()=>{set(msg);if(!reason){set(msg,errBox('bad_input2'));return}send.disabled=true;
  try{const r=await rpc('add_complaint',{p_token:ctoken,p_master:mid,p_reason:reason,p_body:body.value});if(r.error){set(msg,errBox(r.error));send.disabled=false;return}set(msg,okBox(t('complainOk')));setTimeout(()=>go('#/m/'+mid),1400)}catch(e){set(msg,errBox('net'));send.disabled=false}}},t('complainSend'));
 plain(header(t('complainT'),'#/m/'+mid),h('main',{},h('p',{class:'lead'},t('complainS')),h('div',{class:'lab'},t('reasonL')),box,field('cmp-body',t('reviewT'),body),msg),h('div',{class:'bar'},send));
}

// ===== новая заявка
let draft=null; // заявка, ожидающая входа
function viewNew(prefCat){
 const d=draft||{cat:prefCat&&CATS[prefCat]?prefCat:null,auto:false,body:'',voice:null,mime:null,region:loc.r,place:loc.p,landmark:'',when:'any',budget:'',photo:null,more:false};
 draft=null;
 const msg=h('div',{'aria-live':'polite'});
 const body=h('textarea',{id:'n-body',maxlength:1000,placeholder:t('whatPh'),rows:4},d.body);
 const voiceBox=h('div',{});
 const drawVoice=()=>set(voiceBox,d.voice?h('div',{class:'voicebar'},audioEl(d.voice,d.mime),h('button',{type:'button',class:'linkbtn',onclick:()=>{d.voice=null;drawVoice()}},t('recDel'))):null);
 const rec=recorder((b64,mime)=>{d.voice=b64;d.mime=mime;drawVoice()},k=>set(msg,errBox(k)));
 const catBox=h('div',{});
 const sel=catSelect(d.cat,'n-cat');
 sel.addEventListener('change',()=>{d.cat=sel.value||null;d.auto=false;drawCat()});
 const drawCat=()=>set(catBox,d.cat&&d.auto?h('div',{class:'row',style:'gap:8px;flex-wrap:wrap'},h('span',{class:'chip ok'},'✓ '+catName(d.cat)),h('span',{class:'hint'},t('detected'))):null);
 body.addEventListener('input',()=>{d.body=body.value;if(!d.cat||d.auto){const g=guessCat(body.value);if(g&&g!==d.cat){d.cat=g;d.auto=true;sel.value=g;drawCat()}}});
 const L=locFields(d.region,d.place);
 const landmark=h('input',{id:'n-landmark',type:'text',maxlength:120,placeholder:t('landmarkPh')});landmark.value=d.landmark;
 const budget=h('input',{id:'n-budget',type:'text',maxlength:40,inputmode:'text',placeholder:t('budgetPh')});budget.value=d.budget;
 const whenBox=h('div',{class:'seg',role:'group','aria-label':t('whenL')});
 const drawWhen=()=>set(whenBox,['urgent','week','any'].map(w=>h('button',{type:'button','aria-pressed':String(d.when===w),onclick:()=>{d.when=w;drawWhen()}},t('w_'+w))));drawWhen();
 const photoBox=h('div',{});
 const file=h('input',{id:'n-photo',type:'file',accept:'image/*',hidden:true,onchange:async()=>{const f=file.files[0];if(!f)return;try{d.photo=await shrink(f);drawPhoto()}catch(e){set(msg,errBox('bad_photo'))}}});
 const drawPhoto=()=>set(photoBox,d.photo?h('div',{class:'row'},h('img',{src:'data:image/jpeg;base64,'+d.photo,alt:'',class:'thumb'}),h('button',{type:'button',class:'linkbtn',onclick:()=>{d.photo=null;drawPhoto()}},t('delS'))):h('label',{class:'btn ghost',for:'n-photo',style:'cursor:pointer'},t('addPhoto1')));drawPhoto();
 const moreBody=h('div',{class:'morebody',hidden:!d.more},field('n-photo',t('photoL'),h('div',{},photoBox,file)),h('div',{class:'f'},h('div',{class:'lab'},t('whenL')),whenBox),field('n-budget',t('budgetL'),budget));
 const moreBtn=h('button',{type:'button',class:'morebtn','aria-expanded':String(d.more),onclick:()=>{d.more=!d.more;moreBody.hidden=!d.more;moreBtn.setAttribute('aria-expanded',String(d.more))}},h('span',{},h('b',{},t('more')),h('small',{},t('moreS'))),svg(I.down,18,'#56625F'));
 const submit=h('button',{class:'btn yellow',type:'submit'},t('sendReq'));
 const collect=()=>{d.body=body.value;d.cat=sel.value||d.cat;d.region=L.rs.value;d.place=L.ps.value;d.landmark=landmark.value;d.budget=budget.value};
 const form=h('form',{novalidate:true,onsubmit:async e=>{e.preventDefault();set(msg);collect();
   if(body.value.trim().length<5&&!d.voice){set(msg,errBox('bad_request'));return}
   if(!d.cat){set(msg,errBox('cat'));return}
   if(!d.region||!d.place){set(msg,errBox('loc'));return}
   if(!ctoken){draft=d;go('#/login');return}
   submit.disabled=true;const r=await sendRequest(d);if(r&&r.id){go('#/r/'+r.id+'/new')}else{set(msg,errBox(r&&r.error||'net'));submit.disabled=false}}},
  h('div',{class:'f'},h('label',{for:'n-body'},t('whatQ')),h('div',{class:'tawrap'},body,h('div',{class:'micwrap'},rec.label,rec.btn)),h('div',{class:'hint'},t('micHint')),voiceBox),
  h('div',{class:'f'},h('label',{for:'n-cat'},t('masterL')),catBox,sel),
  h('div',{class:'f'},h('div',{class:'lab'},t('whereL')),L.rs,L.ps,landmark),
  moreBtn,moreBody,msg);
 drawVoice();drawCat();
 shell('new',header(t('newReq'),'#/'),h('main',{},form),h('div',{class:'bar'},submit,ctoken?null:h('div',{class:'hint center'},t('sendHint'))));
 submit.setAttribute('form','');submit.addEventListener('click',e=>{e.preventDefault();form.requestSubmit?form.requestSubmit():form.dispatchEvent(new Event('submit',{cancelable:true}))});
}
async function sendRequest(d){
 try{return await rpc('create_request',{p_token:ctoken,p_category:d.cat,p_region:d.region,p_place:d.place,p_landmark:d.landmark||'',p_body:d.body||'',p_when:d.when||'any',p_budget:d.budget||'',p_photo:d.photo||'',p_voice:d.voice||'',p_voice_mime:d.mime||''})}
 catch(e){return {error:'net'}}
}

// ===== вход заказчика
let cauthMode='reg';
function viewClientLogin(){
 const msg=h('div',{'aria-live':'polite'});const reg=cauthMode==='reg';
 const name=h('input',{id:'c-name',type:'text',maxlength:60,placeholder:t('namePh'),autocomplete:'name'});
 const phone=h('input',{id:'c-phone',type:'tel',placeholder:'+998 90 123 45 67',autocomplete:'tel'});
 const pass=h('input',{id:'c-pass',type:'password',maxlength:72,autocomplete:reg?'new-password':'current-password'});
 const submit=h('button',{class:'btn yellow',type:'submit'},reg?t('create'):t('enter'));
 const form=h('form',{novalidate:true,onsubmit:async e=>{e.preventDefault();set(msg);
   const p=normPhone(phone.value);if(!p){set(msg,errBox('phone'));return}
   if(pass.value.length<6){set(msg,errBox('bad_password'));return}
   if(reg&&name.value.trim().length<2){set(msg,errBox('bad_input'));return}
   submit.disabled=true;
   try{const r=reg?await rpc('client_register',{p_name:name.value,p_phone:p,p_password:pass.value}):await rpc('client_login',{p_phone:p,p_password:pass.value});
    if(r.error){set(msg,errBox(r.error));submit.disabled=false;return}
    ctoken=r.token;store.set('usta_ctoken',ctoken);await loadMe();refreshBadges();
    if(afterLogin){const a=afterLogin;afterLogin=null;go(a);return}
    if(draft){const d=draft;const res=await sendRequest(d);if(res&&res.id){draft=null;go('#/r/'+res.id+'/new');return}draft=d;go('#/new');return}
    go('#/req');
   }catch(err){set(msg,errBox('net'));submit.disabled=false}}},
  reg?field('c-name',t('name'),name):null,field('c-phone',t('phone'),phone),field('c-pass',t('pass'),pass,reg?t('passH'):null),msg,submit);
 const tab=(m,l)=>h('button',{type:'button','aria-pressed':String(cauthMode===m),onclick:()=>{cauthMode=m;viewClientLogin()}},l);
 shell('me',header(t('clientLoginT'),draft?'#/new':(afterLogin?afterLogin.replace('complain','m'):'#/me')),h('main',{},h('p',{class:'lead'},t('clientLoginS')),h('div',{class:'tabs'},tab('reg',t('reg')),tab('login',t('login'))),form,
  h('a',{class:'linkbtn center',href:'#/mreg'},t('asMaster')+' →')));
}

// ===== мои заявки
async function viewMyReqs(){
 if(!ctoken){go('#/login');return}
 const box=h('main',{},loading());shell('req',header(t('myReqs')),box);
 let rs;try{rs=await rpc('my_requests',{p_token:ctoken})}catch(e){set(box,errBox('net'));return}
 set(box,rs.length?rs.map(r=>h('a',{class:'card col',href:'#/r/'+r.id},h('div',{class:'row between'},h('span',{class:'badge '+(r.status==='closed'?'b-x':(r.chosen_master?'b-b':'b-g'))},r.status==='closed'?t('st_closed'):(r.chosen_master?t('st_chosen'):t('st_open'))),h('span',{class:'hint'},ago(r.created_at))),
   h('b',{class:'clamp'},r.body||('🎤 '+t('voiceMsg'))),h('div',{class:'meta'},h('span',{},catName(r.category)),h('span',{},r.place),h('span',{class:r.response_count?'strong':''},t('respN')(r.response_count)),r.unread?h('span',{class:'dot'},t('unreadN')(r.unread)):null)))
  :[h('p',{class:'muted center'},t('noReqs')),h('a',{class:'btn yellow',href:'#/new'},t('heroBtn'))]);
}
async function viewReq(id,fresh){
 if(!ctoken){go('#/login');return}
 const box=h('main',{},loading());shell('req',header(t('myReq'),'#/req'),box);
 let d;try{d=await rpc('request_detail',{p_token:ctoken,p_id:id})}catch(e){set(box,errBox('net'));return}
 if(!d||!d.request){set(box,errBox('forbidden'));return}
 const r=d.request,act=async(args)=>{try{await rpc('request_set',Object.assign({p_token:ctoken,p_id:id,p_status:null,p_master:null},args))}catch(e){}viewReq(id)};
 set(box,fresh?okBox(t('reqSent')):null,
  h('div',{class:'card col'},h('span',{class:'badge '+(r.status==='closed'?'b-x':'b-g'),style:'align-self:flex-start'},(r.status==='closed'?t('st_closed'):t('st_open'))+(r.when_kind!=='any'?' · '+t('w_'+r.when_kind):'')),
   r.body?h('b',{style:'white-space:pre-line'},r.body):null,r.voice?audioEl(r.voice,r.voice_mime):null,r.photo?h('button',{class:'phb thumbbtn',type:'button',onclick:()=>lightbox('data:image/jpeg;base64,'+r.photo)},h('img',{src:'data:image/jpeg;base64,'+r.photo,alt:''})):null,
   h('div',{class:'meta'},h('span',{},catName(r.category)),h('span',{},[r.place,r.landmark].filter(Boolean).join(', ')),r.budget?h('span',{},r.budget):null)),
  h('h3',{class:'gh'},t('respondedN')(d.responses.length)),
  d.responses.length?d.responses.map(s=>{const chosen=r.chosen_master===s.master_id;return h('div',{class:'card col'+(chosen?' chosen':'')},
   h('a',{class:'info',href:'#/m/'+s.master_id},h('span',{class:'ava'},initials(s.name)),h('span',{class:'txt'},h('b',{},s.name,' ',boosted(s)?badgeTop():null,' ',s.verified?badgeV():null),h('span',{},[sub(s),rate(s)].filter(Boolean).join(' · ')),h('span',{},statusChip(s)))),
   s.message?h('div',{class:'quote'},'«'+s.message+'»'):null,
   h('div',{class:'row'},h('a',{class:'btn ghost sm',href:'tel:'+s.phone,'aria-label':t('call'),onclick:()=>logEv(s.master_id,'call'),style:'flex:0 0 52px'},svg(I.phone,20)),
    h('a',{class:'btn ghost sm',href:'#/chat/'+id+'/'+s.master_id},t('write'),s.unread?h('span',{class:'nb inline'},String(s.unread)):null),
    chosen?h('span',{class:'btn green sm',style:'pointer-events:none'},'✓ '+t('chosenMark')):(r.status==='open'?h('button',{class:'btn yellow sm',type:'button',onclick:()=>act({p_master:s.master_id})},t('choose2')):null)),
   chosen?h('a',{class:'linkbtn',href:'#/rev/'+s.master_id},'★ '+t('rateMaster')):null)}):h('p',{class:'muted center'},t('noResp')),
  r.status==='open'?h('button',{class:'btn ghost danger',type:'button',onclick:()=>act({p_status:'closed'})},t('closeReq')):h('button',{class:'btn ghost',type:'button',onclick:()=>act({p_status:'open'})},t('reopen')));
}

// ===== отзыв
function viewReview(mid){
 if(!ctoken){go('#/login');return}
 let stars=0;const q={quality:0,time:0,price:0,polite:0};const tags=new Set();const msg=h('div',{'aria-live':'polite'});
 const starRow=h('div',{class:'stars big',role:'group','aria-label':t('overall')});
 const drawStars=()=>set(starRow,[1,2,3,4,5].map(n=>h('button',{type:'button',class:'star','aria-pressed':String(n<=stars),'aria-label':t('overall')+' '+n,onclick:()=>{stars=n;drawStars();for(const k in q)if(!q[k]){q[k]=n}drawCrit()}},n<=stars?'★':'☆')));drawStars();
 const crit=h('div',{class:'col gap'});
 const drawCrit=()=>set(crit,Object.keys(q).map(k=>h('div',{class:'critrow'},h('span',{},t('q_'+k)),h('div',{class:'stars sm',role:'group','aria-label':t('q_'+k)},[1,2,3,4,5].map(n=>h('button',{type:'button',class:'star','aria-pressed':String(n<=q[k]),'aria-label':t('q_'+k)+' '+n,onclick:()=>{q[k]=n;drawCrit()}},n<=q[k]?'★':'☆'))))));drawCrit();
 const tagRow=h('div',{class:'row',style:'gap:8px;flex-wrap:wrap'});
 const drawTags=()=>set(tagRow,['time','neat','price','polite'].map(x=>h('button',{type:'button',class:'chip','aria-pressed':String(tags.has(x)),onclick:()=>{tags.has(x)?tags.delete(x):tags.add(x);drawTags()}},t('tag_'+x))));drawTags();
 const body=h('textarea',{id:'rv-body',maxlength:500,placeholder:t('reviewPh')});
 const send=h('button',{class:'btn yellow',type:'button',onclick:async()=>{set(msg);if(!stars){set(msg,errBox('bad_review'));return}send.disabled=true;
  try{const r=await rpc('add_review_v3',{p_token:ctoken,p_master:mid,p_rating:stars,p_body:body.value,p_tags:[...tags],p_quality:q.quality||null,p_time:q.time||null,p_price:q.price||null,p_polite:q.polite||null});if(r.error){set(msg,errBox(r.error));send.disabled=false;return}set(msg,okBox(t('thanks')));setTimeout(()=>go('#/m/'+mid),900)}catch(e){set(msg,errBox('net'));send.disabled=false}}},t('sendReview'));
 shell('req',header(t('howWas'),'#/req'),h('main',{},h('div',{class:'lab center'},t('overall')),starRow,h('div',{class:'card col'},h('b',{},t('detailRate')),crit),tagRow,field('rv-body',t('reviewT'),body),h('div',{class:'hint center'},t('reviewOnly')),msg),h('div',{class:'bar'},send));
}

// ===== чаты
async function viewChats(){
 if(role()==='guest'){go('#/login');return}
 const box=h('main',{},loading());shell('chats',header(t('chats')),box);
 let th;try{th=await rpc('chat_threads',{p_token:myTok()})}catch(e){set(box,errBox('net'));return}
 if(th&&th.error){set(box,errBox(th.error));return}
 set(box,th.length?th.map(x=>h('a',{class:'card thread',href:'#/chat/'+x.request_id+'/'+x.master_id},h('span',{class:'ava'},initials(x.peer)),h('span',{class:'txt'},h('span',{class:'row between'},h('b',{},x.peer),h('span',{class:'hint'},ago(x.last_at))),
   h('span',{class:'clamp1'},x.last_voice?'🎤 '+t('voiceMsg'):(x.last_photo?'📷 '+t('photoMsg'):(x.last_body||t('byReq')+': '+(x.request_body||catName(x.category)))))),x.unread?h('span',{class:'nb inline'},String(x.unread)):null))
  :h('p',{class:'muted center'},role()==='master'?t('noChatsM'):t('noChats')));
}
let chatTimer=null;
async function viewChat(rid,mid){
 if(role()==='guest'){go('#/login');return}
 const list=h('div',{class:'msgs',role:'log','aria-live':'polite'});let last=0;const seen=new Set();
 const head=h('div',{class:'top chathead'});const ctx=h('div',{class:'ctx'});
 const msg=h('div',{'aria-live':'polite',class:'chaterr'});
 const input=h('textarea',{id:'m-text',rows:1,maxlength:1000,placeholder:t('msgPh'),'aria-label':t('msgPh')});
 const sendBtn=h('button',{type:'button',class:'sendbtn','aria-label':t('sendBtn')},svg(I.send,22));
 const file=h('input',{id:'m-photo',type:'file',accept:'image/*',hidden:true});
 const send=async(body,photo,voice,mime)=>{set(msg);try{const r=await rpc('chat_send',{p_token:myTok(),p_request:rid,p_master:mid,p_body:body||'',p_photo:photo||'',p_voice:voice||'',p_voice_mime:mime||''});if(r.error){set(msg,errBox(r.error));return false}await pull();return true}catch(e){set(msg,errBox('net'));return false}};
 const rec=recorder((b64,mime)=>send('', '', b64, mime),k=>set(msg,errBox(k)));
 const toggle=()=>{const has=input.value.trim().length>0;sendBtn.hidden=!has;rec.btn.hidden=has};
 input.addEventListener('input',()=>{toggle();input.style.height='auto';input.style.height=Math.min(input.scrollHeight,120)+'px'});
 sendBtn.addEventListener('click',async()=>{const v=input.value.trim();if(!v)return;sendBtn.disabled=true;if(await send(v)){input.value='';input.style.height='auto';toggle()}sendBtn.disabled=false;input.focus()});
 file.addEventListener('change',async()=>{const f=file.files[0];if(!f)return;try{await send('',await shrink(f))}catch(e){set(msg,errBox('bad_photo'))}file.value=''});
 const bubble=x=>h('div',{class:'bub '+(x.mine?'mine':'them')},x.photo?h('button',{class:'phb bubimg',type:'button',onclick:()=>lightbox('data:image/jpeg;base64,'+x.photo)},h('img',{src:'data:image/jpeg;base64,'+x.photo,alt:''})):null,x.voice?audioEl(x.voice,x.voice_mime):null,x.body?h('span',{style:'white-space:pre-line'},x.body):null,h('small',{},new Date(x.created_at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})));
 let first=true;
 const pull=async()=>{let d;try{d=await rpc('chat_get',{p_token:myTok(),p_request:rid,p_master:mid,p_after:last})}catch(e){return}
  if(!d||d.error){if(first)set(list,errBox(d&&d.error||'net'));first=false;return}
  if(first){const p=d.peer||{};set(head,h('div',{class:'row'},h('a',{class:'back',href:d.side==='client'?'#/r/'+rid:'#/chats','aria-label':t('back')},svg(I.back,22,'#fff')),h('span',{class:'ava'},initials(p.name)),h('span',{class:'txt'},h('b',{},p.name||''),h('span',{},d.side==='client'?[catName(p.category),rate(p)].filter(Boolean).join(' · '):fmtPhone(p.phone))),
    p.phone?h('a',{class:'call-round',href:'tel:'+p.phone,'aria-label':t('call'),onclick:()=>{if(d.side==='client')logEv(mid,'call')}},svg(I.phone,20,'#fff')):null));
   set(ctx,t('byReq')+': '+((d.request&&d.request.body)||catName(d.request&&d.request.category)));}
  const atBottom=window.innerHeight+window.scrollY>=document.body.scrollHeight-80;
  for(const x of d.messages){if(seen.has(x.id))continue;seen.add(x.id);list.append(bubble(x));last=Math.max(last,x.id)}
  if(first||atBottom)window.scrollTo(0,document.body.scrollHeight);first=false;
 };
 plain(head,ctx,list,h('div',{class:'inputbar'},msg,h('div',{class:'row'},h('label',{class:'attach',for:'m-photo','aria-label':t('photoMsg')},svg(I.img,22,'#56625F')),input,rec.label,rec.btn,sendBtn),file));
 toggle();await pull();
 clearInterval(chatTimer);chatTimer=setInterval(()=>{if(!document.hidden)pull()},4000);
}

// ===== мастер: статус
function busyToggle(onChange){
 const wrap=h('div',{class:'seg2',role:'group','aria-label':t('statusL')});
 const draw=()=>set(wrap,[false,true].map(b=>h('button',{type:'button','aria-pressed':String(!!me.busy===b),class:b?'b':'f',onclick:async()=>{if(!!me.busy===b)return;const old=me.busy;me.busy=b;draw();try{const r=await rpc('set_busy',{p_token:token,p_on:b});if(r&&r.error)throw 0;onChange&&onChange()}catch(e){me.busy=old;draw()}}},b?t('busy'):t('free'))));
 draw();return wrap;
}

// ===== мастер: заявки
async function viewFeed(){
 if(!token){go('#/mreg');return}
 const box=h('main',{},loading());const chips=h('div',{class:'filters'});
 const top=h('div',{class:'top'},h('div',{class:'row between'},h('h1',{},t('feedT')),h('span',{class:'subpill'})),busyToggle(),chips);
 shell('feed',top,box);
 let d;try{d=await rpc('master_feed',{p_token:token})}catch(e){set(box,errBox('net'));return}
 if(d.error){set(box,errBox(d.error));return}
 BADGES.feed=0;const nb=document.querySelector('nav.nav');if(nb)nb.replaceWith(navBar('feed'));
 const days=Math.max(0,Math.ceil((new Date(d.sub_until)-Date.now())/864e5));
 const pill=top.querySelector('.subpill');pill.className='badge '+(d.active?(days<=3?'b-r':'b-y'):'b-r');pill.textContent=d.active?(d.trial?t('trialDays')(days):t('paidDays')(days)):t('expired');
 let only='all';
 const draw=()=>{
  set(chips,h('button',{class:'fchip dark',type:'button','aria-pressed':String(only==='all'),onclick:()=>{only='all';draw()}},catName(me.category)+' · '+regName(me.region)),me.place?h('button',{class:'fchip dark',type:'button','aria-pressed':String(only==='place'),onclick:()=>{only='place';draw()}},me.place):null);
  const items=d.items.filter(x=>only==='all'||x.place===me.place);
  set(box,d.active?null:h('a',{class:'warn',href:'#/sub'},t('subOff'),' ',h('b',{},t('subRenew')+' →')),
   items.length?items.map(feedCard):h('p',{class:'muted center'},t('noFeed')));
 };
 const feedCard=x=>{const card=h('div',{class:'card col'+(x.is_new?' fresh':'')});const media=h('div',{});const resp=h('div',{});
  const loadMedia=async btn=>{btn.disabled=true;try{const m=await rpc('request_media',{p_token:token,p_id:x.id});set(media,m&&m.voice?audioEl(m.voice,m.voice_mime):null,m&&m.photo?h('button',{class:'phb thumbbtn',type:'button',onclick:()=>lightbox('data:image/jpeg;base64,'+m.photo)},h('img',{src:'data:image/jpeg;base64,'+m.photo,alt:''})):null)}catch(e){btn.disabled=false}};
  const drawResp=()=>{if(x.responded){set(resp,h('span',{class:'btn ghost sm',style:'pointer-events:none'},t('respondedBtn')),h('a',{class:'linkbtn',href:'#/chats'},t('chats')+' →'));return}
   if(x.response_count>=5){set(resp,h('span',{class:'btn ghost sm',style:'pointer-events:none;opacity:.7'},t('respFull')));return}
   if(!d.active){set(resp,h('a',{class:'btn ghost sm',href:'#/sub'},t('subRenew')));return}
   set(resp,h('button',{class:'btn yellow sm',type:'button',onclick:()=>{const ta=h('textarea',{maxlength:300,rows:2,placeholder:t('respPh'),'aria-label':t('respPh')});const m2=h('div',{});
    set(resp,ta,m2,h('div',{class:'row'},h('button',{class:'btn ghost sm',type:'button',onclick:drawResp},t('cancel')),h('button',{class:'btn yellow sm',type:'button',onclick:async e=>{e.currentTarget.disabled=true;try{const r=await rpc('respond_request',{p_token:token,p_id:x.id,p_message:ta.value});if(r.error){set(m2,errBox(r.error));e.currentTarget.disabled=false;return}x.responded=true;x.response_count++;drawResp()}catch(err){set(m2,errBox('net'))}}},t('respSend'))));ta.focus()}},t('respondBtn')))};
  drawResp();
  set(card,h('div',{class:'row between'},h('span',{class:'badge '+(x.when_kind==='urgent'?'b-g':'b-b')},t('w_'+x.when_kind)),h('span',{class:'hint'},(x.is_new?'● ':'')+ago(x.created_at))),
   x.body?h('b',{style:'white-space:pre-line'},x.body):h('b',{},'🎤 '+t('voiceMsg')),
   h('div',{class:'meta'},h('span',{},[x.place,x.landmark].filter(Boolean).join(', ')),x.budget?h('span',{},x.budget):null,h('span',{},t('respOfN')(x.response_count))),
   (x.has_voice||x.has_photo)?h('div',{},media,h('button',{class:'linkbtn',type:'button',onclick:e=>loadMedia(e.currentTarget)},(x.has_voice?'🎤 ':'')+(x.has_photo?'📷 ':'')+t('showMedia'))):null,resp);
  return card};
 draw();
}

// ===== мастер: подписка
async function viewSub(){
 if(!token){go('#/mreg');return}
 const box=h('main',{},loading());shell('sub',header(t('subT')),box);
 let st,pi;try{[st,pi]=await Promise.all([rpc('my_stats',{p_token:token}),rpc('pay_info',{})])}catch(e){set(box,errBox('net'));return}
 if(st.error){set(box,errBox(st.error));return}
 const until=new Date(st.sub_until),days=Math.max(0,Math.ceil((until-Date.now())/864e5)),active=days>0;
 const total=st.trial?30:Math.max(30,days);
 const price=k=>parseInt(String(pi&&pi['price_'+k]||'0').replace(/\D/g,''),10)||0;
 let plan=price('m3')?'m3':(price('m1')?'m1':null);
 const note=h('div',{class:'hint center','aria-live':'polite'});const msg=h('div',{'aria-live':'polite'});
 const subPlans=h('div',{class:'col gap'}),boostPlans=h('div',{class:'col gap'}),payBtn=h('button',{class:'btn green',type:'button'});
 const label=k=>(k.startsWith('boost')?t('boostT')+' · ':'')+t(k);
 const planBtn=k=>h('button',{type:'button',class:'plan','aria-pressed':String(plan===k),disabled:!price(k),onclick:()=>{plan=k;draw()}},h('span',{},h('b',{},t(k)),k==='m3'?h('span',{class:'badge b-y',style:'margin-left:8px'},t('best')):null),h('span',{class:'p'},price(k)?money(price(k))+' '+t('sum'):'—'));
 const draw=()=>{set(subPlans,['m1','m3'].map(planBtn));set(boostPlans,['boost7','boost30'].map(planBtn));
  payBtn.disabled=!plan;set(payBtn,plan?t('paidBtn')+' · '+label(plan)+' · '+money(price(plan))+' '+t('sum'):t('choosePlan'))};
 payBtn.addEventListener('click',async()=>{if(!plan)return;payBtn.disabled=true;set(msg);try{const r=await rpc('pay_claim',{p_token:token,p_plan:plan});if(r.error){set(msg,errBox(r.error));payBtn.disabled=false;return}viewSub()}catch(e){set(msg,errBox('net'));payBtn.disabled=false}});
 draw();
 const card=(pi&&pi.card_number||'').trim();const anyPrice=['m1','m3','boost7','boost30'].some(price);
 const pend=st.pending_payment;
 set(box,h('div',{class:'card col'},h('div',{class:'row between'},h('b',{},st.trial?t('trial'):(active?t('paidSub'):t('expired'))),h('span',{class:'badge '+(active?'b-g':'b-r')},active?t('daysLeft')(days):t('expired'))),
   h('div',{class:'prog'},h('i',{style:'width:'+Math.min(100,Math.round(days/total*100))+'%'})),h('span',{class:'hint'},t('untilD')(fmtDate(until)))),
  h('p',{class:'lead'},t('subWhy')),
  pend?h('div',{class:'warn'},t('pendingPay'),h('br'),h('b',{},label(pend.plan)+' · '+money(pend.amount)+' '+t('sum'))):[
   h('h3',{class:'gh'},t('subT')),subPlans,
   h('h3',{class:'gh',id:'boost'},'★ '+t('boostT')),boosted({boost_until:st.boost_until})?h('div',{class:'ok'},t('boostActive')(fmtDate(st.boost_until))):null,h('p',{class:'hint',style:'margin:0'},t('boostS')),boostPlans,
   anyPrice?h('div',{class:'card col'},h('b',{},t('howPay')),h('span',{},'1. '+t('pay1')),card?h('div',{class:'cardno'},card):null,pi.card_holder?h('span',{class:'hint'},pi.card_holder):null,card?h('button',{class:'btn ghost sm',type:'button',onclick:()=>copyText(card.replace(/\s/g,''),note,t('copiedCard'))},t('copyCard')):null,note,h('span',{},'2. '+t('pay2'))):h('div',{class:'warn'},t('noPrice')),
   msg,anyPrice?payBtn:null],
  h('div',{class:'row',style:'gap:8px;opacity:.55'},h('span',{class:'paybtn click'},'Click · '+t('soon')),h('span',{class:'paybtn payme'},'Payme · '+t('soon'))));
 if(location.hash.endsWith('#boost')||sessionBoost){sessionBoost=false;const el=document.getElementById('boost');if(el)el.scrollIntoView()}
}
let sessionBoost=false;

// ===== профиль (вкладка)
async function viewMe(){
 if(token)return viewMasterCabinet();
 if(ctoken)return viewClientProfile();
 shell('me',header(t('guestT')),h('main',{},h('p',{class:'lead'},t('guestS')),h('a',{class:'btn yellow',href:'#/login'},t('asClient')),h('a',{class:'btn ghost',href:'#/mreg'},t('asMaster')),langSection(),
  h('a',{class:'linkbtn center',href:'#/admin',style:'margin-top:24px;color:var(--muted)'},t('adminLogin'))));
}
function langSection(){return h('div',{class:'f'},h('div',{class:'lab'},t('language')),h('div',{class:'langs light',role:'group'},LANGS.map(([c,n])=>h('button',{class:'chip',type:'button','aria-pressed':String(c===lang),onclick:()=>{lang=c;store.set('usta_lang',c);document.documentElement.lang=c;render()}},n))))}
function viewClientProfile(){
 const msg=h('div',{'aria-live':'polite'});const name=h('input',{id:'cp-name',type:'text',maxlength:60});name.value=me.name||'';
 shell('me',header(t('clientProfile')),h('main',{},h('div',{class:'card'},h('span',{class:'ava'},initials(me.name)),h('span',{class:'txt'},h('b',{},me.name),h('span',{},fmtPhone(me.phone)))),
  field('cp-name',t('name'),name),msg,h('button',{class:'btn yellow',type:'button',onclick:async()=>{try{const r=await rpc('client_update',{p_token:ctoken,p_name:name.value});set(msg,r.error?errBox(r.error):okBox(t('saved')));await loadMe()}catch(e){set(msg,errBox('net'))}}},t('save')),
  h('a',{class:'btn ghost',href:'#/req'},t('myReqs')),langSection(),
  h('button',{class:'btn ghost',type:'button',onclick:async()=>{const tk=ctoken;logoutLocal();try{await rpc('client_logout',{p_token:tk})}catch(e){}go('#/')}},t('logout')),
  h('a',{class:'linkbtn center',href:'#/mreg'},t('asMaster')+' →')));
}
async function viewMasterCabinet(){
 const box=h('main',{},loading());shell('me',h('div',{class:'top'},h('h1',{},t('mine'))),box);
 await loadMe();if(!me.id){go('#/mreg');return}
 const m=me;let st={};try{st=await rpc('my_stats',{p_token:token})}catch(e){}
 const pct=Math.round(([m.name,m.about&&m.about.length>20,m.experience_years!=null,m.district,(st.photos||0)>0,(st.photos||0)>=3].filter(Boolean).length/6)*100);
 const tgl=h('button',{type:'button',class:'switch',role:'switch','aria-checked':String(m.accepting!==false),'aria-label':t('accepting'),onclick:async()=>{const on=tgl.getAttribute('aria-checked')!=='true';tgl.setAttribute('aria-checked',String(on));try{await rpc('set_accepting',{p_token:token,p_on:on});me.accepting=on;set(offl,on?null:h('div',{class:'warn'},t('offlineNote')))}catch(e){tgl.setAttribute('aria-checked',String(!on))}}},h('i'));
 const offl=h('div',{},m.accepting===false?h('div',{class:'warn'},t('offlineNote')):null);
 // форма редактирования
 const msg=h('div',{'aria-live':'polite'});
 const name=h('input',{id:'f-name',type:'text',maxlength:80,value:m.name,required:true});
 const cat=catSelect(m.category);const L=locFields(m.region,m.place);const district=h('input',{id:'f-district',type:'text',maxlength:80,value:m.district||'',placeholder:t('districtPh')});
 const exp=h('input',{id:'f-exp',type:'number',min:0,max:70,inputmode:'numeric',value:m.experience_years!=null?m.experience_years:''});
 const about=h('textarea',{id:'f-about',maxlength:600,placeholder:t('aboutPh')},m.about||'');
 const save=h('button',{class:'btn yellow',type:'submit'},t('save'));
 const form=h('form',{novalidate:true,onsubmit:async e=>{e.preventDefault();set(msg);if(name.value.trim().length<2){set(msg,errBox('bad_input'));return}if(!L.rs.value||!L.ps.value){set(msg,errBox('loc'));return}save.disabled=true;
   try{const r=await rpc('update_master_v2',{p_token:token,p_name:name.value,p_category:cat.value,p_region:L.rs.value,p_place:L.ps.value,p_district:district.value,p_about:about.value,p_experience:expVal(exp.value)});
    set(msg,r.error?errBox(r.error):okBox(t('saved')));await loadMe()}catch(err){set(msg,errBox('net'))}save.disabled=false}},
  field('f-name',t('name'),name),field('f-cat',t('spec'),cat),field('f-region',t('regionL'),L.rs),field('f-place',t('placeL'),L.ps),field('f-district',t('district'),district),field('f-exp',t('expL'),exp),field('f-about',t('about'),about),msg,save);
 const editBox=h('details',{class:'card col details'},h('summary',{},h('b',{},t('editProfile'))),form);
 // фото
 const photoBox=h('div',{class:'panel'}),pmsg=h('div',{'aria-live':'polite'});
 const loadMy=async()=>{let ps=[];try{ps=await rpc('my_photos',{p_token:token})||[]}catch(e){}
  const file=h('input',{id:'f-photo',type:'file',accept:'image/*',hidden:true,onchange:async()=>{const f=file.files[0];if(!f)return;set(pmsg,h('p',{class:'muted'},t('load')));
   try{const data=await shrink(f);const r=await rpc('add_photo',{p_token:token,p_data:data});set(pmsg,r.error?errBox(r.error):null)}catch(e){set(pmsg,errBox(e.message==='net'?'net':'bad_photo'))}loadMy()}});
  set(photoBox,h('h3',{},t('photos')),ps.length?photoGrid(ps,async p=>{try{await rpc('delete_photo',{p_token:token,p_id:p.id})}catch(e){}loadMy()}):null,ps.length<6?h('label',{class:'btn ghost',for:'f-photo',style:'cursor:pointer'},'+ '+t('addPhoto')):null,file,h('div',{class:'hint'},t('photoHint')),pmsg)};
 loadMy();
 const delBox=h('div',{});
 const askDel=()=>set(delBox,h('div',{class:'panel'},h('b',{},t('delQ')),h('button',{class:'btn danger',type:'button',onclick:async()=>{try{const r=await rpc('delete_master',{p_token:token});if(r&&r.error)throw 0;logoutLocal();go('#/')}catch(e){set(msg,errBox('net'))}}},t('delYes')),h('button',{class:'btn ghost',type:'button',onclick:()=>showDel()},t('cancel'))));
 const showDel=()=>set(delBox,h('button',{class:'btn danger',type:'button',onclick:askDel},t('del')));showDel();
 const days=st.sub_until?Math.max(0,Math.ceil((new Date(st.sub_until)-Date.now())/864e5)):0;
 set(app.querySelector('.top'),h('div',{class:'row'},h('span',{class:'ava big y'},initials(m.name)),h('span',{class:'txt'},h('h1',{},m.name),h('span',{class:'sub'},[catName(m.category),m.place].filter(Boolean).join(' · '))),m.verified?badgeV():null));
 set(box,m.is_admin?h('a',{class:'btn green',href:'#/admin'},t('admin')):null,m.is_active?null:h('div',{class:'warn'},t('hiddenMsg')),
  h('div',{class:'card col'},h('b',{},t('statusL')),busyToggle(),h('span',{class:'hint'},t('statusS'))),
  h('div',{class:'card col'},h('div',{class:'row between'},h('b',{},t('accepting')),tgl),h('span',{class:'hint'},t('acceptingS'))),offl,
  boosted(m)?h('a',{class:'card row between topcard',href:'#/sub'},h('b',{},'★ '+t('boostActive')(fmtDate(m.boost_until))),h('span',{class:'linkbtn'},'→')):h('a',{class:'card row between',href:'#/sub#boost'},h('span',{class:'col'},h('b',{},'★ '+t('boostT')),h('span',{class:'hint'},t('boostS'))),svg(I.next,20)),
  h('a',{class:'card row between',href:'#/sub'},h('b',{},days>0?(st.trial?t('trialDays')(days):t('paidDays')(days)):t('expired')),h('span',{class:'linkbtn'},t('subRenew')+' →')),
  h('h3',{class:'gh'},t('stat30')),h('div',{class:'stats'},[['views',st.views],['calls',st.calls],['resp',st.responses],['won',st.chosen]].map(([k,v])=>h('div',{class:'card stat'},h('b',{},String(v||0)),h('span',{},t('st_'+k))))),
  h('div',{class:'card col'},h('div',{class:'row between'},h('b',{},t('complete')),h('b',{},pct+'%')),h('div',{class:'prog'},h('i',{style:'width:'+pct+'%'})),pct<100?h('span',{class:'hint'},t('completeHint')):null),
  photoBox,editBox,m.is_active?h('a',{class:'btn ghost',href:'#/m/'+m.id},t('view')):null,langSection(),
  h('button',{class:'btn ghost',type:'button',onclick:async()=>{const tk=token;logoutLocal();try{await rpc('logout_master',{p_token:tk})}catch(e){}go('#/')}},t('logout')),delBox);
}

// ===== регистрация / вход мастера
let authMode='reg';
function viewMasterAuth(){
 if(token){go('#/me');return}
 const msg=h('div',{'aria-live':'polite'});const reg=authMode==='reg';
 const name=h('input',{id:'f-name',type:'text',maxlength:80,placeholder:t('namePh'),autocomplete:'name'});
 const phone=h('input',{id:'f-phone',type:'tel',placeholder:'+998 90 123 45 67',autocomplete:'tel'});
 const pass=h('input',{id:'f-pass',type:'password',maxlength:72,autocomplete:reg?'new-password':'current-password'});
 const cat=catSelect();const L=locFields(loc.r,loc.p);
 const submit=h('button',{class:'btn yellow',type:'submit'},reg?t('create'):t('enter'));
 const form=h('form',{novalidate:true,onsubmit:async e=>{e.preventDefault();set(msg);
   const p=normPhone(phone.value);if(!p){set(msg,errBox('phone'));return}
   if(pass.value.length<6){set(msg,errBox('bad_password'));return}
   if(reg&&name.value.trim().length<2){set(msg,errBox('bad_input'));return}
   if(reg&&!cat.value){set(msg,errBox('cat'));return}
   if(reg&&(!L.rs.value||!L.ps.value)){set(msg,errBox('loc'));return}
   submit.disabled=true;
   try{const r=reg?await rpc('register_master_v2',{p_name:name.value,p_phone:p,p_password:pass.value,p_category:cat.value,p_region:L.rs.value,p_place:L.ps.value,p_district:'',p_about:'',p_experience:null}):await rpc('login_master',{p_phone:p,p_password:pass.value});
    if(r.error){set(msg,errBox(r.error));submit.disabled=false;return}
    token=r.token;store.set('usta_token',token);await loadMe();refreshBadges();go(reg?'#/me':'#/feed');
   }catch(err){set(msg,errBox('net'));submit.disabled=false}}},
  reg?field('f-name',t('name'),name):null,field('f-phone',t('phone'),phone,reg?t('phoneH'):null),field('f-pass',t('pass'),pass,reg?t('passH'):null),
  reg?field('f-cat',t('spec'),cat):null,reg?field('f-region',t('regionL'),L.rs):null,reg?field('f-place',t('placeL'),L.ps):null,msg,submit);
 const tab=(m,l)=>h('button',{type:'button','aria-pressed':String(authMode===m),onclick:()=>{authMode=m;viewMasterAuth()}},l);
 shell('me',header(reg?t('masterRegT'):t('login'),'#/'),h('main',{},reg?h('div',{class:'hero sm'},h('b',{},t('masterRegS'))):null,h('div',{class:'tabs'},tab('reg',t('reg')),tab('login',t('login'))),form,
  h('a',{class:'linkbtn center',href:'#/admin',style:'color:var(--muted)'},t('adminLogin'))));
}

// ===== админ
async function viewAdminLogin(){
 const box=h('main',{},loading());plain(header(t('adminLogin'),'#/'),box);
 let exists;try{exists=await rpc('admin_exists',{})}catch(e){set(box,errBox('net'));return}
 const msg=h('div',{'aria-live':'polite'});
 const login=h('input',{id:'a-login',type:'text',maxlength:30,autocomplete:'username',autocapitalize:'none',spellcheck:'false'});
 const pass=h('input',{id:'a-pass',type:'password',maxlength:72,autocomplete:exists?'current-password':'new-password'});
 const submit=h('button',{class:'btn yellow',type:'submit'},exists?t('enter'):t('create'));
 set(box,exists?null:h('div',{class:'warn'},t('setupT')),h('form',{novalidate:true,onsubmit:async e=>{e.preventDefault();set(msg);
   if(!exists&&!/^[a-z0-9_]{3,30}$/.test(login.value.trim().toLowerCase())){set(msg,errBox('bad_login'));return}
   if(!exists&&pass.value.length<8){set(msg,errBox('weak'));return}
   submit.disabled=true;
   try{const r=await rpc(exists?'admin_login':'admin_setup',{p_login:login.value,p_password:pass.value});if(r.error){set(msg,errBox(r.error==='wrong'?'wrong_admin':r.error));submit.disabled=false;return}
    adminToken=r.token;store.set('usta_admin',adminToken);viewAdmin()}catch(err){set(msg,errBox('net'));submit.disabled=false}}},
  field('a-login',t('loginL'),login),field('a-pass',t('pass'),pass,exists?null:t('setupH')),msg,submit));
}
let adminTab='masters';
async function viewAdmin(){
 const atok=adminToken||(me.is_admin?token:null);
 if(!atok){viewAdminLogin();return}
 const box=h('main',{},loading());
 const TL={masters:'tabMasters',complaints:'tabComplaints',pays:'tabPays',settings:'tabSettings'};
 const tabs=h('div',{class:'tabs four'},Object.keys(TL).map(k=>h('button',{type:'button','aria-pressed':String(adminTab===k),onclick:()=>{adminTab=k;viewAdmin()}},t(TL[k]))));
 plain(header(t('admin'),'#/'),h('main',{class:'nopad'},tabs),box);
 const call=async(fn,args)=>{try{const x=await rpc(fn,Object.assign({p_token:atok},args));if(x&&x.error){if(x.error==='forbidden'){adminToken=null;store.set('usta_admin',null);viewAdminLogin();return null}box.prepend(errBox(x.error));return null}return x}catch(e){box.prepend(errBox('net'));return null}};
 if(adminTab==='masters'){
  const r=await call('admin_list_masters_v3',{});if(!r)return;
  set(box,h('p',{class:'hint'},t('adminStats')(r.masters.length,r.clients,r.requests)),r.masters.map(m=>{
   const btns=h('div',{class:'row wrap'});const out=h('div',{});
   const base=()=>set(btns,
    h('button',{class:'btn ghost sm',type:'button',onclick:async()=>{if(await call('admin_set_verified',{p_id:m.id,p_on:!m.verified}))viewAdmin()}},m.verified?t('unverify'):t('verifyBtn')),
    h('button',{class:'btn ghost sm',type:'button',onclick:async()=>{if(await call('admin_extend',{p_id:m.id,p_days:30}))viewAdmin()}},t('extend30')),
    h('button',{class:'btn ghost sm',type:'button',onclick:async()=>{if(await call('admin_set_active',{p_id:m.id,p_active:!m.is_active}))viewAdmin()}},m.is_active?t('hide'):t('show')),
    h('button',{class:'btn ghost sm',type:'button',onclick:()=>{const pw=h('input',{type:'text',minlength:6,maxlength:72,placeholder:t('newPw'),'aria-label':t('newPw')});set(out,pw,h('button',{class:'btn yellow sm',type:'button',onclick:async()=>{const x=await call('admin_reset_master_password',{p_id:m.id,p_password:pw.value});if(x)set(out,okBox(t('pwSet')+' '+pw.value))}},t('save')))}},t('resetPw')),
    h('button',{class:'btn ghost sm danger',type:'button',onclick:()=>set(btns,h('button',{class:'btn danger sm',type:'button',onclick:async()=>{if(await call('admin_delete_master',{p_id:m.id}))viewAdmin()}},t('delYes')),h('button',{class:'btn ghost sm',type:'button',onclick:base},t('cancel')))},t('delS')));
   base();
   return h('div',{class:'panel',style:m.is_active?null:'opacity:.7'},h('div',{class:'txt'},h('b',{},m.name,' ',m.verified?badgeV():null,' ',boosted(m)?badgeTop():null,m.is_active?null:' · '+t('hidden'),m.accepting===false?' · '+t('offline'):null),h('span',{class:'row',style:'gap:6px;flex-wrap:wrap'},statusChip(m),rate(m)?h('span',{class:'rate'},rate(m)):null,m.complaints?h('span',{class:'badge b-r'},'⚠ '+t('complaintsN')(m.complaints)):null),h('span',{},catName(m.category)+' · '+[m.place,regName(m.region)].filter(Boolean).join(', ')),h('span',{},fmtPhone(m.phone)+' · '+t('subTill')(fmtDate(m.sub_until))+(m.trial?' ('+t('trial').toLowerCase()+')':''))),btns,out)}));
 }else if(adminTab==='complaints'){
  const r=await call('admin_complaints',{});if(!r)return;
  set(box,r.complaints.length?r.complaints.map(k=>h('div',{class:'panel',style:k.status==='open'?null:'opacity:.65'},h('div',{class:'row between'},h('b',{},t('r_'+k.reason)),h('span',{class:'badge '+(k.status==='open'?'b-r':'b-x')},k.status==='open'?t('openL'):t('resolvedL'))),
   k.body?h('p',{style:'white-space:pre-line'},k.body):null,
   h('span',{},h('a',{href:'#/m/'+k.master_id,class:'linkbtn',style:'padding:0;min-height:0'},k.master_name),' · '+fmtPhone(k.master_phone)+(k.master_active?'':' · '+t('hidden'))),
   h('span',{class:'hint'},t('fromL')+': '+k.client_name+' · '+fmtPhone(k.client_phone)+' · '+ago(k.created_at)),
   k.status==='open'?h('div',{class:'row wrap'},k.master_active?h('button',{class:'btn ghost sm danger',type:'button',onclick:async()=>{if(await call('admin_set_active',{p_id:k.master_id,p_active:false}))viewAdmin()}},t('hide')):null,h('button',{class:'btn green sm',type:'button',onclick:async()=>{if(await call('admin_resolve_complaint',{p_id:k.id}))viewAdmin()}},t('resolve'))):null)):h('p',{class:'muted center'},t('noComplaints')));
 }else if(adminTab==='pays'){
  const r=await call('admin_payments',{});if(!r)return;
  set(box,r.payments.length?r.payments.map(p=>h('div',{class:'panel'},h('div',{class:'row between'},h('b',{},p.name),h('span',{class:'badge '+(p.status==='pending'?'b-y':(p.status==='confirmed'?'b-g':'b-r'))},t('p_'+p.status))),
   h('span',{},fmtPhone(p.phone)+' · '+(p.plan.startsWith('boost')?t('boostT')+' ':'')+t(p.plan)+' · '+money(p.amount)+' '+t('sum')),h('span',{class:'hint'},ago(p.created_at)),
   p.status==='pending'?h('div',{class:'row'},h('button',{class:'btn ghost sm danger',type:'button',onclick:async()=>{if(await call('admin_decide_payment',{p_id:p.id,p_ok:false}))viewAdmin()}},t('rejectPay')),h('button',{class:'btn green sm',type:'button',onclick:async()=>{if(await call('admin_decide_payment',{p_id:p.id,p_ok:true}))viewAdmin()}},t('confirmPay'))):null)):h('p',{class:'muted center'},t('noPays')));
 }else{
  const r=await call('admin_payments',{});if(!r)return;const c=r.config||{};const msg=h('div',{'aria-live':'polite'});
  const pv=k=>c[k]&&c[k]!=='0'?c[k]:'';const p1=h('input',{id:'s-p1',type:'text',inputmode:'numeric',value:pv('price_m1')}),p3=h('input',{id:'s-p3',type:'text',inputmode:'numeric',value:pv('price_m3')}),b7=h('input',{id:'s-b7',type:'text',inputmode:'numeric',value:pv('price_boost7')}),b30=h('input',{id:'s-b30',type:'text',inputmode:'numeric',value:pv('price_boost30')});
  const cn=h('input',{id:'s-card',type:'text',inputmode:'numeric',maxlength:24,value:c.card_number||'',autocomplete:'off'}),ch=h('input',{id:'s-holder',type:'text',maxlength:60,value:c.card_holder||''});
  set(box,field('s-p1',t('priceM1'),p1),field('s-p3',t('priceM3'),p3),field('s-b7',t('priceB7'),b7),field('s-b30',t('priceB30'),b30),field('s-card',t('cardL'),cn),field('s-holder',t('holderL'),ch),msg,
   h('button',{class:'btn yellow',type:'button',onclick:async()=>{set(msg);const x=await call('admin_set_config2',{p_price_m1:p1.value.replace(/\D/g,''),p_price_m3:p3.value.replace(/\D/g,''),p_price_b7:b7.value.replace(/\D/g,''),p_price_b30:b30.value.replace(/\D/g,''),p_card:cn.value.replace(/[^\d ]/g,'').trim(),p_holder:ch.value});if(x)set(msg,okBox(t('saved')))}},t('save')),
   adminToken?h('button',{class:'btn ghost',type:'button',onclick:async()=>{const tk=adminToken;adminToken=null;store.set('usta_admin',null);try{await rpc('admin_logout',{p_token:tk})}catch(e){}go('#/')}},t('logout')):null);
 }
}

// ===== маршруты
async function render(){
 clearInterval(chatTimer);
 const p=location.hash.replace(/^#\/?/,'').split('/');window.scrollTo(0,0);
 const a=p[0]||'';
 if(a==='loc'){viewLoc();return}
 if(a==='c'&&CATS[p[1]])return viewList(p[1]);
 if(a==='s'&&p[1]){let q=p.slice(1).join('/');try{q=decodeURIComponent(q)}catch(e){}return viewList(null,q)}
 if(a==='cats')return viewCats();
 if(a==='m'&&p[1])return viewMaster(p[1]);
 if(a==='new'){if(role()==='master'){go('#/feed');return}return viewNew(p[1])}
 if(a==='login'){if(ctoken){go('#/req');return}return viewClientLogin()}
 if(a==='req')return viewMyReqs();
 if(a==='r'&&p[1])return viewReq(p[1],p[2]==='new');
 if(a==='rev'&&p[1])return viewReview(p[1]);
 if(a==='chats')return viewChats();
 if(a==='chat'&&p[1]&&p[2])return viewChat(p[1],p[2]);
 if(a==='feed')return viewFeed();
 if(a==='sub'||a==='sub#boost'){if(a!=='sub')sessionBoost=true;return viewSub()}
 if(a==='complain'&&p[1])return viewComplain(p[1]);
 if(a==='me')return viewMe();
 if(a==='mreg')return viewMasterAuth();
 if(a==='admin')return viewAdmin();
 return viewHome();
}
window.addEventListener('hashchange',render);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshBadges()});
document.documentElement.lang=lang;
(async()=>{await loadMe();await refreshBadges();render();badgeTimer=setInterval(()=>{if(!document.hidden)refreshBadges()},25000)})();
