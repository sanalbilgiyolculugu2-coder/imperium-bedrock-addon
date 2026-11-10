import { world } from '@minecraft/server';
import { ActionFormData } from '@minecraft/server-ui';
import { EconomyEngine } from '../economy/EconomyEngine.js';

export class SiegeEngine {
    static gateHp = 500;
    static maxGateHp = 500;

    static triggerTarCauldron(player) {
        player.runCommand('particle minecraft:lava_particle ~ ~-1 ~');
        player.runCommand('damage @e[r=7,family=!player,family=!soldier] 24 fire');
        player.runCommand('playsound bucket.empty_lava @a ~ ~ ~ 1 1');
        player.sendMessage('§4[Sur Savunması] 🔥 Kaynar Katran Kazanı devrildi! Sura tırmanan düşmanlar yandı!');
    }

    static useSapperPowderKeg(player) {
        this.gateHp = Math.max(0, this.gateHp - 250);
        player.runCommand('particle minecraft:huge_explosion_emitter ~ ~1 ~');
        player.runCommand('playsound random.explode @a ~ ~ ~ 1 0.8');
        player.runCommand('clear @s megamod:sapper_powder_keg 0 1');

        if (this.gateHp === 0) {
            player.sendMessage('§4[LAĞIMCI PATLAMASI!] 💥 Surların altı havaya uçtu! Kale Kapısı (0/500 HP) tamamen yıkıldı, gedik açıldı!');
            this.gateHp = 500;
            this.openCityConquestDecision(player);
        } else {
            player.sendMessage(`§6[Lağımcı Tüneli] 💥 Barut fıçısı patladı! Düşman Sur/Kapı Dayanıklılığı: §c${this.gateHp}/${this.maxGateHp} HP`);
        }
    }

    static useGrapplingHook(player) {
        const view = player.getViewDirection();
        player.applyKnockback(view.x, view.z, 1.8, 1.35);
        player.runCommand('playsound random.bow @s ~ ~ ~ 1 0.8');
        player.sendMessage('§e[Kuşatma Kancası] 🧗 Halat kanca sur burçlarına takıldı, yukarı çekiliyorsunuz!');
    }

    static useFireBucket(player) {
        player.runCommand('extinguish @e[r=8]');
        player.runCommand('particle minecraft:water_splash_particle ~ ~1 ~');
        player.runCommand('playsound bucket.empty_water @a ~ ~ ~ 1 1');
        player.sendMessage('§b[İtfaiye] 🪣 Alevler ve yanan kuşatma araçları su kovasıyla söndürüldü!');
    }

    static openCastleGateMenu(player) {
        const form = new ActionFormData()
            .title('§4🏰 KALE KAPISI & KUŞATMA MÜZAKERESİ')
            .body(`§eKale Sur & Kapı Dayanıklılığı: §a${this.gateHp} / ${this.maxGateHp} HP\n\n` +
                  `§7Kapıyı onarabilir, koçbaşıyla zorlayabilir veya kuşatılan düşman garnizonuna teslim olma şartları sunabilirsiniz:`)
            .button('§a🔨 Kapıyı ve Surları Onar (+200 HP - 60 Bakır)')
            .button('§c🐏 Koçbaşı & Mancınık Darbesi Vur (-150 HP)')
            .button('§e🏳️ Garnizona "Şerefli Çıkış / Teslim Ol" Teklif Et')
            .button('§8« Kapat');

        form.show(player).then((res) => {
            if (res.canceled || res.selection === 3) return;
            if (res.selection === 0) {
                if (EconomyEngine.deductMoney(player, 60)) {
                    this.gateHp = Math.min(this.maxGateHp, this.gateHp + 200);
                    player.sendMessage(`§a[Sur Onarımı] Kale kapısı güçlendirildi! Güncel Dayanıklılık: ${this.gateHp}/${this.maxGateHp} HP`);
                } else {
                    player.sendMessage('§c[Sur Onarımı] 60 Bakır Dinar gerekiyor!');
                }
            } else if (res.selection === 1) {
                this.gateHp = Math.max(0, this.gateHp - 150);
                player.runCommand('playsound mob.zombie.woodbreak @a ~ ~ ~ 1 0.6');
                if (this.gateHp === 0) {
                    player.sendMessage('§4[KALE DÜŞTÜ!] 💥 Koçbaşı ana kapıyı parçaladı! Ordu şehre giriyor!');
                    this.gateHp = 500;
                    this.openCityConquestDecision(player);
                } else {
                    player.sendMessage(`§c[Kuşatma Darbesi] GÜMM! Kapı sarsıldı! Kalan Kapı Canı: ${this.gateHp}/${this.maxGateHp} HP`);
                }
            } else if (res.selection === 2) {
                player.sendMessage('§e[Müzakere] 🏳️ Erzakı tükenen düşman garnizonu kan dökülmeden beyaz bayrak çekip kaleyi teslim etti!');
                this.openCityConquestDecision(player);
            }
        });
    }

    static openCityConquestDecision(player) {
        const fin = EconomyEngine.getFinance(player.id);
        const form = new ActionFormData()
            .title('§6👑 FETİH KARARI: ŞEHRİN KADERİ')
            .body('§eKale düştü! Hükümdar olarak ele geçirilen şehre nasıl muamele edeceksiniz?')
            .button('§4🔥 Şehri Yağmala (+600 Bakır Ganimet, +3 Esir, -20 Onur)')
            .button('§a🕊️ Halkı Bağışla ve Koru (+150 Bakır Vergi, +30 Şöhret/Onur)')
            .button('§6👑 Vasal / Haraca Bağla (+300 Bakır Haraç)');

        form.show(player).then((res) => {
            if (res.canceled) return;
            if (res.selection === 0) {
                EconomyEngine.addMoney(player, 600);
                fin.prisoners += 3;
                fin.renown = Math.max(0, fin.renown - 10);
                player.sendMessage('§4[Yağma] Şehir yağmalandı! +600 Bakır Dinar ve +3 Esir ele geçirildi.');
            } else if (res.selection === 1) {
                EconomyEngine.addMoney(player, 150);
                fin.renown += 30;
                fin.publicOrder = Math.min(100, fin.publicOrder + 20);
                player.sendMessage('§a[Adil Fetih] Şehri bağışladınız! Halk size bağlılık yemini etti, Şöhretiniz +30 arttı!');
            } else if (res.selection === 2) {
                EconomyEngine.addMoney(player, 300);
                fin.bankBalance += 200;
                player.sendMessage('§6[Vasallık] Şehir haraca bağlandı! +300 Bakır nakit ve +200 Bakır hazineye aktarıldı.');
            }
            EconomyEngine.saveFinance(player.id, fin);
        });
    }
}
