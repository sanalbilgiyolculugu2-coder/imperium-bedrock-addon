import { ActionFormData } from '@minecraft/server-ui';
import { NATIONS, NationManager } from '../nations/NationManager.js';

export class NationSelectUI {
    static openSelectionMenu(player) {
        const form = new ActionFormData()
            .title('§6İMPERİUM §0- Uygarlık Seçimi')
            .body('§7Yöneteceğiniz büyük imparatorluğu seçin. Her ulus kendine has özel askeri birime ve pasif avantaja sahiptir:');

        const keys = Object.keys(NATIONS);
        for (const k of keys) {
            const n = NATIONS[k];
            form.button(`${n.name}\n§8Birim: ${n.unit}`);
        }

        form.show(player).then((res) => {
            if (res.canceled) return;
            const chosenKey = keys[res.selection];
            const chosenNation = NATIONS[chosenKey];

            NationManager.setPlayerNation(player, chosenKey);
            player.sendMessage('§6========================================');
            player.sendMessage(`§aTebrikler! §e${chosenNation.name} §aseçildi.`);
            player.sendMessage(`§eÖzel Birim: §f${chosenNation.unit}`);
            player.sendMessage(`§ePasif Güç: §f${chosenNation.perk}`);
            player.sendMessage('§6========================================');
        });
    }
}
