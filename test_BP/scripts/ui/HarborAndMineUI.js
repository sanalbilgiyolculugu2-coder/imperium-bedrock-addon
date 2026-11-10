import { ActionFormData } from '@minecraft/server-ui';
import { system } from '@minecraft/server';
import { EconomyEngine } from '../economy/EconomyEngine.js';
import { NationManager } from '../nations/NationManager.js';

export class HarborAndMineUI {
 static openHarborMenu(player) {
 const wallet = EconomyEngine.getPlayerMoney(player);

 const form = new ActionFormData()
 .title('§1 SAHİL TİCARET LİMANI & TERSANE')
 .body(`§eCüzdanınız: §6${wallet} Bakır Dinar\n\n` +
 `§7Tersanede savaş kadırgası inşa edebilir, denizaşırı ticaret karaveli yollayabilir veya balıkçı filosu kurabilirsiniz:`)
 .button('§c Savaş Kadırgası İnşa Et (400 Bakır)')
 .button('§6 Deniz Ticaret Karaveli Gönder (200 Bakır -> Gelir: 480 Bakır)')
 .button('§b Balıkçı İskelesi Hasadı (+16 Tuzlanmış Sefer Balığı - 40 Bakır)')
 .button('§l§0« Kapat');

 form.show(player).then((res) => {
 if (res.canceled || res.selection === 3) return;

 if (res.selection === 0) {
 if (!EconomyEngine.deductMoney(player, 400)) {
 player.sendMessage('§c[Tersane] Savaş Kadırgası için 400 Bakır Dinar gerekiyor!');
 return;
 }
 const ship = player.dimension.spawnEntity('megamod:war_galley', player.location);
 ship.nameTag = `§4 ${player.name} Donanma Kadırgası`;
 player.sendMessage('§a[Tersane] Savaş Kadırgası suya indirildi! Deniz savaşlarına hazır!');
 } else if (res.selection === 1) {
 if (!EconomyEngine.deductMoney(player, 200)) {
 player.sendMessage('§c[Liman] Ticaret Karaveli donatmak için 200 Bakır Dinar gerekiyor!');
 return;
 }
 const caravel = player.dimension.spawnEntity('megamod:trade_caravel', player.location);
 caravel.nameTag = `§6 ${player.name} Ticaret Karaveli`;
 player.sendMessage('§b[Liman] Ticaret Karaveli denize açıldı! Dönüşte +480 Bakır Dinar getirecek.');

 system.runTimeout(() => {
 EconomyEngine.addMoney(player, 480);
 player.sendMessage('§6[Liman] Ticaret Karaveli limana döndü ve +480 Bakır Dinar deniz ticareti kârı getirdi!');
 }, 600);
 } else if (res.selection === 2) {
 if (!EconomyEngine.deductMoney(player, 40)) {
 player.sendMessage('§c[İskele] 40 Bakır Dinar gerekiyor!');
 return;
 }
 player.runCommand('give @s megamod:salted_fish 16');
 player.sendMessage('§a[İskele] 16x Tuzlanmış Sefer Balığı (Bozulmaz Ordu Erzağı) envanterinize eklendi!');
 }
 });
 }

 static openMineMenu(player) {
 const nation = NationManager.getPlayerNation(player) || 'osmanli';
 const isSpain = nation === 'ispanya';
 const veinRemaining = player.getDynamicProperty('imperium:mine_vein') ?? 2500;

 const form = new ActionFormData()
 .title('§8 DERİN MADEN OCAĞI & DÖKÜMHANE')
 .body(`§eKalan Cevher Damarı Rezervi: §6${veinRemaining} Cevher\n` +
 `${isSpain ? '§a[İspanya Pasifi Aktif: +%20 Ekstra Altın Çıkarımı]\n' : ''}` +
 `§7Derin maden ocağında esir işçileri veya madencileri çalıştırarak demir, kömür ve altın çıkarabilirsiniz. Damar tükendiğinde yeni damar aranır:`)
 .button('§7 Demir ve Kömür Çıkar (12 Demir + 16 Kömür)')
 .button('§6 Altın Damarı Kaz (6 Altın Külçesi)')
 .button('§b Yeni Cevher Damarı Ara & Sondaj Yap (150 Bakır)')
 .button('§l§0« Kapat');

 form.show(player).then((res) => {
 if (res.canceled || res.selection === 3) return;

 if (res.selection === 0) {
 if (veinRemaining < 50) {
 player.sendMessage('§c[Maden Ocağı] Bu maden damarı tükendi! Yeni damar sondajı yapmalısınız.');
 return;
 }
 player.setDynamicProperty('imperium:mine_vein', veinRemaining - 50);
 player.runCommand('give @s minecraft:iron_ingot 12');
 player.runCommand('give @s minecraft:coal 16');
 player.runCommand('playsound random.anvil_land @s ~ ~ ~ 0.7 1.2');
 player.sendMessage(`§a[Maden Ocağı] 12x Demir Külçesi ve 16x Kömür çıkarıldı! (Kalan Damar: ${veinRemaining - 50})`);
 } else if (res.selection === 1) {
 if (veinRemaining < 80) {
 player.sendMessage('§c[Maden Ocağı] Bu maden damarı tükendi! Yeni damar sondajı yapmalısınız.');
 return;
 }
 const goldCount = isSpain ? 8 : 6;
 player.setDynamicProperty('imperium:mine_vein', veinRemaining - 80);
 player.runCommand(`give @s minecraft:gold_ingot ${goldCount}`);
 player.sendMessage(`§6[Maden Ocağı] ${goldCount}x Altın Külçesi çıkarıldı! (Kalan Damar: ${veinRemaining - 80})`);
 } else if (res.selection === 2) {
 if (!EconomyEngine.deductMoney(player, 150)) {
 player.sendMessage('§c[Maden] Yeni damar sondajı için 150 Bakır Dinar gerekiyor!');
 return;
 }
 player.setDynamicProperty('imperium:mine_vein', 2500);
 player.sendMessage('§a[Maden Mühendisi] Dağ altında zengin bir cevher damarı bulundu! (Rezerv: 2500 Cevher)');
 }
 });
 }

 static triggerTollGate(player) {
 EconomyEngine.addMoney(player, 45);
 player.sendMessage('§6[Köprü Gümrük Kapısı] Geçen ticaret kervanlarından ve seyyahlardan +45 Bakır Dinar geçiş harcı tahsil edildi!');
 }
}
