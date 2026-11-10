import { MilitaryController } from '../military/MilitaryController.js';
import { ActionFormData } from '@minecraft/server-ui';
import { system } from '@minecraft/server';
import { EconomyEngine } from '../economy/EconomyEngine.js';
import { NationManager } from '../nations/NationManager.js';
import { PolygonClaimEngine } from '../territory/PolygonClaimEngine.js';

export const BARRACKS_UNITS = [
    { id: 'megamod:peasant_militia', name: 'Kademe 1: Köylü Milis', cost: 25, timeSec: 4 },
    { id: 'megamod:regular_footman', name: 'Kademe 2: Düzenli Kılıçlı Piyade', cost: 55, timeSec: 6 },
    { id: 'megamod:regular_archer', name: 'Kademe 3: Acemi Okçu', cost: 60, timeSec: 6 },
    { id: 'megamod:shield_infantry', name: 'Kademe 4: Ağır Kalkanlı Piyade', cost: 95, timeSec: 8 },
    { id: 'megamod:heavy_crossbowman', name: 'Kademe 5: Zırh Delen Kundaklı Yaycı', cost: 110, timeSec: 9 },
    { id: 'megamod:heavy_cavalry', name: 'Kademe 6: Ağır Zırhlı Süvari', cost: 160, timeSec: 12 },
    { id: 'SPECIAL_INFANTRY', name: 'Kademe 7: Ulusa Özel Elit Piyade', cost: 210, timeSec: 14 },
    { id: 'SPECIAL_CAVALRY', name: 'Kademe 8: Ulusa Özel Elit Süvari', cost: 260, timeSec: 15 },
    { id: 'megamod:unit_banner_bearer', name: 'Kademe 9: Birlik Sancaktarı & Çavuş', cost: 240, timeSec: 12 },
    { id: 'megamod:battering_ram', name: 'Kuşatma: Islak Deri Çatılı Koçbaşı', cost: 350, timeSec: 15 },
    { id: 'megamod:catapult', name: 'Kuşatma: Ağır Mancınık', cost: 420, timeSec: 16 },
    { id: 'megamod:supply_wagon', name: 'Lojistik: Ordu Erzak Arabası', cost: 180, timeSec: 10 },
    { id: 'megamod:combat_medic', name: 'Uzman: Ordu Sıhhiye Hekimi (Oto-Tedavi)', cost: 190, timeSec: 10 },
    { id: 'megamod:sapper_engineer', name: 'Uzman: Lağımcı Kuşatma Mühendisi', cost: 220, timeSec: 11 },
    { id: 'megamod:fire_brigade_soldier', name: 'Uzman: Şehir Tulumbacısı (Yangın Söndürücü)', cost: 150, timeSec: 8 },
    { id: 'megamod:imperial_cannon', name: 'Ağır Topçu: Osmanlı Şahi Topu Bataryası', cost: 520, timeSec: 18 },
    { id: 'megamod:war_elephant', name: 'Ağır Zırhlı: Kuleli Savaş Fili (Howdah)', cost: 600, timeSec: 20 },
    { id: 'megamod:camel_archer', name: 'Çöl Süvarisi: Zırhlı Deve Okçusu', cost: 230, timeSec: 12 }
];

export class BarracksUI {
    static MAX_ACTIVE_SOLDIERS = 50; // Mobil sıfır-lag aktif savaşçı sınırı

    static resolveSpecialUnit(nation, isCavalry) {
        const mapInfantry = {
            'osmanli': 'megamod:ottoman_janissary',
            'roma': 'megamod:roman_legionary',
            'britanya': 'megamod:british_longbowman',
            'rusya': 'megamod:soviet_red_guard',
            'fransa': 'megamod:shield_infantry',
            'cin': 'megamod:chinese_chukonu',
            'ispanya': 'megamod:shield_infantry',
            'mogol': 'megamod:regular_archer',
            'sparta': 'megamod:spartan_hoplite'
        };
        const mapCavalry = {
            'osmanli': 'megamod:ottoman_sipahi',
            'roma': 'megamod:heavy_cavalry',
            'britanya': 'megamod:heavy_cavalry',
            'rusya': 'megamod:heavy_cavalry',
            'fransa': 'megamod:french_paladin',
            'cin': 'megamod:heavy_cavalry',
            'ispanya': 'megamod:spanish_conquistador',
            'mogol': 'megamod:mongol_keshik',
            'sparta': 'megamod:heavy_cavalry'
        };
        return isCavalry ? (mapCavalry[nation] || 'megamod:heavy_cavalry') : (mapInfantry[nation] || 'megamod:ottoman_janissary');
    }

    static openBarracksMenu(player) {
        const nation = NationManager.getPlayerNation(player) || 'osmanli';
        const discount = nation === 'roma' ? 0.9 : 1.0; // Roma -%10 indirim
        const money = EconomyEngine.getPlayerMoney(player);

        const activeSoldiers = player.dimension.getEntities({
            location: player.location,
            maxDistance: 64,
            families: ['soldier']
        }).length;

        const form = new ActionFormData()
            .title('§4⚔️ İMPERİUM KIŞLA & TALİMGAH')
            .body(`§eCüzdan: §6${money} Bakır Dinar\n` +
                  `§eAktif Savaşçı: §a${activeSoldiers}/${this.MAX_ACTIVE_SOLDIERS} §7(Fazlası Rezerv Orduya katılır)\n` +
                  `${nation === 'roma' ? '§a[Roma Pasifi: -%10 Eğitim İndirimi Aktif]\n' : ''}` +
                  `§7Eğitmek istediğiniz askeri birliği seçin:`);

        for (const u of BARRACKS_UNITS) {
            const finalCost = Math.round(u.cost * discount);
            form.button(`§l§0⚔️ ${u.name}\n§r§0Bedel: ${finalCost} Bakır | Süre: ${u.timeSec}sn`, 'textures/items/ottoman_yatagan');
        }

        form.button('§l§4🚨 ACİL SEFERBERLİK (Anında 3 Milis)\n§r§0Bedel: 100 Bakır Dinar', 'textures/items/war_horn');

        form.show(player).then((res) => {
            if (res.canceled) return;

            if (res.selection === BARRACKS_UNITS.length) {
                if (!EconomyEngine.deductMoney(player, 100)) {
                    player.sendMessage('§c[Kışla] Acil seferberlik için 100 Bakır Dinar gerekiyor!');
                    return;
                }
                for (let i = 0; i < 3; i++) {
                    const e = player.dimension.spawnEntity('megamod:peasant_militia', player.location);
                    e.nameTag = `§e[Muhafız] Köylü Milis`;
                    MilitaryController.bindSoldierToCommander(e, player, 'follow');
                }
                player.sendMessage('§6[Kışla] §aAcil Seferberlik! 3 Köylü Milis silahlandırılıp saflara katıldı!');
                return;
            }

            const chosen = BARRACKS_UNITS[res.selection];
            const finalCost = Math.round(chosen.cost * discount);
            if (!EconomyEngine.deductMoney(player, finalCost)) {
                player.sendMessage(`§c[Kışla] Yetersiz altın! Gereken: ${finalCost} Bakır.`);
                return;
            }

            let entityId = chosen.id;
            if (entityId === 'SPECIAL_INFANTRY') entityId = this.resolveSpecialUnit(nation, false);
            if (entityId === 'SPECIAL_CAVALRY') entityId = this.resolveSpecialUnit(nation, true);

            player.sendMessage(`§e[Kışla Kuyruğu] §f${chosen.name} §7talime başladı (${chosen.timeSec} saniye)...`);

            system.runTimeout(() => {
                const currentCount = player.dimension.getEntities({
                    location: player.location,
                    maxDistance: 64,
                    families: ['soldier']
                }).length;

                if (currentCount >= this.MAX_ACTIVE_SOLDIERS) {
                    const k = PolygonClaimEngine.getPlayerKingdom(player.id);
                    if (k) {
                        const all = PolygonClaimEngine.getAllKingdoms();
                        all[k.id].reserveArmy = (all[k.id].reserveArmy || 0) + 1;
                        PolygonClaimEngine.saveKingdoms(all);
                    }
                    player.sendMessage(`§6[Kışla] §a${chosen.name} eğitimi tamamlandı! (Aktif sınır dolu olduğu için Rezerv Orduya eklendi)`);
                } else {
                    const spawned = player.dimension.spawnEntity(entityId, player.location);
                    spawned.nameTag = `§e★1 ${chosen.name.split(': ')[1]}`;
                    MilitaryController.bindSoldierToCommander(spawned, player, 'follow');
                    player.sendMessage(`§a[Kışla] ⚔️ ${chosen.name} talimini tamamladı ve emrinize girdi!`);
                    player.runCommand('playsound random.anvil_use @s ~ ~ ~ 0.8 1.2');
                }
            }, chosen.timeSec * 20);
        });
    }
}
