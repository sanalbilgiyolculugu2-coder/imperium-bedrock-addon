import { world } from '@minecraft/server';

export const AI_KINGDOMS = [
 { id: 'npc_rome', name: 'Roma Lejyonu', personality: 'Agresif (Warmonger)', desc: 'Askeri gucu sever, pakt olmazsa koye oncu akinci yollar.' },
 { id: 'npc_ottoman', name: 'Osmanli Beyligi', personality: 'Ticari (Merchant)', desc: 'Ticaret paktinda pazar fiyatlarinda ekstra indirim sunar.' },
 { id: 'npc_britain', name: 'Britanya Kralligi', personality: 'Kibirli (Arrogant)', desc: 'Guclu kaleniz varsa barisa sadik kalir.' },
 { id: 'npc_france', name: 'Fransiz Dukaligi', personality: 'Bariscil (Builder)', desc: 'Tarisal uretim ve ortak ambar antlasmasini sever.' },
 { id: 'npc_mongol', name: 'Mogol Hanligi', personality: 'Gocer (Raider)', desc: 'Baris yapilmazsa kervan yollarini basar.' },
 { id: 'npc_sparta', name: 'Sparta Sehir Devleti', personality: 'Savaski (Defender)', desc: 'Karsilikli savunma paktina sadiktir.' }
];

export class DiplomacyManager {
 static PROPERTY_KEY = 'imperium:diplomacy_status';

 static getPacts() {
 try {
 const raw = world.getDynamicProperty(this.PROPERTY_KEY);
 if (raw) return JSON.parse(raw);
 } catch (e) {}
 return {};
 }

 static savePacts(pacts) {
 try {
 world.setDynamicProperty(this.PROPERTY_KEY, JSON.stringify(pacts));
 } catch (e) {}
 }

 static setRelation(kingdomId, relationType) {
 const pacts = this.getPacts();
 pacts[kingdomId] = relationType;
 this.savePacts(pacts);
 }

 static hasTradePact() {
 const pacts = this.getPacts();
 return Object.values(pacts).some(p => p.includes('Ticaret') || p.includes('trade'));
 }

 static getVassalCount() {
 const pacts = this.getPacts();
 return Object.values(pacts).filter(p => p.includes('Vasal') || p.includes('vassal')).length;
 }
}
