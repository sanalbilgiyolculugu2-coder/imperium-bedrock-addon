import { ActionFormData } from '@minecraft/server-ui';
import { EconomyEngine } from '../economy/EconomyEngine.js';
import { SiegeEngine } from '../siege/SiegeEngine.js';

export class SpyUI {
 static openSpyMenu(player) {
 const wallet = EconomyEngine.getPlayerMoney(player);

 const form = new ActionFormData()
 .title('§l[CASUSLUK & SABOTAJ TESKILATI]')
 .body(
 `Hazine: §6${wallet} Bakir Dinar §7(Her operasyon 75 Bakir talep eder)\n` +
 `────────────────────────────────\n` +
 `Hedef bolgeye gizli casus veya suikastci sizdirin:`
 )
 .button('[DUSMAN KAPISINI SABOTE ET] (75 Bakir)\nSur kapisina 150 hasar vurur ve yakin kilitleri kirar')
 .button('[ERZAK AMBARINI KUNDAKLA] (75 Bakir)\nDusman kilerinden 150 Bakir ve erzak calip kacar')
 .button('[SU KUYULARINI ZEHIRLE] (75 Bakir)\nYakindaki tum haydutlara Yavaslik ve Zehir enjekte eder')
 .button('[HAYDUT ELEBASINA SUIKAST] (75 Bakir)\nYakindaki haydut liderini hancler ve 100B ganimet alir')
 .button('[Geri / Kapat]');

 form.show(player).then((res) => {
 if (res.canceled || res.selection === 4) return;

 if (!EconomyEngine.deductMoney(player, 75)) {
 player.sendMessage('§c[Casus] Operasyon bedeli icin 75 Bakir Dinar gerekiyor!');
 return;
 }

 const success = Math.random() < 0.80; // 80% success rate

 if (!success) {
 player.sendMessage('§4[Casus Yakalandi!] Casusunuz nobetciler tarafindan fark edilip yakalandi!');
 try {
 const ambush = player.dimension.spawnEntity('megamod:bandit_gang_member', {
 x: player.location.x + 4,
 y: player.location.y,
 z: player.location.z + 4
 });
 ambush.nameTag = '§c[Intikamci Haydut]';
 } catch (e) {}
 return;
 }

 if (res.selection === 0) {
 SiegeEngine.gateHp = Math.max(0, SiegeEngine.gateHp - 150);
 player.sendMessage(`§a[Casus Basarili] Dusman sur kapisi iceriden sabote edildi! Kalan Kapi Cani: ${SiegeEngine.gateHp}/500 HP`);
 } else if (res.selection === 1) {
 EconomyEngine.addMoney(player, 150);
 try {
 player.runCommand('give @s bread 8');
 } catch (e) {}
 player.sendMessage('§a[Casus Basarili] Dusman zahire ambari kundaklandi! +150 Bakir ve 8x Ekmek ele gecirildi!');
 } else if (res.selection === 2) {
 const enemies = player.dimension.getEntities({ location: player.location, maxDistance: 48, families: ['bandit'] });
 for (const en of enemies) {
 en.addEffect('slowness', 400, { amplifier: 1, showParticles: true });
 en.addEffect('weakness', 400, { amplifier: 1, showParticles: true });
 en.addEffect('poison', 120, { amplifier: 0, showParticles: true });
 }
 player.sendMessage(`§a[Casus Basarili] Su kuyusu zehirlendi! Yakindaki ${enemies.length} haydut zayif dustu.`);
 } else if (res.selection === 3) {
 const chiefs = player.dimension.getEntities({ location: player.location, maxDistance: 64, type: 'megamod:bandit_chief' });
 if (chiefs.length > 0) {
 chiefs[0].applyDamage(50);
 EconomyEngine.addMoney(player, 100);
 player.sendMessage('§a[Suikast Basarili] Haydut elebasi cadirinda hanclendi! +100 Bakir kelle odulu alindi!');
 } else {
 EconomyEngine.addMoney(player, 100);
 player.sendMessage('§a[Suikast Basarili] Bolge haydut komutani infaz edildi! +100 Bakir odul alindi.');
 }
 }
 });
 }
}
