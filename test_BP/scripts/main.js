import { ActionFormData, ModalFormData } from '@minecraft/server-ui';
try {
    const _origActionShow = ActionFormData.prototype.show;
    ActionFormData.prototype.show = function(player) {
        try { return _origActionShow.call(this, player); }
        catch (e) { return Promise.resolve({ canceled: true }); }
    };
    const _origModalShow = ModalFormData.prototype.show;
    ModalFormData.prototype.show = function(player) {
        try { return _origModalShow.call(this, player); }
        catch (e) { return Promise.resolve({ canceled: true }); }
    };
} catch (e) {}
import { WorldGenManager } from './environment/WorldGenManager.js';
import { SoldierInteractionUI } from './ui/SoldierInteractionUI.js';
import { BlueprintBuilder } from './territory/BlueprintBuilder.js';
import { MultiplayerAndCompassUI } from './ui/MultiplayerAndCompassUI.js';
import { HarborAndMineUI } from './ui/HarborAndMineUI.js';
import { world, system } from '@minecraft/server';
import { EconomyEngine } from './economy/EconomyEngine.js';
import { MarketUI } from './ui/MarketUI.js';
import { TaxCycle } from './economy/TaxCycle.js';
import { FlagUI } from './territory/FlagUI.js';
import { NationSelectUI } from './ui/NationSelectUI.js';
import { NationManager } from './nations/NationManager.js';
import { QuestUI } from './ui/QuestUI.js';
import { MilitaryController } from './military/MilitaryController.js';
import { SiegeEngine } from './siege/SiegeEngine.js';
import { EdictUI } from './siege/EdictUI.js';
import { DiplomacyUI } from './ui/DiplomacyUI.js';
import { SpyUI } from './ui/SpyUI.js';
import { BarracksUI } from './ui/BarracksUI.js';
import { BankAndCaravanUI } from './ui/BankAndCaravanUI.js';
import { CityAndDungeonUI } from './ui/CityAndDungeonUI.js';
import { WeatherEngine } from './environment/WeatherEngine.js';
import { ImperialHubUI } from './ui/ImperialHubUI.js';
import { PolygonClaimEngine } from './territory/PolygonClaimEngine.js';

console.warn('>>> [İMPERİUM MASTER v1.3.0] Tüm Sistemler, Ortaçağ UI, 3D Sınır ve Kışla Kademeleri Aktif! <<<');

TaxCycle.init();
WeatherEngine.init();
MilitaryController.initEscortLoop();

function playerHasItem(player, typeId) {
    try {
        const inv = player.getComponent('inventory');
        if (!inv || !inv.container) return false;
        const c = inv.container;
        for (let i = 0; i < c.size; i++) {
            const it = c.getItem(i);
            if (it && it.typeId === typeId) return true;
        }
    } catch (e) {}
    return false;
}

export function handlePlayerSpawn(event) {
    const player = event.player;
    if (!player) return;
    MilitaryController.applyKingHealth(player);

    const needsKitV3 = !player.hasTag('imperium_kit_v3');
    const missingCompass = !playerHasItem(player, 'megamod:campaign_compass');

    if (event.initialSpawn || needsKitV3 || missingCompass) {
        try { player.addTag('imperium_kit_v3'); } catch (e) {}

        if (needsKitV3) {
            const oldClutter = [
                'megamod:market_terminal', 'megamod:barracks_desk', 'megamod:royal_bank_vault',
                'megamod:guild_crafting_table', 'megamod:tactical_map_table', 'megamod:trade_contract',
                'megamod:diplomatic_seal', 'megamod:spy_kit', 'megamod:quest_ledger',
                'megamod:construction_blueprint', 'megamod:horse_saddlebag', 'megamod:kingdom_passport',
                'megamod:field_bandage', 'megamod:silver_coin', 'megamod:copper_coin',
                'megamod:campaign_compass', 'megamod:war_horn', 'megamod:claim_flag'
            ];
            for (const itemId of oldClutter) {
                try { player.runCommand(`clear @s ${itemId}`); } catch (e) {}
            }
        }

        if (EconomyEngine.getPlayerMoney(player) < 1000) {
            EconomyEngine.addMoney(player, 1000);
        }

        if (!playerHasItem(player, 'megamod:campaign_compass')) {
            player.runCommand('give @s megamod:campaign_compass 1');
        }
        if (!playerHasItem(player, 'megamod:war_horn')) {
            player.runCommand('give @s megamod:war_horn 1');
        }
        if (!playerHasItem(player, 'megamod:claim_flag')) {
            player.runCommand('give @s megamod:claim_flag 5');
        }

        player.sendMessage('§6========================================');
        player.sendMessage('§e§l👑 İMPERİUM: BÜYÜK İMPARATORLUKLAR (v1.3)');
        player.sendMessage('§fHoş geldiniz Hükümdarım! Hazineniz: §a' + EconomyEngine.getPlayerMoney(player) + ' Bakır Dinar');
        player.sendMessage('§e▸ 1. Slot (İmparatorluk Asası): §fSaray Divanı & Kuruluş Rehberi');
        player.sendMessage('§e▸ 2. Slot (Savaş Borusu): §fMuhafız & Ordu Emirleri');
        player.sendMessage('§e▸ 3. Slot (Sınır Kazığı): §f3D Köşe Bayrağı & Köy Kurma');
        player.sendMessage('§6========================================');

        try {
            player.onScreenDisplay.setTitle('§6👑 İMPERİUM', {
                stayDuration: 50,
                fadeInDuration: 10,
                fadeOutDuration: 15,
                subtitle: '§e1. Slottaki İmparatorluk Asasına sağ tıklayın!'
            });
        } catch (e) {}

        system.runTimeout(() => {
            try {
                const pLoc = player.location;
                const existingGuards = player.dimension.getEntities({
                    location: pLoc,
                    maxDistance: 32,
                    families: ['soldier']
                });
                if (existingGuards.length === 0) {
                    const g1 = player.dimension.spawnEntity('megamod:shield_infantry', { x: pLoc.x + 5, y: pLoc.y, z: pLoc.z + 4 });
                    g1.nameTag = '§6🛡️ Hükümdar Muhafızı';
                    MilitaryController.bindSoldierToCommander(g1, player, 'follow');

                    const g2 = player.dimension.spawnEntity('megamod:regular_footman', { x: pLoc.x - 5, y: pLoc.y, z: pLoc.z + 4 });
                    g2.nameTag = '§6⚔️ Hükümdar Muhafızı';
                    MilitaryController.bindSoldierToCommander(g2, player, 'follow');

                    const adv = player.dimension.spawnEntity('megamod:royal_advisor', { x: pLoc.x, y: pLoc.y, z: pLoc.z + 5 });
                    adv.nameTag = '§e📜 Başdanışman Vezir (Tıkla: Rehber & Divan)';
                    MilitaryController.bindSoldierToCommander(adv, player, 'hold');
                }
            } catch (e) {}

            // Yükleme ekranı bitene kadar menüyü güvenle aç (UserBusy korumalı)
            let attempts = 0;
            const tryOpenStartupMenu = () => {
                attempts++;
                if (!NationManager.getPlayerNation(player)) {
                    NationSelectUI.openSelectionMenu(player, (busy) => {
                        if (busy && attempts < 8) system.runTimeout(tryOpenStartupMenu, 25);
                    });
                } else {
                    const k = PolygonClaimEngine.getPlayerKingdom(player.id);
                    if (!k || k.flags.length < 3) {
                        ImperialHubUI.openOnboardingGuide(player, (busy) => {
                            if (busy && attempts < 8) system.runTimeout(tryOpenStartupMenu, 25);
                        });
                    }
                }
            };
            tryOpenStartupMenu();
        }, 40);
    } else {
        player.sendMessage('§6[İMPERİUM] §eHükümdar yeniden doğdu! (Menü için İmparatorluk Asasını kullanın)');
    }
}

world.afterEvents.playerSpawn.subscribe((event) => {
    handlePlayerSpawn(event);
});

export function handleItemUse(event) {
    const item = event.itemStack;
    const player = event.source;
    if (!item || !player) return;

    switch (item.typeId) {
        case 'megamod:campaign_compass':
            ImperialHubUI.openMainHub(player);
            break;
        case 'megamod:war_horn':
            MilitaryController.handleWarHornUse(player);
            break;
        case 'megamod:claim_flag':
            if (player.isSneaking) {
                FlagUI.placeFlagDirectly(player);
            } else {
                FlagUI.openFlagMenu(player);
            }
            break;
        case 'megamod:market_terminal':
            MarketUI.openMainMenu(player);
            break;
        case 'megamod:barracks_desk':
            BarracksUI.openBarracksMenu(player);
            break;
        case 'megamod:royal_bank_vault':
            BankAndCaravanUI.openBankMenu(player);
            break;
        case 'megamod:trade_contract':
            BankAndCaravanUI.openCaravanMenu(player);
            break;
        case 'megamod:guild_crafting_table':
        case 'megamod:feast_table':
            CityAndDungeonUI.openGuildMenu(player);
            break;
        case 'megamod:tactical_map_table':
        case 'megamod:commander_spyglass':
            CityAndDungeonUI.openTacticalMap(player);
            break;
        case 'megamod:quest_ledger':
        case 'megamod:advisor_parchment':
            QuestUI.openQuestMenu(player);
            break;
        case 'megamod:diplomatic_seal':
            DiplomacyUI.openDiplomacyMenu(player);
            break;
        case 'megamod:spy_kit':
            SpyUI.openSpyMenu(player);
            break;
        case 'megamod:royal_throne':
            EdictUI.openThroneMenu(player);
            break;
        case 'megamod:tar_cauldron':
            SiegeEngine.triggerTarCauldron(player);
            break;
        case 'megamod:sapper_powder_keg':
            SiegeEngine.useSapperPowderKeg(player);
            break;
        case 'megamod:grappling_hook':
            SiegeEngine.useGrapplingHook(player);
            break;
        case 'megamod:fire_bucket':
            SiegeEngine.useFireBucket(player);
            break;
        case 'megamod:castle_gate':
            SiegeEngine.openCastleGateMenu(player);
            break;
        case 'megamod:harbor_dock':
            HarborAndMineUI.openHarborMenu(player);
            break;
        case 'megamod:mine_shaft':
            HarborAndMineUI.openMineMenu(player);
            break;
        case 'megamod:toll_gate':
            HarborAndMineUI.triggerTollGate(player);
            break;
        case 'megamod:construction_blueprint':
            BlueprintBuilder.openBlueprintMenu(player);
            break;
        case 'megamod:kingdom_passport':
            MultiplayerAndCompassUI.openPassportAndClanMenu(player);
            break;
        case 'megamod:horse_saddlebag':
            MultiplayerAndCompassUI.openSaddlebagMenu(player);
            break;
        case 'megamod:field_bandage':
        case 'megamod:infirmary_bed':
            MilitaryController.reviveWoundedSoldier(player);
            break;
        case 'megamod:relic_fatih_sword':
        case 'megamod:relic_caesar_gladius':
        case 'megamod:relic_excalibur':
        case 'megamod:relic_khan_bow':
            MilitaryController.triggerRelicPower(player, item.typeId);
            break;
        case 'megamod:town_bell':
            player.runCommand('playsound random.bell @a ~ ~ ~ 1 1');
            player.sendMessage('§c[ALARM] 🔔 Şehir Meydanı Çanı çalındı! Köylüler kaleye sığınıyor, tüm askerler surlara koşuyor!');
            break;
    }
}

world.afterEvents.itemUse.subscribe((event) => {
    handleItemUse(event);
});

world.afterEvents.playerInteractWithEntity.subscribe((event) => {
    const player = event.player;
    const target = event.target;
    if (!target) return;

    if (target.typeId === 'megamod:market_trader') {
        MarketUI.openMainMenu(player);
    } else if (target.typeId === 'megamod:royal_advisor') {
        ImperialHubUI.openMainHub(player);
    } else if (target.typeId === 'megamod:wounded_soldier') {
        MilitaryController.reviveWoundedSoldier(player);
    } else if (target.typeId.startsWith('megamod:') && !target.typeId.includes('bandit') && !target.typeId.includes('thief')) {
        SoldierInteractionUI.openSoldierMenu(player, target);
    }
});

world.afterEvents.entityHurt.subscribe((event) => {
    MilitaryController.handleEntityHurt(event);
});

world.afterEvents.entityDie.subscribe((event) => {
    MilitaryController.handleEntityDie(event);
});
