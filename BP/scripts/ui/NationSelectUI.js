import { ActionFormData } from '@minecraft/server-ui';
import { NATIONS, NationManager } from '../nations/NationManager.js';
import { ImperialHubUI } from './ImperialHubUI.js';

export class NationSelectUI {
 static openSelectionMenu(player, onBusyCallback = null) {
 const form = new ActionFormData()
 .title('§l§6 İMPERİUM: UYGARLIK SEÇİMİ')
 .body(
 '§fHükümdarım, kuracağınız imparatorluğun ulusunu seçin.\n' +
 '§eSeçiminizden hemen sonra İlk Köyünüzü nasıl kuracağınızı gösteren Kuruluş Rehberi açılacaktır:'
 );

 const keys = Object.keys(NATIONS);
 for (const k of keys) {
 const n = NATIONS[k];
 form.button(`§l§0${n.name}\n§r§0Özel Birim: ${n.unit}`, 'textures/items/kingdom_passport');
 }

 form.show(player).then((res) => {
 if (res.canceled) { if (res.cancelationReason === 'UserBusy' && onBusyCallback) onBusyCallback(true); return; }
 const chosenKey = keys[res.selection];
 const chosenNation = NATIONS[chosenKey];

 NationManager.setPlayerNation(player, chosenKey);
 player.sendMessage(`§a[Uygarlık] §e${chosenNation.name} §aseçildi! Özel Birim: §f${chosenNation.unit}`);

 // Ulus seçilir seçilmez oyuncuya ne yapacağını adım adım anlatan rehberi aç!
 ImperialHubUI.openOnboardingGuide(player);
 });
 }
}
