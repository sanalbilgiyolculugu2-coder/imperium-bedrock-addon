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

console.warn('>>> [İMPERİUM MASTER v1.26.62.1] Tüm Sistemler, 33 Varlık, 55+ Eşya ve 3D Modeller Aktif! <<<');

TaxCycle.init();
WeatherEngine.init();

world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    MilitaryController.applyKingHealth(player);

    if (event.initialSpawn) {
        player.sendMessage('§6========================================');
        player.sendMessage('§e§lİMPERİUM: BÜYÜK İMPARATORLUKLAR (v1.26.62.1)');
        player.sendMessage('§7Hoş geldiniz Sürgün Soylu! 32 HP Kral Canı aktif.');
        player.sendMessage('§aEnvanterinize İmparatorluk Başlangıç Kiti eklendi.');
        player.sendMessage('§6========================================');
        
        // Sürgün Edilmiş Soylu Başlangıç Kiti + Sadık Muhafız
        player.runCommand('give @s megamod:market_terminal 1');
        player.runCommand('give @s megamod:claim_flag 5');
        player.runCommand('give @s megamod:war_horn 1');
        player.runCommand('give @s megamod:barracks_desk 1');
        player.runCommand('give @s megamod:royal_bank_vault 1');
        player.runCommand('give @s megamod:guild_crafting_table 1');
        player.runCommand('give @s megamod:tactical_map_table 1');
        player.runCommand('give @s megamod:trade_contract 1');
        player.runCommand('give @s megamod:diplomatic_seal 1');
        player.runCommand('give @s megamod:spy_kit 1');
        player.runCommand('give @s megamod:quest_ledger 1');
        player.runCommand('give @s megamod:construction_blueprint 3');
        player.runCommand('give @s megamod:campaign_compass 1');
        player.runCommand('give @s megamod:horse_saddlebag 1');
        player.runCommand('give @s megamod:kingdom_passport 1');
        player.runCommand('give @s megamod:field_bandage 5');
        player.runCommand('give @s megamod:silver_coin 5');
        player.runCommand('give @s megamod:copper_coin 50');

        // Yanına 1 Kraliyet Danışmanı ve 1 Muhafız Asker çağır
        system.runTimeout(() => {
            try {
                const adv = player.dimension.spawnEntity('megamod:royal_advisor', player.location);
                adv.nameTag = '§6📜 Kraliyet Danışmanı (Vezir)';
                const guard = player.dimension.spawnEntity('megamod:shield_infantry', player.location);
                guard.nameTag = '§b🛡️ Sadık Soylu Muhafızı';
            } catch (e) {}

            if (!NationManager.getPlayerNation(player)) {
                NationSelectUI.openSelectionMenu(player);
            }
        }, 40);
    } else {
        // Kral normal yolla ölürse tahtında/kalesinde tam canla doğar
        player.sendMessage('§6[İMPERİUM] §eHükümdar kalesinde yeniden doğdu! (32 HP Kral Canı yenilendi)');
    }
});

// Eşya Sağ Tıklama Etkileşimleri
world.afterEvents.itemUse.subscribe((event) => {
    const item = event.itemStack;
    const player = event.source;
    if (!item) return;

    switch (item.typeId) {
        case 'megamod:market_terminal':
            MarketUI.openMainMenu(player);
            break;
        case 'megamod:claim_flag':
            FlagUI.openFlagMenu(player);
            break;
        case 'megamod:war_horn':
            MilitaryController.openWarHornMenu(player);
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
        case 'megamod:campaign_compass':
            WorldGenManager.openWorldSimMenu(player);
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

// NPC Varlıklara Tıklama (Tüccar, Danışman, Yaralı Asker)
world.afterEvents.playerInteractWithEntity.subscribe((event) => {
    const player = event.player;
    const target = event.target;
    if (!target) return;

    if (target.typeId === 'megamod:market_trader') {
        MarketUI.openMainMenu(player);
    } else if (target.typeId === 'megamod:royal_advisor') {
        QuestUI.openQuestMenu(player);
    } else if (target.typeId === 'megamod:wounded_soldier') {
        MilitaryController.reviveWoundedSoldier(player);
    } else if (target.typeId === 'megamod:artisan_blacksmith' || target.typeId === 'megamod:artisan_baker') {
        CityAndDungeonUI.openGuildMenu(player);
    } else if (target.typeId.startsWith('megamod:') && !target.typeId.includes('bandit') && !target.typeId.includes('thief')) {
        SoldierInteractionUI.openSoldierMenu(player, target);
    }
});

// Hasar ve Ölüm Olayları
world.afterEvents.entityHurt.subscribe((event) => {
    MilitaryController.handleEntityHurt(event);
});

world.afterEvents.entityDie.subscribe((event) => {
    MilitaryController.handleEntityDie(event);
});
