import { ActionFormData } from '@minecraft/server-ui';
import { world } from '@minecraft/server';
import { EconomyEngine } from '../economy/EconomyEngine.js';

export class MultiplayerAndCompassUI {
    static openCompassRadar(player) {
        const pos = player.location;
        const bandits = player.dimension.getEntities({ location: pos, maxDistance: 150, families: ['bandit'] });
        const traders = player.dimension.getEntities({ location: pos, maxDistance: 150, families: ['trader'] });
        const wounded = player.dimension.getEntities({ location: pos, maxDistance: 100, type: 'megamod:wounded_soldier' });

        let report = `§6=== 🧭 İMPERİUM SEFER PUSULASI & RADAR ===\n`;
        report += `§e📍 Mevcut Koordinat: §fX:${Math.round(pos.x)}, Y:${Math.round(pos.y)}, Z:${Math.round(pos.z)}\n`;
        if (bandits.length > 0) {
            const b = bandits[0].location;
            report += `§c⚠️ En Yakın Haydut Çetesi: §fX:${Math.round(b.x)}, Z:${Math.round(b.z)} (${bandits.length} Haydut)\n`;
        } else {
            report += `§a✔️ 150m Çevrede Haydut Tehdidi Yok\n`;
        }
        if (traders.length > 0) {
            const t = traders[0].location;
            report += `§6🏪 En Yakın Pazar Karakolu: §fX:${Math.round(t.x)}, Z:${Math.round(t.z)}\n`;
        }
        if (wounded.length > 0) {
            report += `§d✚ Kurtarılmayı Bekleyen Yaralı Asker: §f${wounded.length} Kişi`;
        }
        player.sendMessage(report);
        player.runCommand('playsound random.orb @s ~ ~ ~ 1 1.2');
    }

    static openPassportAndClanMenu(player) {
        const rank = player.getDynamicProperty('imperium:clan_rank') || 'Hükümdar (Kral)';

        const form = new ActionFormData()
            .title('§4👑 ÇOK OYUNCULU KRALLIK & PASAPORT')
            .body(`§eKrallık Rütbeniz: §6${rank}\n` +
                  `§7Çok oyunculu sunucuda oyunculara rütbe atayabilir (Kral, Başkomutan/Mareşal, Hazinedar, Şövalye), Şehir Giriş Pasaportu verebilir veya klan sohbetini kullanabilirsiniz:`)
            .button('§6👑 Rütbe Ata: Başkomutan / Mareşal (Ordu Yetkisi)')
            .button('§e💰 Rütbe Ata: Kraliyet Hazinedarı (Banka Yetkisi)')
            .button('§b🛂 Yabancı Oyuncuya Şehir Giriş Pasaportu Ver')
            .button('§c⛓️ Baygın Düşman Oyuncuyu Esir Al & Fidye İste')
            .button('§l§0« Kapat');

        form.show(player).then((res) => {
            if (res.canceled || res.selection === 4) return;
            const players = world.getAllPlayers();
            if (res.selection === 0) {
                player.sendMessage('§6[Krallık] ⚔️ Yakındaki müttefik oyuncuya Başkomutan (Mareşal) yetkisi verildi! Ortak orduya emir verebilir.');
            } else if (res.selection === 1) {
                player.sendMessage('§e[Krallık] 💰 Hazinedar yetkisi tanımlandı! Ortak kasadan altın çekebilir.');
            } else if (res.selection === 2) {
                player.runCommand('give @a[r=10] megamod:kingdom_passport 1');
                player.sendMessage('§a[Gümrük] 🛂 Şehir Giriş Pasaportu verildi! Muhafızlar bu oyuncuya saldırmayacak.');
            } else if (res.selection === 3) {
                const fin = EconomyEngine.getFinance(player.id);
                fin.prisoners += 1;
                EconomyEngine.saveFinance(player.id, fin);
                player.sendMessage('§4[Esir Alındı!] ⛓️ Düşman komutan zindana kapatıldı! Klanından altın fidye talep edildi.');
            }
        });
    }

    static openSaddlebagMenu(player) {
        const stashGold = player.getDynamicProperty('imperium:saddlebag_gold') || 0;
        const stashRations = player.getDynamicProperty('imperium:saddlebag_rations') || 10;

        const form = new ActionFormData()
            .title('§6🐎 AT EYER ÇANTASI (SEFER HEYBESİ)')
            .body(`§eHeybedeki Sefer Altını: §6${stashGold} Bakır Dinar\n` +
                  `§eHeybedeki Sefer Erzağı: §a${stashRations} Paket\n\n` +
                  `§7Savaş alanında topladığınız ganimetleri ve yedek erzağı atınızın eyer çantasında güvenle taşıyabilirsiniz:`)
            .button('§2📥 Heybeye 200 Bakır Ganimet Koy')
            .button('§6📤 Heybeden 200 Bakır Çıkar')
            .button('§e🍖 Heybeden 2 Sefer Erzağı Al')
            .button('§l§0« Kapat');

        form.show(player).then((res) => {
            if (res.canceled || res.selection === 3) return;
            if (res.selection === 0) {
                if (EconomyEngine.deductMoney(player, 200)) {
                    player.setDynamicProperty('imperium:saddlebag_gold', stashGold + 200);
                    player.sendMessage('§a[Eyer Çantası] 200 Bakır Dinar at heybesine eklendi.');
                } else {
                    player.sendMessage('§c[Eyer Çantası] Yeterli bakır yok!');
                }
            } else if (res.selection === 1) {
                if (stashGold >= 200) {
                    player.setDynamicProperty('imperium:saddlebag_gold', stashGold - 200);
                    EconomyEngine.addMoney(player, 200);
                    player.sendMessage('§6[Eyer Çantası] Heybeden 200 Bakır Dinar alındı.');
                } else {
                    player.sendMessage('§c[Eyer Çantası] Heybede yeterli altın yok!');
                }
            } else if (res.selection === 2) {
                if (stashRations >= 2) {
                    player.setDynamicProperty('imperium:saddlebag_rations', stashRations - 2);
                    player.runCommand('give @s megamod:soldier_ration 2');
                    player.sendMessage('§a[Eyer Çantası] Heybeden 2x Ordu Erzak Paketi çıkarıldı.');
                } else {
                    player.sendMessage('§c[Eyer Çantası] Heybede erzak kalmadı!');
                }
            }
        });
    }
}
