import { MilitaryController } from '../military/MilitaryController.js';
import { ActionFormData } from '@minecraft/server-ui';
import { system } from '@minecraft/server';
import { EconomyEngine } from '../economy/EconomyEngine.js';
import { NationManager } from '../nations/NationManager.js';
import { PolygonClaimEngine } from '../territory/PolygonClaimEngine.js';
import { FlagUI } from '../territory/FlagUI.js';
import { BlueprintBuilder } from '../territory/BlueprintBuilder.js';

export const BARRACKS_UNITS = [
    { id: 'megamod:peasant_militia', name: 'Kademe 0: Köylü Milis', cost: 25, timeSec: 3, reqTier: 0, reqLabel: 'Başlangıçta Açık' },
    { id: 'megamod:regular_footman', name: 'Kademe 1: Düzenli Kılıçlı Piyade', cost: 55, timeSec: 5, reqTier: 1, reqLabel: 'Köy Kurulumu (3 Bayrak)' },
    { id: 'megamod:regular_archer', name: 'Kademe 1: Acemi Okçu', cost: 60, timeSec: 5, reqTier: 1, reqLabel: 'Köy Kurulumu (3 Bayrak)' },
    { id: 'megamod:shield_infantry', name: 'Kademe 2: Ağır Kalkanlı Piyade', cost: 95, timeSec: 7, reqTier: 2, reqLabel: 'Askeri Kışla Binası' },
    { id: 'megamod:heavy_crossbowman', name: 'Kademe 2: Zırh Delen Kundaklı Yaycı', cost: 110, timeSec: 8, reqTier: 2, reqLabel: 'Askeri Kışla Binası' },
    { id: 'megamod:combat_medic', name: 'Kademe 2: Ordu Sıhhiye Hekimi (Oto-Tedavi)', cost: 190, timeSec: 8, reqTier: 2, reqLabel: 'Askeri Kışla Binası' },
    { id: 'megamod:supply_wagon', name: 'Kademe 2: Ordu Erzak Arabası', cost: 180, timeSec: 8, reqTier: 2, reqLabel: 'Askeri Kışla Binası' },
    { id: 'megamod:fire_brigade_soldier', name: 'Kademe 2: Şehir Tulumbacısı', cost: 150, timeSec: 7, reqTier: 2, reqLabel: 'Askeri Kışla Binası' },
    { id: 'megamod:heavy_cavalry', name: 'Kademe 3: Ağır Zırhlı Süvari', cost: 160, timeSec: 10, reqTier: 3, reqLabel: 'Savunma Kulesi / Kale Suru' },
    { id: 'SPECIAL_INFANTRY', name: 'Kademe 3: Ulusa Özel Elit Piyade', cost: 210, timeSec: 11, reqTier: 3, reqLabel: 'Savunma Kulesi / Kale Suru' },
    { id: 'megamod:unit_banner_bearer', name: 'Kademe 3: Birlik Sancaktarı & Çavuş', cost: 240, timeSec: 10, reqTier: 3, reqLabel: 'Savunma Kulesi / Kale Suru' },
    { id: 'megamod:battering_ram', name: 'Kademe 3: Islak Deri Çatılı Koçbaşı', cost: 350, timeSec: 12, reqTier: 3, reqLabel: 'Savunma Kulesi / Kale Suru' },
    { id: 'megamod:sapper_engineer', name: 'Kademe 3: Lağımcı Kuşatma Mühendisi', cost: 220, timeSec: 10, reqTier: 3, reqLabel: 'Savunma Kulesi / Kale Suru' },
    { id: 'SPECIAL_CAVALRY', name: 'Kademe 4: Ulusa Özel Elit Süvari', cost: 260, timeSec: 12, reqTier: 4, reqLabel: 'Topçu Dökümhanesi / İmparatorluk' },
    { id: 'megamod:catapult', name: 'Kademe 4: Ağır Mancınık', cost: 420, timeSec: 14, reqTier: 4, reqLabel: 'Topçu Dökümhanesi / İmparatorluk' },
    { id: 'megamod:imperial_cannon', name: 'Kademe 4: Osmanlı Şahi Topu Bataryası', cost: 520, timeSec: 15, reqTier: 4, reqLabel: 'Topçu Dökümhanesi / İmparatorluk' },
    { id: 'megamod:war_elephant', name: 'Kademe 4: Kuleli Savaş Fili (Howdah)', cost: 600, timeSec: 16, reqTier: 4, reqLabel: 'Topçu Dökümhanesi / İmparatorluk' },
    { id: 'megamod:camel_archer', name: 'Kademe 4: Zırhlı Deve Okçusu', cost: 230, timeSec: 11, reqTier: 4, reqLabel: 'Topçu Dökümhanesi / İmparatorluk' }
];

export class BarracksUI {
    static MAX_ACTIVE_SOLDIERS = 50;

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

    static getPlayerUnlockedTier(player) {
        const k = PolygonClaimEngine.getPlayerKingdom(player.id);
        if (!k || !k.flags || k.flags.length < 3) return 0; // Henüz köy kurulmadı -> Sadece Köylü Milis!
        const area = PolygonClaimEngine.calculatePolygonArea(k.flags);
        let tier = 1; // Köy kuruldu (Kılıçlı Piyade & Okçu açık)
        if (k.hasBarracks || area >= 250) tier = 2; // Kışla kuruldu
        if (k.hasCastle || area >= 600) tier = Math.max(tier, 3); // Kale kuruldu
        if (k.hasSiege || area >= 1200) tier = Math.max(tier, 4); // İmparatorluk / Dökümhane
        return tier;
    }

    static openBarracksMenu(player) {
        const nation = NationManager.getPlayerNation(player) || 'osmanli';
        const discount = nation === 'roma' ? 0.9 : 1.0;
        const money = EconomyEngine.getPlayerMoney(player);
        const unlockedTier = this.getPlayerUnlockedTier(player);

        const activeSoldiers = player.dimension.getEntities({
            location: player.location,
            maxDistance: 64,
            families: ['soldier']
        }).length;

        const tierDescriptions = [
            '§c0 - Göçebe (Sadece Milis Açık -> Önce 3 Bayrak dikip Köy kurun!)',
            '§e1 - Köy Kuruldu (Piyade & Okçu Açık -> Kademe 2 için Askeri Kışla inşa edin!)',
            '§a2 - Askeri Kışla Aktif (Ağır Piyade & Arbalet Açık -> Kademe 3 için Kale/Kule inşa edin!)',
            '§b3 - Kale Garnizonu Aktif (Süvari & Yeniçeri/Elit Açık -> Kademe 4 için Dökümhane kurun!)',
            '§64 - İmparatorluk Ordusu (Tüm Elit Birimler, Şahi Topu ve Savaş Fili Açık!)'
        ];

        const form = new ActionFormData()
            .title('§l§4⚔️ KIŞLA & ASKER EĞİTİMİ')
            .body(
                `§e▸ Hazine: §6${money} Bakır Dinar §7| §eOrdu: §a${activeSoldiers}/${this.MAX_ACTIVE_SOLDIERS}\n` +
                `§e▸ Kışla Seviyeniz: ${tierDescriptions[unlockedTier]}\n` +
                `§7────────────────────────────────\n` +
                `§fEğitmek istediğiniz birliği seçin (Kilitli birimleri açmak için üzerine tıklayın):`
            );

        for (const u of BARRACKS_UNITS) {
            const finalCost = Math.round(u.cost * discount);
            const isUnlocked = unlockedTier >= u.reqTier;
            if (isUnlocked) {
                form.button(`§l§0✅ ${u.name}\n§r§0Bedel: ${finalCost} Bakır | Süre: ${u.timeSec}sn`, 'textures/items/ottoman_yatagan');
            } else {
                form.button(`§l§8🔒 ${u.name}\n§r§cGereksinim: ${u.reqLabel}`, 'textures/items/claim_flag');
            }
        }

        form.show(player).then((res) => {
            if (res.canceled) return;
            const chosen = BARRACKS_UNITS[res.selection];
            if (!chosen) return;

            if (unlockedTier < chosen.reqTier) {
                player.sendMessage(`§c[Kışla Kilidi] 🔒 '${chosen.name}' birimini eğitmek için önce §e${chosen.reqLabel} §ctamamlamalısınız!`);
                if (chosen.reqTier === 1) {
                    FlagUI.openFlagMenu(player);
                } else {
                    BlueprintBuilder.openBlueprintMenu(player);
                }
                return;
            }

            const finalCost = Math.round(chosen.cost * discount);
            if (!EconomyEngine.deductMoney(player, finalCost)) {
                player.sendMessage(`§c[Kışla] Yetersiz hazine! Gereken: ${finalCost} Bakır Dinar.`);
                return;
            }

            let entityId = chosen.id;
            if (entityId === 'SPECIAL_INFANTRY') entityId = this.resolveSpecialUnit(nation, false);
            if (entityId === 'SPECIAL_CAVALRY') entityId = this.resolveSpecialUnit(nation, true);

            player.sendMessage(`§e[Kışla] ⏳ ${chosen.name} talime başladı (${chosen.timeSec} saniye)...`);

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
                    player.sendMessage(`§6[Kışla] §a${chosen.name} eğitimi tamamlandı ve Rezerv Orduya eklendi.`);
                } else {
                    const pLoc = player.location;
                    const angle = Math.random() * Math.PI * 2;
                    const spawnPos = {
                        x: pLoc.x + Math.cos(angle) * 5.0,
                        y: pLoc.y,
                        z: pLoc.z + Math.sin(angle) * 5.0
                    };
                    const spawned = player.dimension.spawnEntity(entityId, spawnPos);
                    spawned.nameTag = `§e★1 ${chosen.name.split(': ')[1]}`;
                    MilitaryController.bindSoldierToCommander(spawned, player, 'follow');
                    player.sendMessage(`§a[Kışla] ⚔️ ${chosen.name} eğitimi tamamlandı ve 5m mesafede emrinize girdi!`);
                }
            }, chosen.timeSec * 20);
        });
    }
}
