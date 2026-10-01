import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {normalizeDeck,validateCode} from './deck-format.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const directory=path.join(root,'decks');fs.mkdirSync(directory,{recursive:true});
const registeredPath=path.join(directory,'registered.json');
const registrations=fs.existsSync(registeredPath)?JSON.parse(fs.readFileSync(registeredPath,'utf8')):[];
const code=String(process.env.REGISTER_DECK_CODE||'').trim(),label=String(process.env.REGISTER_DECK_LABEL||'').trim();
if(code){validateCode(code);if(label.length>100)throw Error('Deck label must be at most 100 characters');const row=registrations.find(d=>d.code===code);if(row){if(label)row.label=label;}else registrations.push({code,label:label||code});}
if(!Array.isArray(registrations)||registrations.length>1000)throw Error('Invalid deck registry');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'db/manifest.json'),'utf8'));
const catalog=JSON.parse(fs.readFileSync(path.join(root,'db',manifest.file),'utf8'));
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const indexPath=path.join(directory,'index.json');
const oldIndex=fs.existsSync(indexPath)?JSON.parse(fs.readFileSync(indexPath,'utf8')):{decks:[]};
const entries=[];
for(const registration of registrations){
 validateCode(registration.code);
 const response=await fetch(`https://api.xross-stars.com/v1/decks/${registration.code}`,{signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error(`Cannot retrieve deck ${registration.code}: HTTP ${response.status}`);
 const data=normalizeDeck(await response.json(),registration.code,catalog.cards);
 const content={...data,label:registration.label||registration.code};
 const version=hash(JSON.stringify(content)).slice(0,20);
 const payload={schema:1,...content,version,card_db_version:manifest.version};
 const file=`deck-${registration.code}-${version}.json`;
 const bytes=JSON.stringify(payload,null,2)+'\n';
 // Existing snapshots stay immutable even when the common card DB changes.
 const target=path.join(directory,file);if(!fs.existsSync(target))fs.writeFileSync(target,bytes);
 const savedBytes=fs.readFileSync(target);
 const previous=oldIndex.decks.find(d=>d.code===registration.code&&d.version===version);
 entries.push({code:registration.code,label:content.label,version,file,sha256:hash(savedBytes),updated_at:previous?.updated_at||new Date().toISOString(),main_count:data.main.reduce((sum,c)=>sum+c.count,0),main_types:data.main.length,tactics_count:data.tactics.reduce((sum,c)=>sum+c.count,0)});
}
const index={schema:1,total:entries.length,decks:entries};
// Publish metadata only after every requested deck succeeds.
fs.writeFileSync(registeredPath,JSON.stringify(registrations,null,2)+'\n');
fs.writeFileSync(indexPath+'.part',JSON.stringify(index,null,2)+'\n');fs.renameSync(indexPath+'.part',indexPath);
console.log(JSON.stringify({ok:true,registered:entries.length,decks:entries.map(d=>({code:d.code,label:d.label,main_types:d.main_types}))}));
