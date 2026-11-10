import { ActionFormData } from '@minecraft/server-ui';
import { EconomyEngine } from '../economy/EconomyEngine.js';

export class BlueprintBuilder {
    static openBlueprintMenu(player) {
        const wallet = EconomyEngine.getPlayerMoney(player);

        const form = new ActionFormData()
            .title('§1📐 MİMARİ İNŞAAT PARŞÖMENİ (HAZIR BİNA)')
            .body(`§eCüzdanınız: §6${wallet} Bakır Dinar\n\n` +
                  `§7Tek tıkla bulunduğunuz konumun önüne hazır krallık yapısı inşa edin (Hibrit İnşaat Sistemi):`)
            .button('§4🏰 Gözetleme & Okçu Kulesi İnşa Et (120 Bakır)\n§8Taş kule + Mazgal + 1 Uzun Yaycı Nöbetçi')
            .button('§c⚔️ Askeri Kışla Binası İnşa Et (180 Bakır)\n§8Taş/Meşe kışla + Kışla Talim Masası')
            .button('§a🏥 Saha Reviri & Şifacı Çadırı (100 Bakır)\n§8Kırmızı/Beyaz çadır + Revir Yatağı')
            .button('§6🏪 Korunaklı Pazar Karakolu (200 Bakır)\n§8Pazar alanı + Tüccar + 2 Elit Muhafız')
            .button('§8⛓️ Krallık Zindanı Hücresi (140 Bakır)\n§8Demir parmaklıklı zindan + 1 Esir')
            .button('§8« Kapat');

        form.show(player).then((res) => {
            if (res.canceled || res.selection === 5) return;
            const px = Math.floor(player.location.x) + 3;
            const py = Math.floor(player.location.y);
            const pz = Math.floor(player.location.z) + 3;

            if (res.selection === 0) {
                if (!EconomyEngine.deductMoney(player, 120)) {
                    player.sendMessage('§c[İnşaat] Kule için 120 Bakır Dinar gerekiyor!');
                    return;
                }
                player.runCommand(`fill ${px} ${py} ${pz} ${px+4} ${py+7} ${pz+4} stonebrick hollow`);
                player.runCommand(`fill ${px} ${py+8} ${pz} ${px+4} ${py+8} ${pz+4} cobblestone_wall`);
                player.runCommand(`setblock ${px+2} ${py+1} ${pz} air`);
                player.runCommand(`setblock ${px+2} ${py+2} ${pz} air`);
                const archer = player.dimension.spawnEntity('megamod:british_longbowman', { x: px + 2.5, y: py + 8, z: pz + 2.5 });
                archer.nameTag = '§b🏹 Kule Gözetleme Okçusu';
                archer.triggerEvent('imperium:order_hold_line');
                player.sendMessage('§a[İnşaat] 🏰 Gözetleme Kulesi inşa edildi ve tepesine Uzun Yaycı nöbetçi yerleştirildi!');
            } else if (res.selection === 1) {
                if (!EconomyEngine.deductMoney(player, 180)) {
                    player.sendMessage('§c[İnşaat] Kışla için 180 Bakır Dinar gerekiyor!');
                    return;
                }
                player.runCommand(`fill ${px} ${py} ${pz} ${px+6} ${py+4} ${pz+6} stonebrick hollow`);
                player.runCommand(`setblock ${px+3} ${py+1} ${pz} air`);
                player.runCommand(`setblock ${px+3} ${py+2} ${pz} air`);
                player.runCommand(`setblock ${px+3} ${py+1} ${pz+3} megamod:barracks_desk_block`);
                player.runCommand('give @s megamod:barracks_desk 1');
                player.sendMessage('§a[İnşaat] ⚔️ Askeri Kışla binası tamamlandı!');
            } else if (res.selection === 2) {
                if (!EconomyEngine.deductMoney(player, 100)) {
                    player.sendMessage('§c[İnşaat] Revir için 100 Bakır Dinar gerekiyor!');
                    return;
                }
                player.runCommand(`fill ${px} ${py} ${pz} ${px+4} ${py+3} ${pz+4} white_wool hollow`);
                player.runCommand(`setblock ${px+2} ${py+1} ${pz} air`);
                player.runCommand(`setblock ${px+2} ${py+2} ${pz} air`);
                player.runCommand(`setblock ${px+2} ${py+1} ${pz+2} megamod:infirmary_bed_block`);
                player.runCommand('give @s megamod:field_bandage 4');
                player.sendMessage('§a[İnşaat] 🏥 Saha Reviri kuruldu ve +4 Sargı Bezi verildi!');
            } else if (res.selection === 3) {
                if (!EconomyEngine.deductMoney(player, 200)) {
                    player.sendMessage('§c[İnşaat] Pazar Karakolu için 200 Bakır Dinar gerekiyor!');
                    return;
                }
                player.runCommand(`fill ${px} ${py-1} ${pz} ${px+6} ${py-1} ${pz+6} stone_bricks`);
                const trader = player.dimension.spawnEntity('megamod:market_trader', { x: px + 3, y: py + 1, z: pz + 3 });
                trader.nameTag = '§6💰 Pazar Borsa Tüccarı';
                for (let i = 0; i < 2; i++) {
                    const g = player.dimension.spawnEntity('megamod:elite_market_guard', { x: px + (i * 5), y: py + 1, z: pz + 2 });
                    g.nameTag = '§4🛡️ Elit Pazar Muhafızı (1.25x)';
                }
                player.sendMessage('§6[İnşaat] 🏪 Yarı Güvenli Pazar Karakolu, Tüccar ve 1.25x Elit Muhafızlar kuruldu!');
            } else if (res.selection === 4) {
                if (!EconomyEngine.deductMoney(player, 140)) {
                    player.sendMessage('§c[İnşaat] Zindan için 140 Bakır Dinar gerekiyor!');
                    return;
                }
                player.runCommand(`fill ${px} ${py} ${pz} ${px+4} ${py+3} ${pz+4} iron_bars hollow`);
                player.runCommand(`fill ${px} ${py} ${pz} ${px+4} ${py} ${pz+4} stonebrick`);
                const fin = EconomyEngine.getFinance(player.id);
                fin.prisoners += 2;
                EconomyEngine.saveFinance(player.id, fin);
                player.sendMessage('§4[İnşaat] ⛓️ Krallık Zindanı inşa edildi ve 2 haydut hücreye kapatıldı!');
            }
            player.runCommand('playsound random.anvil_use @a ~ ~ ~ 1 0.9');
        });
    }
}
