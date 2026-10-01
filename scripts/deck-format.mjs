export const validateCode=code=>{if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(code))throw Error('Deck code must be a UUID');return code;};
export function normalizeDeck(raw,code,cards){
 validateCode(code);
 if(raw?.id!==code||!Array.isArray(raw.leader)||raw.leader.length!==4||!Array.isArray(raw.deck)||raw.deck.length!==50||!Array.isArray(raw.tactics)||raw.tactics.length!==5)throw Error('Incomplete deck (expected 4 leaders, 50 main cards, 5 tactics)');
 const byId=new Map(cards.map(c=>[c.id,c]));
 function validate(card,types){const c=byId.get(card?.id);if(!c||!types.includes(c.type)||c.type!==card.card_type?.internal_id||c.code!==card.display_card_number)throw Error(`Card ${card?.id} is missing or differs from shared DB; update card DB first`);return c.id;}
 function group(rows,types){const map=new Map();for(const c of rows){const id=validate(c,types);map.set(id,(map.get(id)||0)+1);}return [...map].map(([card_id,count])=>({card_id,count}));}
 return {code,leaders:raw.leader.map(c=>validate(c,['leader'])),main:group(raw.deck,['attack','memoria']),tactics:group(raw.tactics,['tactics']),pp:raw.pp?validate(raw.pp,['tactics']):null};
}
