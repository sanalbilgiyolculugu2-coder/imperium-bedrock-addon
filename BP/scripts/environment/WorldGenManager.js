import { world, system } from '@minecraft/server';
import { ActionFormData } from '@minecraft/server-ui';
import { EconomyEngine } from '../economy/EconomyEngine.js';

export class WorldGenManager {
    static AI_KINGDOMS = [
        { id: 'osmanli', name: 'Osmanlı İmparatorluğu', power: 1450, wealth: 8200 },
        { id: 'roma', name: 'Roma İmparatorluğu', power: 1380, wealth: 7900 },
        { id: 'britanya', name: 'Britanya Krallığı', power: 1290, wealth: 9100 },
        { id: 'mogol', name: 'Moğol İmparatorluğu', power: 1520, wealth: 6400 },
        { id: 'sparta', name: 'Sparta Şehir Devleti', power: 1490, wealth: 5800 }
    ];

    static initWorldLoops() {
        // 1. Uzman Birlikler (Sıhhiye Hekimi & Tulumbacı) Otomatik Yapay Zeka Döngüsü (Her 6 saniye / 120 tick)
        system.runInterval(() => {
            for (const player of world.getAllPlayers()) {
                const dim = player.dimension;
                const pos = player.location;

                // Sıhhiye Hekimi (combat_medic): Yakındaki yaralı askerleri iyileştirir ve yerdeki ağır yaralıları kaldırır
                try {
                    const medics = dim.getEntities({ location: pos, maxDistance: 40, type: 'megamod:combat_medic' });
                    if (medics.length > 0) {
                        const mPos = medics[0].location;
                        dim.runCommand(`effect @e[family=soldier,x=${mPos.x},y=${mPos.y},z=${mPos.z},r=10] regeneration 6 1 true`);
                        const wounded = dim.getEntities({ location: mPos, maxDistance: 8, type: 'megamod:wounded_soldier' });
                        if (wounded.length > 0) {
                            const w = wounded[0];
                            const wLoc = w.location;
                            w.remove();
                            const revived = dim.spawnEntity('megamod:regular_footman', wLoc);
                            revived.nameTag = '§a★★ Sıhhiye Tarafından Kurtarıldı';
                            revived.triggerEvent('imperium:promote_veteran');
                            player.sendMessage('§a[Sıhhiye Hekimi] ✚ Savaş alanındaki ağır yaralı bir asker hekim tarafından tedavi edilerek saflara döndü!');
                        }
                    }

                    // Tulumbacı (fire_brigade_soldier): Yakındaki yangınları söndürür ve askerlere ateş direnci verir
                    const firefighters = dim.getEntities({ location: pos, maxDistance: 40, type: 'megamod:fire_brigade_soldier' });
                    if (firefighters.length > 0) {
                        const fPos = firefighters[0].location;
                        const fx = Math.floor(fPos.x);
                        const fy = Math.floor(fPos.y);
                        const fz = Math.floor(fPos.z);
                        dim.runCommand(`fill ${fx-6} ${fy-2} ${fz-6} ${fx+6} ${fy+4} ${fz+6} air replace fire`);
                        dim.runCommand(`effect @e[family=soldier,x=${fx},y=${fy},z=${fz},r=10] fire_resistance 10 1 true`);
                    }
                } catch (e) {}

                // Keşif Kontrolü: Oyuncu son keşif noktasından 350 blok uzaklaştığında prosedürel dünya yapısı oluşturur
                const lastGenX = player.getDynamicProperty('imperium:last_gen_x') || 0;
                const lastGenZ = player.getDynamicProperty('imperium:last_gen_z') || 0;
                const dist = Math.hypot(pos.x - lastGenX, pos.z - lastGenZ);
                if (dist > 350) {
                    player.setDynamicProperty('imperium:last_gen_x', Math.round(pos.x));
                    player.setDynamicProperty('imperium:last_gen_z', Math.round(pos.z));
                    const roll = Math.random();
                    if (roll < 0.35) {
                        this.spawnMarketOutpost(player, Math.floor(pos.x + 18), Math.floor(pos.y), Math.floor(pos.z + 18));
                    } else if (roll < 0.70) {
                        this.spawnBanditCamp(player, Math.floor(pos.x + 22), Math.floor(pos.y), Math.floor(pos.z + 22));
                    } else {
                        this.spawnRivalOutpost(player, Math.floor(pos.x + 25), Math.floor(pos.y), Math.floor(pos.z + 25));
                    }
                }
            }
        }, 120);

        // 2. Arka Plan Matematiksel Yapay Zeka Krallık Simülasyonu (Her 5 dakikada bir / 6000 tick)
        system.runInterval(() => {
            const k1 = this.AI_KINGDOMS[Math.floor(Math.random() * this.AI_KINGDOMS.length)];
            const k2 = this.AI_KINGDOMS[Math.floor(Math.random() * this.AI_KINGDOMS.length)];
            if (k1.id !== k2.id) {
                k1.power += 35;
                k2.power = Math.max(500, k2.power - 25);
                k1.wealth += 250;
                for (const p of world.getAllPlayers()) {
                    p.sendMessage(`§8[Dünya Haberi] 🌍 Uzak diyarlarda §6${k1.name}§8, §c${k2.name}§8 sınır karakolunu ele geçirdi! (+250 Hazine)`);
                }
            }
        }, 6000);
    }

    static spawnMarketOutpost(player, x, y, z) {
        const dim = player.dimension;
        try {
            dim.runCommand(`fill ${x-4} ${y-1} ${z-4} ${x+4} ${y-1} ${z+4} stone_bricks`);
            dim.runCommand(`fill ${x-3} ${y+3} ${z-3} ${x+3} ${y+3} ${z+3} yellow_wool`);
            dim.runCommand(`setblock ${x} ${y} ${z} megamod:market_table`);
            dim.runCommand(`setblock ${x+2} ${y} ${z} megamod:bank_vault_block`);
            dim.runCommand(`setblock ${x-2} ${y} ${z} megamod:caravan_post_block`);
            dim.spawnEntity('megamod:market_trader', { x: x, y: y + 1, z: z + 1 });
            dim.spawnEntity('megamod:elite_market_guard', { x: x + 3, y: y + 1, z: z + 2 });
            dim.spawnEntity('megamod:elite_market_guard', { x: x - 3, y: y + 1, z: z + 2 });
            player.sendMessage(`§6[Keşif] 🏪 Yakınlarda Tarafsız Ticaret ve Pazar Karakolu keşfedildi! (X:${x}, Z:${z})`);
        } catch (e) {}
    }

    static spawnBanditCamp(player, x, y, z) {
        const dim = player.dimension;
        try {
            dim.runCommand(`fill ${x-4} ${y-1} ${z-4} ${x+4} ${y-1} ${z+4} coarse_dirt`);
            dim.runCommand(`fill ${x-4} ${y} ${z-4} ${x+4} ${y+1} ${z+4} oak_fence outline`);
            dim.runCommand(`fill ${x-3} ${y} ${z-3} ${x+3} ${y+1} ${z+3} air`);
            dim.runCommand(`setblock ${x} ${y} ${z} campfire`);
            dim.runCommand(`setblock ${x+2} ${y} ${z+2} megamod:spike_barricade_block`);
            const chief = dim.spawnEntity('megamod:bandit_chief', { x: x, y: y + 1, z: z - 1 });
            chief.nameTag = '§4☠️ Haydut Reisi (Aranan Elebaşı)';
            dim.spawnEntity('megamod:bandit_gang_member', { x: x + 2, y: y + 1, z: z });
            dim.spawnEntity('megamod:bandit_gang_member', { x: x - 2, y: y + 1, z: z });
            const captive = dim.spawnEntity('megamod:slave_worker', { x: x, y: y + 1, z: z + 2 });
            captive.nameTag = '§e⛓️ Esir Köylü (Kurtarılmayı Bekliyor)';
            player.sendMessage(`§c[Keşif] 🏴‍☠️ İleride Gizli Haydut Çetesi Kampı tespit edildi! (X:${x}, Z:${z}) - Esirleri kurtarabilir ve ganimet toplayabilirsiniz!`);
        } catch (e) {}
    }

    static spawnRivalOutpost(player, x, y, z) {
        const dim = player.dimension;
        try {
            dim.runCommand(`fill ${x-5} ${y-1} ${z-5} ${x+5} ${y+4} ${z+5} cobblestone hollow`);
            dim.runCommand(`setblock ${x} ${y} ${z-5} megamod:siege_gate_block`);
            dim.runCommand(`setblock ${x} ${y+1} ${z-5} air`);
            dim.runCommand(`setblock ${x} ${y} ${z} megamod:claim_flag_block`);
            const lord = dim.spawnEntity('megamod:rival_kingdom_lord', { x: x, y: y + 1, z: z });
            lord.nameTag = '§5👑 Rakip Krallık Kale Komutanı';
            dim.spawnEntity('megamod:bandit_gang_member', { x: x + 2, y: y + 1, z: z - 2 });
            dim.spawnEntity('megamod:bandit_gang_member', { x: x - 2, y: y + 1, z: z - 2 });
            player.sendMessage(`§4[Keşif] 🏰 Dikkat! Yakınlarda Rakip Yapay Zeka Krallık Sınır Kalesi belirdi! (X:${x}, Z:${z})`);
        } catch (e) {}
    }

    static openWorldSimMenu(player) {
        let simText = `§e--- 🌍 DÜNYA GÜÇ SIRALAMASI (ARKA PLAN AI SİMÜLASYONU) ---\n`;
        for (const k of this.AI_KINGDOMS) {
            simText += `§6• ${k.name}: §c⚔️ Güç: ${k.power} §7| §e💰 Hazine: ${k.wealth}\n`;
        }

        const form = new ActionFormData()
            .title('§2🧭 KEŞİF RADARI & DÜNYA SİMÜLASYONU')
            .body(`${simText}
§7Yakındaki yapıları tarayabilir veya bölgede keşif kolu çıkartarak yeni karakol/kamp bulabilirsiniz:`)
            .button('§6📡 Yakındaki Tüm Karakol, Kamp ve Birlikleri Tara')
            .button('§e🏪 İleride Tarafsız Pazar Karakolu Keşfet (+18m)')
            .button('§c🏴‍☠️ İleride Gizli Haydut Kampı Tespit Et (+20m)')
            .button('§4🏰 İleride Rakip Krallık Sınır Kalesi Tespit Et (+24m)')
            .button('§8« Kapat');

        form.show(player).then((res) => {
            if (res.canceled || res.selection === 4) return;
            const pos = player.location;
            const x = Math.floor(pos.x);
            const y = Math.floor(pos.y);
            const z = Math.floor(pos.z);

            if (res.selection === 0) {
                const bandits = player.dimension.getEntities({ location: pos, maxDistance: 150, families: ['bandit'] });
                const traders = player.dimension.getEntities({ location: pos, maxDistance: 150, families: ['trader'] });
                const soldiers = player.dimension.getEntities({ location: pos, maxDistance: 150, families: ['soldier'] });
                player.sendMessage(`§6[Radar Raporu] §fKonum: (${x}, ${y}, ${z}) | §aDost Asker: ${soldiers.length} | §6Pazar Tüccarı: ${traders.length} | §cHaydut/Rakip: ${bandits.length}`);
            } else if (res.selection === 1) {
                this.spawnMarketOutpost(player, x + 18, y, z + 18);
            } else if (res.selection === 2) {
                this.spawnBanditCamp(player, x + 20, y, z + 20);
            } else if (res.selection === 3) {
                this.spawnRivalOutpost(player, x + 24, y, z + 24);
            }
        });
    }
}
