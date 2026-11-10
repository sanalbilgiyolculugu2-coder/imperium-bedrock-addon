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
        this.saveState(initial);
        return initial;
    }

    static saveState(state) {
        world.setDynamicProperty(this.PROPERTY_KEY, JSON.stringify(state));
    }

    static getFinance(playerId) {
        try {
            const raw = world.getDynamicProperty(this.FINANCE_KEY);
            const all = raw ? JSON.parse(raw) : {};
            if (all[playerId]) return all[playerId];
        } catch (e) {}
        return {
            bankBalance: 500,
            loanDebt: 0,
            loanDueDays: 0,
            activeCaravans: 0,
            insuredCaravans: false,
            granaryRations: 100,
            ironStock: 25,
            prisoners: 2,
            publicOrder: 85,
            morale: 90,
            renown: 50
        };
    }

    static saveFinance(playerId, data) {
        let all = {};
        try {
            const raw = world.getDynamicProperty(this.FINANCE_KEY);
            if (raw) all = JSON.parse(raw);
        } catch (e) {}
        all[playerId] = data;
        world.setDynamicProperty(this.FINANCE_KEY, JSON.stringify(all));
    }

    // Bölgesel Fiyat Arbitrajı (Çöl, Orman, Dağ/Kar farkları)
    static getRegionalMultiplier(player, commodityId) {
        if (!player) return 1.0;
        const pos = player.location;
        // Yükseklik ve koordinat tabanlı biyom/bölge simülasyonu
        if (pos.y > 95) {
            // Dağlık / Soğuk Bölge: Yiyecek ve odun pahalı, maden ucuz
            if (commodityId.includes('wheat') || commodityId.includes('bread')) return 1.4;
            if (commodityId.includes('iron') || commodityId.includes('coal')) return 0.75;
        } else if (Math.abs(pos.x + pos.z) % 400 > 200) {
            // Çöl / Kurak Pazar: Odun ve buğday çok değerli
            if (commodityId.includes('log')) return 1.6;
            if (commodityId.includes('wheat')) return 1.5;
        } else {
            // Orman / Ova Pazarı: Odun ucuz, demir pahalı
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
        const minPrice = Math.max(1, Math.round(item.basePrice * 0.5)); // %50 Taban
        const maxPrice = Math.round(item.basePrice * 3.0);              // 3x Tavan
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

    static deductMoney(player, amountInCopper) {
        const current = this.getPlayerMoney(player);
        if (current < amountInCopper) return false;
        const container = player.getComponent('inventory')?.container;
        if (!container) return false;

        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i);
            if (!item) continue;
            if (item.typeId === 'megamod:copper_coin' ||
                item.typeId === 'megamod:silver_coin' ||
                item.typeId === 'megamod:gold_coin') {
                container.setItem(i, undefined);
            }
        }
        this.addMoney(player, current - amountInCopper);
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
