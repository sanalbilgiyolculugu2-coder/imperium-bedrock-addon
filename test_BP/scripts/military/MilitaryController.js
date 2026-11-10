import { SoldierInteractionUI } from '../ui/SoldierInteractionUI.js';
import { world, system } from '@minecraft/server';
import { ActionFormData } from '@minecraft/server-ui';
import { PolygonClaimEngine } from '../territory/PolygonClaimEngine.js';

export class MilitaryController {
 static activeSquadFilter = {}; // player.id -> 'all' | 'infantry' | 'archer' | 'cavalry'
 static quickOrderIndex = {}; // player.id -> 0 | 1 | 2

 static bindSoldierToCommander(entity, player, stance = 'follow') {
 if (!entity || !player) return;
 try {
 entity.addTag(`owner:${player.id}`);
 entity.removeTag('stance:hold');
 entity.removeTag('stance:charge');
 entity.removeTag('stance:follow');
 entity.removeTag('stance:patrol_village');
 entity.addTag(`stance:${stance}`);

 const tameComp = entity.getComponent('minecraft:tameable');
 if (tameComp && typeof tameComp.tame === 'function') {
 tameComp.tame(player);
 }
 if (stance === 'follow') {
 entity.triggerEvent('imperium:order_follow');
 } else if (stance === 'hold') {
 entity.triggerEvent('imperium:order_hold_line');
 } else if (stance === 'charge') {
 entity.triggerEvent('imperium:order_charge');
 } else if (stance === 'patrol_village') {
 entity.triggerEvent('imperium:order_patrol');
 }
 } catch (e) {}
 }

 static initEscortLoop() {
 system.runInterval(() => {
 for (const player of world.getAllPlayers()) {
 try {
 const dim = player.dimension;
 const pLoc = player.location;
 const soldiers = dim.getEntities({
 location: pLoc,
 maxDistance: 64,
 families: ['soldier']
 });
 const k = PolygonClaimEngine.getPlayerKingdom(player.id);

 for (const unit of soldiers) {
 const tags = unit.getTags ? unit.getTags() : [];
 if (!tags.some(t => t.startsWith('owner:'))) {
 this.bindSoldierToCommander(unit, player, 'follow');
 continue;
 }
 const isOwner = tags.includes(`owner:${player.id}`);
 if (!isOwner) continue;

 const uLoc = unit.location;
 const dist = Math.hypot(pLoc.x - uLoc.x, pLoc.z - uLoc.z);

 if (tags.includes('stance:follow')) {
 if (dist > 18 && dist <= 50) {
 unit.addEffect('speed', 60, { amplifier: 1, showParticles: false });
 } else if (dist > 55) {
 const view = (typeof player.getViewDirection === 'function') ? player.getViewDirection() : { x: 0, z: 1 };
 try {
 unit.teleport({
 x: pLoc.x - view.x * 8.0,
 y: pLoc.y,
 z: pLoc.z - view.z * 8.0
 });
 } catch (e) {}
 }
 } else if (tags.includes('stance:patrol_village')) {
 if (k && k.flags && k.flags.length >= 3) {
 const cx = (k.flags[0].x + k.flags[1].x + k.flags[2].x) / 3;
 const cz = (k.flags[0].z + k.flags[1].z + k.flags[2].z) / 3;
 const distToCenter = Math.hypot(uLoc.x - cx, uLoc.z - cz);
 if (distToCenter > 40) {
 try {
 unit.teleport({ x: cx + (Math.random() * 6 - 3), y: k.flags[0].y, z: cz + (Math.random() * 6 - 3) });
 } catch (e) {}
 }
 }
 }
 }
 } catch (e) {}
 }
 }, 40);
 }

 static handleWarHornUse(player) {
 if (player.isSneaking) {
 this.cycleQuickOrder(player);
 } else {
 this.openWarHornMenu(player);
 }
 }

 static cycleQuickOrder(player) {
 const idx = (this.quickOrderIndex[player.id] || 0);
 const nextIdx = (idx + 1) % 3;
 this.quickOrderIndex[player.id] = nextIdx;

 const soldiers = player.dimension.getEntities({
 location: player.location,
 maxDistance: 48,
 families: ['soldier']
 });

 if (nextIdx === 0) {
 for (const s of soldiers) this.bindSoldierToCommander(s, player, 'follow');
 player.sendMessage(`§a[Emir] Mesafeli Takip: ${soldiers.length} asker 5-8 blok mesafeden sizi takip ediyor.`);
 } else if (nextIdx === 1) {
 for (const s of soldiers) this.bindSoldierToCommander(s, player, 'hold');
 player.sendMessage(`§e[Emir] Mevzide Bekle: ${soldiers.length} asker mevcut konumunda nobet tutuyor.`);
 } else if (nextIdx === 2) {
 for (const s of soldiers) {
 this.bindSoldierToCommander(s, player, 'charge');
 s.addEffect('speed', 200, { amplifier: 1, showParticles: false });
 }
 player.sendMessage(`§c[Emir] Serbest Taarruz: ${soldiers.length} asker yakindaki dusmanlara hucum ediyor!`);
 }
 }

 static openWarHornMenu(player) {
 const currentFilter = this.activeSquadFilter[player.id] || 'all';
 const filterNames = {
 'all': 'TUM ORDU',
 'infantry': 'SADECE PIYADELER',
 'archer': 'SADECE OKCULAR',
 'cavalry': 'SADECE SUVARILER'
 };

 const familyFilter = currentFilter === 'all' ? 'soldier' : currentFilter;
 const nearbySoldiers = player.dimension.getEntities({
 location: player.location,
 maxDistance: 64,
 families: [familyFilter]
 });

 const form = new ActionFormData()
 .title('§l[ORDU KOMUTA MERKEZI]')
 .body(
 `Secili Birlik: §f${filterNames[currentFilter]} §7(${nearbySoldiers.length} Asker)\n` +
 `Takip Mesafesi: §a5 - 8 Blok (Dogal Yurus & Kosarak Yetisme)\n` +
 `────────────────────────────────\n` +
 `Ordunuza vermek istediginiz emri secin:`
 )
 .button('[BENI MESAFELI TAKIP ET]\nAskerler 5-8m mesafeden yuruyerek takip eder', 'textures/items/campaign_compass')
 .button('[OLDUGUN YERDE BEKLE]\nAskerler bulundugu konumu korur, pesinizden gelmez', 'textures/items/claim_flag')
 .button('[KOY SINIRINDA DEVRIYE]\nAskerler koy sinirlari icinde guvenlik devriyesi atar', 'textures/items/barracks_desk')
 .button('[SERBEST TAARRUZ]\nYakindaki haydut ve dusman yaratiklara saldirir', 'textures/items/ottoman_yatagan')
 .button('[KALKAN DUVARI SAVUNMASI]\nAskerler mevzide kalkan kapatir (+Direnc)', 'textures/items/ottoman_shield')
 .button('[OKCU YAYLIM ATESI]\nTum okcular baktiginiz yone ok yagdirir', 'textures/items/composite_shortbow')
 .button(`[BIRLIK SINIFI SEC: ${filterNames[currentFilter]}]\nEmirleri belirli siniflara yonlendir`, 'textures/items/war_horn');

 form.show(player).then((res) => {
 if (res.canceled) return;
 if (res.selection === 6) {
 this.openSquadFilterMenu(player);
 return;
 }

 const soldiers = player.dimension.getEntities({
 location: player.location,
 maxDistance: 64,
 families: [familyFilter]
 });

 if (soldiers.length === 0 && res.selection !== 5) {
 player.sendMessage('§c[Komuta] Yakininizda (64 blok) bu gruptan emir alacak asker bulunmuyor.');
 return;
 }

 if (res.selection === 0) {
 for (const s of soldiers) {
 s.removeEffect('slowness');
 this.bindSoldierToCommander(s, player, 'follow');
 }
 player.sendMessage(`§a[Komuta] ${soldiers.length} asker mesafeli takip duzenine gecti.`);
 } else if (res.selection === 1) {
 for (const s of soldiers) {
 this.bindSoldierToCommander(s, player, 'hold');
 }
 player.sendMessage(`§e[Komuta] ${soldiers.length} asker bulundugu yerde sabit nobet tutuyor.`);
 } else if (res.selection === 2) {
 for (const s of soldiers) {
 this.bindSoldierToCommander(s, player, 'patrol_village');
 }
 player.sendMessage(`§6[Komuta] ${soldiers.length} asker Koy Garnizon Devriyesine atandi.`);
 } else if (res.selection === 3) {
 for (const s of soldiers) {
 s.removeEffect('slowness');
 this.bindSoldierToCommander(s, player, 'charge');
 s.addEffect('speed', 240, { amplifier: 1, showParticles: false });
 }
 player.sendMessage(`§c[Komuta] ${soldiers.length} asker SERBEST TAARRUZA gecti!`);
 } else if (res.selection === 4) {
 for (const s of soldiers) {
 this.bindSoldierToCommander(s, player, 'hold');
 s.addEffect('resistance', 600, { amplifier: 2, showParticles: false });
 }
 player.sendMessage(`§b[Komuta] ${soldiers.length} asker Kalkan Duvari kurdu.`);
 } else if (res.selection === 5) {
 const archers = player.dimension.getEntities({
 location: player.location,
 maxDistance: 64,
 families: ['archer']
 });
 if (archers.length === 0) {
 player.sendMessage('§c[Komuta] Yakininizda yaylim atesi acacak Okcu birligi yok!');
 return;
 }
 const viewDir = (typeof player.getViewDirection === 'function') ? player.getViewDirection() : { x: 0, y: 0.2, z: 1 };
 for (const a of archers) {
 try {
 const spawnPos = { x: a.location.x, y: a.location.y + 1.8, z: a.location.z };
 const arrow = player.dimension.spawnEntity('minecraft:arrow', spawnPos);
 arrow.applyImpulse({ x: viewDir.x * 2.4, y: Math.max(0.25, viewDir.y + 0.35), z: viewDir.z * 2.4 });
 } catch (e) {}
 }
 player.sendMessage(`§a[Komuta] ${archers.length} Okcu baktiginiz hedefe yaylim atesi acti!`);
 }
 });
 }

 static openSquadFilterMenu(player) {
 const form = new ActionFormData()
 .title('§l[BIRLIK GRUBU SECIMI]')
 .body('Emirlerinizi hangi askeri sinifa yonlendirmek istiyorsunuz?')
 .button('[TUMU] Tum Ordu Birlikleri', 'textures/items/war_horn')
 .button('[1] Sadece Piyadeler & Kalkanlilar', 'textures/items/ottoman_shield')
 .button('[2] Sadece Okcular & Tufekciler', 'textures/items/composite_shortbow')
 .button('[3] Sadece Suvariler & Atlilar', 'textures/items/couch_lance');

 form.show(player).then((res) => {
 if (res.canceled) return;
 const keys = ['all', 'infantry', 'archer', 'cavalry'];
 this.activeSquadFilter[player.id] = keys[res.selection];
 this.openWarHornMenu(player);
 });
 }

 static applyKingHealth(player) {
 try {
 player.addEffect('health_boost', 20000000, { amplifier: 2, showParticles: false });
 } catch (e) {}
 }

 static triggerRelicPower(player, itemTypeId) {
 if (itemTypeId === 'megamod:relic_fatih_sword') {
 player.sendMessage('§6[Fatih Kilici] "Ileri Gaziler!" Ordunun hasari 15 saniye artti!');
 } else if (itemTypeId === 'megamod:relic_caesar_gladius') {
 player.sendMessage('§6[Sezar Gladyusu] "Roma Icin!" Lejyon savunmasi 20 saniye guclendi!');
 } else if (itemTypeId === 'megamod:relic_excalibur') {
 player.sendMessage('§b[Excalibur] Kutsal kilic parladi! Ordunun yaralari iyilesiyor!');
 } else if (itemTypeId === 'megamod:relic_khan_bow') {
 player.sendMessage('§6[Cengiz Han Yayi] Bozkir ruzgari arkamizda! Hiz katlandi!');
 }
 }

 static reviveWoundedSoldier(player) {
 const wounded = player.dimension.getEntities({
 location: player.location,
 maxDistance: 5,
 type: 'megamod:wounded_soldier'
 });

 if (wounded.length === 0) {
 player.sendMessage('§e[Sihhiye] Yakininizda (5 blok) tedavi edilecek agir yarali asker yok.');
 return;
 }

 const target = wounded[0];
 const pos = target.location;
 target.remove();
 const revived = player.dimension.spawnEntity('megamod:regular_footman', pos);
 revived.nameTag = '§a[Gazi] Kidemli Muhafiz';
 revived.triggerEvent('imperium:promote_veteran');
 this.bindSoldierToCommander(revived, player, 'follow');
 player.sendMessage('§a[Sihhiye] Agir yarali asker kurtarildi ve birliğe katildi!');
 }

 static handleEntityHurt(event) {
 const hurtEntity = event.hurtEntity;
 const attacker = event.damageSource?.damagingEntity;
 if (!hurtEntity) return;

 if (hurtEntity.typeId.startsWith('megamod:') && !hurtEntity.typeId.includes('bandit')) {
 const cause = event.damageSource?.cause;
 if (cause === 'entityExplosion' || cause === 'blockExplosion' || cause === 'fire' || cause === 'lava') {
 hurtEntity.addTag('perma_death');
 }
 }
 }

 static handleEntityDie(event) {
 const dead = event.deadEntity;
 if (!dead) return;

 if (dead.typeId.startsWith('megamod:') && !dead.typeId.includes('bandit') && dead.typeId !== 'megamod:wounded_soldier') {
 if (dead.typeId.includes('ram') || dead.typeId.includes('catapult') || dead.typeId.includes('wagon') || dead.typeId.includes('cannon')) {
 return;
 }
 const tags = dead.getTags ? dead.getTags() : [];
 if (tags.includes('perma_death')) {
 world.sendMessage('§4[Savas Kaybi] Bir asker patlama/ates sonucu sehit dustu!');
 } else if (Math.random() < 0.60) {
 try {
 const w = dead.dimension.spawnEntity('megamod:wounded_soldier', dead.location);
 w.nameTag = '§e[Agir Yarali Asker]';
 } catch (e) {}
 }
 }
 }
}
