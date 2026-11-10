import { world, system } from '@minecraft/server';
import { PolygonClaimEngine } from '../territory/PolygonClaimEngine.js';
import { EconomyEngine } from '../economy/EconomyEngine.js';

export class WeatherEngine {
 static currentWeather = 'Acik';

 static init() {
 system.runInterval(() => {
 this.tickPlayerHUDAndMechanics();
 }, 40);

 system.runInterval(() => {
 this.cycleWeather();
 }, 6000);

 system.runInterval(() => {
 this.tickBanditRaids();
 }, 2400); // Check for bandit raids every 2 minutes
 }

 static tickPlayerHUDAndMechanics() {
 for (const player of world.getAllPlayers()) {
 const k = PolygonClaimEngine.getPlayerKingdom(player.id);
 const wallet = EconomyEngine.getPlayerMoney(player);
 const flagCount = k ? k.flags.length : 0;
 const area = flagCount >= 3 ? PolygonClaimEngine.calculatePolygonArea(k.flags) : 0;
 const title = PolygonClaimEngine.getTitleByArea(area, flagCount);

 if (flagCount >= 1) {
 PolygonClaimEngine.renderAllKingdomBorders(player);
 }

 let hideHud = false;
 try {
 hideHud = Boolean(player.getDynamicProperty('imperium:hide_hud'));
 } catch (e) {}

 if (!hideHud) {
 const activeSoldiers = player.dimension.getEntities({
 location: player.location,
 maxDistance: 64,
 families: ['soldier']
 }).length;
 const borderStatus = flagCount < 3 ? `[Sinir: ${flagCount}/3 Bayrak]` : `[Koy: ${area}m²]`;
 const hudText = `§6[${title}] §7| §e${wallet}B §7| §a${borderStatus} §7| §c${activeSoldiers} Asker`;
 player.onScreenDisplay.setActionBar(hudText);
 }

 const thieves = player.dimension.getEntities({ location: player.location, maxDistance: 3, type: 'megamod:pickpocket_thief' });
 if (thieves.length > 0 && wallet > 5 && Math.random() < 0.25) {
 EconomyEngine.deductMoney(player, 5);
 player.sendMessage('§c[Yankesici] Bir hirsiz kesenizden 5 Bakir Dinar caldi!');
 }

 const enemies = player.dimension.getEntities({ location: player.location, maxDistance: 32, families: ['bandit'] });
 for (const en of enemies) {
 try {
 const b = en.dimension.getBlock({ x: Math.floor(en.location.x), y: Math.floor(en.location.y), z: Math.floor(en.location.z) });
 if (b && b.typeId === 'megamod:wooden_stakes_block') {
 en.applyDamage(18);
 } else if (b && b.typeId === 'megamod:caltrops_block') {
 en.applyDamage(6);
 en.addEffect('slowness', 100, { amplifier: 3 });
 }
 } catch (e) {}
 }
 }
 }

 static cycleWeather() {
 const events = [
 { name: 'Acik', msg: '§a[Hava Durumu] Gokyuzu acildi! Tarlalar bereketli, ordular tam hizda ilerliyor.' },
 { name: 'Saganak', msg: '§9[Hava Durumu] Saganak yagmur basladi! Zemin camurlasti.' },
 { name: 'Sisli', msg: '§7[Hava Durumu] Savas alanina sis coktu!' },
 { name: 'Karli', msg: '§b[Hava Durumu] Soguk ruzgarlar esmeye basladi.' },
 { name: 'Sicak', msg: '§6[Hava Durumu] Sicak dalgasi! Pazarda bugday fiyatlari yukseliyor.' }
 ];
 const chosen = events[Math.floor(Math.random() * events.length)];
 this.currentWeather = chosen.name;
 for (const player of world.getAllPlayers()) {
 player.sendMessage(chosen.msg);
 }
 }

 static tickBanditRaids() {
 for (const player of world.getAllPlayers()) {
 try {
 const k = PolygonClaimEngine.getPlayerKingdom(player.id);
 if (!k || !k.flags || k.flags.length < 3) continue;
 const money = EconomyEngine.getPlayerMoney(player);
 if (money < 100) continue;

 const raidKey = `imperium:last_raid_${player.id}`;
 const lastRaid = world.getDynamicProperty(raidKey) || 0;
 const now = Date.now();
 if (now - lastRaid < 240000) continue;
 world.setDynamicProperty(raidKey, now);

 const cx = (k.flags[0].x + k.flags[1].x + k.flags[2].x) / 3;
 const cz = (k.flags[0].z + k.flags[1].z + k.flags[2].z) / 3;
 const angle = Math.random() * Math.PI * 2;
 const spawnX = Math.round(cx + Math.cos(angle) * 32);
 const spawnZ = Math.round(cz + Math.sin(angle) * 32);
 const spawnY = PolygonClaimEngine.findSurfaceGroundY(player.dimension, spawnX, spawnZ, k.flags[0].y);

 player.onScreenDisplay.setTitle('§c[HAYDUT BASKINI!]', {
 stayDuration: 60,
 fadeInDuration: 10,
 fadeOutDuration: 15,
 subtitle: '§eKoyunuze saldiriyorlar! Muhafizlari mevzilendirin!'
 });
 player.sendMessage('§c[ALARM] Bir haydut cetesi koyunuze baskin duzenledi! Askerlerinizi toplayin!');

 const squad = [
 'megamod:bandit_chief',
 'megamod:bandit_gang_member',
 'megamod:bandit_gang_member',
 'megamod:pickpocket_thief'
 ];
 for (let i = 0; i < squad.length; i++) {
 const bPos = { x: spawnX + i * 2, y: spawnY, z: spawnZ + i * 2 };
 try {
 const b = player.dimension.spawnEntity(squad[i], bPos);
 b.nameTag = '§c[Haydut Capulcusu]';
 } catch (e) {}
 }
 } catch (e) {}
 }
 }
}
