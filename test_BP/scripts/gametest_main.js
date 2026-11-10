import './main.js';
import { ImperiumGameTestSuite } from './gametest/ImperiumGameTestSuite.js';
import { world, system } from '@minecraft/server';

function createHeadlessBDSSimPlayer() {
    const dim = world.getDimension('overworld');
    const slots = new Array(36).fill(undefined);
    const tags = new Set();
    const props = new Map();
    return {
        id: 'sim_emperor_01',
        name: 'Sultan_Mehmed_Sim',
        typeId: 'minecraft:player',
        location: { x: 0, y: 70, z: 0 },
        dimension: dim,
        isSprinting: true,
        isSneaking: false,
        getViewDirection() { return { x: 0, y: 0, z: 1 }; },
        onScreenDisplay: { setActionBar() {}, setTitle() {} },
        addTag(t) { tags.add(t); },
        removeTag(t) { tags.delete(t); },
        hasTag(t) { return tags.has(t); },
        getTags() { return Array.from(tags); },
        getDynamicProperty(k) { return props.get(k); },
        setDynamicProperty(k, v) { props.set(k, v); },
        triggerEvent() {},
        addEffect() {},
        removeEffect() {},
        applyDamage() {},
        sendMessage(m) {},
        runCommand(cmd) {
            if (cmd.startsWith('give @s ')) {
                const parts = cmd.split(' ');
                const itemType = parts[2];
                const amt = parseInt(parts[3] || '1', 10);
                for (let i = 0; i < slots.length; i++) {
                    if (slots[i] && slots[i].typeId === itemType) { slots[i].amount += amt; return { successCount: 1 }; }
                }
                for (let i = 0; i < slots.length; i++) {
                    if (!slots[i]) { slots[i] = { typeId: itemType, amount: amt }; return { successCount: 1 }; }
                }
            }
            try { return dim.runCommand(cmd); } catch (e) { return { successCount: 0 }; }
        },
        getComponent(id) {
            if (id === 'inventory') {
                return {
                    container: {
                        size: 36,
                        getItem(i) { return slots[i]; },
                        setItem(i, v) { slots[i] = v; }
                    }
                };
            }
            if (id === 'health') return { currentValue: 20, effectiveMax: 32 };
            if (id === 'equippable') return { getEquipment: () => ({ typeId: 'megamod:spartan_dory' }) };
            return null;
        }
    };
}

let testsExecuted = false;
function triggerHeadlessTests() {
    if (testsExecuted) return;
    testsExecuted = true;
    const players = world.getAllPlayers();
    const targetPlayer = players.length > 0 ? players[0] : createHeadlessBDSSimPlayer();
    ImperiumGameTestSuite.runAllSimulatedPlayerScenarios(targetPlayer);
}

system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id === 'imperium:run_tests') {
        triggerHeadlessTests();
    }
});

world.afterEvents.worldInitialize.subscribe(() => {
    system.runTimeout(() => {
        triggerHeadlessTests();
    }, 40);
});
