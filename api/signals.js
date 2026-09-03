const https = require('https');

// Public BOAMP dataset (OpenDataSoft v2.1).
const BOAMP = 'https://www.boamp.fr/api/explore/v2.1/catalog/datasets/boamp_piamp_concentrateur/records';
const DECP = 'https://www.data.gouv.fr/api/1/datasets/donnees-essentielles-de-la-commande-publique-donnees-enrichies';
const IDF = new Set(['75','77','78','91','92','93','94','95']);

const KEYWORDS = {
  cvc:['cvc','chauffage','climatisation','ventilation','hvac','thermique'],
  plomberie:['plomberie','plombier','sanitaire','canalisation','eau potable'],
  electricite:['électricité','electricite','électrique','electrique','courant fort','courant faible','hta','bt'],
  maintenance:['maintenance','entretien','exploitation technique','multitechnique','exploitation-maintenance']
};

function str(v){ return v == null ? '' : String(v); }
function first(r,names){
  const keys = Object.keys(r || {});
  for(const n of names){
    const k = keys.find(x => x.toLowerCase() === n.toLowerCase());
    if(k && r[k] != null && r[k] !== '') return r[k];
  }
  for(const n of names){
    const k = keys.find(x => x.toLowerCase().includes(n.toLowerCase()));
    if(k && r[k] != null && r[k] !== '') return r[k];
  }
  return null;
}
function num(v){
  if(v == null) return null;
  if(typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = str(v).replace(/\s/g,'').replace(/€/g,'').replace(/,/g,'.').replace(/[^0-9.\-]/g,'');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function parseJson(v){ if(typeof v !== 'string') return v; try { return JSON.parse(v); } catch { return null; } }
function flattenValues(v, out=[]){
  if(v == null) return out;
  if(Array.isArray(v)){ for(const x of v) flattenValues(x,out); return out; }
  if(typeof v === 'object'){ for(const [k,x] of Object.entries(v)){ out.push([k,str(x)]); flattenValues(x,out); } return out; }
  return out;
}
function nestedFirst(r, keys){
  const parsed = parseJson(r?.donnees);
  if(!parsed) return null;
  const wanted = keys.map(x=>x.toLowerCase());
  for(const [k,v] of flattenValues(parsed)) if(wanted.some(w=>k.toLowerCase().includes(w))){ const n=num(v); if(n!=null) return n; }
  return null;
}
function sector(t){
  t = t.toLowerCase();
  for(const [s,ws] of Object.entries(KEYWORDS)) if(ws.some(w=>t.includes(w))) return s;
  return null;
}
function region(r){
  const deps = [].concat(r.code_departement || [], r.code_departement_prestation || []).map(str);
  if(deps.some(d=>IDF.has(d))) return 'Île-de-France';
  const t = Object.values(r).map(str).join(' ').toLowerCase();
  if(/\bparis\b/.test(t) || /\bversailles\b/.test(t)) return 'Île-de-France';
  return null;
}
function eventType(r){
  const n = str(first(r,['nature','nature_libelle','type_avis','type'])).toLowerCase();
  if(n.includes('attribution') || n.includes('résultat') || n.includes('resultat')) return 'attribution';
  if(n.includes('annulation')) return 'annulation';
  if(n.includes('rectificatif')) return 'rectificatif';
  if(n.includes('avis de marché') || n.includes('appel d’offres') || n.includes("appel d'offres") || n.includes('appel')) return 'appel_offres';
  return n || 'autre';
}
function confidence(score, evidenceCount){
  if(score >= 80 && evidenceCount >= 4) return 'high';
  if(score >= 65 && evidenceCount >= 3) return 'medium';
  return 'low';
}
function score(r){
  const title = str(first(r,['objet','object','title','intitule','description']));
  const blob = title+' '+Object.values(r).map(str).join(' ');
  const sec = sector(blob);
  const reg = region(r);
  const amount = num(first(r,['montant','amount','montant_ht','value','valeur'])) ?? nestedFirst(r,['montant','valeur','value']);
  const duration = str(first(r,['duree','duration','duree_mois','dureeMois'])) || null;
  const evt = eventType(r);
  const winner = first(r,['titulaire','winner','contractor','entreprise','titulaire_nom','attributaire']);
  const buyer = first(r,['nomacheteur','acheteur','organisme','acheteur_nom']);
  let points = 0, reasons=[], evidence=0;
  if(sec){ points += 25; evidence++; reasons.push('activité ciblée'); }
  if(reg){ points += 15; evidence++; reasons.push('zone Île-de-France'); }
  if(evt === 'attribution'){ points += 25; evidence++; reasons.push('marché déjà attribué'); }
  else if(evt === 'appel_offres'){ points += 10; evidence++; reasons.push('opportunité active'); }
  if(amount != null){
    if(amount>=1e6) points += 20;
    else if(amount>=5e5) points += 16;
    else if(amount>=1e5) points += 10;
    else if(amount>=4e4) points += 5;
    if(amount>=5e5){ evidence++; reasons.push('montant significatif'); }
  }
  if(duration){ points += 5; evidence++; reasons.push('durée renseignée'); }
  if(winner){ points += 5; evidence++; reasons.push('entreprise gagnante identifiable'); }
  if(buyer){ points += 3; evidence++; reasons.push('acheteur identifiable'); }
  if(first(r,['idweb','id','filename'])){ points += 2; evidence++; reasons.push('source traçable'); }
  return {score:Math.min(points,100), evidence, confidence:confidence(Math.min(points,100),evidence), facts:{event_type:evt,sector:sec,region:reg,amount_eur:amount,duration,winner:str(winner)||null,buyer:str(buyer)||null,reasons}};
}

function inferIntent(f){
  const intents=[];
  const evidence=[];
  if(f.event_type === 'attribution') { intents.push('capacité opérationnelle / sous-traitance'); evidence.push('contrat attribué'); }
  if(f.amount_eur >= 500000) { intents.push('BFR / financement'); evidence.push('montant >= 500 k€'); }
  if(f.duration && /\d/.test(f.duration)) { intents.push('recrutement / renfort opérationnel'); evidence.push('durée contractuelle'); }
  if(['cvc','plomberie','electricite','maintenance'].includes(f.sector)) { intents.push('logiciel / gestion BTP'); evidence.push('verticale technique'); }
  if(f.region === 'Île-de-France') { intents.push('fournisseurs / prestataires locaux'); evidence.push('zone IDF'); }
  const confidenceScore = Math.min(95, 35 + evidence.length * 12 + (f.event_type==='attribution'?12:0) + (f.amount_eur>=500000?10:0));
  return { intents:[...new Set(intents)].slice(0,5), confidence:confidenceScore, evidence, caveat:'Hypothèse commerciale : le signal indique un besoin potentiel, pas un besoin confirmé.' };
}

function partnerMatches(f, intents){
  const matches=[];
  if(intents.some(x=>x.includes('logiciel'))) matches.push({category:'SaaS BTP',reason:'gestion opérationnelle potentiellement pertinente',priority:3});
  if(intents.some(x=>x.includes('recrutement'))) matches.push({category:'RH / staffing',reason:'besoin potentiel de capacité',priority:3});
  if(intents.some(x=>x.includes('financement'))) matches.push({category:'financement B2B',reason:'contrat significatif pouvant créer un besoin de trésorerie',priority:2});
  if(intents.some(x=>x.includes('sous-traitance'))) matches.push({category:'réseau de sous-traitants',reason:'contrat attribué et capacité à absorber',priority:3});
  if(intents.some(x=>x.includes('fournisseurs'))) matches.push({category:'fournisseurs / équipements',reason:'activité locale ciblée',priority:2});
  return matches.sort((a,b)=>b.priority-a.priority);
}

function normalizeDecp(r){
  return {
    idweb: first(r,['uid','id','marche_id']) || first(r,['idweb']),
    nature: 'Attribution DECP',
    objet: first(r,['objet','objet_du_marche','description']),
    code_departement: first(r,['code_departement','acheteur_code_departement']),
    montant: first(r,['montant','montant_ht']),
    dureeMois: first(r,['dureeMois','duree_mois']),
    titulaire_nom: first(r,['titulaire_nom','titulaire_denomination']),
    titulaire_siret: first(r,['titulaire_siret']),
    acheteur_nom: first(r,['acheteur_nom','acheteur_nom_officiel']),
    acheteur_id: first(r,['acheteur_id']),
    dateNotification: first(r,['dateNotification','date_notification']),
    datePublicationDonnees: first(r,['datePublicationDonnees','date_publication_donnees'])
  };
}

function build(records, source='BOAMP'){
  const now = new Date().toISOString();
  return records.map((r,i)=>{
    const q = score(r);
    if(q.score < 50) return null;
    const idweb = str(first(r,['idweb','id','filename'])) || String(i+1);
    const intent = inferIntent(q.facts);
    const matches = partnerMatches(q.facts,intent.intents);
    return {
      id:`trigora-${idweb.replace(/[^a-zA-Z0-9_-]/g,'-')}`,
      detected_at:now,
      score:q.score,
      confidence:q.confidence,
      company:q.facts.winner,
      buyer:q.facts.buyer,
      siret:str(first(r,['titulaire_siret','siret','contractor_siret','siren'])) || null,
      title:str(first(r,['objet','object','title','intitule','description'])) || 'Marché public',
      published_at:str(first(r,['dateparution','date_publication','date'])) || null,
      facts:q.facts,
      intent,
      match:{recommended:matches.slice(0,3)},
      monetization:{status:'not_connected',expected_revenue_eur:null},
      source:{system:source,dataset:source==='DECP'?'decp_augmente':'boamp_piamp_concentrateur',idweb:idweb,url:str(first(r,['url_avis','safe_url_avis','url'])) || null,source_type:'open_public_data'}
    };
  }).filter(Boolean).sort((a,b)=>b.score-a.score);
}

function fetchJson(limit=100){
  return new Promise((resolve,reject)=>{
    const params = new URLSearchParams({limit:String(limit),order_by:'dateparution desc'});
    const url = BOAMP+'?'+params.toString();
    const req = https.get(url,{headers:{'User-Agent':'TRIGORA/1.1'}},res=>{
      let body=''; res.on('data',d=>body+=d); res.on('end',()=>{
        if(res.statusCode>=200&&res.statusCode<300){ try { resolve(JSON.parse(body).results || []); } catch(e){ reject(new Error('BOAMP invalid JSON')); } }
        else reject(new Error('BOAMP HTTP '+res.statusCode));
      });
    });
    req.on('error',reject); req.setTimeout(15000,()=>req.destroy(new Error('BOAMP timeout')));
  });
}

module.exports = async (req,res)=>{
  try{
    const limit = Math.min(Math.max(Number(req.query.limit||100),1),100);
    const records = await fetchJson(limit);
    const signals = build(records, 'BOAMP');
    res.statusCode=200;
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=600');
    res.end(JSON.stringify({generated_at:new Date().toISOString(),source:'BOAMP',source_records:records.length,signal_count:signals.length,signals}));
  }catch(e){
    res.statusCode=502; res.setHeader('Content-Type','application/json; charset=utf-8');
    res.end(JSON.stringify({error:'upstream_unavailable',message:e.message}));
  }
};

module.exports._test = {build,score,inferIntent,partnerMatches,normalizeDecp};
