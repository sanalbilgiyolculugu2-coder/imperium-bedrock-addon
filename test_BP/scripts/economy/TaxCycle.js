import { world, system } from '@minecraft/server';
import { EconomyEngine } from './EconomyEngine.js';
import { PolygonClaimEngine } from '../territory/PolygonClaimEngine.js';
import { DiplomacyManager } from '../diplomacy/DiplomacyManager.js';
import { NationManager } from '../nations/NationManager.js';

export class TaxCycle {
 static LAST_TAX_DAY_KEY = 'imperium:last_tax_day';

 static init() {
 system.runInterval(() => {
 EconomyEngine.normalizeMarket();
 this.processCitizenProduction();
 }, 2400);

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
 const activeEdict = player.getDynamicProperty('imperium:active_edict');
 const rationBoost = activeEdict === 'harvest' ? 15 : 5;
 const nation = NationManager.getPlayerNation(player);
 const extraRations = nation === 'fransa' ? 4 : 0;

 fin.granaryRations = Math.min(500, fin.granaryRations + rationBoost + extraRations);
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
 const nation = NationManager.getPlayerNation(player);

 let taxRevenue = Math.max(25, Math.round((area * 0.2) * (taxRate / 15)));
 if (nation === 'osmanli') {
 taxRevenue = Math.round(taxRevenue * 1.15); // Ottoman +15% tax perk
 }

 // Vassal tributary income
 const vassals = DiplomacyManager.getVassalCount();
 const vassalIncome = vassals * 75;
 taxRevenue += vassalIncome;

 const soldiers = player.dimension.getEntities({ location: player.location, maxDistance: 80, families: ['soldier'] });
 const upkeep = soldiers.length * 4;

 fin.bankBalance += taxRevenue;
 if (fin.bankBalance >= upkeep) {
 fin.bankBalance -= upkeep;
 const vassalNote = vassalIncome > 0 ? ` (+${vassalIncome} Vasal Haraci)` : '';
 player.sendMessage(`§6[Safak Bilancosu] §a+${taxRevenue} Bakir Gelir${vassalNote} §7| §c-${upkeep} Bakir Ordu Maasi §7(Kasa: ${fin.bankBalance})`);
 } else {
 player.sendMessage('§4[ISYAN UYARISI!] Hazine bosaldi ve askerlerin maasi odenemedi! Askerlerden firar edenler oldu!');
 if (soldiers.length > 0) {
 const rebel = soldiers[0];
 const pos = rebel.location;
 rebel.remove();
 try {
 player.dimension.spawnEntity('megamod:bandit_gang_member', pos);
 } catch (e) {}
 }
 }

 if (taxRate > 35 && Math.random() < 0.5) {
 player.sendMessage('§4[KOYLU ISYANI!] Vergiler %35 uzerinde oldugu icin koyde isyan cikti!');
 try {
 player.dimension.spawnEntity('megamod:bandit_gang_member', player.location);
 } catch (e) {}
 }

 EconomyEngine.saveFinance(player.id, fin);
 }
 }
}
