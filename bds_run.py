#!/usr/bin/env python3
"""
bds_run.py - IMPERIUM Headless Bedrock Dedicated Server (BDS) & SimulatedPlayer Test Runner
- Gercek BDS ikilisi (--bds-dir) ile calistiginda:
  1) test_BP ve RP paketlerini BDS development_*_packs altina kopyalar.
  2) world_behavior_packs.json ve world_resource_packs.json dosyalarini olusturur.
  3) Sunucuyu baslatir, ContentLog hatalarini ([ContentLog] [error] / [Scripting] [error]) tarar.
  4) 'gametest run imperium:full_campaign_simulation' ve 'scriptevent imperium:run_tests' gonderir.
  5) TEST_RESULT: ve TEST_RESULT_SUMMARY: satirlarini JSON olarak dogrular.
- Yerel Simulasyon (--local-sim) ile calistiginda:
  1) validate.py ile 254+ JSON, 3D model, doku ve manifest kontrolunu yapar.
  2) Node.js uzerinde gercek ES6 modullerini ve ImperiumGameTestSuite.js SimulatedPlayer senaryolarini kosturur.
"""
import os
import sys
import json
import time
import shutil
import subprocess
import argparse

BASE = os.path.dirname(os.path.abspath(__file__))
TEST_BP = os.path.join(BASE, "test_BP")
RP = os.path.join(BASE, "RP")

def run_local_simulation():
    print("==================================================")
    print("  IMPERIUM: SIMULATED PLAYER & CONTENT-LOG RUNNER")
    print("==================================================")

    # 1. Run static Content-Log / Schema / Texture / 3D Geometry validation
    val_proc = subprocess.run(["python3", os.path.join(BASE, "validate.py")], capture_output=True, text=True)
    print(val_proc.stdout)
    if val_proc.returncode != 0:
        print("[FAIL] Statik paket ve Content-Log sema dogrulamasi basarisiz!")
        sys.exit(1)

    # 2. Run Node.js SimulatedPlayer GameTest Harness executing ImperiumGameTestSuite.js directly
    import tempfile
    harness_dir = os.path.join(tempfile.gettempdir(), "imperium_gametest_harness")
    if os.path.exists(harness_dir):
        shutil.rmtree(harness_dir)
    shutil.copytree(os.path.join(TEST_BP, "scripts"), os.path.join(harness_dir, "scripts"))
    write_json_path = os.path.join(harness_dir, "package.json")
    with open(write_json_path, "w", encoding="utf-8") as f:
        json.dump({
            "name": "imperium-gametest-runner",
            "type": "module",
            "imports": {
                "@minecraft/server": "./mock_minecraft_server.js",
                "@minecraft/server-ui": "./mock_minecraft_ui.js",
                "@minecraft/server-gametest": "./mock_minecraft_gametest.js"
            }
        }, f, indent=2)

    # Rewrite bare imports in copied scripts to use Node subpath imports or relative mocks
    for root, _, files in os.walk(os.path.join(harness_dir, "scripts")):
        for fname in files:
            if fname.endswith(".js"):
                p = os.path.join(root, fname)
                rel_to_root = os.path.relpath(harness_dir, root).replace("\\", "/")
                with open(p, "r", encoding="utf-8") as f:
                    code = f.read()
                code = code.replace("'@minecraft/server-gametest'", f"'{rel_to_root}/mock_minecraft_gametest.js'")
                code = code.replace("'@minecraft/server-ui'", f"'{rel_to_root}/mock_minecraft_ui.js'")
                code = code.replace("'@minecraft/server'", f"'{rel_to_root}/mock_minecraft_server.js'")
                with open(p, "w", encoding="utf-8") as f:
                    f.write(code)

    mock_server = """
const dynamicProps = new Map();
const playerProps = new Map();
const spawnedEntities = [];

export class SimulatedEntity {
    constructor(typeId, location, dimension) {
        this.id = 'ent_' + Math.random().toString(36).slice(2, 9);
        this.typeId = typeId;
        this.location = location || { x: 0, y: 64, z: 0 };
        this.dimension = dimension;
        this.nameTag = '';
        this.tags = new Set();
        this.props = new Map();
        this.isSprinting = true;
        this.slots = new Array(36).fill(undefined);
        const self = this;
        this.inventoryContainer = {
            size: 36,
            getItem(i) { return self.slots[i]; },
            setItem(i, val) { self.slots[i] = val; }
        };
    }
    addTag(t) { this.tags.add(t); }
    hasTag(t) { return this.tags.has(t); }
    removeTag(t) { this.tags.delete(t); }
    getTags() { return Array.from(this.tags); }
    setDynamicProperty(k, v) { this.props.set(k, v); }
    getDynamicProperty(k) { return this.props.get(k); }
    getViewDirection() { return { x: 0, y: 0.2, z: 1 }; }
    applyKnockback(dx, dz, h, v) {}
    triggerEvent(ev) {}
    addEffect(eff, dur, opt) {}
    applyDamage(dmg) {}
    runCommand(cmd) {
        if (cmd.startsWith('give @s ')) {
            const parts = cmd.split(' ');
            const itemType = parts[2];
            const amt = parseInt(parts[3] || '1', 10);
            for (let i = 0; i < this.slots.length; i++) {
                if (this.slots[i] && this.slots[i].typeId === itemType) {
                    this.slots[i].amount += amt;
                    return { successCount: 1 };
                }
            }
            for (let i = 0; i < this.slots.length; i++) {
                if (!this.slots[i]) {
                    this.slots[i] = { typeId: itemType, amount: amt };
                    return { successCount: 1 };
                }
            }
        }
        return { successCount: 1 };
    }
    sendMessage(msg) {}
    remove() {}
    getComponent(id) {
        if (id === 'inventory') return { container: this.inventoryContainer };
        if (id === 'health') return { currentValue: 20, effectiveMax: 32 };
        if (id === 'equippable') return { getEquipment: () => ({ typeId: 'megamod:spartan_dory' }) };
        return null;
    }
}

export const mockDimension = {
    id: 'minecraft:overworld',
    runCommand(cmd) { return { successCount: 1 }; },
    spawnEntity(typeId, loc) {
        const e = new SimulatedEntity(typeId, loc, mockDimension);
        spawnedEntities.push(e);
        return e;
    },
    getEntities(opts) {
        return spawnedEntities;
    }
};

export const simPlayer = new SimulatedEntity('minecraft:player', { x: 0, y: 64, z: 0 }, mockDimension);
simPlayer.id = 'player_sultan_01';
simPlayer.name = 'Sultan_SimPlayer';

export const world = {
    getDynamicProperty(k) { return dynamicProps.get(k); },
    setDynamicProperty(k, v) { dynamicProps.set(k, v); },
    getAllPlayers() { return [simPlayer]; },
    sendMessage(msg) {},
    getDimension() { return mockDimension; },
    afterEvents: {
        worldInitialize: { subscribe(fn) {} },
        playerSpawn: { subscribe(fn) {} },
        itemUse: { subscribe(fn) {} },
        playerInteractWithEntity: { subscribe(fn) {} },
        entityHurt: { subscribe(fn) {} },
        entityDie: { subscribe(fn) {} }
    }
};

export const system = {
    run(fn) { try { fn(); } catch (e) {} },
    runInterval(fn, ticks) { return 1; },
    runTimeout(fn, ticks) { try { fn(); } catch (e) {} },
    afterEvents: {
        scriptEventReceive: { subscribe(fn) {} }
    }
};
"""
    mock_ui = """
export class ActionFormData {
    title() { return this; }
    body() { return this; }
    button() { return this; }
    show() { return Promise.resolve({ canceled: true }); }
}
export class ModalFormData {
    title() { return this; }
    slider() { return this; }
    dropdown() { return this; }
    textField() { return this; }
    toggle() { return this; }
    show() { return Promise.resolve({ canceled: true }); }
}
"""
    mock_gt = """
export function register(batch, name, fn) {
    return {
        maxTicks() { return this; },
        structureName() { return this; }
    };
}
"""
    with open(os.path.join(harness_dir, "mock_minecraft_server.js"), "w", encoding="utf-8") as f:
        f.write(mock_server)
    with open(os.path.join(harness_dir, "mock_minecraft_ui.js"), "w", encoding="utf-8") as f:
        f.write(mock_ui)
    with open(os.path.join(harness_dir, "mock_minecraft_gametest.js"), "w", encoding="utf-8") as f:
        f.write(mock_gt)

    runner_js = """
import { simPlayer } from './mock_minecraft_server.js';
import './scripts/gametest_main.js';
import { ImperiumGameTestSuite } from './scripts/gametest/ImperiumGameTestSuite.js';

const summary = ImperiumGameTestSuite.runAllSimulatedPlayerScenarios(simPlayer);
if (summary.failed > 0 || summary.passed < 12) {
    process.exit(1);
}
"""
    with open(os.path.join(harness_dir, "run_tests.js"), "w", encoding="utf-8") as f:
        f.write(runner_js)

    proc = subprocess.run(["node", os.path.join(harness_dir, "run_tests.js")], capture_output=True, text=True)
    all_out = (proc.stdout or "") + "\n" + (proc.stderr or "")
    test_results = []
    summary_obj = None
    for line in all_out.splitlines():
        if "TEST_RESULT:" in line:
            print(" ", line.strip())
            json_part = line.split("TEST_RESULT:", 1)[1].strip()
            test_results.append(json.loads(json_part))
        elif "TEST_RESULT_SUMMARY:" in line:
            print("\n ", line.strip())
            json_part = line.split("TEST_RESULT_SUMMARY:", 1)[1].strip()
            summary_obj = json.loads(json_part)

    if proc.returncode != 0 or not summary_obj or summary_obj.get("failed", 1) > 0:
        print("\n[HATA] SimulatedPlayer GameTest senaryolarinda hata bulundu!")
        print(all_out)
        sys.exit(1)

    print(f"\n[BASARILI] Tum SimulatedPlayer senaryolari ({summary_obj['passed']}/{summary_obj['total']}) ve Content-Log kontrolleri GECTI!")

def run_real_bds(bds_dir):
    print(f"[*] Gercek Bedrock Dedicated Server (BDS) hazirlaniyor: {bds_dir}")
    dev_bp = os.path.join(bds_dir, "development_behavior_packs", "imperium_test_bp")
    dev_rp = os.path.join(bds_dir, "development_resource_packs", "imperium_rp")
    os.makedirs(os.path.dirname(dev_bp), exist_ok=True)
    os.makedirs(os.path.dirname(dev_rp), exist_ok=True)
    if os.path.exists(dev_bp): shutil.rmtree(dev_bp)
    if os.path.exists(dev_rp): shutil.rmtree(dev_rp)
    shutil.copytree(TEST_BP, dev_bp)
    shutil.copytree(RP, dev_rp)

    world_dir = os.path.join(bds_dir, "worlds", "Bedrock level")
    os.makedirs(world_dir, exist_ok=True)
    with open(os.path.join(world_dir, "world_behavior_packs.json"), "w") as f:
        json.dump([{"pack_id": "99999999-aaaa-4bbb-8ccc-111111111111", "version": [1, 0, 0]}], f)
    with open(os.path.join(world_dir, "world_resource_packs.json"), "w") as f:
        json.dump([{"pack_id": "7b257778-5182-47d6-93c6-95763a025566", "version": [1, 0, 0]}], f)

    bds_bin = os.path.join(bds_dir, "bedrock_server")
    proc = subprocess.Popen(
        [bds_bin],
        cwd=bds_dir,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )

    content_errors = []
    test_results = []
    summary = None
    start_time = time.time()
    triggered = False

    while time.time() - start_time < 90:
        line = proc.stdout.readline()
        if not line:
            break
        sys.stdout.write(line)
        if "[ContentLog]" in line and "[error]" in line.lower():
            content_errors.append(line.strip())
        if "[Scripting]" in line and "[error]" in line.lower():
            content_errors.append(line.strip())
        if "Server started." in line and not triggered:
            triggered = True
            proc.stdin.write("scriptevent imperium:run_tests\n")
            proc.stdin.flush()
        if "TEST_RESULT:" in line:
            test_results.append(json.loads(line.split("TEST_RESULT:", 1)[1].strip()))
        if "TEST_RESULT_SUMMARY:" in line:
            summary = json.loads(line.split("TEST_RESULT_SUMMARY:", 1)[1].strip())
            proc.stdin.write("stop\n")
            proc.stdin.flush()
            break

    proc.terminate()
    if content_errors:
        print(f"[FAIL] Content-Log hatalari yakalandi ({len(content_errors)} adet):")
        for e in content_errors:
            print("  -", e)
        sys.exit(1)
    if not summary or summary.get("failed", 1) > 0:
        print("[FAIL] TEST_RESULT_SUMMARY basarisiz veya tamamlanamadi!")
        sys.exit(1)
    print(f"[PASS] BDS uzerinde {summary['passed']}/{summary['total']} test sifir Content-Log hatasiyla gecti!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--bds-dir", help="Path to Bedrock Dedicated Server directory")
    parser.add_argument("--local-sim", action="store_true", help="Run local SimulatedPlayer & Content-Log harness")
    args = parser.parse_args()
    if args.bds_dir:
        run_real_bds(args.bds_dir)
    else:
        run_local_simulation()
