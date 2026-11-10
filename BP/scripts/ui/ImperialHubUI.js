import { ActionFormData } from '@minecraft/server-ui';
import { EconomyEngine } from '../economy/EconomyEngine.js';
import { NationManager, NATIONS } from '../nations/NationManager.js';
import { PolygonClaimEngine } from '../territory/PolygonClaimEngine.js';
import { NationSelectUI } from './NationSelectUI.js';
import { BarracksUI } from './BarracksUI.js';
import { MarketUI } from './MarketUI.js';
import { FlagUI } from '../territory/FlagUI.js';
import { BlueprintBuilder } from '../territory/BlueprintBuilder.js';
import { MilitaryController } from '../military/MilitaryController.js';
import { DiplomacyUI } from './DiplomacyUI.js';
import { SpyUI } from './SpyUI.js';
import { QuestUI } from './QuestUI.js';
import { EdictUI } from '../siege/EdictUI.js';
import { CityAndDungeonUI } from './CityAndDungeonUI.js';
import { HarborAndMineUI } from './HarborAndMineUI.js';
import { MultiplayerAndCompassUI } from './MultiplayerAndCompassUI.js';
import { WorldGenManager } from '../environment/WorldGenManager.js';

export class ImperialHubUI {
 static getStepGuideText(kingdom, flagCount, guards) {
 if (flagCount < 3) {
 return `§e ŞU ANKİ GÖREVİN (ADIM 1/4): §fİlk Köyünü Kur! (${flagCount}/3 Bayrak)\n` +
 `§7 Elindeki 3. Slot ( Sınır Kazığı) ile 3 farklı köşeye bayrak dikerek köy sınırını kapat.`;
 }
 if (!kingdom || !kingdom.hasBarracks) {
 return `§e ŞU ANKİ GÖREVİN (ADIM 2/4): §fAskeri Kışla İnşa Et!\n` +
 `§7 ' Arazi & Kale İnşası -> Köy Binaları' menüsünden ilk Askeri Kışlanı kur.`;
 }
 if (guards < 5) {
 return `§e ŞU ANKİ GÖREVİN (ADIM 3/4): §fOrdunu Eğit (${guards}/5 Asker)\n` +
 `§7 ' Kışla & Asker Eğitimi' menüsünden yeni açılan piyade ve okçuları eğit.`;
 }
 return `§a ŞU ANKİ GÖREVİN (ADIM 4/4): §fKaleni Büyüt & Fetihlere Başla!\n` +
 `§7 Savunma Kulesi ve Topçu Dökümhanesi kurarak Elit Birimleri ve Şahi Topunu aç!`;
 }

 static openOnboardingGuide(player, onBusyCallback = null) {
 const kingdom = PolygonClaimEngine.getPlayerKingdom(player.id);
 const flagCount = kingdom ? kingdom.flags.length : 0;

 const form = new ActionFormData()
 .title('§l§6 NASIL OYNANIR? (KURULUŞ REHBERİ)')
 .body(
 '§eHoş Geldiniz Hükümdarım! Oyunda ilerlemek için şu 4 adımı takip edin:\n\n' +
 `§a1. ADIM — İLK KÖYÜNÜ KUR (${flagCount}/3 Bayrak):\n` +
 '§fEnvanterinizdeki §e Sınır Kazığı §file birbirinden 10-15 blok uzakta §e3 köşeye bayrak dikin§f. 3. bayrağı diktiğinizde yere fiziksel Sınır Taşları ve Köy Sancağı kurulur!\n\n' +
 '§a2. ADIM — KIŞLA VE KALE İNŞA ET:\n' +
 '§fKöy sınırınız kurulduktan sonra §e Köy & Kale İnşası §fmenüsünden §eAskeri Kışla§f, §eSavunma Kulesi§f ve §eTopçu Dökümhanesi§f kurun.\n\n' +
 '§a3. ADIM — KADEMELİ ASKER EĞİT:\n' +
 '§fBaşlangıçta sadece Köylü Milis açıktır. Köy kurunca Piyade/Okçu, Kışla kurunca Ağır Piyade/Arbalet, Kale kurunca Süvari/Yeniçeri/Topçu açılır!\n\n' +
 '§a4. ADIM — ORDUNA EMİR VER:\n' +
 '§fElindeki §e Savaş Borusu §file askerlerine §eMesafeli Takip§f, §eOlduğun Yerde Bekle (Peşimden Gelme)§f veya §eHücum§f emri ver!'
 )
 .button('§l§0 HEMEN 1. KÖŞE BAYRAĞINI BURAYA DİK!\n§r§0Bulunduğun noktaya ilk fiziksel sınır bayrağını diker', 'textures/items/claim_flag')
 .button('§l§0 SARAY DİVANINA GEÇ (Ana Menü)\n§r§0Tüm krallık yönetim ekranını açar', 'textures/items/campaign_compass');

 form.show(player).then((res) => {
 if (res.canceled) { if (res.cancelationReason === 'UserBusy' && onBusyCallback) onBusyCallback(true); return; }
 if (res.selection === 0) {
 FlagUI.placeFlagDirectly(player);
 } else {
 this.openMainHub(player);
 }
 });
 }

 static openMainHub(player) {
 const nationKey = NationManager.getPlayerNation(player);
 const nationName = nationKey && NATIONS[nationKey] ? NATIONS[nationKey].name : 'Seçilmedi';
 const money = EconomyEngine.getPlayerMoney(player);
 const kingdom = PolygonClaimEngine.getPlayerKingdom(player.id);
 const flagCount = kingdom ? kingdom.flags.length : 0;
 const area = flagCount >= 3 ? PolygonClaimEngine.calculatePolygonArea(kingdom.flags) : 0;
 const title = PolygonClaimEngine.getTitleByArea(area, flagCount);
 const hudHidden = Boolean(player.getDynamicProperty('imperium:hide_hud'));

 const guards = player.dimension.getEntities({
 location: player.location,
 maxDistance: 64,
 families: ['soldier']
 }).length;

 const stepGuide = this.getStepGuideText(kingdom, flagCount, guards);

 const form = new ActionFormData()
 .title('§l§6 İMPERİUM SARAY DİVANI')
 .body(
 `${stepGuide}\n` +
 `§7────────────────────────────────\n` +
 `§e▸ Hükümdar: §f${player.name} §7(${title} - ${nationName})\n` +
 `§e▸ Hazine: §6${money} Bakır Dinar §7| §eSınır: §b${flagCount >= 3 ? area + ' m²' : flagCount + '/3 Bayrak'} §7| §eOrdu: §a${guards}\n` +
 `§7────────────────────────────────`
 )
 .button('§l§0 NASIL OYNANIR? (Adım Adım Kuruluş Rehberi)\n§r§0İlk köyünü kurma, kışla açma ve ordu komut rehberi', 'textures/items/quest_ledger')
 .button(`§l§0 SINIR BAYRAĞI & KÖY İNŞASI (${flagCount}/3 Bayrak)\n§r§03D Sınır Bayrağı dik, Kışla ve Kale binaları kur`, 'textures/items/claim_flag')
 .button('§l§0 KIŞLA & ASKER EĞİTİMİ\n§r§0Köy ve Kışla seviyene göre Piyade, Süvari, Topçu eğit', 'textures/items/barracks_desk')
 .button('§l§0 ORDU KOMUTA & MUHAFIZ EMİRLERİ\n§r§0Mesafeli Takip, Olduğun Yerde Bekle, Taarruz, Kalkan', 'textures/items/war_horn')
 .button('§l§0 PAZAR BORSASI, BANKA & KERVAN\n§r§0Hammadde al-sat, kredi çek, ticaret kervanı yolla', 'textures/items/market_terminal')
 .button('§l§0 SARAY FERMANLARI, LONCA & DİPLOMASİ\n§r§0Fermanlar, lonca üretimi, donanma, casusluk ve elçilik', 'textures/items/royal_throne')
 .button('§l§0 HÜKÜMDAR CEPHANELİĞİ (Özel Eşya Al)\n§r§0Sadece ihtiyacın olan silah ve kuşatma aracını al', 'textures/items/royal_bank_vault')
 .button(`§l§0 ALT EKRAN BİLGİ ÇUBUĞU (HUD): ${hudHidden ? '§cKAPALI' : '§aAÇIK'}\n§r§0Ekranın altındaki bilgi yazısını gizle veya aç`, 'textures/items/advisor_parchment');

 form.show(player).then((res) => {
 if (res.canceled) return;
 switch (res.selection) {
 case 0: this.openOnboardingGuide(player); break;
 case 1: this.openTerritorySubMenu(player); break;
 case 2: BarracksUI.openBarracksMenu(player); break;
 case 3: MilitaryController.openWarHornMenu(player); break;
 case 4: MarketUI.openMainMenu(player); break;
 case 5: this.openPalaceAndCitySubMenu(player); break;
 case 6: this.openToolboxMenu(player); break;
 case 7:
 player.setDynamicProperty('imperium:hide_hud', !hudHidden);
 if (!hudHidden) {
 player.onScreenDisplay.setActionBar('');
 player.sendMessage('§e[Arayüz] Alt bilgi çubuğu (HUD) GİZLENDİ. Ekranınız artık tamamen temiz!');
 } else {
 player.sendMessage('§a[Arayüz] Alt bilgi çubuğu (HUD) tekrar AÇILDI.');
 }
 break;
 }
 });
 }

 static openTerritorySubMenu(player) {
 const k = PolygonClaimEngine.getPlayerKingdom(player.id);
 const flagCount = k ? k.flags.length : 0;

 const form = new ActionFormData()
 .title('§l§2 ARAZİ & KÖY İNŞA DAİRESİ')
 .body(
 `§e▸ Köşe Bayrağı Durumu: §f${flagCount}/3 Bayrak ${flagCount >= 3 ? '§a(Köy Sınırı Aktif!)' : '§c(Köy için 3 bayrak dikin)'}\n` +
 '§fToprak sınırlarınızı yönetin veya sınırınızın içine Kışla, Kale ve Pazar kurun:'
 )
 .button('§l§0 Sınır Bayrakları & Köy Kuruluşu\n§r§0Fiziksel 3D köşe bayrağı dik, sınır çizgisini gör, vergi seç', 'textures/items/claim_flag')
 .button('§l§0 Köy Binaları, Kışla & Kale Şablonları\n§r§0Askeri Kışla, Savunma Kulesi, Dökümhane ve Sur inşa et', 'textures/items/construction_blueprint')
 .button('§l§0 Dünya Haritası & Rakip Kaleler\n§r§0Yakındaki AI krallıkları ve haydut kampları', 'textures/items/campaign_compass')
 .button('§l§0« Saray Divanına Dön', 'textures/items/advisor_parchment');

 form.show(player).then((res) => {
 if (res.canceled) return;
 if (res.selection === 0) FlagUI.openFlagMenu(player);
 else if (res.selection === 1) BlueprintBuilder.openBlueprintMenu(player);
 else if (res.selection === 2) WorldGenManager.openWorldSimMenu(player);
 else this.openMainHub(player);
 });
 }

 static openPalaceAndCitySubMenu(player) {
 const form = new ActionFormData()
 .title('§l§6 SARAY, LONCA & DİPLOMASİ')
 .body('§fİmparatorluk içişleri, üretim loncaları, madenler, diplomasi ve istihbarat:')
 .button('§l§0 Kraliyet Fermanları (Taht Odası)\n§r§0Seferberlik, vergi affı ve sıkıyönetim', 'textures/items/royal_throne')
 .button('§l§0 Esnaf Loncası & Şehir Yönetimi\n§r§0Demirci, fırıncı, zindan ve esir yönetimi', 'textures/items/guild_crafting_table')
 .button('§l§0 Tersane, Donanma & Maden Ocakları\n§r§0Savaş kadırgası, ticaret gemisi ve madenler', 'textures/items/harbor_dock')
 .button('§l§0 Elçilik & Devlet Antlaşmaları\n§r§0Ticaret paktı, ittifak, haraç veya savaş ilanı', 'textures/items/diplomatic_seal')
 .button('§l§0 İstihbarat, Casusluk & Vezir Görevleri\n§r§0Casus yolla veya imparatorluk görevlerinden ödül al', 'textures/items/spy_kit')
 .button('§l§0 Uygarlık Değiştir (Ulus Seçimi)\n§r§0Osmanlı, Roma, Sparta, Britanya, Moğol...', 'textures/items/kingdom_passport')
 .button('§l§0« Saray Divanına Dön', 'textures/items/advisor_parchment');

 form.show(player).then((res) => {
 if (res.canceled) return;
 if (res.selection === 0) EdictUI.openThroneMenu(player);
 else if (res.selection === 1) CityAndDungeonUI.openGuildMenu(player);
 else if (res.selection === 2) HarborAndMineUI.openHarborMenu(player);
 else if (res.selection === 3) DiplomacyUI.openDiplomacyMenu(player);
 else if (res.selection === 4) this.openDiplomacyAndSpySubMenu(player);
 else if (res.selection === 5) NationSelectUI.openSelectionMenu(player);
 else this.openMainHub(player);
 });
 }

 static openDiplomacyAndSpySubMenu(player) {
 const form = new ActionFormData()
 .title('§l§9 DİPLOMASİ, CASUSLUK & GÖREVLER')
 .body('§fDiğer imparatorluklarla antlaşma imzalayın, casus gönderin veya Vezir görevlerini tamamlayın:')
 .button('§l§0 Elçilik & Devlet Antlaşmaları\n§r§0Ticaret paktı, ittifak, haraç veya savaş ilanı', 'textures/items/diplomatic_seal')
 .button('§l§0 İstihbarat & Sabotaj Teşkilatı\n§r§0Rakip kalelere casus ve suikastçı sızdır', 'textures/items/spy_kit')
 .button('§l§0 Vezir Görevleri & Ödüller\n§r§0İmparatorluk hedeflerini tamamla, altın kazan', 'textures/items/quest_ledger')
 .button('§l§0 Taktik Savaş Haritası & İttifak Klanı\n§r§0Bölgesel güç raporu ve pasaport/klan', 'textures/items/tactical_map_table')
 .button('§l§0« Saray Divanına Dön', 'textures/items/advisor_parchment');

 form.show(player).then((res) => {
 if (res.canceled) return;
 if (res.selection === 0) DiplomacyUI.openDiplomacyMenu(player);
 else if (res.selection === 1) SpyUI.openSpyMenu(player);
 else if (res.selection === 2) QuestUI.openQuestMenu(player);
 else if (res.selection === 3) MultiplayerAndCompassUI.openPassportAndClanMenu(player);
 else this.openMainHub(player);
 });
 }

 static openToolboxMenu(player) {
 const tools = [
 { id: 'megamod:war_horn', amt: 1, name: ' Komutan Savaş Borusu', desc: 'Orduna hızlıca Takip/Bekle/Taarruz emri verir', icon: 'textures/items/war_horn' },
 { id: 'megamod:claim_flag', amt: 5, name: ' Sınır Kazığı (5 Adet)', desc: 'Toprak sınırı çizer ve 3D bayrak diker', icon: 'textures/items/claim_flag' },
 { id: 'megamod:field_bandage', amt: 5, name: ' Sıhhiye Sargı Bezi (5 Adet)', desc: 'Yaralı askerleri iyileştirip rütbe atlatır', icon: 'textures/items/field_bandage' },
 { id: 'megamod:construction_blueprint', amt: 3, name: ' Hazır Kale & Bina Şablonu', desc: 'Kışla, sur ve kule şablonlarını kurar', icon: 'textures/items/construction_blueprint' },
 { id: 'megamod:sapper_powder_keg', amt: 2, name: ' Lağımcı Barut Fıçısı', desc: 'Kuşatmada düşman surlarını havaya uçurur', icon: 'textures/items/sapper_powder_keg' },
 { id: 'megamod:tar_cauldron', amt: 1, name: ' Kaynar Katran Kazanı', desc: 'Sur dibindeki düşmanları yakar ve yavaşlatır', icon: 'textures/items/tar_cauldron' },
 { id: 'megamod:grappling_hook', amt: 1, name: ' Kuşatma Tırmanma Kancası', desc: 'Surlara hızla tırmanmayı sağlar', icon: 'textures/items/grappling_hook' },
 { id: 'megamod:ottoman_yatagan', amt: 1, name: ' Osmanlı Yatağanı (Silah)', desc: 'Keskin yakın dövüş palası (10 Hasar)', icon: 'textures/items/ottoman_yatagan' },
 { id: 'megamod:ottoman_shield', amt: 1, name: ' Çelik Göbekli Kalkan', desc: 'Sol elde ok ve kılıç darbelerini savuşturur', icon: 'textures/items/ottoman_shield' }
 ];

 const form = new ActionFormData()
 .title('§l§6 HÜKÜMDAR CEPHANELİĞİ')
 .body('§fEnvanterinizin kalabalık olmaması için araçlar burada saklanır.\n§eSadece ihtiyacınız olan aracı seçip envanterinize alın:');

 for (const t of tools) {
 form.button(`§l§0${t.name}\n§r§0${t.desc}`, t.icon);
 }
 form.button('§l§0« Saray Divanına Dön', 'textures/items/advisor_parchment');

 form.show(player).then((res) => {
 if (res.canceled || res.selection >= tools.length) {
 if (!res.canceled) this.openMainHub(player);
 return;
 }
 const chosen = tools[res.selection];
 player.runCommand(`give @s ${chosen.id} ${chosen.amt}`);
 player.sendMessage(`§a[Cephanelik] §f${chosen.name} (${chosen.amt}x) §aenvanterinize eklendi!`);
 });
 }
}
