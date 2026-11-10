import { world, system } from '@minecraft/server';
import { PolygonClaimEngine } from '../territory/PolygonClaimEngine.js';
import { EconomyEngine } from '../economy/EconomyEngine.js';

export class WeatherEngine {
    static currentWeather = 'Açık';

    static init() {
        // Her 2 saniyede bir (40 tick): İsteğe Bağlı Actionbar HUD, Sınır Çizgisi Partikülü ve Yol Hızı
        system.runInterval(() => {
            this.tickPlayerHUDAndMechanics();
        }, 40);

        // Her 5 dakikada bir (6000 tick): Dinamik Mevsim & Hava Olayı
        system.runInterval(() => {
            this.cycleWeather();
        }, 6000);

        // Her 1000 tick: Boşta kalan okları temizle
        system.runInterval(() => {
            this.cleanupSpentProjectiles();
        }, 1000);
    }

    static tickPlayerHUDAndMechanics() {
        for (const player of world.getAllPlayers()) {
            const k = PolygonClaimEngine.getPlayerKingdom(player.id);
            const wallet = EconomyEngine.getPlayerMoney(player);
            const flagCount = k ? k.flags.length : 0;
            const area = flagCount >= 3 ? PolygonClaimEngine.calculatePolygonArea(k.flags) : 0;
            const title = PolygonClaimEngine.getTitleByArea(area, flagCount);

            // Sınır çizgilerini ve köşeleri dünyada görünür kıl!
            if (flagCount >= 1) {
                PolygonClaimEngine.renderAllKingdomBorders(player);
            }

            // Kullanıcı alt barı gizlemediyse sade ve ekranı kaplamayan bilgi göster
            let hideHud = false;
            try {
                hideHud = Boolean(player.getDynamicProperty('imperium:hide_hud'));
            } catch (e) {}

            if (!hideHud) {
                const activeSoldiers = player.dimension.getEntities({
                    location: player.location,
                    maxDistance: 64,
                    families: ['soldier']
                }).length;
                const borderStatus = flagCount < 3 ? `🚩 ${flagCount}/3 Bayrak` : `🚩 ${area}m²`;
                const hudText = `§6👑 ${title} §7| §e💰 ${wallet}B §7| §a${borderStatus} §7| §c⚔️ ${activeSoldiers} Asker`;
                player.onScreenDisplay.setActionBar(hudText);
            }

            // Yankesici (Pickpocket) Hırsızlık Kontrolü
            const thieves = player.dimension.getEntities({ location: player.location, maxDistance: 3, type: 'megamod:pickpocket_thief' });
            if (thieves.length > 0 && wallet > 5 && Math.random() < 0.25) {
                EconomyEngine.deductMoney(player, 5);
                player.sendMessage('§c[Yankesici!] 🕵️ Bir pazar hırsızı kesenizden 5 Bakır Dinar çaldı! Muhafızları çağırın!');
            }

            // Kazık ve Dikenli Tuzak Blok Kontrolü
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

            // Yol Hız Bonusu
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
            { name: 'Açık', msg: '§a[Hava Durumu] Gökyüzü açıldı! Tarlalar bereketli, ordular tam hızda ilerliyor.' },
            { name: 'Sağanak', msg: '§9[Hava Durumu] Sağanak yağmur başladı! Zemin çamurlaştı.' },
            { name: 'Sisli', msg: '§7[Hava Durumu] Savaş alanına sis çöktü!' },
            { name: 'Karlı', msg: '§b[Hava Durumu] Soğuk rüzgarlar esmeye başladı.' },
            { name: 'Sıcak', msg: '§6[Hava Durumu] Sıcak dalgası! Pazarda buğday fiyatları yükseliyor.' }
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
