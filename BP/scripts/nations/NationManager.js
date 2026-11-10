import { world } from '@minecraft/server';

export const NATIONS = {
 'osmanli': {
 name: 'Osmanlı İmparatorluğu',
 color: '§cKırmızı-Yeşil',
 unit: 'Yeniçeri & Sipahi',
 relic: 'Fatih Kılıcı',
 perk: 'Pazar ve gümrük vergilerinde +%15 gelir artışı.'
 },
 'roma': {
 name: 'Roma İmparatorluğu',
 color: '§4Kızıl-Altın',
 unit: 'Lejyoner (Kalkan Duvarı)',
 relic: 'Sezar Gladyusu',
 perk: 'Asker eğitim maliyetlerinde -%10 indirim.'
 },
 'britanya': {
 name: 'Britanya İmparatorluğu',
 color: '§1Lacivert-Beyaz',
 unit: 'Uzun Yaylılar (Longbowmen)',
 relic: 'Excalibur',
 perk: 'Kule savunmasında menzil ve isabet artışı.'
 },
 'rusya': {
 name: 'Sovyetler / Rusya',
 color: '§cKızıl Bayrak',
 unit: 'Kızıl Muhafız',
 relic: 'Kuzey Baltası',
 perk: 'Soğuk biyomlarda askerler yorulmaz/hasar almaz.'
 },
 'fransa': {
 name: 'Fransa Krallığı',
 color: '§9Mavi-Altın Zambak',
 unit: 'Şövalye (Paladin Süvari)',
 relic: 'Şövalye Sancağı',
 perk: 'Tarım ve ziyafet verimliliğinde +%20 artış.'
 },
 'cin': {
 name: 'Çin İmparatorluğu',
 color: '§eİmparatorluk Sarısı',
 unit: 'Chu-Ko-Nu (Seri Kundaklı Yaycı)',
 relic: 'Ejder Mührü',
 perk: 'Surlar ve binalar +%25 daha dayanıklıdır.'
 },
 'ispanya': {
 name: 'İspanya İmparatorluğu',
 color: '§6Sarı-Kırmızı',
 unit: 'Fatih (Conquistador Süvari)',
 relic: 'Altın Haç',
 perk: 'Maden çıkarımında +%20 ekstra altın cevheri.'
 },
 'mogol': {
 name: 'Moğol İmparatorluğu',
 color: '§3Bozkır Mavisi',
 unit: 'Keshik (Atlı Okçu)',
 relic: 'Cengiz Han Yayı',
 perk: 'Süvarilerde %30 hız ve düşük erzak masrafı.'
 },
 'sparta': {
 name: 'Sparta Krallığı',
 color: '§8Koyu Bordo',
 unit: 'Spartalı Hoplit',
 relic: 'Leonidas Kargısı',
 perk: 'Askerler asla geri çekilmez; canı azaldıkça hasarı artar.'
 }
};

export class NationManager {
 static getPlayerNation(player) {
 try {
 return player.getDynamicProperty('imperium:nation') || null;
 } catch (e) {
 return null;
 }
 }

 static setPlayerNation(player, nationKey) {
 player.setDynamicProperty('imperium:nation', nationKey);
 }
}
