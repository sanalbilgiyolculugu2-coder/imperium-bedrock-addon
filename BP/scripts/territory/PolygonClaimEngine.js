import { world, system } from '@minecraft/server';
import { EconomyEngine } from '../economy/EconomyEngine.js';

const CLAIM_PROP = 'imperium:kingdoms_v1';

export class PolygonClaimEngine {
    static COST_PER_SQM = 2; // 1 m² = 2 Bakır Dinar

    static getAllKingdoms() {
        try {
            const raw = world.getDynamicProperty(CLAIM_PROP);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return {};
    }

    static saveKingdoms(data) {
        try {
            world.setDynamicProperty(CLAIM_PROP, JSON.stringify(data));
        } catch (e) {}
    }

    static calculatePolygonArea(pts) {
        if (!pts || pts.length < 2) return 0;
        if (pts.length === 2) {
            const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].z - pts[0].z);
            return Math.max(10, Math.round(dist * 4));
        }
        let sum = 0;
        for (let i = 0; i < pts.length; i++) {
            const p1 = pts[i];
            const p2 = pts[(i + 1) % pts.length];
            sum += (p1.x * p2.z) - (p2.x * p1.z);
        }
        return Math.max(16, Math.round(Math.abs(sum) * 0.5));
    }

    static isPointInPolygon(point, vs) {
        if (!vs || vs.length < 3) return false;
        const x = point.x, z = point.z;
        let inside = false;
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            const xi = vs[i].x, zi = vs[i].z;
            const xj = vs[j].x, zj = vs[j].z;
            const intersect = ((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / ((zj - zi) || 0.0001) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    static isPointInsidePolygon(point, vs) {
        return this.isPointInPolygon(point, vs);
    }

    static getTitleByArea(area, flagCount = 3) {
        if (flagCount < 3) return 'Göçebe (Köy Kurulmadı)';
        if (area < 150) return 'Oba / Köy Beyi';
        if (area < 500) return 'Uçbeyi (Derebeyi)';
        if (area < 1200) return 'Sancakbeyi (Dük)';
        if (area < 2500) return 'Sultan / Kral';
        return 'Cihan İmparatoru';
    }

    static getPlayerKingdom(playerId) {
        const all = this.getAllKingdoms();
        return all[playerId] || null;
    }

    static markBuildingConstructed(playerId, buildingTag) {
        const all = this.getAllKingdoms();
        if (!all[playerId]) return;
        if (buildingTag === 'barracks') all[playerId].hasBarracks = true;
        if (buildingTag === 'castle') all[playerId].hasCastle = true;
        if (buildingTag === 'siege') all[playerId].hasSiege = true;
        this.saveKingdoms(all);
    }

    // Fiziksel 3D Sınır Sancağı Dikme (Oyuncunun dünyada gerçekten gördüğü bayrak direği!)
    static buildPhysicalFlagPost(dimension, pt, flagNumber) {
        if (!dimension || typeof dimension.runCommand !== 'function') return;
        try {
            const x = pt.x, y = pt.y, z = pt.z;
            dimension.runCommand(`setblock ${x} ${y} ${z} chiseled_stone_bricks`);
            dimension.runCommand(`setblock ${x} ${y + 1} ${z} oak_fence`);
            dimension.runCommand(`setblock ${x} ${y + 2} ${z} oak_fence`);
            dimension.runCommand(`setblock ${x} ${y + 3} ${z} red_wool`);
            dimension.runCommand(`setblock ${x} ${y + 4} ${z} torch`);
            dimension.runCommand(`particle minecraft:totem_particle ${x} ${y + 2} ${z}`);
        } catch (e) {}
    }

    static removePhysicalFlagPost(dimension, pt) {
        if (!dimension || typeof dimension.runCommand !== 'function' || !pt) return;
        try {
            const x = pt.x, y = pt.y, z = pt.z;
            for (let dy = 0; dy <= 4; dy++) {
                dimension.runCommand(`setblock ${x} ${y + dy} ${z} air`);
            }
        } catch (e) {}
    }

    // İki köşe bayrağı arasına fiziksel sınır taşları ve parlak çizgi partikülleri çizer
    static renderBorderLineBetween(dimension, p1, p2, placeBlocks = true) {
        if (!dimension || typeof dimension.runCommand !== 'function') return;
        try {
            const dx = p2.x - p1.x;
            const dz = p2.z - p1.z;
            const dist = Math.hypot(dx, dz);
            if (dist < 2 || dist > 160) return;
            const steps = Math.min(60, Math.max(2, Math.floor(dist / 2)));
            for (let i = 1; i < steps; i++) {
                const t = i / steps;
                const bx = Math.round(p1.x + dx * t);
                const bz = Math.round(p1.z + dz * t);
                const by = Math.round(p1.y + (p2.y - p1.y) * t);
                dimension.runCommand(`particle minecraft:villager_happy ${bx} ${by + 1.2} ${bz}`);
                // Her 6 blokta bir yere küçük sınır taşı koy (sınırın nereden geçtiği net gözüksün!)
                if (placeBlocks && (i % 3 === 0)) {
                    dimension.runCommand(`setblock ${bx} ${by} ${bz} stone_brick_slab`);
                }
            }
        } catch (e) {}
    }

    static buildVillageCenterMonument(dimension, flags) {
        if (!dimension || typeof dimension.runCommand !== 'function' || flags.length < 3) return;
        try {
            const cx = Math.round((flags[0].x + flags[1].x + flags[2].x) / 3);
            const cy = Math.round((flags[0].y + flags[1].y + flags[2].y) / 3);
            const cz = Math.round((flags[0].z + flags[1].z + flags[2].z) / 3);
            dimension.runCommand(`fill ${cx - 1} ${cy - 1} ${cz - 1} ${cx + 1} ${cy - 1} ${cz + 1} stone_bricks`);
            dimension.runCommand(`setblock ${cx} ${cy} ${cz} megamod:claim_flag_block`);
            dimension.runCommand(`setblock ${cx} ${cy + 1} ${cz} oak_fence`);
            dimension.runCommand(`setblock ${cx} ${cy + 2} ${cz} gold_block`);
            dimension.runCommand(`setblock ${cx} ${cy + 3} ${cz} torch`);
            dimension.runCommand(`particle minecraft:totem_particle ${cx} ${cy + 2} ${cz}`);
        } catch (e) {}
    }

    static renderAllKingdomBorders(player) {
        try {
            const k = this.getPlayerKingdom(player.id);
            if (!k || !k.flags || k.flags.length < 2) return;
            const dim = player.dimension;
            const pts = k.flags;
            for (let i = 0; i < pts.length; i++) {
                const p1 = pts[i];
                // Parlak köşe partikülü
                if (Math.hypot(player.location.x - p1.x, player.location.z - p1.z) < 64) {
                    dim.runCommand(`particle minecraft:endrod ${p1.x} ${p1.y + 3.5} ${p1.z}`);
                }
                if (pts.length >= 2 && (i < pts.length - 1 || pts.length >= 3)) {
                    const p2 = pts[(i + 1) % pts.length];
                    this.renderBorderLineBetween(dim, p1, p2, false);
                }
            }
        } catch (e) {}
    }

    static addFlag(player, pos) {
        const all = this.getAllKingdoms();
        const pid = player.id;
        if (!all[pid]) {
            all[pid] = {
                id: pid,
                name: `${player.name} Hanedanı`,
                flags: [],
                taxRate: 15,
                happiness: 85,
                population: 5,
                reserveArmy: 0,
                hasBarracks: false,
                hasCastle: false,
                hasSiege: false
            };
        }

        const k = all[pid];
        const newPt = { x: Math.round(pos.x), y: Math.round(pos.y), z: Math.round(pos.z) };

        // Aynı noktaya üst üste dikilmesini önle
        for (const existing of k.flags) {
            if (Math.hypot(existing.x - newPt.x, existing.z - newPt.z) < 3) {
                return {
                    success: false,
                    reason: 'Bu noktada zaten bir sınır bayrağınız var! Biraz uzaklaşıp (en az 5-10 blok öteye) diğer köşeyi dikin.'
                };
            }
        }

        const oldArea = k.flags.length >= 3 ? this.calculatePolygonArea(k.flags) : 0;
        const nextFlags = [...k.flags, newPt];
        const newArea = nextFlags.length >= 3 ? this.calculatePolygonArea(nextFlags) : 0;
        const addedArea = Math.max(0, newArea - oldArea);
        const cost = nextFlags.length === 1 ? 0 : Math.max(10, addedArea * this.COST_PER_SQM);

        if (cost > 0 && !EconomyEngine.deductMoney(player, cost)) {
            return { success: false, reason: `Sınır genişletmek için ${cost} Bakır Dinar gerekiyor!` };
        }

        k.flags = nextFlags;
        this.saveKingdoms(all);

        // Fiziksel 3D Bayrak Direği ve Sınır Çizgisi İnşa Et!
        this.buildPhysicalFlagPost(player.dimension, newPt, k.flags.length);
        if (k.flags.length >= 2) {
            const prevPt = k.flags[k.flags.length - 2];
            this.renderBorderLineBetween(player.dimension, prevPt, newPt, true);
        }
        if (k.flags.length >= 3) {
            this.renderBorderLineBetween(player.dimension, newPt, k.flags[0], true);
        }
        if (k.flags.length === 3) {
            this.buildVillageCenterMonument(player.dimension, k.flags);
            try {
                player.onScreenDisplay.setTitle('§a🏕️ KÖY SINIRI KURULDU!', {
                    stayDuration: 70,
                    fadeInDuration: 10,
                    fadeOutDuration: 15,
                    subtitle: `§e${newArea} m² Köyünüz resmen kuruldu! Şimdi Kışla kurabilirsiniz.`
                });
            } catch (e) {}
        }

        return {
            success: true,
            count: k.flags.length,
            area: newArea,
            costPaid: cost,
            established: k.flags.length >= 3,
            title: this.getTitleByArea(newArea, k.flags.length)
        };
    }

    static moveLastFlag(player, newPos) {
        const all = this.getAllKingdoms();
        const k = all[player.id];
        if (!k || k.flags.length === 0) {
            return { success: false, reason: 'Taşınacak bayrak yok! Önce bayrak dikin.' };
        }

        const oldPt = k.flags[k.flags.length - 1];
        const oldArea = k.flags.length >= 3 ? this.calculatePolygonArea(k.flags) : 0;
        const updatedFlags = [...k.flags];
        const movedPt = { x: Math.round(newPos.x), y: Math.round(newPos.y), z: Math.round(newPos.z) };
        updatedFlags[updatedFlags.length - 1] = movedPt;
        const newArea = updatedFlags.length >= 3 ? this.calculatePolygonArea(updatedFlags) : 0;

        const diffArea = newArea - oldArea;
        if (diffArea > 0) {
            const extraCost = diffArea * this.COST_PER_SQM;
            if (!EconomyEngine.deductMoney(player, extraCost)) {
                return { success: false, reason: `Sınırı genişletmek için ${extraCost} Bakır Dinar lazım!` };
            }
            this.removePhysicalFlagPost(player.dimension, oldPt);
            k.flags = updatedFlags;
            this.saveKingdoms(all);
            this.buildPhysicalFlagPost(player.dimension, movedPt, k.flags.length);
            return { success: true, diffArea, newArea, paid: extraCost, refund: 0 };
        } else {
            const refund = Math.round(Math.abs(diffArea) * this.COST_PER_SQM * 0.7);
            if (refund > 0) EconomyEngine.addMoney(player, refund);
            this.removePhysicalFlagPost(player.dimension, oldPt);
            k.flags = updatedFlags;
            this.saveKingdoms(all);
            this.buildPhysicalFlagPost(player.dimension, movedPt, k.flags.length);
            return { success: true, diffArea, newArea, paid: 0, refund };
        }
    }

    static removeLastFlag(player) {
        const all = this.getAllKingdoms();
        const k = all[player.id];
        if (!k || k.flags.length === 0) return { success: false };

        const oldPt = k.flags[k.flags.length - 1];
        const oldArea = k.flags.length >= 3 ? this.calculatePolygonArea(k.flags) : 0;
        k.flags.pop();
        const newArea = k.flags.length >= 3 ? this.calculatePolygonArea(k.flags) : 0;
        const lostArea = Math.max(0, oldArea - newArea);
        const refund = Math.round(lostArea * this.COST_PER_SQM * 0.7);

        if (refund > 0) EconomyEngine.addMoney(player, refund);
        this.removePhysicalFlagPost(player.dimension, oldPt);
        this.saveKingdoms(all);
        return { success: true, remaining: k.flags.length, area: newArea, refund };
    }
}
