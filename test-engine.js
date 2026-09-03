const {build} = require('./api/signals')._test;
const fixture = [
 {idweb:'A1',nature:'Avis d’attribution',objet:'Maintenance CVC et chauffage de bâtiments publics à Versailles',code_departement:'78',montant:1800000,duree:'36 mois',titulaire:'Entreprise Alpha',nomacheteur:'Ville de Versailles'},
 {idweb:'A2',nature:'Avis de marché',objet:'Travaux de plomberie sanitaire à Paris',code_departement:'75',montant:750000,duree:'24 mois',titulaire:'Entreprise Beta',nomacheteur:'Ville de Paris'},
 {idweb:'A3',nature:'Avis de marché',objet:'Fourniture de papier administratif',code_departement:'59',montant:10000,nomacheteur:'Ville X'}
];
const out=build(fixture);
if(out.length!==2) throw new Error(`expected 2 signals, got ${out.length}`);
if(out[0].intent.intents.length===0) throw new Error('missing intent inference');
if(out[0].match.recommended.length===0) throw new Error('missing partner match');
console.log(JSON.stringify(out,null,2));
