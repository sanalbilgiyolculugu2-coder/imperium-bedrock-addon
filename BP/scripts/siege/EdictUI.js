import { ActionFormData } from '@minecraft/server-ui';
import { EconomyEngine } from '../economy/EconomyEngine.js';

export class EdictUI {
 static openThroneMenu(player) {
 const form = new ActionFormData()
 .title('§6 KRALİYET TAHTI & FERMANLAR')
 .body('§eTahtınızdan tüm imparatorluğa bağlayıcı fermanlar yayınlayın:\n\n' +
 '• Fermanlar krallığın huzurunu, ekonomisini ve askeri gücünü doğrudan etkiler.')
 .button('§4 Sıkıyönetim Fermanı\n§r§0Suçları sıfırlar, huzursuzluk yaratır')
 .button('§2 Hasat Seferberliği\n§r§0Tarım üretimini ikiye katlar')
 .button('§6 Büyük Şenlik Fermanı\n§r§0Ordu ve halk moralini tavan yaptırır')
 .button('§b Vergi İndirimi\n§r§0Şehre dışarıdan göçmen akını çeker')
 .button('§l§0« Kapat');

 form.show(player).then((res) => {
 if (res.canceled || res.selection === 4) return;
 const edicts = [
 'Sıkıyönetim ilan edildi! Devriyeler şehri kuş uçurtmuyor.',
 'Hasat Seferberliği başladı! Çiftçiler gece gündüz ekiyor.',
 'Büyük Şenlik başladı! Halk meydanlarda zaferi kutluyor.',
 'Vergi indirimi ilan edildi! Komşu şehirlerden göçmenler akın ediyor.'
 ];
 player.sendMessage(`§6[Ferman] §a${edicts[res.selection]}`);
 player.runCommand('playsound random.levelup @a ~ ~ ~ 1 1');
 });
 }
}
