import { ActionFormData } from '@minecraft/server-ui';
import { PolygonClaimEngine } from '../territory/PolygonClaimEngine.js';
import { EconomyEngine } from '../economy/EconomyEngine.js';

export const QUEST_STAGES = [
 {
 stage: 1,
 title: 'Asama 1: Ilk Koy Kurulusu',
 desc: 'En az 3 Kose Bayragi dikerek resmi koy sinirini aktiflestir.',
 check: (player, k, guards) => k && k.flags && k.flags.length >= 3,
 rewardLabel: '100 Bakir Dinar + 16 Mese Kutugu',
 grant: (player) => {
 EconomyEngine.addMoney(player, 100);
 try { player.runCommand('give @s log 16'); } catch (e) {}
 }
 },
 {
 stage: 2,
 title: 'Asama 2: Askeri Talimgah & Kisla',
 desc: 'Koy sinirinin icine Askeri Kisla Binasi insa et.',
 check: (player, k, guards) => k && k.hasBarracks,
 rewardLabel: '150 Bakir Dinar + 20 Demir Kulcesi',
 grant: (player) => {
 EconomyEngine.addMoney(player, 150);
 try { player.runCommand('give @s iron_ingot 20'); } catch (e) {}
 }
 },
 {
 stage: 3,
 title: 'Asama 3: Muhafiz Garnizonu',
 desc: 'Kisladan en az 5 asker egiterek ordu kur.',
 check: (player, k, guards) => guards >= 5,
 rewardLabel: '200 Bakir Dinar + 2 Agir Kalkan + 32 Ok',
 grant: (player) => {
 EconomyEngine.addMoney(player, 200);
 try {
 player.runCommand('give @s shield 2');
 player.runCommand('give @s arrow 32');
 } catch (e) {}
 }
 },
 {
 stage: 4,
 title: 'Asama 4: Kale & Savunma Burclari',
 desc: 'Savunma Kulesi / Sur insa ederek kaleni guclendir.',
 check: (player, k, guards) => k && k.hasCastle,
 rewardLabel: '300 Bakir Dinar + 1 Sovalye Zirhi',
 grant: (player) => {
 EconomyEngine.addMoney(player, 300);
 try { player.runCommand('give @s iron_chestplate 1'); } catch (e) {}
 }
 },
 {
 stage: 5,
 title: 'Asama 5: Buyuk Imparatorluk',
 desc: 'Toprak alanini 500 m2ye genislet ve 1000 Bakir Dinar biriktir.',
 check: (player, k, guards) => {
 const area = k ? PolygonClaimEngine.calculatePolygonArea(k.flags) : 0;
 const money = EconomyEngine.getPlayerMoney(player);
 return area >= 500 && money >= 1000;
 },
 rewardLabel: '500 Bakir Dinar + Cihan Fatihi Unvani',
 grant: (player) => {
 EconomyEngine.addMoney(player, 500);
 player.sendMessage('§6[Imparatorluk Fatihi] Tebrikler! Cihan Fatihi unvanina eristiniz!');
 }
 }
];

export class QuestUI {
 static openQuestMenu(player) {
 const k = PolygonClaimEngine.getPlayerKingdom(player.id);
 const currentStage = player.getDynamicProperty('imperium:quest_stage') || 1;
 const guards = player.dimension.getEntities({ location: player.location, maxDistance: 64, families: ['soldier'] }).length;

 const currentQuest = QUEST_STAGES.find(q => q.stage === currentStage);
 let statusText = '';

 if (!currentQuest) {
 statusText = '§a[TEBRIKLER!] Tum imparatorluk fetih ve kurulus gorevlerini tamamladiniz!';
 } else {
 const isReady = currentQuest.check(player, k, guards);
 statusText =
 `Gorev: §e${currentQuest.title}\n` +
 `Aciklama: §f${currentQuest.desc}\n` +
 `Durum: ${isReady ? '§a[TAMAMLANDI - Odulu Al]' : '§c[Devam Ediyor - Sartlari Saglayin]'}\n` +
 `Odul: §6${currentQuest.rewardLabel}`;
 }

 const form = new ActionFormData()
 .title('§l[GOREV & FETIH DEFTERI]')
 .body(
 `Mevcut Asama: §e${currentStage}/5\n` +
 `────────────────────────────────\n` +
 `${statusText}`
 );

 if (currentQuest) {
 form.button('[ODULU TALEP ET & ILERLE]');
 }
 form.button('[Kapat]');

 form.show(player).then((res) => {
 if (res.canceled) return;
 if (currentQuest && res.selection === 0) {
 const isReady = currentQuest.check(player, k, guards);
 if (isReady) {
 currentQuest.grant(player);
 player.setDynamicProperty('imperium:quest_stage', currentStage + 1);
 player.sendMessage(`§a[Danisman] Tebrikler Sultanim! '${currentQuest.title}' tamamlandi! Odul: ${currentQuest.rewardLabel}`);
 } else {
 player.sendMessage(`§c[Danisman] Sartlar henuz saglanmadi: ${currentQuest.desc}`);
 }
 }
 });
 }
}
