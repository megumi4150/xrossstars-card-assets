import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const db=path.join(root,'db');fs.mkdirSync(db,{recursive:true});
const seedArg=process.argv.indexOf('--seed');
const seedPath=path.join(db,'baseline.json');
if(!fs.existsSync(seedPath)) {
 if(seedArg<0)throw Error('baseline.json is required');
 const context={window:{}};vm.runInNewContext(fs.readFileSync(process.argv[seedArg+1],'utf8'),context);
 fs.writeFileSync(seedPath,JSON.stringify(context.window.XROSS_ALL_CARDS,null,2)+'\n');
}
const baseline=JSON.parse(fs.readFileSync(seedPath,'utf8'));
const trusted=new Set(baseline.map(c=>c.type+'\n'+c.effect));
const reviewed=JSON.parse(fs.readFileSync(path.join(db,'reviewed-effects.json'),'utf8'));
for(const rule of reviewed)trusted.add(rule.type+'\n'+rule.effect);
const previous=fs.existsSync(path.join(db,'manifest.json'))?JSON.parse(fs.readFileSync(path.join(db,'manifest.json'),'utf8')):null;
const previousPayload=previous?JSON.parse(fs.readFileSync(path.join(db,previous.file),'utf8')):null;
const safeName=(c,awake=false)=>`${String(c.id).padStart(4,'0')}_${c.card_type.internal_id}_${c.display_card_number.split(/\s+/)[0].replaceAll('/','_')}${awake?'_awaken':''}.png`;
const allowed=new Set(['leader','attack','memoria','tactics']);
async function get(url,json=false){const u=new URL(url);if(u.protocol!=='https:'||!['api.xross-stars.com','assets.xross-stars.com'].includes(u.hostname))throw Error('Unexpected URL '+url);let error;for(let i=0;i<3;i++){try{const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`HTTP ${r.status}: ${url}`);return json?await r.json():Buffer.from(await r.arrayBuffer());}catch(e){error=e;}}throw error;}
const raw=[];let expected;
for(let page=1;page<=100;page++){
 const p=await get(`https://api.xross-stars.com/v1/cards?limit=200&page=${page}`,true);
 if(!Array.isArray(p.cards)||!p.cards.length||!p.page_info)throw Error('Incomplete API response');
 expected??=p.page_info.total_count;if(expected!==p.page_info.total_count)throw Error('API changed during download');
 raw.push(...p.cards);if(!p.page_info.has_next_page)break;
}
if(raw.length!==expected||new Set(raw.map(c=>c.id)).size!==raw.length)throw Error('Missing/duplicate API cards');
const oldCards=previousPayload?.cards||baseline;
if(oldCards.some(c=>!raw.some(r=>r.id===c.id)))throw Error('Existing card missing; manual review required');
const cards=[];let downloads=0;
for(const r of raw.filter(c=>allowed.has(c.card_type?.internal_id))){
 if(!Number.isInteger(r.id)||!r.name||!r.image_url||!r.display_card_number)throw Error('Invalid card');
 const c={id:r.id,name:r.name,kana:r.name_kana||'',code:r.display_card_number,rarity:r.card_rarity?.internal_id||'',type:r.card_type.internal_id,color:r.card_color?.internal_id||'colorless',cost:r.cost??'',hp:r.hp??'',atk:r.atk??'',awaken_hp:r.awaken_hp??'',awaken_atk:r.awaken_atk??'',effect:r.effect||'',image_url:r.image_url,awaken_image_url:r.awaken_image_url||'',local_image:'',local_awaken_image:'',review_required:!trusted.has(r.card_type.internal_id+'\n'+(r.effect||''))};
 if(c.type==='leader'&&(!Number.isFinite(c.hp)||!Number.isFinite(c.awaken_hp)||!c.awaken_image_url))throw Error('Incomplete leader '+c.name);
 for(const awake of [false,true]){
  const url=awake?c.awaken_image_url:c.image_url;if(!url)continue;
  const original=safeName(r,awake);if(!/^[\w.-]+$/.test(original))throw Error('Unsafe filename');
  const old=oldCards.find(x=>x.id===c.id),urlKey=awake?'awaken_image_url':'image_url',localKey=awake?'local_awaken_image':'local_image';
  // Preserve old image URLs in historical logs when the official artwork changes.
  const name=old&&old[urlKey]!==url?original.replace('.png','_'+hash(url).slice(0,10)+'.png'):path.basename(old?.[localKey]||original);
  const relative='card-images/'+name,target=path.join(root,relative);
  if(!fs.existsSync(target)||fs.statSync(target).size<1024){const bytes=await get(url);if(bytes.length<1024||!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Invalid PNG '+c.name);fs.writeFileSync(target+'.part',bytes);fs.renameSync(target+'.part',target);downloads++;}
  const header=Buffer.alloc(8),fd=fs.openSync(target,'r');try{fs.readSync(fd,header,0,8,0);}finally{fs.closeSync(fd);}if(!header.equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Invalid cached image '+relative);
  c[localKey]=relative;
 }
 cards.push(c);
}
cards.sort((a,b)=>b.id-a.id);
const imageBytes=fs.readdirSync(path.join(root,'card-images')).reduce((n,f)=>n+fs.statSync(path.join(root,'card-images',f)).size,0);
if(imageBytes>950000000)throw Error('Pages capacity safety limit reached. Review image storage before publishing.');
const version=hash(JSON.stringify(cards)).slice(0,20),file=`cards-${version}.json`;
const payload={schema:1,version,total:cards.length,cards};
const bytes=JSON.stringify(payload,null,2)+'\n';
fs.writeFileSync(path.join(db,file),bytes);
const now=new Date().toISOString();
const manifest={schema:1,version,file,sha256:hash(bytes),total:cards.length,updated_at:previous?.version===version?previous.updated_at:now,checked_at:now,review_required:cards.filter(c=>c.review_required).length};
fs.writeFileSync(path.join(db,'manifest.json.part'),JSON.stringify(manifest,null,2)+'\n');fs.renameSync(path.join(db,'manifest.json.part'),path.join(db,'manifest.json'));
console.log(JSON.stringify({ok:true,...manifest,downloads}));
