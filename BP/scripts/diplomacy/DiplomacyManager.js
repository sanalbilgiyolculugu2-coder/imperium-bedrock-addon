import { world } from '@minecraft/server';

export const AI_KINGDOMS = [
 { id: 'npc_rome', name: 'Roma Lejyonu', personality: 'Agresif (Warmonger)', desc: 'Sürekli ordu basar, sınır komşularını tehdit eder.' },
 { id: 'npc_ottoman', name: 'Osmanlı Beyliği', personality: 'Kurnaz (Shrewd)', desc: 'Ticareti ve zayıf anınızda arkadan vurmayı sever.' },
 { id: 'npc_britain', name: 'Britanya Krallığı', personality: 'Kibirli (Arrogant)', desc: 'Asla teslim olmaz, barış tekliflerini aşağılar.' },
 { id: 'npc_france', name: 'Fransız Dükalığı', personality: 'Barışçıl (Builder)', desc: 'Saldırmazlık paktına sadıktır, tarıma odaklanır.' },
 { id: 'npc_mongol', name: 'Moğol Hanlığı', personality: 'Sinsi (Espionage)', desc: 'Casus sızdırmayı ve kervan yollarını kesmeyi sever.' },
 { id: 'npc_sparta', name: 'Sparta Şehir Devleti', personality: 'Yalaka (Submissive)', desc: 'Güçlü ordunuz varsa hemen haraç ve vasallık teklif eder.' }
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
 world.setDynamicProperty(this.PROPERTY_KEY, JSON.stringify(pacts));
 }

 static setRelation(kingdomId, relationType) {
 const pacts = this.getPacts();
 pacts[kingdomId] = relationType; // 'war', 'peace', 'vassal', 'trade'
 this.savePacts(pacts);
 }
}
