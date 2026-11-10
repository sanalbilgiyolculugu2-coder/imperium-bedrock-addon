import { ActionFormData } from '@minecraft/server-ui';
import { EconomyEngine } from '../economy/EconomyEngine.js';
import { PolygonClaimEngine } from './PolygonClaimEngine.js';

export const BLUEPRINTS = [
    {
        name: '⚔️ Askeri Kışla & Talimgah (Kademe 2 Askerleri Açar!)',
        cost: 150,
        unlockTag: 'barracks',
        desc: 'Ağır Kalkanlı Piyade, Kundaklı Yaycı, Sıhhiye Hekimi ve Erzak Arabası kilidini açar.',
        build: (dim, x, y, z) => {
            dim.runCommand(`fill ${x - 4} ${y} ${z - 4} ${x + 4} ${y} ${z + 4} stone_bricks`);
            dim.runCommand(`fill ${x - 4} ${y + 1} ${z - 4} ${x + 4} ${y + 3} ${z + 4} cobblestone hollow`);
            dim.runCommand(`fill ${x - 4} ${y + 4} ${z - 4} ${x + 4} ${y + 4} ${z + 4} dark_oak_planks`);
            dim.runCommand(`setblock ${x} ${y + 1} ${z - 4} air`);
            dim.runCommand(`setblock ${x} ${y + 2} ${z - 4} air`);
            dim.runCommand(`setblock ${x} ${y + 1} ${z} megamod:barracks_desk_block`);
            dim.runCommand(`setblock ${x - 2} ${y + 1} ${z + 2} armor_stand`);
            dim.runCommand(`setblock ${x + 2} ${y + 2} ${z} torch`);
        }
    },
    {
        name: '🏰 Savunma Kulesi & Kale Burcu (Kademe 3 Askerleri Açar!)',
        cost: 220,
        unlockTag: 'castle',
        desc: 'Ağır Süvari, Ulusa Özel Elit Piyade (Yeniçeri/Lejyoner), Sancaktar ve Koçbaşı kilidini açar.',
        build: (dim, x, y, z) => {
            dim.runCommand(`fill ${x - 2} ${y} ${z - 2} ${x + 2} ${y + 7} ${z + 2} stone_bricks hollow`);
            dim.runCommand(`fill ${x - 3} ${y + 7} ${z - 3} ${x + 3} ${y + 8} ${z + 3} chiseled_stone_bricks hollow`);
            dim.runCommand(`setblock ${x} ${y + 1} ${z - 2} oak_door`);
            dim.runCommand(`setblock ${x} ${y + 8} ${z} campfire`);
        }
    },
    {
        name: '💣 Kuşatma & Topçu Dökümhanesi (Kademe 4 İmparatorluk Ordusunu Açar!)',
        cost: 350,
        unlockTag: 'siege',
        desc: 'Ulusa Özel Süvari (Sipahi/Keshik), Osmanlı Şahi Topu, Savaş Fili ve Mancınık kilidini açar.',
        build: (dim, x, y, z) => {
            dim.runCommand(`fill ${x - 4} ${y} ${z - 4} ${x + 4} ${y} ${z + 4} polished_blackstone_bricks`);
            dim.runCommand(`fill ${x - 4} ${y + 1} ${z - 4} ${x + 4} ${y + 3} ${z + 4} stone_bricks hollow`);
            dim.runCommand(`setblock ${x} ${y + 1} ${z - 4} air`);
            dim.runCommand(`setblock ${x} ${y + 2} ${z - 4} air`);
            dim.runCommand(`setblock ${x - 2} ${y + 1} ${z + 2} blast_furnace`);
            dim.runCommand(`setblock ${x + 2} ${y + 1} ${z + 2} anvil`);
            dim.runCommand(`setblock ${x} ${y + 1} ${z} smithing_table`);
        }
    },
    {
        name: '🧱 Kalın Taş Kale Suru (9 Blok Cephe)',
        cost: 120,
        unlockTag: 'castle',
        desc: 'Köyünüzün etrafını çevirmek için 9 blok uzunluğunda, 5 blok yüksekliğinde mazgallı taş sur.',
        build: (dim, x, y, z) => {
            dim.runCommand(`fill ${x - 4} ${y} ${z} ${x + 4} ${y + 4} ${z + 1} stone_bricks`);
            dim.runCommand(`fill ${x - 4} ${y + 5} ${z} ${x + 4} ${y + 5} ${z} cobblestone_wall`);
        }
    },
    {
        name: '🌾 Kraliyet Erzak Ambarı & Değirmen',
        cost: 140,
        unlockTag: null,
        desc: 'Ordunuzun günlük buğday ve erzak kapasitesini artırır.',
        build: (dim, x, y, z) => {
            dim.runCommand(`fill ${x - 3} ${y} ${z - 3} ${x + 3} ${y + 4} ${z + 3} oak_planks hollow`);
            dim.runCommand(`fill ${x - 2} ${y + 1} ${z - 2} ${x + 2} ${y + 1} ${z + 2} hay_block`);
            dim.runCommand(`setblock ${x} ${y + 1} ${z - 3} oak_door`);
        }
    },
    {
        name: '🏪 İpek Yolu Pazar Meydanı & Çeşme',
        cost: 130,
        unlockTag: null,
        desc: 'Şehir ticaretini canlandırır ve köylü mutluluğunu yükseltir.',
        build: (dim, x, y, z) => {
            dim.runCommand(`fill ${x - 3} ${y} ${z - 3} ${x + 3} ${y} ${z + 3} polished_andesite`);
            dim.runCommand(`fill ${x - 3} ${y + 3} ${z - 3} ${x + 3} ${y + 3} ${z + 3} red_wool`);
            dim.runCommand(`setblock ${x} ${y + 1} ${z} water`);
        }
    }
];

export class BlueprintBuilder {
    static openBlueprintMenu(player) {
        const k = PolygonClaimEngine.getPlayerKingdom(player.id);
        const flagCount = k ? k.flags.length : 0;
        const hasVillage = flagCount >= 3;

        const form = new ActionFormData()
            .title('§l§6🏗️ KÖY & KALE BİNA İNŞASI')
            .body(
                `${hasVillage ? '§a✅ Köy Sınırınız Aktif! İstediğiniz binayı inşa edebilirsiniz.' : '§c⚠️ ÖNCE KÖY KURMALISINIZ: Bina inşa etmek için en az 3 Köşe Bayrağı dikmelisiniz!'}\n` +
                `§7────────────────────────────────\n` +
                `§e▸ Kışla Durumu: ${k && k.hasBarracks ? '§a✅ İnşa Edildi (Kademe 2 Açık)' : '§c❌ Kurulmadı'}\n` +
                `§e▸ Kale Durumu: ${k && k.hasCastle ? '§a✅ İnşa Edildi (Kademe 3 Açık)' : '§c❌ Kurulmadı'}\n` +
                `§e▸ Dökümhane: ${k && k.hasSiege ? '§a✅ İnşa Edildi (Kademe 4 Açık)' : '§c❌ Kurulmadı'}\n` +
                `§fİnşa etmek istediğiniz yapıyı seçin (Baktığınız yönde 6 blok önünüze kurulur):`
            );

        for (const b of BLUEPRINTS) {
            form.button(`§l§0${b.name}\n§r§0Bedel: ${b.cost} Bakır | ${b.desc}`, 'textures/items/construction_blueprint');
        }

        form.show(player).then((res) => {
            if (res.canceled) return;
            if (!hasVillage) {
                player.sendMessage('§c[İnşaat] Önce elinizdeki 🚩 Sınır Kazığı ile 3 köşe bayrağı dikerek İlk Köyünüzü kurmalısınız!');
                return;
            }
            const chosen = BLUEPRINTS[res.selection];
            if (!EconomyEngine.deductMoney(player, chosen.cost)) {
                player.sendMessage(`§c[İnşaat] Yetersiz Hazine! ${chosen.name} için ${chosen.cost} Bakır Dinar gerekiyor.`);
                return;
            }

            const view = player.getViewDirection();
            const bx = Math.floor(player.location.x + view.x * 6);
            const by = Math.floor(player.location.y);
            const bz = Math.floor(player.location.z + view.z * 6);

            try {
                chosen.build(player.dimension, bx, by, bz);
                if (chosen.unlockTag) {
                    PolygonClaimEngine.markBuildingConstructed(player.id, chosen.unlockTag);
                }
                player.dimension.runCommand(`particle minecraft:huge_explosion_emitter ${bx} ${by + 2} ${bz}`);
                player.sendMessage(`§a[İmar Dairesi] 🏗️ ${chosen.name} başarıyla inşa edildi!`);
                if (chosen.unlockTag === 'barracks') {
                    player.sendMessage('§6🔓 [Yeni Askerler Açıldı] §eKışla kuruldu! Artık Kışla menüsünden Ağır Piyade, Arbaletçi ve Sıhhiye Hekimi eğitebilirsiniz!');
                } else if (chosen.unlockTag === 'castle') {
                    player.sendMessage('§6🔓 [Yeni Askerler Açıldı] §eKale yapısı kuruldu! Artık Ağır Süvari, Ulusa Özel Elit Piyade (Yeniçeri/Lejyoner) ve Koçbaşı eğitebilirsiniz!');
                } else if (chosen.unlockTag === 'siege') {
                    player.sendMessage('§6🔓 [Yeni Askerler Açıldı] §eDökümhane kuruldu! Artık Osmanlı Şahi Topu, Savaş Fili ve Elit Süvari eğitebilirsiniz!');
                }
            } catch (e) {
                player.sendMessage('§e[İmar] Yapı şablonu yerleştirildi.');
            }
        });
    }
}
