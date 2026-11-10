import { ActionFormData } from '@minecraft/server-ui';
import { EconomyEngine } from '../economy/EconomyEngine.js';
import { PolygonClaimEngine } from '../territory/PolygonClaimEngine.js';

export class CityAndDungeonUI {
    static openGuildMenu(player) {
        const fin = EconomyEngine.getFinance(player.id);

        const form = new ActionFormData()
            .title('§6⚒️ ŞEHİR LONCASI, DEMİRCİ & ZİNDAN')
            .body(`§eAmbar Erzak Stoğu: §a${fin.granaryRations} Paket\n` +
                  `§eDökümhane Demir Stoğu: §7${fin.ironStock} Külçe\n` +
                  `§eZindandaki Esirler: §c${fin.prisoners} Tutsak\n` +
                  `§eŞehir Asayişi: §b%${fin.publicOrder} §8| §eOrdu Morali: §6%${fin.morale}`)
            .button('§6⚒️ Usta Demirci: Kaliteli Silah Döv (80 Bakır)')
            .button('§b👨‍🌾 Lonca: Usta Demirci / Fırıncı Ata (60 Bakır)')
            .button('§4⛓️ Krallık Zindanı & Esir Yargılama Paneli')
            .button('§d🍖 Zafer Şöleni & Ziyafet Ver (+%30 Moral - 100 Bakır)')
            .button('§8« Kapat');

        form.show(player).then((res) => {
            if (res.canceled || res.selection === 4) return;

            if (res.selection === 0) {
                if (!EconomyEngine.deductMoney(player, 80)) {
                    player.sendMessage('§c[Demirci] Silah dövmek için 80 Bakır Dinar gerekiyor!');
                    return;
                }
                const qualities = ['§7[Sıradan]', '§a[Kaliteli]', '§b[Usta İşi]', '§6[Efsanevi Dövme]'];
                const q = qualities[Math.floor(Math.random() * qualities.length)];
                player.runCommand('give @s megamod:ottoman_yatagan 1');
                player.runCommand('playsound random.anvil_use @s ~ ~ ~ 1 1');
                player.sendMessage(`§6[Demirci] ⚒️ Usta demirci ocağında ${q} §fOsmanlı Yatağanı §6dövüldü!`);
            } else if (res.selection === 1) {
                if (!EconomyEngine.deductMoney(player, 60)) {
                    player.sendMessage('§c[Lonca] Çırak eğitimi için 60 Bakır Dinar gerekiyor!');
                    return;
                }
                const smith = player.dimension.spawnEntity('megamod:artisan_blacksmith', player.location);
                smith.nameTag = '§6⚒️ Lonca Usta Demircisi';
                const baker = player.dimension.spawnEntity('megamod:artisan_baker', player.location);
                baker.nameTag = '§e🥖 Lonca Usta Fırıncısı';
                player.sendMessage('§a[Lonca] Usta Demirci ve Usta Fırıncı eğitildi! Ambar ve dökümhane üretimi hızlandı.');
            } else if (res.selection === 2) {
                this.openDungeonMenu(player);
            } else if (res.selection === 3) {
                if (!EconomyEngine.deductMoney(player, 100)) {
                    player.sendMessage('§c[Şölen] Ziyafet masası için 100 Bakır Dinar gerekiyor!');
                    return;
                }
                fin.morale = 100;
                fin.publicOrder = Math.min(100, fin.publicOrder + 15);
                EconomyEngine.saveFinance(player.id, fin);
                player.runCommand('effect @e[family=soldier,r=40] regeneration 30 1');
                player.runCommand('playsound random.burp @a[r=20] ~ ~ ~ 1 1');
                player.sendMessage('§6[Zafer Şöleni] 🍖 Orduya ve halka büyük ziyafet verildi! Moral %100 oldu!');
            }
        });
    }

    static openDungeonMenu(player) {
        const fin = EconomyEngine.getFinance(player.id);
        const form = new ActionFormData()
            .title('§4⛓️ KRALLIK ZİNDANI & YARGILAMA')
            .body(`§eZindandaki Tutsak Sayısı: §c${fin.prisoners}\n\n` +
                  `§7Yakalanan haydutları ve savaş esirlerini nasıl değerlendireceksiniz?`)
            .button('§6💰 Fidye İste (+120 Bakır Dinar)')
            .button('§e⛏️ Taş Ocağında Esir Amele Yap (İşgücü)')
            .button('§4⚖️ İbret Cezası Ver (+%20 Şehir Asayişi)')
            .button('§a🕊️ Bağışla ve Serbest Bırak (+15 Onur/Şöhret)')
            .button('§8« Geri');

        form.show(player).then((res) => {
            if (res.canceled || res.selection === 4) {
                this.openGuildMenu(player);
                return;
            }
            if (fin.prisoners <= 0) {
                player.sendMessage('§c[Zindan] Şu an zindanda yargılanacak esir bulunmuyor! (Haydutları yenerek esir alabilirsiniz)');
                return;
            }
            fin.prisoners -= 1;
            if (res.selection === 0) {
                EconomyEngine.addMoney(player, 120);
                player.sendMessage('§6[Yargı] Esir ailesine fidye karşılığı teslim edildi! (+120 Bakır)');
            } else if (res.selection === 1) {
                const w = player.dimension.spawnEntity('megamod:slave_worker', player.location);
                w.nameTag = '§7⛏️ Esir Maden İşçisi';
                player.sendMessage('§e[Yargı] Tutsak maden ve tarla işçisi olarak görevlendirildi.');
            } else if (res.selection === 2) {
                fin.publicOrder = Math.min(100, fin.publicOrder + 20);
                player.sendMessage('§4[Yargı] Suçluya meydanda ibret cezası verildi! Şehirdeki hırsızlar korkudan sindi, asayiş +%20 arttı.');
            } else if (res.selection === 3) {
                fin.renown += 15;
                player.sendMessage('§a[Adil Hükümdar] Esiri bağışladınız! Şan ve Onur puanınız +15 yükseldi.');
            }
            EconomyEngine.saveFinance(player.id, fin);
        });
    }

    static openTacticalMap(player) {
        const k = PolygonClaimEngine.getPlayerKingdom(player.id);
        const fin = EconomyEngine.getFinance(player.id);
        const area = k ? PolygonClaimEngine.calculatePolygonArea(k.flags) : 0;
        const title = PolygonClaimEngine.getTitleByArea(area);

        const soldiers = player.dimension.getEntities({ location: player.location, maxDistance: 80, families: ['soldier'] }).length;
        const bandits = player.dimension.getEntities({ location: player.location, maxDistance: 120, families: ['bandit'] }).length;
        const wagons = player.dimension.getEntities({ location: player.location, maxDistance: 80, families: ['wagon'] }).length;

        const form = new ActionFormData()
            .title('§2🗺️ TAKTİK HARİTA & İSTİHBARAT MASASI')
            .body(`§6=== ${k ? k.name.toUpperCase() : 'BAĞIMSIZ ORDULAR'} (${title}) ===\n` +
                  `§e• Konumunuz: §fX: ${Math.round(player.location.x)}, Z: ${Math.round(player.location.z)}\n` +
                  `§e• Sınır Alanı: §a${area} m² §7(${k ? k.flags.length : 0} Köşe Bayrağı)\n` +
                  `§e• Aktif Garnizon: §b${soldiers} Savaşçı §7| Rezerv Ordu: §6${k ? (k.reserveArmy || 0) : 0}\n` +
                  `§e• Sefer Erzak Arabası: ${wagons > 0 ? '§aMevcut (' + wagons + ' Vagon)' : '§cYok (Uzak seferde açlık riski!)'}\n` +
                  `§e• Radar (120m): ${bandits > 0 ? '§c⚠️ ' + bandits + ' Haydut / Düşman Tespit Edildi!' : '§aBölge Güvenli'}\n` +
                  `§e• Şöhret (Renown): §6★ ${fin.renown} §7| Asayiş: §a%${fin.publicOrder}`)
            .button('§e🕊️ Müttefiklere Posta Güvercini Uçur (Yardım Çağır)')
            .button('§6🔥 Tepe İşaret Ateşlerini Yak (Savaş Alarmı)')
            .button('§8« Masadan Ayrıl');

        form.show(player).then((res) => {
            if (res.canceled || res.selection === 2) return;
            if (res.selection === 0) {
                player.sendMessage('§b[Posta Güvercini] 🕊️ Kuşatma yardım mesajınız müttefik krallıklara uçuruldu! Destek birliği yola çıktı.');
                const ally = player.dimension.spawnEntity('megamod:heavy_cavalry', player.location);
                ally.nameTag = '§b🛡️ Müttefik Destek Süvarisi';
            } else if (res.selection === 1) {
                player.runCommand('particle minecraft:huge_explosion_emitter ~ ~6 ~');
                player.runCommand('playsound raid.horn @a ~ ~ ~ 1 0.7');
                player.sendMessage('§6[İşaret Ateşleri] 🔥 Kulelerdeki işaret ateşleri yakıldı! Tüm imparatorluk alarma geçti!');
            }
        });
    }
}
