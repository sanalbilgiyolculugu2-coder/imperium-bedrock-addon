import { MilitaryController } from '../military/MilitaryController.js';
import { ActionFormData } from '@minecraft/server-ui';
import { system } from '@minecraft/server';
import { EconomyEngine } from '../economy/EconomyEngine.js';
import { NationManager } from '../nations/NationManager.js';
import { PolygonClaimEngine } from '../territory/PolygonClaimEngine.js';
import { FlagUI } from '../territory/FlagUI.js';
import { BlueprintBuilder } from '../territory/BlueprintBuilder.js';

export const BARRACKS_UNITS = [
 { id: 'megamod:peasant_militia', name: 'Kademe 0: Koylu Milis', cost: 25, timeSec: 3, reqTier: 0, reqLabel: 'Baslangicta Acik' },
 { id: 'megamod:regular_footman', name: 'Kademe 1: Duzenli Kilicli Piyade', cost: 55, timeSec: 5, reqTier: 1, reqLabel: 'Koy Kurulumu (3 Bayrak)' },
 { id: 'megamod:regular_archer', name: 'Kademe 1: Acemi Okcu', cost: 60, timeSec: 5, reqTier: 1, reqLabel: 'Koy Kurulumu (3 Bayrak)' },
 { id: 'megamod:shield_infantry', name: 'Kademe 2: Agir Kalkanli Piyade', cost: 95, timeSec: 7, reqTier: 2, reqLabel: 'Askeri Kisla Binasi' },
 { id: 'megamod:heavy_crossbowman', name: 'Kademe 2: Zirh Delen Kundakli Yayci', cost: 110, timeSec: 8, reqTier: 2, reqLabel: 'Askeri Kisla Binasi' },
 { id: 'megamod:combat_medic', name: 'Kademe 2: Ordu Sihhiye Hekimi (Oto-Tedavi)', cost: 190, timeSec: 8, reqTier: 2, reqLabel: 'Askeri Kisla Binasi' },
 { id: 'megamod:supply_wagon', name: 'Kademe 2: Ordu Erzak Arabasi', cost: 180, timeSec: 8, reqTier: 2, reqLabel: 'Askeri Kisla Binasi' },
 { id: 'megamod:fire_brigade_soldier', name: 'Kademe 2: Sehir Tulumbacisi', cost: 150, timeSec: 7, reqTier: 2, reqLabel: 'Askeri Kisla Binasi' },
 { id: 'megamod:heavy_cavalry', name: 'Kademe 3: Agir Zirhli Suvari', cost: 160, timeSec: 10, reqTier: 3, reqLabel: 'Savunma Kulesi / Kale Suru' },
 { id: 'SPECIAL_INFANTRY', name: 'Kademe 3: Ulusa Ozel Elit Piyade', cost: 210, timeSec: 11, reqTier: 3, reqLabel: 'Savunma Kulesi / Kale Suru' },
 { id: 'megamod:unit_banner_bearer', name: 'Kademe 3: Birlik Sancaktari & Cavus', cost: 240, timeSec: 10, reqTier: 3, reqLabel: 'Savunma Kulesi / Kale Suru' },
 { id: 'megamod:battering_ram', name: 'Kademe 3: Islak Deri Catili Kocbasi', cost: 350, timeSec: 12, reqTier: 3, reqLabel: 'Savunma Kulesi / Kale Suru' },
 { id: 'megamod:sapper_engineer', name: 'Kademe 3: Lagimci Kusatma Muhendisi', cost: 220, timeSec: 10, reqTier: 3, reqLabel: 'Savunma Kulesi / Kale Suru' },
 { id: 'SPECIAL_CAVALRY', name: 'Kademe 4: Ulusa Ozel Elit Suvari', cost: 260, timeSec: 12, reqTier: 4, reqLabel: 'Topcu Dokumhanesi' },
 { id: 'megamod:catapult', name: 'Kademe 4: Agir Mancinik', cost: 420, timeSec: 14, reqTier: 4, reqLabel: 'Topcu Dokumhanesi' },
 { id: 'megamod:imperial_cannon', name: 'Kademe 4: Osmanli Sahi Topu Bataryasi', cost: 520, timeSec: 15, reqTier: 4, reqLabel: 'Topcu Dokumhanesi' },
 { id: 'megamod:war_elephant', name: 'Kademe 4: Kuleli Savas Fili (Howdah)', cost: 600, timeSec: 16, reqTier: 4, reqLabel: 'Topcu Dokumhanesi' },
 { id: 'megamod:camel_archer', name: 'Kademe 4: Zirhli Deve Okcusu', cost: 230, timeSec: 11, reqTier: 4, reqLabel: 'Topcu Dokumhanesi' }
];

export class BarracksUI {
 static MAX_ACTIVE_SOLDIERS = 50;

 static resolveSpecialUnit(nation, isCavalry) {
 const mapInfantry = {
 'osmanli': 'megamod:ottoman_janissary',
 'roma': 'megamod:roman_legionary',
 'britanya': 'megamod:british_longbowman',
 'rusya': 'megamod:soviet_red_guard',
 'fransa': 'megamod:shield_infantry',
 'cin': 'megamod:chinese_chukonu',
 'ispanya': 'megamod:shield_infantry',
 'mogol': 'megamod:regular_archer',
 'sparta': 'megamod:spartan_hoplite'
 };
 const mapCavalry = {
 'osmanli': 'megamod:ottoman_sipahi',
 'roma': 'megamod:heavy_cavalry',
 'britanya': 'megamod:heavy_cavalry',
 'rusya': 'megamod:heavy_cavalry',
 'fransa': 'megamod:french_paladin',
 'cin': 'megamod:heavy_cavalry',
 'ispanya': 'megamod:spanish_conquistador',
 'mogol': 'megamod:mongol_keshik',
 'sparta': 'megamod:heavy_cavalry'
 };
 return isCavalry ? (mapCavalry[nation] || 'megamod:heavy_cavalry') : (mapInfantry[nation] || 'megamod:ottoman_janissary');
 }

 static getPlayerUnlockedTier(player) {
 const k = PolygonClaimEngine.getPlayerKingdom(player.id);
 if (!k || !k.flags || k.flags.length < 3) return 0;
 let tier = 1;
 if (k.hasBarracks) tier = 2;
 if (k.hasCastle) tier = 3;
 if (k.hasSiege) tier = 4;
 return tier;
 }

 static openBarracksMenu(player) {
 const nation = NationManager.getPlayerNation(player) || 'osmanli';
 const discount = nation === 'roma' ? 0.9 : 1.0;
 const money = EconomyEngine.getPlayerMoney(player);
 const unlockedTier = this.getPlayerUnlockedTier(player);

 const activeSoldiers = player.dimension.getEntities({
 location: player.location,
 maxDistance: 64,
 families: ['soldier']
 }).length;

 const tierDescriptions = [
 '0 - Gocebe (Sadece Milis -> Once 3 Bayrak ile Koy kurun)',
 '1 - Koy Kuruldu (Piyade & Okcu Acik -> Kisla insa edin)',
 '2 - Askeri Kisla Aktif (Agir Piyade & Arbalet Acik)',
 '3 - Kale Garnizonu Aktif (Suvari & Elit Birlikler Acik)',
 '4 - Imparatorluk Ordusu (Sahi Topu, Fil ve Mancinik Acik)'
 ];

 const form = new ActionFormData()
 .title('§l[KISLA & ASKER EGITIMI]')
 .body(
 `Hazine: §6${money} Bakir Dinar §r| Ordu: §a${activeSoldiers}/${this.MAX_ACTIVE_SOLDIERS}\n` +
 `Mevcut Askeri Kademe: §e${tierDescriptions[unlockedTier]}\n` +
 `────────────────────────────────\n` +
 `Egitmek istediginiz birligi secin:`
 );

 for (const u of BARRACKS_UNITS) {
 const finalCost = Math.round(u.cost * discount);
 const isUnlocked = unlockedTier >= u.reqTier;
 if (isUnlocked) {
 form.button(`[${u.name}]\nBedel: ${finalCost} Bakir | Sure: ${u.timeSec}sn`, 'textures/items/ottoman_yatagan');
 } else {
 form.button(`[KILITLI] ${u.name}\nGereksinim: ${u.reqLabel}`, 'textures/items/claim_flag');
 }
 }

 form.show(player).then((res) => {
 if (res.canceled) return;
 const chosen = BARRACKS_UNITS[res.selection];
 if (!chosen) return;

 if (unlockedTier < chosen.reqTier) {
 player.sendMessage(`§c[Kisla] '${chosen.name}' birligini acmak icin once §e${chosen.reqLabel} §ctamamlanmalidir!`);
 if (chosen.reqTier === 1) {
 FlagUI.openFlagMenu(player);
 } else {
 BlueprintBuilder.openBlueprintMenu(player);
 }
 return;
 }

 const finalCost = Math.round(chosen.cost * discount);
 if (!EconomyEngine.deductMoney(player, finalCost)) {
 player.sendMessage(`§c[Kisla] Yetersiz hazine! Gereken: ${finalCost} Bakir Dinar.`);
 return;
 }

 let entityId = chosen.id;
 if (entityId === 'SPECIAL_INFANTRY') entityId = this.resolveSpecialUnit(nation, false);
 if (entityId === 'SPECIAL_CAVALRY') entityId = this.resolveSpecialUnit(nation, true);

 player.sendMessage(`§e[Kisla] ${chosen.name} talime basladi (${chosen.timeSec} saniye)...`);

 system.runTimeout(() => {
 const k = PolygonClaimEngine.getPlayerKingdom(player.id);
 let spawnPos = player.location;
 if (k && k.barracksPos) {
 spawnPos = { x: k.barracksPos.x, y: k.barracksPos.y + 1, z: k.barracksPos.z };
 } else if (k && k.flags && k.flags.length > 0) {
 spawnPos = { x: k.flags[0].x, y: k.flags[0].y + 1, z: k.flags[0].z };
 } else {
 const pLoc = player.location;
 spawnPos = { x: pLoc.x + 4, y: pLoc.y, z: pLoc.z + 4 };
 }

 try {
 const spawned = player.dimension.spawnEntity(entityId, spawnPos);
 spawned.nameTag = `§6[Muhafiz] ${chosen.name}`;
 MilitaryController.bindSoldierToCommander(spawned, player, 'follow');
 player.sendMessage(`§a[Kisla] ${chosen.name} egitimini tamamladi ve goreve basladi!`);
 } catch (e) {
 player.sendMessage(`§a[Kisla] ${chosen.name} ordu saflarina katildi.`);
 }
 }, chosen.timeSec * 20);
 });
 }
}
