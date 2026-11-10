import { ActionFormData } from '@minecraft/server-ui';
import { EconomyEngine } from '../economy/EconomyEngine.js';
import { NationManager, NATIONS } from '../nations/NationManager.js';
import { PolygonClaimEngine } from '../territory/PolygonClaimEngine.js';
import { NationSelectUI } from './NationSelectUI.js';
import { BarracksUI } from './BarracksUI.js';
import { MarketUI } from './MarketUI.js';
import { BankAndCaravanUI } from './BankAndCaravanUI.js';
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
    static openMainHub(player) {
        const nationKey = NationManager.getPlayerNation(player);
        const nationName = nationKey && NATIONS[nationKey] ? NATIONS[nationKey].name : 'Seçilmedi';
        const money = EconomyEngine.getPlayerMoney(player);
        const kingdom = PolygonClaimEngine.getPlayerKingdom(player.id);
        const area = kingdom ? PolygonClaimEngine.calculatePolygonArea(kingdom.flags) : 0;
        const title = PolygonClaimEngine.getTitleByArea(area);

        const guards = player.dimension.getEntities({
            location: player.location,
            maxDistance: 64,
            families: ['soldier']
        }).length;

        const form = new ActionFormData()
            .title('§l§6👑 İMPERİUM SARAY DİVANI')
            .body(
                `§e▸ Hükümdar: §f${player.name} §7(${title})\n` +
                `§e▸ Uygarlık: §a${nationName}\n` +
                `§e▸ Hazine: §6${money} Bakır Dinar\n` +
                `§e▸ Toprak Alanı: §b${area} m² §7| §eYakındaki Asker: §a${guards}\n` +
                `§7────────────────────────────────\n` +
                `§fYönetmek istediğiniz devlet dairesini seçin:`
            )
            .button('§l§0⚔️ KIŞLA & ASKER EĞİTİMİ\n§r§0Yeni Piyade, Süvari, Topçu ve Fil eğit', 'textures/items/barracks_desk')
            .button('§l§0📯 ORDU KOMUTA & MUHAFIZ EMİRLERİ\n§r§0Takip Et, Hücum, Kalkan Duvarı, Salvo', 'textures/items/war_horn')
            .button('§l§0🚩 ARAZİ SINIRI & HAZIR KALE İNŞASI\n§r§0Toprak genişlet, vergi ayarla, bina kur', 'textures/items/claim_flag')
            .button('§l§0💰 PAZAR BORSASI, BANKA & KERVAN\n§r§0Hammadde al-sat, kredi çek, kervan yolla', 'textures/items/market_terminal')
            .button('§l§0🏰 SARAY FERMANLARI, LONCA & LİMAN\n§r§0Krallık fermanları, üretim, maden, donanma', 'textures/items/royal_throne')
            .button('§l§0🕊️ DİPLOMASİ, CASUSLUK & GÖREVLER\n§r§0İttifak kur, casus yolla, vezir görevleri', 'textures/items/diplomatic_seal')
            .button('§l§0🧰 HÜKÜMDAR CEPHANELİĞİ (EŞYA AL)\n§r§0Sadece ihtiyacın olan özel aracı envantere al', 'textures/items/royal_bank_vault');

        form.show(player).then((res) => {
            if (res.canceled) return;
            switch (res.selection) {
                case 0: BarracksUI.openBarracksMenu(player); break;
                case 1: MilitaryController.openWarHornMenu(player); break;
                case 2: this.openTerritorySubMenu(player); break;
                case 3: MarketUI.openMainMenu(player); break;
                case 4: this.openPalaceAndCitySubMenu(player); break;
                case 5: this.openDiplomacyAndSpySubMenu(player); break;
                case 6: this.openToolboxMenu(player); break;
            }
        });
    }

    static openTerritorySubMenu(player) {
        const form = new ActionFormData()
            .title('§l§2🚩 ARAZİ & ŞEHİR İNŞA DAİRESİ')
            .body('§fToprak sınırlarınızı yönetin veya tek tıkla hazır sur, kışla, kule ve pazar kurun:')
            .button('§l§0🚩 Sınır Bayrakları & Vergi Yönetimi\n§r§0Köşe bayrağı dik, sınırı kaydır, vergi seç', 'textures/items/claim_flag')
            .button('§l§0🏗️ Hazır Kale & Bina Şablonları\n§r§0Gözetleme kulesi, sur, kışla, ambar inşa et', 'textures/items/construction_blueprint')
            .button('§l§0🌍 Dünya Haritası & Rakip Kaleler\n§r§0Yakındaki AI krallıkları ve haydut kampları', 'textures/items/campaign_compass')
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
            .title('§l§6🏰 SARAY, LONCA & DONANMA')
            .body('§fİmparatorluk içişleri, üretim loncaları, madenler ve deniz ticareti:')
            .button('§l§0👑 Kraliyet Fermanları (Taht Odası)\n§r§0Seferberlik, vergi affı ve sıkıyönetim', 'textures/items/royal_throne')
            .button('§l§0⚒️ Esnaf Loncası & Şehir Yönetimi\n§r§0Demirci, fırıncı, zindan ve esir yönetimi', 'textures/items/guild_crafting_table')
            .button('§l§0⚓ Tersane, Donanma & Maden Ocakları\n§r§0Savaş kadırgası, ticaret gemisi ve madenler', 'textures/items/harbor_dock')
            .button('§l§0🗺️ Taktik Savaş Haritası & İttifak Klanı\n§r§0Bölgesel güç raporu ve pasaport/klan', 'textures/items/tactical_map_table')
            .button('§l§0🏛️ Uygarlık Değiştir (5 Büyük Ulus)\n§r§0Osmanlı, Roma, Sparta, Viking, Moğol...', 'textures/items/kingdom_passport')
            .button('§l§0« Saray Divanına Dön', 'textures/items/advisor_parchment');

        form.show(player).then((res) => {
            if (res.canceled) return;
            if (res.selection === 0) EdictUI.openThroneMenu(player);
            else if (res.selection === 1) CityAndDungeonUI.openGuildMenu(player);
            else if (res.selection === 2) HarborAndMineUI.openHarborMenu(player);
            else if (res.selection === 3) MultiplayerAndCompassUI.openPassportAndClanMenu(player);
            else if (res.selection === 4) NationSelectUI.openSelectionMenu(player);
            else this.openMainHub(player);
        });
    }

    static openDiplomacyAndSpySubMenu(player) {
        const form = new ActionFormData()
            .title('§l§9🕊️ DİPLOMASİ, CASUSLUK & GÖREVLER')
            .body('§fDiğer imparatorluklarla antlaşma imzalayın, casus gönderin veya Vezir görevlerini tamamlayın:')
            .button('§l§0🕊️ Elçilik & Devlet Antlaşmaları\n§r§0Ticaret paktı, ittifak, haraç veya savaş ilanı', 'textures/items/diplomatic_seal')
            .button('§l§0🗡️ İstihbarat & Sabotaj Teşkilatı\n§r§0Rakip kalelere casus ve suikastçı sızdır', 'textures/items/spy_kit')
            .button('§l§0📜 Vezir Görevleri & Ödüller\n§r§0İmparatorluk hedeflerini tamamla, altın kazan', 'textures/items/quest_ledger')
            .button('§l§0« Saray Divanına Dön', 'textures/items/advisor_parchment');

        form.show(player).then((res) => {
            if (res.canceled) return;
            if (res.selection === 0) DiplomacyUI.openDiplomacyMenu(player);
            else if (res.selection === 1) SpyUI.openSpyMenu(player);
            else if (res.selection === 2) QuestUI.openQuestMenu(player);
            else this.openMainHub(player);
        });
    }

    static openToolboxMenu(player) {
        const tools = [
            { id: 'megamod:war_horn', amt: 1, name: '📯 Komutan Savaş Borusu', desc: 'Orduna hızlıca Takip/Hücum/Savunma emri verir', icon: 'textures/items/war_horn' },
            { id: 'megamod:claim_flag', amt: 5, name: '🚩 Sınır Kazığı (5 Adet)', desc: 'Toprak sınırı çizer ve genişletir', icon: 'textures/items/claim_flag' },
            { id: 'megamod:field_bandage', amt: 5, name: '🩹 Sıhhiye Sargı Bezi (5 Adet)', desc: 'Yaralı askerleri iyileştirip rütbe atlatır', icon: 'textures/items/field_bandage' },
            { id: 'megamod:construction_blueprint', amt: 3, name: '🏗️ Hazır Kale & Bina Şablonu', desc: 'Sur, kule ve kışla şablonlarını kurar', icon: 'textures/items/construction_blueprint' },
            { id: 'megamod:sapper_powder_keg', amt: 2, name: '💣 Lağımcı Barut Fıçısı', desc: 'Kuşatmada düşman surlarını havaya uçurur', icon: 'textures/items/sapper_powder_keg' },
            { id: 'megamod:tar_cauldron', amt: 1, name: '🔥 Kaynar Katran Kazanı', desc: 'Sur dibindeki düşmanları yakar ve yavaşlatır', icon: 'textures/items/tar_cauldron' },
            { id: 'megamod:grappling_hook', amt: 1, name: '🪝 Kuşatma Tırmanma Kancası', desc: 'Surlara hızla tırmanmayı sağlar', icon: 'textures/items/grappling_hook' },
            { id: 'megamod:ottoman_yatagan', amt: 1, name: '⚔️ Osmanlı Yatağanı (Silah)', desc: 'Keskin yakın dövüş palası (10 Hasar)', icon: 'textures/items/ottoman_yatagan' },
            { id: 'megamod:ottoman_shield', amt: 1, name: '🛡️ Çelik Göbekli Kalkan', desc: 'Sol elde ok ve kılıç darbelerini savuşturur', icon: 'textures/items/ottoman_shield' }
        ];

        const form = new ActionFormData()
            .title('§l§6🧰 HÜKÜMDAR CEPHANELİĞİ')
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
