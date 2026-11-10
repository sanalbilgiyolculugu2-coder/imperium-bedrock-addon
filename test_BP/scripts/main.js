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

console.warn('>>> [IMPERIUM MASTER] Sistemler Aktif! <<<');

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

 const starterGranted = Boolean(player.getDynamicProperty('imperium:starter_granted'));

 if (!starterGranted) {
 player.setDynamicProperty('imperium:starter_granted', true);
 EconomyEngine.addMoney(player, 1000);

 if (!playerHasItem(player, 'megamod:campaign_compass')) player.runCommand('give @s megamod:campaign_compass 1');
 if (!playerHasItem(player, 'megamod:war_horn')) player.runCommand('give @s megamod:war_horn 1');
 if (!playerHasItem(player, 'megamod:claim_flag')) player.runCommand('give @s megamod:claim_flag 5');

 player.sendMessage('§6========================================');
 player.sendMessage('§e§l[IMPERIUM: BUYUK IMPARATORLUKLAR]');
 player.sendMessage('§fHos geldiniz Hukumdarim! Hazineniz: §a1000 Bakir Dinar');
 player.sendMessage('§e▸ 1. Slot: §fImparatorluk Asasi (Saray Divani & Rehber)');
 player.sendMessage('§e▸ 2. Slot: §fSavas Borusu (Ordu Komuta & Taktik Emirler)');
 player.sendMessage('§e▸ 3. Slot: §fSinir Kazigi (3D Sinir Bayragi & Koy Kurma)');
 player.sendMessage('§7────────────────────────────────');
 player.sendMessage('§a1. Adim: §fBir bolge secin ve Sinir Kazigi ile 3 kose bayragi dikerek ilk koyunuzu kurun!');
 player.sendMessage('§6========================================');

 try {
 player.onScreenDisplay.setTitle('§6[IMPERIUM]', {
 stayDuration: 60,
 fadeInDuration: 10,
 fadeOutDuration: 15,
 subtitle: '§e1. Slottaki Imparatorluk Asasina sag tiklayin!'
 });
 } catch (e) {}

 system.runTimeout(() => {
 if (!NationManager.getPlayerNation(player)) {
 NationSelectUI.openSelectionMenu(player, (busy) => {
 if (busy) {
 system.runTimeout(() => {
 if (!NationManager.getPlayerNation(player)) {
 NationSelectUI.openSelectionMenu(player);
 }
 }, 40);
 }
 });
 } else {
 const k = PolygonClaimEngine.getPlayerKingdom(player.id);
 if (!k || !k.flags || k.flags.length < 3) {
 ImperialHubUI.openOnboardingGuide(player, (busy) => {
 if (busy) {
 system.runTimeout(() => {
 ImperialHubUI.openOnboardingGuide(player);
 }, 40);
 }
 });
 }
 }
 }, 30);
 } else {
 if (!playerHasItem(player, 'megamod:campaign_compass')) player.runCommand('give @s megamod:campaign_compass 1');
 if (!playerHasItem(player, 'megamod:war_horn')) player.runCommand('give @s megamod:war_horn 1');
 if (!playerHasItem(player, 'megamod:claim_flag')) player.runCommand('give @s megamod:claim_flag 3');
 player.sendMessage('§6[IMPERIUM] §eHukumdar yeniden dogdu! (Yonetim icin Imparatorluk Asasini kullanin)');
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
 CityAndDungeonUI.openGuildMenu(player);
 break;
 case 'megamod:tactical_map_table':
 CityAndDungeonUI.openTacticalMap(player);
 break;
 case 'megamod:quest_ledger':
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
 case 'megamod:powder_keg':
 SiegeEngine.useSapperPowderKeg(player);
 break;
 case 'megamod:grappling_hook':
 SiegeEngine.useGrapplingHook(player);
 break;
 case 'megamod:fire_bucket':
 SiegeEngine.useFireBucket(player);
 break;
 case 'megamod:castle_gate_lever':
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
 MilitaryController.reviveWoundedSoldier(player);
 break;
 case 'megamod:relic_fatih_sword':
 case 'megamod:relic_caesar_gladius':
 case 'megamod:relic_excalibur':
 case 'megamod:relic_khan_bow':
 MilitaryController.triggerRelicPower(player, item.typeId);
 break;
 case 'megamod:alarm_bell':
 player.runCommand('playsound random.bell @a ~ ~ ~ 1 1');
 player.sendMessage('§c[ALARM] Sehir Meydani Cani calindi! Tum askerler savunma mevzilerine kosuyor!');
 break;
 }
}

world.afterEvents.itemUse.subscribe((event) => {
 handleItemUse(event);
});

world.afterEvents.playerInteractWithEntity.subscribe((event) => {
 const player = event.player;
 const target = event.target;
 if (!player || !target) return;

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
