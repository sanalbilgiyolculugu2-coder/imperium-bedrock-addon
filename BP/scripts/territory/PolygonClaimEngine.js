import { world } from '@minecraft/server';
import { EconomyEngine } from '../economy/EconomyEngine.js';

export class PolygonClaimEngine {
    static PROPERTY_KEY = 'imperium:kingdoms';
    static COST_PER_SQM = 2; // 1 m² arsa = 2 Bakır Dinar

    static getAllKingdoms() {
        try {
            const raw = world.getDynamicProperty(this.PROPERTY_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return {};
    }

    static saveKingdoms(kingdoms) {
        world.setDynamicProperty(this.PROPERTY_KEY, JSON.stringify(kingdoms));
    }

    static getPlayerKingdom(playerId) {
        const all = this.getAllKingdoms();
        for (const [id, k] of Object.entries(all)) {
            if (k.ownerId === playerId) return { id, ...k };
        }
        return null;
    }

    static getTitleByArea(area) {
        if (area >= 5000) return 'İmparatorluk';
        if (area >= 2000) return 'Krallık';
        if (area >= 600) return 'Dükalık';
        return 'Beylik';
    }

    // Shoelace Formülü (Gauss Alan Hesabı)
    static calculatePolygonArea(vertices) {
        if (!vertices || vertices.length < 3) return 0;
        let area = 0;
        const n = vertices.length;
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += vertices[i].x * vertices[j].z;
            area -= vertices[j].x * vertices[i].z;
        }
        return Math.abs(Math.round(area / 2));
    }

    static isPointInsidePolygon(point, vertices) {
        if (!vertices || vertices.length < 3) return false;
        let inside = false;
        const x = point.x, z = point.z;
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            const xi = vertices[i].x, zi = vertices[i].z;
            const xj = vertices[j].x, zj = vertices[j].z;
            const intersect = ((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    static addFlag(player, pos) {
        const kingdoms = this.getAllKingdoms();
        let kId = null;
        for (const [id, k] of Object.entries(kingdoms)) {
            if (k.ownerId === player.id) { kId = id; break; }
        }

        if (!kId) {
            kId = 'kingdom_' + player.id.substring(0, 8);
            kingdoms[kId] = {
                name: player.name + ' Hanedanı',
                ownerId: player.id,
                nation: player.getDynamicProperty('imperium:nation') || 'osmanli',
                flags: [],
                treasury: 500,
                taxRate: 15,
                reserveArmy: 0
            };
        }

        const k = kingdoms[kId];
        const oldArea = this.calculatePolygonArea(k.flags);
        const newVertex = { x: Math.round(pos.x), y: Math.round(pos.y), z: Math.round(pos.z) };
        const previewFlags = [...k.flags, newVertex];
        const newArea = this.calculatePolygonArea(previewFlags);
        const deltaArea = Math.max(0, newArea - oldArea);
        const cost = deltaArea * this.COST_PER_SQM;

        if (previewFlags.length >= 3 && cost > 0) {
            if (!EconomyEngine.deductMoney(player, cost)) {
                return { success: false, reason: `Bu genişleme (+${deltaArea} m²) için ${cost} Bakır Dinar gerekiyor!` };
            }
        }

        k.flags.push(newVertex);
        this.saveKingdoms(kingdoms);
        return { success: true, count: k.flags.length, area: newArea, costPaid: cost, title: this.getTitleByArea(newArea) };
    }

    // Son bayrağın yerini doğrudan satmadan taşıma (Alan artarsa öder, azalırsa iade alır)
    static moveLastFlag(player, newPos) {
        const kingdoms = this.getAllKingdoms();
        for (const [id, k] of Object.entries(kingdoms)) {
            if (k.ownerId === player.id && k.flags.length >= 3) {
                const oldArea = this.calculatePolygonArea(k.flags);
                const updatedFlags = [...k.flags];
                updatedFlags[updatedFlags.length - 1] = {
                    x: Math.round(newPos.x),
                    y: Math.round(newPos.y),
                    z: Math.round(newPos.z)
                };
                const newArea = this.calculatePolygonArea(updatedFlags);
                const diffArea = newArea - oldArea;

                if (diffArea > 0) {
                    const extraCost = diffArea * this.COST_PER_SQM;
                    if (!EconomyEngine.deductMoney(player, extraCost)) {
                        return { success: false, reason: `Alan +${diffArea} m² büyüdü. Gereken fark: ${extraCost} Bakır!` };
                    }
                    k.flags = updatedFlags;
                    this.saveKingdoms(kingdoms);
                    return { success: true, diffArea, paid: extraCost, refund: 0, newArea };
                } else {
                    const refund = Math.round(Math.abs(diffArea) * this.COST_PER_SQM * 0.8);
                    EconomyEngine.addMoney(player, refund);
                    k.flags = updatedFlags;
                    this.saveKingdoms(kingdoms);
                    return { success: true, diffArea, paid: 0, refund, newArea };
                }
            }
        }
        return { success: false, reason: 'Yer değiştirmek için en az 3 dikili bayrağınız olmalı!' };
    }

    // Bayrağı kaldırıp toprağı amortismanlı (%70 bedelle) geri satma
    static removeLastFlag(player) {
        const kingdoms = this.getAllKingdoms();
        for (const [id, k] of Object.entries(kingdoms)) {
            if (k.ownerId === player.id && k.flags.length > 0) {
                const oldArea = this.calculatePolygonArea(k.flags);
                k.flags.pop();
                const newArea = this.calculatePolygonArea(k.flags);
                const lostArea = Math.max(0, oldArea - newArea);
                const refund = Math.round(lostArea * this.COST_PER_SQM * 0.7); // %30 değer kaybı ile satış
                if (refund > 0) EconomyEngine.addMoney(player, refund);
                this.saveKingdoms(kingdoms);
                return { success: true, remaining: k.flags.length, area: newArea, refund };
            }
        }
        return { success: false };
    }
}
