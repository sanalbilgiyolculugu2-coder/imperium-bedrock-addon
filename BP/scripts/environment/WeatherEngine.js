import { world, system } from '@minecraft/server';
import { PolygonClaimEngine } from '../territory/PolygonClaimEngine.js';
import { EconomyEngine } from '../economy/EconomyEngine.js';

export class WeatherEngine {
    static currentWeather = 'Açık ve Güneşli';

    static init() {
        // Her 2 saniyede bir (40 tick): Actionbar HUD, Yol Hız Bonusu ve Süvari Çiğneme Kontrolü
        system.runInterval(() => {
            this.tickPlayerHUDAndMechanics();
        }, 40);

        // Her 5 dakikada bir (6000 tick): Dinamik Mevsim & Hava Olayı
        system.runInterval(() => {
            this.cycleWeather();
        }, 6000);

        // Her 1000 tick: Boşta kalan okları temizle (Ganimetler KESİNLİKLE silinmez)
        system.runInterval(() => {
            this.cleanupSpentProjectiles();
        }, 1000);
    }

    static tickPlayerHUDAndMechanics() {
        for (const player of world.getAllPlayers()) {
            const k = PolygonClaimEngine.getPlayerKingdom(player.id);
            const fin = EconomyEngine.getFinance(player.id);
            const wallet = EconomyEngine.getPlayerMoney(player);
            const area = k ? PolygonClaimEngine.calculatePolygonArea(k.flags) : 0;
            const title = PolygonClaimEngine.getTitleByArea(area);

            const activeSoldiers = player.dimension.getEntities({
                location: player.location,
                maxDistance: 64,
                families: ['soldier']
            }).length;

            // Canlı Mobil Krallık Bilgi Çubuğu (Actionbar HUD)
            const hudText = `§6👑 ${title} §7| §e💰 ${wallet}B (🏦${fin.bankBalance}) §7| §c⚔️ Ordu: ${activeSoldiers}/${k ? (k.reserveArmy || 0) : 0} §7| §a🌾 Erzak: ${fin.granaryRations} §7| §b🌤️ ${this.currentWeather}`;
            player.onScreenDisplay.setActionBar(hudText);

            // Yankesici (Pickpocket) Hırsızlık Kontrolü
            const thieves = player.dimension.getEntities({ location: player.location, maxDistance: 3, type: 'megamod:pickpocket_thief' });
            if (thieves.length > 0 && wallet > 5 && Math.random() < 0.25) {
                EconomyEngine.deductMoney(player, 5);
                player.sendMessage('§c[Yankesici!] 🕵️ Bir pazar hırsızı kesenizden 5 Bakır Dinar çaldı! Muhafızları çağırın!');
            }

            // Kazık ve Dikenli Tuzak Blok Kontrolü (Süvari ve Haydutlara Hasar)
            const enemies = player.dimension.getEntities({ location: player.location, maxDistance: 32, families: ['bandit'] });
            for (const en of enemies) {
                try {
                    const b = en.dimension.getBlock({ x: Math.floor(en.location.x), y: Math.floor(en.location.y), z: Math.floor(en.location.z) });
                    if (b && b.typeId === 'megamod:wooden_stakes_block') {
                        en.applyDamage(18);
                    } else if (b && b.typeId === 'megamod:caltrops_block') {
                        en.applyDamage(6);
                        en.addEffect('slowness', 100, { amplifier: 3 });
                    }
                } catch (e) {}
            }

            // Yol Hız Bonusu (%30 Hız): Oyuncu taş/çakıl/yol bloğu üstündeyse
            try {
                const blockBelow = player.dimension.getBlock({
                    x: Math.floor(player.location.x),
                    y: Math.floor(player.location.y - 1),
                    z: Math.floor(player.location.z)
                });
                if (blockBelow && (blockBelow.typeId.includes('stone_bricks') ||
                                   blockBelow.typeId.includes('cobblestone') ||
                                   blockBelow.typeId.includes('gravel') ||
                                   blockBelow.typeId.includes('grass_path') ||
                                   blockBelow.typeId.includes('dirt_path'))) {
                    player.addEffect('speed', 60, { amplifier: 0, showParticles: false });
                }
            } catch (e) {}
        }
    }

    static cycleWeather() {
        const events = [
            { name: 'Açık & Bereketli', msg: '§a[Hava Durumu] Gökyüzü açıldı! Tarlalar bereketli, ordular tam hızda ilerliyor.' },
            { name: 'Sağanak & Çamur', msg: '§9[Hava Durumu] Sağanak yağmur başladı! Zemin çamurlaştı, ağır kuşatma araçları yavaşladı.' },
            { name: 'Yoğun Sis (Pusu Havası)', msg: '§7[Hava Durumu] Savaş alanına yoğun sis çöktü! Görüş mesafesi düştü, pusu için kusursuz an!' },
            { name: 'Şiddetli Kar & Tipi', msg: '§b[Hava Durumu] Dondurucu tipi başladı! Kamp ateşlerinden uzaklaşan ordular üşüyor.' },
            { name: 'Kuraklık & Sıcak', msg: '§6[Hava Durumu] Sıcak dalgası! Pazarda buğday ve su fiyatları yükselişe geçti.' }
        ];
        const chosen = events[Math.floor(Math.random() * events.length)];
        this.currentWeather = chosen.name;
        for (const player of world.getAllPlayers()) {
            player.sendMessage(chosen.msg);
        }
    }

    static cleanupSpentProjectiles() {
        for (const player of world.getAllPlayers()) {
            try {
                player.runCommand('kill @e[type=arrow,r=50]');
            } catch (e) {}
        }
    }
}
