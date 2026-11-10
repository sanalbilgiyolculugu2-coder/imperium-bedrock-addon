import { ActionFormData } from '@minecraft/server-ui';
import { AI_KINGDOMS, DiplomacyManager } from '../diplomacy/DiplomacyManager.js';

export class DiplomacyUI {
    static openDiplomacyMenu(player) {
        const form = new ActionFormData()
            .title('§6İMPERİUM §0- Diplomasi ve İlişkiler')
            .body('§7Görüşmek istediğiniz komşu krallığı seçin:');

        const pacts = DiplomacyManager.getPacts();
        for (const k of AI_KINGDOMS) {
            const rel = pacts[k.id] || 'Nötr';
            form.button(`${k.name}\n§8Durum: §e${rel} §8| ${k.personality.split(' ')[0]}`);
        }

        form.show(player).then((res) => {
            if (res.canceled) return;
            const target = AI_KINGDOMS[res.selection];
            this.openRelationActions(player, target);
        });
    }

    static openRelationActions(player, kingdom) {
        const form = new ActionFormData()
            .title(`§0Diplomasi: ${kingdom.name}`)
            .body(`§eLider Karakteri: §f${kingdom.personality}\n` +
                  `§7${kingdom.desc}\n\n` +
                  `Elçiniz aracılığıyla hangi antlaşmayı teklif edeceksiniz?`)
            .button('§a🤝 Karşılıklı Ticaret Paktı')
            .button('§b🕊️ Saldırmazlık & Barış Paktı')
            .button('§6👑 Haraç & Vasallık Dayat')
            .button('§c⚔️ SAVAŞ İLAN ET')
            .button('§8« Geri');

        form.show(player).then((res) => {
            if (res.canceled || res.selection === 4) {
                this.openDiplomacyMenu(player);
                return;
            }
            const actions = ['Ticaret Paktı', 'Barış Paktı', 'Vasallık', 'Savaş'];
            const chosen = actions[res.selection];
            DiplomacyManager.setRelation(kingdom.id, chosen);
            player.sendMessage(`§6[Diplomasi] §a${kingdom.name} ile ilişki güncellendi: §e${chosen}`);
        });
    }
}
