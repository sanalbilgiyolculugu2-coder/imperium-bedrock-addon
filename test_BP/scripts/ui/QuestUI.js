import { ActionFormData } from '@minecraft/server-ui';
import { PolygonClaimEngine } from '../territory/PolygonClaimEngine.js';
import { EconomyEngine } from '../economy/EconomyEngine.js';

export class QuestUI {
 static openQuestMenu(player) {
 const k = PolygonClaimEngine.getPlayerKingdom(player.id);
 const flags = k ? k.flags.length : 0;
 const money = EconomyEngine.getPlayerMoney(player);

 const form = new ActionFormData()
 .title('§6İMPERİUM §e- Görev ve Fetih Defteri')
 .body('§eKraliyet Danışmanı Görevleri:\n\n' +
 `1. §f[3 Köşe Bayrağı Dik] -> ${flags >= 3 ? '§a(Tamamlandı)' : `§c(${flags}/3)`}\n` +
 `2. §f[Pazar Cüzdanında 100 Bakır Biriktir] -> ${money >= 100 ? '§a(Tamamlandı)' : `§c(${money}/100)`}\n` +
 `3. §f[Kışla İnşa Et & 5 Asker Eğit] -> §e(Sıradaki)\n` +
 `4. §f[İlk Pazar Karakolunu Ziyaret Et] -> §e(Sıradaki)\n\n` +
 `§7Görevleri tamamladıkça krallığınızın unvanı ve şanı yükselir.`);

 form.button('§aÖdül Talep Et');
 form.button('§l§0« Kapat');

 form.show(player).then((res) => {
 if (res.canceled) return;
 if (res.selection === 0) {
 if (flags >= 3 && money >= 100) {
 player.sendMessage('§a[Danışman] Tebrikler Sultanım! İlk aşama başarıyla tamamlandı. +50 Bakır Dinar ödül verildi.');
 EconomyEngine.addMoney(player, 50);
 } else {
 player.sendMessage('§c[Danışman] Henüz şartlar sağlanmadı! 3 Bayrak dikmeli ve en az 100 Bakır Dinar sahibi olmalısınız.');
 }
 }
 });
 }
}
