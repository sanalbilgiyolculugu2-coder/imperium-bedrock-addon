import { ActionFormData, ModalFormData } from '@minecraft/server-ui';
import { PolygonClaimEngine } from './PolygonClaimEngine.js';
import { BlueprintBuilder } from './BlueprintBuilder.js';

export class FlagUI {
    static openFlagMenu(player) {
        const k = PolygonClaimEngine.getPlayerKingdom(player.id);
        const flagCount = k ? k.flags.length : 0;
        const isEstablished = flagCount >= 3;
        const area = isEstablished ? PolygonClaimEngine.calculatePolygonArea(k.flags) : 0;
        const value = area * PolygonClaimEngine.COST_PER_SQM;
        const sellValue = Math.round(value * 0.7);
        const title = PolygonClaimEngine.getTitleByArea(area, flagCount);

        let statusBanner = '';
        if (flagCount === 0) {
            statusBanner = '§c⚠️ SINIR DURUMU: HENÜZ KÖY KURULMADI (0/3 Bayrak)\n§e👉 İlk köyünüzü kurmak için 3 farklı köşeye yürüdükten sonra "Yeni Köşe Bayrağı Dik" butonuna basın!';
        } else if (flagCount < 3) {
            statusBanner = `§6⏳ SINIR DURUMU: TASLAK AŞAMASINDA (${flagCount}/3 Bayrak)\n§e👉 Köy sınırının kapanması için §f${3 - flagCount} köşe bayrağı daha §edikmelisiniz! (10-15 blok öteye yürüyüp dikin)`;
        } else {
            statusBanner = `§a✅ SINIR DURUMU: RESMİ KÖY SINIRI AKTİF (${area} m² - ${title})\n§7Köşe bayrakları ve sınır taşları dünyaya yerleştirildi.`;
        }

        const form = new ActionFormData()
            .title(`§l§6🚩 SINIR & KÖY KURULUŞU`)
            .body(
                `${statusBanner}\n` +
                `§7────────────────────────────────\n` +
                `§e▸ Dikilen Köşe Bayrağı: §f${flagCount} Adet §7(Min 3 = Köy Sınırı)\n` +
                `§e▸ Resmi Toprak Alanı: §a${area} m² §7(Değer: ${value}B)\n` +
                `§e▸ Vergi Oranı: §b%${k ? k.taxRate : 15}\n` +
                `§7💡 İpucu: Elinde Sınır Kazığı varken Eğilerek (Sneak) sağ tıklarsan menü açmadan anında bayrak dikersin!`
            )
            .button(`§l§0🚩 BURAYA KÖŞE BAYRAĞI DİK (${flagCount + 1}. Bayrak)\n§r§0Bulunduğun noktaya fiziksel 3D Sınır Sancağı diker`, 'textures/items/claim_flag')
            .button('§l§0✨ SINIR ÇİZGİLERİNİ GÖSTER (Parlak İşaret)\n§r§0Tüm sınır hatlarını ve köşeleri ışıklı partikülle gösterir', 'textures/items/campaign_compass')
            .button('§l§0📐 SON BAYRAĞI BURAYA TAŞI (Genişlet/Daralt)\n§r§0Son diktiğin bayrağı bulunduğun konuma kaydırır', 'textures/items/construction_blueprint')
            .button('§l§0💰 SON BAYRAĞI SÖK & İADE AL (%70 İade)\n§r§0Son dikilen bayrak direğini kaldırır', 'textures/items/copper_coin')
            .button('§l§0🏗️ KÖY BİNALARI & KIŞLA İNŞA ET\n§r§0Sınırın içine Kışla, Sur, Kule ve Pazar kur', 'textures/items/barracks_desk')
            .button('§l§0⚖️ VERGİ ORANINI AYARLA (%5 - %50)\n§r§0Köylülerden toplanan günlük vergiyi belirle', 'textures/items/royal_bank_vault');

        form.show(player).then((res) => {
            if (res.canceled) return;
            if (res.selection === 0) {
                this.placeFlagDirectly(player);
            } else if (res.selection === 1) {
                PolygonClaimEngine.renderAllKingdomBorders(player);
                player.sendMessage('§a[Sınır Haritası] ✨ Tüm köşe bayraklarınız ve sınır çizgileriniz parlak ışıklarla işaretlendi!');
            } else if (res.selection === 2) {
                const r = PolygonClaimEngine.moveLastFlag(player, player.location);
                if (!r.success) {
                    player.sendMessage(`§c[Toprak] ${r.reason}`);
                } else if (r.diffArea >= 0) {
                    player.sendMessage(`§a[Toprak] Sınır +${r.diffArea} m² genişletildi! Yeni Alan: ${r.newArea} m². Ödenen: ${r.paid} Bakır.`);
                } else {
                    player.sendMessage(`§e[Toprak] Sınır ${r.diffArea} m² daraltıldı! Yeni Alan: ${r.newArea} m². İade: ${r.refund} Bakır.`);
                }
            } else if (res.selection === 3) {
                const r = PolygonClaimEngine.removeLastFlag(player);
                if (r.success) {
                    player.sendMessage(`§e[Toprak] Son bayrak direği söküldü. Kalan: ${r.remaining} bayrak, Alan: ${r.area} m². İade: +${r.refund} Bakır.`);
                } else {
                    player.sendMessage('§c[Toprak] Sökülecek bayrak bulunamadı!');
                }
            } else if (res.selection === 4) {
                BlueprintBuilder.openBlueprintMenu(player);
            } else if (res.selection === 5) {
                this.openTaxModal(player);
            }
        });
    }

    static placeFlagDirectly(player) {
        const r = PolygonClaimEngine.addFlag(player, player.location);
        if (!r.success) {
            player.sendMessage(`§c[Sınır] ${r.reason}`);
            return;
        }
        if (r.count < 3) {
            player.sendMessage(`§e[Sınır] 🚩 ${r.count}/3 Köşe Bayrağı dikildi! Şimdi 10-15 blok öteye yürüyüp ${r.count + 1}. bayrağı dikin.`);
        } else if (r.count === 3) {
            player.sendMessage(`§a========================================`);
            player.sendMessage(`§a🏕️ TEBRİKLER! İLK KÖYÜNÜZ RESMEN KURULDU!`);
            player.sendMessage(`§e▸ Resmi Alan: §f${r.area} m² (${r.title})`);
            player.sendMessage(`§e▸ Köy Meydanı Sancağı merkeze inşa edildi!`);
            player.sendMessage(`§e▸ Sıradaki Hedef: §fİmparatorluk Asası -> Bina Şablonları'ndan 'Askeri Kışla' kurun!`);
            player.sendMessage(`§a========================================`);
        } else {
            player.sendMessage(`§a[Sınır] 🚩 ${r.count}. Köşe Bayrağı dikildi! Yeni Alan: ${r.area} m² (${r.title}).`);
        }
    }

    static openTaxModal(player) {
        const k = PolygonClaimEngine.getPlayerKingdom(player.id);
        if (!k || k.flags.length < 3) {
            player.sendMessage('§c[Vergi] Vergi toplamak için önce en az 3 sınır bayrağı dikerek Köyünüzü kurmalısınız!');
            return;
        }
        const modal = new ModalFormData()
            .title('§l§6Krallık Vergi Oranı')
            .slider('Vergi Yüzdesi (%35 üstü köylü isyanı riski doğurur!)', 5, 50, 5, k.taxRate || 15);

        modal.show(player).then((res) => {
            if (res.canceled) return;
            const newRate = Math.round(res.formValues[0]);
            const all = PolygonClaimEngine.getAllKingdoms();
            if (all[k.id]) {
                all[k.id].taxRate = newRate;
                PolygonClaimEngine.saveKingdoms(all);
                player.sendMessage(`§6[Maliye] Yeni vergi oranı §e%${newRate} §6olarak belirlendi.`);
                if (newRate > 35) {
                    player.sendMessage('§c[Danışman Uyarısı] Sultanım! Vergi %35 üstüne çıktı, halk huzursuzlanıyor!');
                }
            }
        });
    }
}
