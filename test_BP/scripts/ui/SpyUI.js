import { ActionFormData } from '@minecraft/server-ui';

export class SpyUI {
    static openSpyMenu(player) {
        const form = new ActionFormData()
            .title('§8🗡️ CASUSLUK VE GİZLİ OPERASYONLAR')
            .body('§eDüşman kalelerine sızan casuslarınıza gizli görev verin:\n\n' +
                  '§7Başarılı sabotajlar düşman kuşatmasını içeriden çökertir.')
            .button('§4🗝️ Gece Kale Kapısını İçeriden Aç\n§8Gece yarısı ordunuza kapıyı aralar')
            .button('§6🔥 Erzak Ambarını Kundakla\n§8Garnizonu açlık ve panikle baş başa bırak')
            .button('§2🧪 Su Kuyusunu Zehirle\n§8Düşman askerlerini zayıflat')
            .button('§c🎯 Düşman Generali Suikastı\n§8Ordu moralini sıfıra indir')
            .button('§8« Vazgeç');

        form.show(player).then((res) => {
            if (res.canceled || res.selection === 4) return;
            const missions = [
                'Casus gece sızdı! Kale kapısı ordunuza aralandı!',
                'Düşmanın tahıl ambarı alev aldı! Garnizon açlıkla boğuşuyor!',
                'Su kuyuları zehirlendi! Düşman askerleri halsiz düştü!',
                'Düşman generali gece çadırında hançerlendi! Düşman ordusu panik içinde!'
            ];
            player.sendMessage(`§8[Casus] §c${missions[res.selection]}`);
            player.runCommand('playsound random.anvil_land @a ~ ~ ~ 1 0.5');
        });
    }
}
