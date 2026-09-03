# TRIGORA V1

**Event → Intent → Revenue**

B2B web application / event-intelligence engine. Initial wedge: public procurement signals for BTP in Île-de-France.

## Current status
- Static product surface ready.
- Real BOAMP connector implemented as a Vercel serverless function.
- Deterministic scoring keeps facts separate from inferences.
- No user accounts, passwords, card data, or personal-contact database in V1.
- Vercel/Supabase can remain free until an actual bottleneck appears.

## Brand
TRIGORA is the construction name. It still requires formal trademark/domain clearance before public commercial use; no web search can guarantee 100% legal availability.

## Next production step
Deploy this directory as a Vercel project. Then add storage and a scheduled ingestion process only after the first live signal flow is validated.

## Signal Engine V1

Le moteur transforme chaque annonce qualifiée en :
- score de pertinence ;
- niveau de confiance ;
- faits structurés ;
- intentions commerciales possibles ;
- catégories de partenaires recommandées ;
- avertissement explicite que l'intention est une hypothèse.

L'interface charge les signaux depuis `/api/signals` et n'utilise plus uniquement les fixtures de démonstration.
