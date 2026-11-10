import { ActionFormData } from '@minecraft/server-ui';
import { EconomyEngine } from '../economy/EconomyEngine.js';

export const VOICE_LINES = {
 'ottoman': ['"Emredin Sultanım! Kılıcımız keskin!"', '"Devlet-i Aliyye için ileri!"', '"Sancak yere düşmez Hünkârım!"'],
 'roman': ['"Ave Caesar! Roma için!"', '"Kalkanlar birleşsin, Lejyon hazır!"', '"Roma’nın zaferi yakındır!"'],
 'british': ['"Yaylarımız gerildi Ekselansları!"', '"Kral ve Taç için!"'],
 'russian': ['"Kış bize işlemez Komutanım!"', '"Kızıl Muhafızlar emrinizde!"'],
 'french': ['"Şövalye onuruyla hücuma hazırız!"', '"Fransa Sancağı altında!"'],
 'chinese': ['"İmparatorluk muhafızları hazır!"', '"Oklarımız yağmur gibi yağacak!"'],
 'spanish': ['"Altın ve zafer için Komutanım!"', '"Tüfeklerimiz dolu!"'],
 'mongol': ['"Bozkırın atları yorulmaz Hanım!"', '"Yaylarımız rüzgarla yarışır!"'],
 'spartan': ['"Ahuu! Sparta asla geri çekilmez!"', '"Ya kalkanımla ya kalkanımın üstünde!"'],
 'default': ['"Emredin Komutanım! Saflarımız sıkı!"', '"Canımız krallığa feda olsun!"']
};

export class SoldierInteractionUI {
 static getVoiceLine(typeId) {
 for (const [key, lines] of Object.entries(VOICE_LINES)) {
 if (typeId.includes(key)) {
 return lines[Math.floor(Math.random() * lines.length)];
 }
 }
 const def = VOICE_LINES['default'];
 return def[Math.floor(Math.random() * def.length)];
 }

 static updateOverheadBar(entity) {
 try {
 const hpComp = entity.getComponent('health');
 if (!hpComp) return;
 const cur = Math.max(0, Math.round(hpComp.currentValue));
 const max = Math.round(hpComp.effectiveMax);
 const rank = entity.hasTag('elite') ? '§6 Elit' : (entity.hasTag('veteran') ? '§b Kıdemli' : '§e Asker');
 const armored = entity.hasTag('armored') ? ' §9[Zırhlı]' : '';
 entity.nameTag = `${rank}${armored} §c[ ${cur}/${max}]`;
 } catch (e) {}
 }

 static openSoldierMenu(player, soldier) {
 const line = this.getVoiceLine(soldier.typeId);
 player.sendMessage(`§6[Asker Selamı] §e${line}`);
 player.runCommand('playsound random.pop @s ~ ~ ~ 0.8 1.2');

 this.updateOverheadBar(soldier);
 const hpComp = soldier.getComponent('health');
 const curHp = hpComp ? Math.round(hpComp.currentValue) : 20;
 const maxHp = hpComp ? Math.round(hpComp.effectiveMax) : 20;

 const form = new ActionFormData()
 .title('§4 ASKER DONANIM & KOMUTA PANELİ')
 .body(`§eBirim: §f${soldier.nameTag || soldier.typeId}\n` +
 `§eSağlık Durumu: §c ${curHp} / ${maxHp} HP\n` +
 `§eZırh Donanımı: ${soldier.hasTag('armored') ? '§aÇelik Zırh & Kalkan Kuşanıldı' : '§7Standart Donanım'}\n\n` +
 `§7Askerinize zırh giydirebilir, sefer erzağı verip iyileştirebilir veya özel görev atayabilirsiniz:`)
 .button('§b Çelik Zırh & Kalkan Giydir (+%50 Koruma - 45 Bakır)')
 .button('§2 Sefer Erzağı Ver (Tam İyileşme & Moral - 10 Bakır)')
 .button('§6 Kıdemli Rütbesine Terfi Ettir (60 Bakır)')
 .button('§a Şahsi Yakın Korumam Olarak Ata')
 .button('§l§0« Kapat');

 form.show(player).then((res) => {
 if (res.canceled || res.selection === 4) return;

 if (res.selection === 0) {
 if (soldier.hasTag('armored')) {
 player.sendMessage('§e[Donanım] Bu asker zaten tam takım çelik zırh ve kalkan kuşanmış!');
 return;
 }
 if (!EconomyEngine.deductMoney(player, 45)) {
 player.sendMessage('§c[Donanım] Zırh giydirmek için 45 Bakır Dinar gerekiyor!');
 return;
 }
 soldier.addTag('armored');
 soldier.addEffect('resistance', 20000000, { amplifier: 1, showParticles: false });
 this.updateOverheadBar(soldier);
 player.runCommand('playsound armor.equip_iron @s ~ ~ ~ 1 1');
 player.sendMessage('§a[Donanım] Askerinize çelik zırh ve kalkan giydirildi! Hasar direnci +%40 arttı.');
 } else if (res.selection === 1) {
 if (!EconomyEngine.deductMoney(player, 10)) {
 player.sendMessage('§c[Erzak] 10 Bakır Dinar gerekiyor!');
 return;
 }
 soldier.addEffect('instant_health', 1, { amplifier: 10, showParticles: true });
 soldier.addEffect('strength', 600, { amplifier: 0, showParticles: false });
 this.updateOverheadBar(soldier);
 player.sendMessage('§a[Erzak] Asker karnını doyurdu, yaraları iyileşti ve morali yükseldi!');
 } else if (res.selection === 2) {
 if (!EconomyEngine.deductMoney(player, 60)) {
 player.sendMessage('§c[Terfi] 60 Bakır Dinar gerekiyor!');
 return;
 }
 soldier.addTag('elite');
 soldier.triggerEvent('imperium:promote_elite');
 this.updateOverheadBar(soldier);
 player.runCommand('playsound random.levelup @s ~ ~ ~ 1 1');
 player.sendMessage('§6[Terfi] Askeriniz Elit Muhafız rütbesine terfi etti!');
 } else if (res.selection === 3) {
 soldier.triggerEvent('imperium:order_follow');
 soldier.teleport(player.location);
 player.sendMessage('§a[Muhafız] Asker şahsi yakın korumanız olarak atandı!');
 }
 });
 }
}
