import { world, system } from '@minecraft/server';
import { EconomyEngine } from './EconomyEngine.js';
import { PolygonClaimEngine } from '../territory/PolygonClaimEngine.js';

export class TaxCycle {
 static LAST_TAX_DAY_KEY = 'imperium:last_tax_day';

 static init() {
 // Her 2 dakikada bir (2400 tick) piyasa arz-talep dengelemesi
 system.runInterval(() => {
 EconomyEngine.normalizeMarket();
 this.processCitizenProduction();
 }, 2400);

 // Her 200 tick (10 saniye): Oyun içi günü kontrol et!
 // Oyuncu 5 dakika oynayıp çıksa bile yeni gün geldiğinde vergi/maaş döngüsü tam zamanında çalışır.
 system.runInterval(() => {
 this.checkAndProcessDailyCycle();
 }, 200);
 }

 static checkAndProcessDailyCycle() {
 try {
 const currentDay = world.getDay ? world.getDay() : Math.floor(world.getTimeOfDay ? world.getTimeOfDay() / 24000 : 0);
 const lastRecordedDay = world.getDynamicProperty(this.LAST_TAX_DAY_KEY) || 0;

 if (currentDay > lastRecordedDay) {
 world.setDynamicProperty(this.LAST_TAX_DAY_KEY, currentDay);
 this.collectTaxesAndPayUpkeep();
 }
 } catch (e) {}
 }

 static processCitizenProduction() {
 for (const player of world.getAllPlayers()) {
 const fin = EconomyEngine.getFinance(player.id);
 fin.granaryRations = Math.min(500, fin.granaryRations + 5);
 fin.ironStock = Math.min(200, fin.ironStock + 2);
 EconomyEngine.saveFinance(player.id, fin);
 }
 }

 static collectTaxesAndPayUpkeep() {
 for (const player of world.getAllPlayers()) {
 const k = PolygonClaimEngine.getPlayerKingdom(player.id);
 const fin = EconomyEngine.getFinance(player.id);
 const area = k ? PolygonClaimEngine.calculatePolygonArea(k.flags) : 0;
 const taxRate = k ? (k.taxRate || 15) : 15;

 const taxRevenue = Math.max(25, Math.round((area * 0.2) * (taxRate / 15)));
 const soldiers = player.dimension.getEntities({ location: player.location, maxDistance: 80, families: ['soldier'] });
 const upkeep = soldiers.length * 4;

 fin.bankBalance += taxRevenue;
 if (fin.bankBalance >= upkeep) {
 fin.bankBalance -= upkeep;
 player.sendMessage(`§6[Şafak Bilançosu] §a+${taxRevenue} Bakır Vergi Geliri §7| §c-${upkeep} Bakır Ordu Maaşı §7(Kasa: ${fin.bankBalance})`);
 } else {
 player.sendMessage('§4[İSYAN UYARISI!] §cHazine boşaldı ve askerlerin maaşı ödenemedi! Bazı askerler firar edip hayduta dönüştü!');
 if (soldiers.length > 0) {
 const rebel = soldiers[0];
 const pos = rebel.location;
 rebel.remove();
 player.dimension.spawnEntity('megamod:bandit_gang_member', pos);
 }
 }

 if (taxRate > 35 && Math.random() < 0.5) {
 player.sendMessage('§4[KÖYLÜ İSYANI!] §cVergiler %35 üzerinde olduğu için öfkeli köylüler tırpanlarla ayaklandı!');
 player.dimension.spawnEntity('megamod:bandit_gang_member', player.location);
 }

 EconomyEngine.saveFinance(player.id, fin);
 }
 }
}
