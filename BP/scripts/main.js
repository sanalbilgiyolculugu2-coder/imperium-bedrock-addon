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

console.warn('>>> [İMPERİUM MASTER v1.26.62.1] Tüm Sistemler, Muhafız Eskort AI ve Saray Divanı Aktif! <<<');

TaxCycle.init();
WeatherEngine.init();
MilitaryController.initEscortLoop();

world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    MilitaryController.applyKingHealth(player);

    if (event.initialSpawn) {
        // Başlangıç hazinesi doğrudan Kraliyet Cüzdanına yatırılır (envanteri kirletmez!)
        if (EconomyEngine.getPlayerMoney(player) < 1000) {
            EconomyEngine.addMoney(player, 1000);
        }

        player.sendMessage('§6========================================');
        player.sendMessage('§e§l👑 İMPERİUM: BÜYÜK İMPARATORLUKLAR');
        player.sendMessage('§fHoş geldiniz Hükümdarım! §a+1.000 Bakır Dinar §fhazinenize eklendi.');
        player.sendMessage('§e▸ 1. Slot (İmparatorluk Asası): §fTüm Krallık, Kışla ve Pazar Menüsü');
        player.sendMessage('§e▸ 2. Slot (Savaş Borusu): §fMuhafız ve Ordu Emirleri');
        player.sendMessage('§e▸ 3. Slot (Sınır Kazığı): §fToprak Alma ve Kale Kurma');
        player.sendMessage('§6========================================');

        // Envanteri kirleten 18 eşya yerine SADECE 3 NET ANAHTAR EŞYA!
        player.runCommand('give @s megamod:campaign_compass 1');
        player.runCommand('give @s megamod:war_horn 1');
        player.runCommand('give @s megamod:claim_flag 5');

        // Yanına 2 Sadık Muhafız ve 1 Kraliyet Danışmanı çağır ve ANINDA YAKIN TAKİP MODUNA BAĞLA!
        system.runTimeout(() => {
            try {
                const pLoc = player.location;
                const g1 = player.dimension.spawnEntity('megamod:shield_infantry', { x: pLoc.x + 2, y: pLoc.y, z: pLoc.z + 1 });
                g1.nameTag = '§6🛡️ Sadık Hükümdar Muhafızı';
                MilitaryController.bindSoldierToCommander(g1, player, 'follow');

                const g2 = player.dimension.spawnEntity('megamod:regular_footman', { x: pLoc.x - 2, y: pLoc.y, z: pLoc.z + 1 });
                g2.nameTag = '§6⚔️ Sadık Hükümdar Muhafızı';
                MilitaryController.bindSoldierToCommander(g2, player, 'follow');

                const adv = player.dimension.spawnEntity('megamod:royal_advisor', { x: pLoc.x, y: pLoc.y, z: pLoc.z + 2.5 });
                adv.nameTag = '§e📜 Kraliyet Başdanışmanı (Vezir)';
                MilitaryController.bindSoldierToCommander(adv, player, 'follow');
            } catch (e) {}

            if (!NationManager.getPlayerNation(player)) {
                NationSelectUI.openSelectionMenu(player);
            }
        }, 30);
    } else {
        player.sendMessage('§6[İMPERİUM] §eHükümdar kalesinde yeniden doğdu! (32 HP Kral Canı yenilendi)');
    }
});

// Eşya Sağ Tıklama Etkileşimleri
world.afterEvents.itemUse.subscribe((event) => {
    const item = event.itemStack;
    const player = event.source;
    if (!item) return;

    switch (item.typeId) {
        case 'megamod:campaign_compass':
            // Ana Hükümdar Asası -> Tüm Menülere Ulaşan Saray Divanı!
            ImperialHubUI.openMainHub(player);
            break;
        case 'megamod:war_horn':
            MilitaryController.openWarHornMenu(player);
            break;
        case 'megamod:claim_flag':
            FlagUI.openFlagMenu(player);
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
});

// NPC Varlıklara Tıklama (Vezir -> Ana Saray Divanı, Tüccar -> Pazar, Asker -> Asker Menüsü)
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
