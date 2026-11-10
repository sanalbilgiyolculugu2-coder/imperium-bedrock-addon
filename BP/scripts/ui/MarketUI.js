import { ActionFormData, ModalFormData } from '@minecraft/server-ui';
import { EconomyEngine, COMMODITIES } from '../economy/EconomyEngine.js';
import { BankAndCaravanUI } from './BankAndCaravanUI.js';

export class MarketUI {
 static openMainMenu(player) {
 const totalCopper = EconomyEngine.getPlayerMoney(player);
 const fin = EconomyEngine.getFinance(player.id);
 const golds = Math.floor(totalCopper / 10000);
 const silvers = Math.floor((totalCopper % 10000) / 100);
 const coppers = totalCopper % 100;

 const form = new ActionFormData()
 .title('§6İMPERİUM §e- Kraliyet Borsası & Pazar')
 .body(`§eCüzdanınız: §6${golds} Altın §f${silvers} Gümüş §c${coppers} Bakır\n` +
 `§eBanka Kasası: §a${fin.bankBalance} Bakır §7| §eKredi Borcu: §c${fin.loanDebt}\n` +
 `§7Fiyatlar arz-talebe ve bulunduğunuz biyoma (Çöl/Orman/Dağ Arbitrajı) göre anlık değişir:`);

 form.button('§1 Hammaddeler\n§r§0Demir, Altın, Elmas, Odun...', 'textures/items/iron_ingot');
 form.button('§2 Tarım & Sefer Erzağı\n§r§0Buğday, Ekmek, Kuru Et, Balık...', 'textures/items/wheat');
 form.button('§4 Askeri Silah & İkmal\n§r§0Ok, Kılıç, Mızrak, Kalkan, Barut...', 'textures/items/iron_sword');
 form.button('§6 Sikke Bozdurma (Döviz)\n§r§0Bakır <-> Gümüş <-> Altın', 'textures/items/gold_coin');
 form.button('§b Kraliyet Bankası & Kervanlar\n§r§0Kasa, Tefeci Kredisi & Kervan Gönder');

 form.show(player).then((res) => {
 if (res.canceled) return;
 switch (res.selection) {
 case 0: this.openCategoryMenu(player, 'raw', 'Hammaddeler'); break;
 case 1: this.openCategoryMenu(player, 'food', 'Tarım & Sefer Erzağı'); break;
 case 2: this.openCategoryMenu(player, 'military', 'Askeri İkmal'); break;
 case 3: this.openExchangeMenu(player); break;
 case 4: BankAndCaravanUI.openBankMenu(player); break;
 }
 });
 }

 static openCategoryMenu(player, categoryKey, categoryName) {
 const state = EconomyEngine.getState();
 const form = new ActionFormData()
 .title(`§l§6Pazar: §e${categoryName}`)
 .body('§7Almak veya satmak istediğiniz ürünü seçin ( Yükselişte | Ucuzladı):');

 const items = Object.entries(COMMODITIES).filter(([_, v]) => v.category === categoryKey);
 for (const [id, data] of items) {
 const price = EconomyEngine.getPrice(id, player);
 const trendVal = state[id]?.trend || 0;
 const trendIcon = trendVal > 0 ? '§c' : (trendVal < 0 ? '§a' : '§7');
 form.button(`${data.name} ${trendIcon}\n§eBirim Fiyat: ${price} Bakır (Baz: ${data.basePrice})`);
 }

 form.button('§l§0« Ana Menüye Dön');

 form.show(player).then((res) => {
 if (res.canceled) return;
 if (res.selection >= items.length) {
 this.openMainMenu(player);
 return;
 }
 const selected = items[res.selection];
 this.openTradeModal(player, selected[0], selected[1]);
 });
 }

 static openTradeModal(player, commodityId, commodityData) {
 const currentPrice = EconomyEngine.getPrice(commodityId, player);
 const playerMoney = EconomyEngine.getPlayerMoney(player);

 const form = new ModalFormData()
 .title(`§0Ticaret: ${commodityData.name}`)
 .dropdown(`İşlem Türü (Bölgesel Fiyat: ${currentPrice} Bakır)`, ['Satın Al (Alış)', 'Pazara Sat (Satış)'], 0)
 .slider('Miktar', 1, 64, 1, 8);

 form.show(player).then((res) => {
 if (res.canceled) return;
 const isBuy = res.formValues[0] === 0;
 const amount = Math.round(res.formValues[1]);
 const totalCost = currentPrice * amount;

 if (isBuy) {
 if (playerMoney < totalCost) {
 player.sendMessage(`§c[Pazar] Yetersiz bakiye! Gereken: ${totalCost} Bakır, Cüzdan: ${playerMoney} Bakır.`);
 return;
 }
 if (EconomyEngine.deductMoney(player, totalCost)) {
 player.runCommand(`give @s ${commodityId} ${amount}`);
 EconomyEngine.recordTransaction(commodityId, amount, true);
 player.sendMessage(`§a[Pazar] ${amount}x ${commodityData.name} satın alındı! (-${totalCost} Bakır). Talep arttığı için fiyat güncellendi.`);
 }
 } else {
 player.runCommand(`clear @s ${commodityId} 0 ${amount}`);
 EconomyEngine.addMoney(player, totalCost);
 EconomyEngine.recordTransaction(commodityId, amount, false);
 player.sendMessage(`§6[Pazar] ${amount}x ${commodityData.name} pazara satıldı! (+${totalCost} Bakır). Arz arttığı için fiyat ucuzladı.`);
 }
 });
 }

 static openExchangeMenu(player) {
 const form = new ActionFormData()
 .title('§6Sikke Bozdurma & Döviz')
 .body('§7Madeni paralarınızı dönüştürün:\n• 100 Bakır Dinar = 1 Gümüş Sikke\n• 100 Gümüş Sikke = 1 Kraliyet Altını')
 .button('100 Bakır -> 1 Gümüş')
 .button('1 Gümüş -> 100 Bakır')
 .button('100 Gümüş -> 1 Altın')
 .button('1 Altın -> 100 Gümüş')
 .button('§l§0« Geri');

 form.show(player).then((res) => {
 if (res.canceled || res.selection === 4) {
 this.openMainMenu(player);
 return;
 }
 const money = EconomyEngine.getPlayerMoney(player);
 if (res.selection === 0 && money >= 100) {
 EconomyEngine.deductMoney(player, 100);
 player.runCommand('give @s megamod:silver_coin 1');
 player.sendMessage('§a[Döviz] 100 Bakır Dinar -> 1 Gümüş Sikke.');
 } else if (res.selection === 1 && money >= 100) {
 EconomyEngine.deductMoney(player, 100);
 player.runCommand('give @s megamod:copper_coin 100');
 player.sendMessage('§a[Döviz] 1 Gümüş Sikke -> 100 Bakır Dinar.');
 } else if (res.selection === 2 && money >= 10000) {
 EconomyEngine.deductMoney(player, 10000);
 player.runCommand('give @s megamod:gold_coin 1');
 player.sendMessage('§6[Döviz] 100 Gümüş Sikke -> 1 Kraliyet Altını.');
 } else if (res.selection === 3 && money >= 10000) {
 EconomyEngine.deductMoney(player, 10000);
 player.runCommand('give @s megamod:silver_coin 100');
 player.sendMessage('§6[Döviz] 1 Kraliyet Altını -> 100 Gümüş Sikke.');
 } else {
 player.sendMessage('§c[Döviz] Yetersiz madeni para!');
 }
 });
 }
}
