import { ActionFormData, ModalFormData } from '@minecraft/server-ui';
import { PolygonClaimEngine } from './PolygonClaimEngine.js';

export class FlagUI {
    static openFlagMenu(player) {
        const k = PolygonClaimEngine.getPlayerKingdom(player.id);
        const flagCount = k ? k.flags.length : 0;
        const area = k ? PolygonClaimEngine.calculatePolygonArea(k.flags) : 0;
        const value = area * PolygonClaimEngine.COST_PER_SQM;
        const sellValue = Math.round(value * 0.7);
        const title = PolygonClaimEngine.getTitleByArea(area);

        const form = new ActionFormData()
            .title(`§6İMPERİUM §e- ${title} Sınır Yönetimi`)
            .body(`§eHanedan: §f${k ? k.name : 'Henüz Kurulmadı'} §7(${title})\n` +
                  `§eKöşe Bayrak Sayısı: §6${flagCount} §7(Min 3 bayrak = Üçgen, 4 = Dörtgen, 5+ = Çokgen)\n` +
                  `§eToplam Toprak Alanı: §a${area} m²\n` +
                  `§eArsa Değeri: §6${value} Bakır §7(Geri Satış Bedeli: ${sellValue} Bakır)\n` +
                  `§eVergi Oranı: §b%${k ? k.taxRate : 15}\n\n` +
                  `§7Yeni köşe bayrağı ekleyebilir, son bayrağı taşıyarak sınırı genişletip/daraltabilir veya satabilirsiniz:`);

        form.button('§2🚩 Yeni Köşe Bayrağı Dik (Bulunduğun Konuma)');
        form.button('§6📐 Son Bayrağı Buraya Taşı (Genişlet / Daralt)');
        form.button('§c💰 Son Bayrağı Kaldır & Toprağı Sat (%70 İade)');
        form.button('§b⚖️ Vergi Oranını Ayarla (%5 - %50)');
        form.button('§l§0« Kapat');

        form.show(player).then((res) => {
            if (res.canceled) return;
            if (res.selection === 0) {
                const r = PolygonClaimEngine.addFlag(player, player.location);
                if (!r.success) {
                    player.sendMessage(`§c[Toprak] ${r.reason}`);
                } else {
                    player.sendMessage(`§a[Toprak] ${r.count}. Köşe Bayrağı dikildi! Alan: ${r.area} m² (${r.title}). Ödenen: ${r.costPaid} Bakır.`);
                    player.runCommand('particle minecraft:totem_particle ~ ~1 ~');
                }
            } else if (res.selection === 1) {
                const r = PolygonClaimEngine.moveLastFlag(player, player.location);
                if (!r.success) {
                    player.sendMessage(`§c[Toprak] ${r.reason}`);
                } else if (r.diffArea >= 0) {
                    player.sendMessage(`§a[Toprak] Sınır +${r.diffArea} m² genişletildi! Yeni Alan: ${r.newArea} m². Ödenen fark: ${r.paid} Bakır.`);
                } else {
                    player.sendMessage(`§e[Toprak] Sınır ${r.diffArea} m² daraltıldı! Yeni Alan: ${r.newArea} m². İade alınan: ${r.refund} Bakır.`);
                }
            } else if (res.selection === 2) {
                const r = PolygonClaimEngine.removeLastFlag(player);
                if (r.success) {
                    player.sendMessage(`§e[Toprak] Son bayrak kaldırıldı. Kalan: ${r.remaining} bayrak, Yeni Alan: ${r.area} m². İade: +${r.refund} Bakır.`);
                } else {
                    player.sendMessage('§c[Toprak] Kaldırılacak bayrak bulunamadı!');
                }
            } else if (res.selection === 3) {
                this.openTaxModal(player);
            }
        });
    }

    static openTaxModal(player) {
        const k = PolygonClaimEngine.getPlayerKingdom(player.id);
        if (!k) {
            player.sendMessage('§c[Vergi] Önce en az 1 sınır bayrağı dikerek krallığınızı başlatmalısınız!');
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
                    player.sendMessage('§c[Danışman Uyarısı] Sultanım! Vergi %35 üstüne çıktı, halk huzursuzlanıyor, köylü isyanı çıkabilir!');
                }
            }
        });
    }
}
