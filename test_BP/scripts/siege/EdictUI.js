import { ActionFormData } from '@minecraft/server-ui';
import { EconomyEngine } from '../economy/EconomyEngine.js';
import { PolygonClaimEngine } from '../territory/PolygonClaimEngine.js';

export class EdictUI {
 static openThroneMenu(player) {
 const k = PolygonClaimEngine.getPlayerKingdom(player.id);
 const wallet = EconomyEngine.getPlayerMoney(player);
 const activeEdict = player.getDynamicProperty('imperium:active_edict') || 'Yok';

 const form = new ActionFormData()
 .title('§l[KRALIYET TAHTI & FERMANLAR]')
 .body(
 `Hazine: §6${wallet} Bakir Dinar §r| Aktif Ferman: §e${activeEdict}\n` +
 `Halk Mutlulugu: §a%${k ? k.happiness : 85} §r| Vergi Orani: §b%${k ? k.taxRate : 15}\n` +
 `────────────────────────────────\n` +
 `Tahtinizdan yayinlamak istediginiz imparatorluk fermanini secin:`
 )
 .button('[SIKIYONETIM FERMANI] (100 Bakir)\nAskerlere +Direnc & Guc verir, haydut baskinlarini %75 azaltir (-10 Mutluluk)')
 .button('[HASAT SEFERBERLIGI] (80 Bakir)\nKoy ambar uretimini 3 katina cikarir, tarlalari bereketlendirir')
 .button('[BUYUK SENLIK FERMANI] (120 Bakir)\nHalk mutlulugunu ve moralini %100 yapar, bayram vergisi toplar')
 .button('[VERGI REFORMU & IMAR] (60 Bakir)\nVergiyi %5e indirir, koye 2 gocmen usta ceker ve nufusu artirir')
 .button('[Geri / Kapat]');

 form.show(player).then((res) => {
 if (res.canceled || res.selection === 4) return;

 const allK = PolygonClaimEngine.getAllKingdoms();
 const myK = allK[player.id];

 if (res.selection === 0) {
 if (!EconomyEngine.deductMoney(player, 100)) {
 player.sendMessage('§c[Taht] Sikiyonetim Fermani icin 100 Bakir Dinar gerekiyor!');
 return;
 }
 player.setDynamicProperty('imperium:active_edict', 'martial_law');
 player.setDynamicProperty('imperium:edict_time', Date.now());
 if (myK) {
 myK.happiness = Math.max(30, (myK.happiness || 85) - 10);
 PolygonClaimEngine.saveKingdoms(allK);
 }
 const soldiers = player.dimension.getEntities({ location: player.location, maxDistance: 64, families: ['soldier'] });
 for (const s of soldiers) {
 s.addEffect('resistance', 6000, { amplifier: 1, showParticles: false });
 s.addEffect('strength', 6000, { amplifier: 0, showParticles: false });
 }
 player.sendMessage('§4[Ferman] Sikiyonetim ilan edildi! Askerler mevzilendi, asayis berkemal!');
 } else if (res.selection === 1) {
 if (!EconomyEngine.deductMoney(player, 80)) {
 player.sendMessage('§c[Taht] Hasat Seferberligi icin 80 Bakir Dinar gerekiyor!');
 return;
 }
 player.setDynamicProperty('imperium:active_edict', 'harvest');
 player.setDynamicProperty('imperium:edict_time', Date.now());
 try {
 player.dimension.runCommand(`particle minecraft:villager_happy ${Math.round(player.location.x)} ${Math.round(player.location.y + 1)} ${Math.round(player.location.z)}`);
 } catch (e) {}
 player.sendMessage('§2[Ferman] Hasat Seferberligi baslatildi! Tarlalar gece gunduz ekiliyor.');
 } else if (res.selection === 2) {
 if (!EconomyEngine.deductMoney(player, 120)) {
 player.sendMessage('§c[Taht] Buyuk Senlik Fermani icin 120 Bakir Dinar gerekiyor!');
 return;
 }
 player.setDynamicProperty('imperium:active_edict', 'festival');
 player.setDynamicProperty('imperium:edict_time', Date.now());
 if (myK) {
 myK.happiness = 100;
 PolygonClaimEngine.saveKingdoms(allK);
 }
 const fin = EconomyEngine.getFinance(player.id);
 fin.morale = 100;
 fin.bankBalance += 40;
 EconomyEngine.saveFinance(player.id, fin);
 try {
 player.dimension.runCommand(`particle minecraft:totem_particle ${Math.round(player.location.x)} ${Math.round(player.location.y + 2)} ${Math.round(player.location.z)}`);
 } catch (e) {}
 player.sendMessage('§6[Ferman] Buyuk Zafer Senligi basladi! Halk bayram ediyor, moral %100!');
 } else if (res.selection === 3) {
 if (!EconomyEngine.deductMoney(player, 60)) {
 player.sendMessage('§c[Taht] Vergi Reformu icin 60 Bakir Dinar gerekiyor!');
 return;
 }
 player.setDynamicProperty('imperium:active_edict', 'tax_relief');
 player.setDynamicProperty('imperium:edict_time', Date.now());
 if (myK) {
 myK.taxRate = 5;
 myK.population = (myK.population || 5) + 2;
 PolygonClaimEngine.saveKingdoms(allK);
 }
 player.sendMessage('§b[Ferman] Vergi indirimi ilan edildi! Komsu sehirlerden 2 usta koye goc etti.');
 }
 });
 }
}
