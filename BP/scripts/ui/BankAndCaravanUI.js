import { ActionFormData } from '@minecraft/server-ui';
import { system } from '@minecraft/server';
import { EconomyEngine } from '../economy/EconomyEngine.js';

export class BankAndCaravanUI {
    static openBankMenu(player) {
        const fin = EconomyEngine.getFinance(player.id);
        const wallet = EconomyEngine.getPlayerMoney(player);

        const form = new ActionFormData()
            .title('§6🏦 KRALİYET BANKASI & TEFECİ KREDİSİ')
            .body(`§eCüzdanınızdaki Nakit: §6${wallet} Bakır Dinar\n` +
                  `§eKraliyet Banka Kasası: §a${fin.bankBalance} Bakır Dinar\n` +
                  `§eTefeci Kredi Borcu: §c${fin.loanDebt} Bakır Dinar\n\n` +
                  `§7Bankadaki altınlarınız ölüm ve yağmaya karşı güvendedir. Acil savaş durumunda tefeciden faizli kredi çekebilirsiniz:`)
            .button('§2📥 Kasaya 100 Bakır Yatır')
            .button('§6📤 Kasadan 100 Bakır Çek')
            .button('§c📜 Tefeciden 500 Bakır Kredi Çek (Geri Ödeme: 650)')
            .button('§a💸 Tefeci Borcunu Kapat (650 Bakır)')
            .button('§8« Kapat');

        form.show(player).then((res) => {
            if (res.canceled || res.selection === 4) return;

            if (res.selection === 0) {
                if (EconomyEngine.deductMoney(player, 100)) {
                    fin.bankBalance += 100;
                    EconomyEngine.saveFinance(player.id, fin);
                    player.sendMessage('§a[Banka] 100 Bakır Dinar Kraliyet Kasasına yatırıldı.');
                } else {
                    player.sendMessage('§c[Banka] Cüzdanınızda 100 Bakır yok!');
                }
            } else if (res.selection === 1) {
                if (fin.bankBalance >= 100) {
                    fin.bankBalance -= 100;
                    EconomyEngine.saveFinance(player.id, fin);
                    EconomyEngine.addMoney(player, 100);
                    player.sendMessage('§6[Banka] Kasadan 100 Bakır Dinar çekildi.');
                } else {
                    player.sendMessage('§c[Banka] Kasada yeterli bakiye yok!');
                }
            } else if (res.selection === 2) {
                if (fin.loanDebt > 0) {
                    player.sendMessage('§c[Tefeci] Önce mevcut borcunuzu kapatmalısınız! Ödenmezse haciz haydutları gönderilecek!');
                    return;
                }
                fin.loanDebt = 650;
                EconomyEngine.saveFinance(player.id, fin);
                EconomyEngine.addMoney(player, 500);
                player.sendMessage('§6[Tefeci] §e500 Bakır Dinar kredi verildi! Vadesinde 650 Bakır ödenmezse kiralık haydutlar şehrinizi basacak!');
            } else if (res.selection === 3) {
                if (fin.loanDebt <= 0) {
                    player.sendMessage('§a[Tefeci] Herhangi bir borcunuz bulunmuyor.');
                    return;
                }
                if (EconomyEngine.deductMoney(player, fin.loanDebt)) {
                    fin.loanDebt = 0;
                    EconomyEngine.saveFinance(player.id, fin);
                    player.sendMessage('§a[Tefeci] Kredi borcunuz tamamen kapatıldı!');
                } else {
                    player.sendMessage(`§c[Tefeci] Borcu kapatmak için ${fin.loanDebt} Bakır Dinar gerekiyor!`);
                }
            }
        });
    }

    static openCaravanMenu(player) {
        const fin = EconomyEngine.getFinance(player.id);

        const form = new ActionFormData()
            .title('§6🐪 KERVAN & PAZAR KARAKOLU YÖNETİMİ')
            .body(`§eAktif Ticaret Kervanları: §a${fin.activeCaravans}\n` +
                  `§eLonca Kervan Sigortası: ${fin.insuredCaravans ? '§aAktif (Yağmaya Karşı Korumalı)' : '§cYok'}\n\n` +
                  `§7Komşu pazarlara ticaret devesi kervanı gönderebilir veya bulunduğunuz bölgeye Yarı Güvenli Pazar Karakolu kurabilirsiniz:`)
            .button('§2🐪 Ticaret Kervanı Gönder (Maliyet: 150 Bakır -> Gelir: 320 Bakır)')
            .button('§b🛡️ Lonca Kervan Sigortası Yaptır (50 Bakır)')
            .button('§6🏰 Yarı Güvenli Pazar Karakolu & Muhafızları Çağır')
            .button('§8« Kapat');

        form.show(player).then((res) => {
            if (res.canceled || res.selection === 3) return;

            if (res.selection === 0) {
                if (!EconomyEngine.deductMoney(player, 150)) {
                    player.sendMessage('§c[Kervan] Kervan donatmak için 150 Bakır Dinar gerekiyor!');
                    return;
                }
                fin.activeCaravans += 1;
                EconomyEngine.saveFinance(player.id, fin);

                const camel = player.dimension.spawnEntity('megamod:pack_camel', player.location);
                camel.nameTag = `§6🐪 ${player.name} Ticaret Kervanı`;
                player.sendMessage('§a[Kervan] Yük devesi kervanı yola çıktı! Sefer tamamlandığında +320 Bakır Dinar getirecek.');

                system.runTimeout(() => {
                    const updatedFin = EconomyEngine.getFinance(player.id);
                    updatedFin.activeCaravans = Math.max(0, updatedFin.activeCaravans - 1);
                    if (Math.random() < 0.2 && !updatedFin.insuredCaravans) {
                        player.sendMessage('§c[Kervan Pususu!] Kervanınız ormanda haydutlar tarafından yağmalandı! (Lonca sigortası yaptırmayı unutmayın)');
                    } else {
                        EconomyEngine.addMoney(player, 320);
                        player.sendMessage('§6[Kervan Döndü!] §aTicaret kervanınız seferini tamamladı ve +320 Bakır Dinar kâr getirdi!');
                    }
                    EconomyEngine.saveFinance(player.id, updatedFin);
                }, 600);
            } else if (res.selection === 1) {
                if (EconomyEngine.deductMoney(player, 50)) {
                    fin.insuredCaravans = true;
                    EconomyEngine.saveFinance(player.id, fin);
                    player.sendMessage('§a[Lonca] Tüm kervanlarınız haydut yağmasına karşı %100 sigortalandı!');
                } else {
                    player.sendMessage('§c[Lonca] Sigorta poliçesi için 50 Bakır Dinar gerekiyor!');
                }
            } else if (res.selection === 2) {
                const pos = player.location;
                const trader = player.dimension.spawnEntity('megamod:market_trader', pos);
                trader.nameTag = '§6💰 Pazar Borsa Tüccarı';
                for (let i = 0; i < 2; i++) {
                    const g = player.dimension.spawnEntity('megamod:elite_market_guard', { x: pos.x + (i === 0 ? 3 : -3), y: pos.y, z: pos.z + 2 });
                    g.nameTag = '§4🛡️ Elit Pazar Muhafızı (1.25x)';
                }
                player.sendMessage('§6[Pazar Karakolu] §aYarı Güvenli Pazar Karakolu ve 1.25x Elit Muhafızlar konuşlandırıldı!');
            }
        });
    }
}
