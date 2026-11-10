import { world } from '@minecraft/server';

export const COMMODITIES = {
    'minecraft:iron_ingot': { name: 'Demir Külçesi', basePrice: 40, category: 'raw' },
    'minecraft:gold_ingot': { name: 'Altın Külçesi', basePrice: 150, category: 'raw' },
    'minecraft:diamond': { name: 'Elmas', basePrice: 800, category: 'raw' },
    'minecraft:coal': { name: 'Kömür', basePrice: 12, category: 'raw' },
    'minecraft:oak_log': { name: 'Meşe Kütüğü', basePrice: 8, category: 'raw' },
    'minecraft:cobblestone': { name: 'Kırık Taş', basePrice: 4, category: 'raw' },
    
    'minecraft:wheat': { name: 'Buğday', basePrice: 4, category: 'food' },
    'minecraft:bread': { name: 'Ekmek', basePrice: 10, category: 'food' },
    'minecraft:cooked_beef': { name: 'Pişmiş Biftek', basePrice: 18, category: 'food' },
    'minecraft:carrot': { name: 'Havuç', basePrice: 5, category: 'food' },
    'megamod:salted_fish': { name: 'Tuzlanmış Sefer Balığı', basePrice: 22, category: 'food' },
    'megamod:smoked_meat': { name: 'Kurutulmuş Sefer Eti', basePrice: 26, category: 'food' },
    
    'minecraft:arrow': { name: 'Ok', basePrice: 6, category: 'military' },
    'minecraft:iron_sword': { name: 'Demir Kılıç', basePrice: 90, category: 'military' },
    'minecraft:gunpowder': { name: 'Barut', basePrice: 35, category: 'military' },
    'megamod:infantry_spear': { name: 'Piyade Mızrağı', basePrice: 110, category: 'military' },
    'megamod:scutum_shield': { name: 'Roma Scutum Kalkanı', basePrice: 140, category: 'military' }
};

export class EconomyEngine {
    static PROPERTY_KEY = 'imperium:market_state';
    static FINANCE_KEY = 'imperium:finance_state';

    static getState() {
        try {
            const raw = world.getDynamicProperty(this.PROPERTY_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {}

        const initial = {};
        for (const [id, item] of Object.entries(COMMODITIES)) {
            initial[id] = {
                supply: 100,
                demand: 100,
                currentPrice: item.basePrice,
                trend: 0
            };
        }
        return initial;
    }

    static saveState(state) {
        try {
            world.setDynamicProperty(this.PROPERTY_KEY, JSON.stringify(state));
        } catch (e) {}
    }

    static getFinance(playerId) {
        try {
            const raw = world.getDynamicProperty(`${this.FINANCE_KEY}_${playerId}`);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return {
            bankBalance: 0,
            loanDebt: 0,
            loanDueDays: 0,
            granaryRations: 100,
            ironStock: 50
        };
    }

    static saveFinance(playerId, fin) {
        try {
            world.setDynamicProperty(`${this.FINANCE_KEY}_${playerId}`, JSON.stringify(fin));
        } catch (e) {}
    }

    static getRegionalMultiplier(player, commodityId) {
        if (!player) return 1.0;
        try {
            const biome = player.dimension.getBiome ? player.dimension.getBiome(player.location)?.id : '';
            if (biome.includes('desert') && (commodityId.includes('wheat') || commodityId.includes('bread'))) return 1.45;
            if (biome.includes('desert') && commodityId.includes('iron')) return 1.25;
            if (biome.includes('mountain') && commodityId.includes('iron')) return 0.75;
            if (biome.includes('mountain') && commodityId.includes('diamond')) return 0.80;
            if (biome.includes('forest') && commodityId.includes('log')) return 0.70;
            if (biome.includes('ocean') && commodityId.includes('fish')) return 0.65;
        } catch (e) {}

        const pos = player.location || { x: 0, y: 64, z: 0 };
        if (pos.y > 95) {
            if (commodityId.includes('wheat') || commodityId.includes('bread')) return 1.4;
            if (commodityId.includes('iron') || commodityId.includes('coal')) return 0.75;
        } else if (Math.abs(pos.x + pos.z) % 400 > 200) {
            if (commodityId.includes('log')) return 1.6;
            if (commodityId.includes('wheat')) return 1.5;
        } else {
            if (commodityId.includes('log')) return 0.7;
            if (commodityId.includes('iron')) return 1.35;
        }
        return 1.0;
    }

    static getPrice(commodityId, player = null) {
        const state = this.getState();
        const base = state[commodityId] ? state[commodityId].currentPrice : (COMMODITIES[commodityId]?.basePrice || 10);
        const mult = this.getRegionalMultiplier(player, commodityId);
        return Math.max(1, Math.round(base * mult));
    }

    static calculatePrice(commodityId, supply, demand) {
        const item = COMMODITIES[commodityId];
        if (!item) return 10;
        const ratio = demand / Math.max(supply, 10);
        const calculated = Math.round(item.basePrice * ratio);
        const minPrice = Math.max(1, Math.round(item.basePrice * 0.5));
        const maxPrice = Math.round(item.basePrice * 3.0);
        return Math.max(minPrice, Math.min(maxPrice, calculated));
    }

    static recordTransaction(commodityId, amount, isBuying) {
        const state = this.getState();
        if (!state[commodityId]) {
            state[commodityId] = { supply: 100, demand: 100, currentPrice: COMMODITIES[commodityId]?.basePrice || 10, trend: 0 };
        }
        const entry = state[commodityId];
        const oldPrice = entry.currentPrice;

        if (isBuying) {
            entry.demand += amount * 2;
            entry.supply = Math.max(20, entry.supply - amount);
        } else {
            entry.supply += amount * 2;
            entry.demand = Math.max(20, entry.demand - amount);
        }

        entry.currentPrice = this.calculatePrice(commodityId, entry.supply, entry.demand);
        entry.trend = entry.currentPrice > oldPrice ? 1 : (entry.currentPrice < oldPrice ? -1 : 0);
        this.saveState(state);
    }

    static normalizeMarket() {
        const state = this.getState();
        for (const [id, item] of Object.entries(COMMODITIES)) {
            if (!state[id]) continue;
            state[id].supply = Math.round(state[id].supply * 0.95 + 100 * 0.05);
            state[id].demand = Math.round(state[id].demand * 0.95 + 100 * 0.05);
            state[id].currentPrice = this.calculatePrice(id, state[id].supply, state[id].demand);
        }
        this.saveState(state);
    }

    static getPlayerMoney(player) {
        const container = player.getComponent('inventory')?.container;
        if (!container) return 0;
        let totalCopper = 0;
        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i);
            if (!item) continue;
            if (item.typeId === 'megamod:copper_coin') totalCopper += item.amount;
            else if (item.typeId === 'megamod:silver_coin') totalCopper += item.amount * 100;
            else if (item.typeId === 'megamod:gold_coin') totalCopper += item.amount * 10000;
        }
        return totalCopper;
    }

    // Clean slot-targeted coin deduction: Never wipes unrelated coins or messes up hotbars!
    static deductMoney(player, amountInCopper) {
        const current = this.getPlayerMoney(player);
        if (current < amountInCopper) return false;
        const container = player.getComponent('inventory')?.container;
        if (!container) return false;

        let needed = amountInCopper;

        // 1. Önce bakır sikkelerden düş
        for (let i = 0; i < container.size && needed > 0; i++) {
            const item = container.getItem(i);
            if (item && item.typeId === 'megamod:copper_coin') {
                const take = Math.min(item.amount, needed);
                needed -= take;
                if (item.amount === take) {
                    container.setItem(i, undefined);
                } else {
                    item.amount -= take;
                    container.setItem(i, item);
                }
            }
        }

        // 2. Hala gerekliyse gümüş sikkelerden düş (1 Gümüş = 100 Bakır)
        for (let i = 0; i < container.size && needed > 0; i++) {
            const item = container.getItem(i);
            if (item && item.typeId === 'megamod:silver_coin') {
                const silverCopper = item.amount * 100;
                if (silverCopper <= needed) {
                    needed -= silverCopper;
                    container.setItem(i, undefined);
                } else {
                    const silversToTake = Math.ceil(needed / 100);
                    const changeCopper = (silversToTake * 100) - needed;
                    needed = 0;
                    if (item.amount === silversToTake) {
                        container.setItem(i, undefined);
                    } else {
                        item.amount -= silversToTake;
                        container.setItem(i, item);
                    }
                    if (changeCopper > 0) {
                        this.addMoney(player, changeCopper);
                    }
                }
            }
        }

        // 3. Hala gerekliyse altın sikkelerden düş (1 Altın = 10000 Bakır)
        for (let i = 0; i < container.size && needed > 0; i++) {
            const item = container.getItem(i);
            if (item && item.typeId === 'megamod:gold_coin') {
                const goldCopper = item.amount * 10000;
                if (goldCopper <= needed) {
                    needed -= goldCopper;
                    container.setItem(i, undefined);
                } else {
                    const goldsToTake = Math.ceil(needed / 10000);
                    const changeCopper = (goldsToTake * 10000) - needed;
                    needed = 0;
                    if (item.amount === goldsToTake) {
                        container.setItem(i, undefined);
                    } else {
                        item.amount -= goldsToTake;
                        container.setItem(i, item);
                    }
                    if (changeCopper > 0) {
                        this.addMoney(player, changeCopper);
                    }
                }
            }
        }

        return true;
    }

    static addMoney(player, amountInCopper) {
        if (amountInCopper <= 0) return;
        const golds = Math.floor(amountInCopper / 10000);
        const silvers = Math.floor((amountInCopper % 10000) / 100);
        const coppers = Math.floor(amountInCopper % 100);

        if (golds > 0) player.runCommand(`give @s megamod:gold_coin ${golds}`);
        if (silvers > 0) player.runCommand(`give @s megamod:silver_coin ${silvers}`);
        if (coppers > 0) player.runCommand(`give @s megamod:copper_coin ${coppers}`);
    }
}
