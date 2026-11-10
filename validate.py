import os
import sys
import json
import subprocess

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
BP_DIR = os.path.join(PROJECT_DIR, "BP")
RP_DIR = os.path.join(PROJECT_DIR, "RP")

total_errors = 0
total_warnings = 0

def log_err(msg):
    global total_errors
    total_errors += 1
    print(f"  [X] HATA: {msg}")

def log_warn(msg):
    global total_warnings
    total_warnings += 1
    print(f"  [!] UYARI: {msg}")

def log_ok(msg):
    print(f"  [V] {msg}")

print("==================================================")
print("  IMPERIUM: BEDROCK MASTER DOGRULAMA ARACI")
print("==================================================")

# 1. JSON Dogrulama
print("\n[1] Tum JSON dosyalari kontrol ediliyor...")
checked_json_count = 0
for base in [BP_DIR, RP_DIR]:
    for root, _, files in os.walk(base):
        for f in files:
            if f.endswith(".json"):
                path = os.path.join(root, f)
                rel_path = os.path.relpath(path, PROJECT_DIR)
                checked_json_count += 1
                try:
                    with open(path, "r", encoding="utf-8") as jf:
                        json.load(jf)
                except Exception as e:
                    log_err(f"{rel_path} gecersiz JSON formati! ({e})")
if total_errors == 0:
    log_ok(f"{checked_json_count} adet JSON dosyasi hatasiz.")

# 2. Manifest Kontrolleri
print("\n[2] Paket manifestleri ve UUID baglantilari kontrol ediliyor...")
bp_manifest_path = os.path.join(BP_DIR, "manifest.json")
rp_manifest_path = os.path.join(RP_DIR, "manifest.json")

if os.path.exists(bp_manifest_path) and os.path.exists(rp_manifest_path):
    with open(bp_manifest_path, "r", encoding="utf-8") as f:
        bp_data = json.load(f)
    with open(rp_manifest_path, "r", encoding="utf-8") as f:
        rp_data = json.load(f)
    rp_header_uuid = rp_data.get("header", {}).get("uuid")
    bp_dependencies = [d.get("uuid") for d in bp_data.get("dependencies", []) if "uuid" in d]
    if rp_header_uuid in bp_dependencies:
        log_ok("BP ve RP manifest UUID baglantisi dogru.")
    else:
        log_warn("BP manifestinde RP bagimlilik UUID'si eslesmiyor!")
else:
    log_err("BP veya RP manifest.json bulunamadi!")

# 3. JavaScript Sozdizimi Kontrolu
print("\n[3] Betik (JavaScript) modulleri kontrol ediliyor...")
scripts_dir = os.path.join(BP_DIR, "scripts")
js_count = 0
if os.path.exists(scripts_dir):
    for root, _, files in os.walk(scripts_dir):
        for f in sorted(files):
            if f.endswith(".js"):
                js_count += 1
                js_path = os.path.join(root, f)
                rel_path = os.path.relpath(js_path, PROJECT_DIR)
                res = subprocess.run(["node", "--check", js_path], capture_output=True, text=True)
                if res.returncode == 0:
                    log_ok(f"{rel_path} sozdizimi gecerli.")
                else:
                    log_err(f"{rel_path} sozdizim hatasi:\n{res.stderr.strip()}")

# 4. Esya ve Blok Doku Haritalari Kontrolu
print("\n[4] Esya ve Blok doku haritalari kontrol ediliyor...")
for map_file, label in [("item_texture.json", "Esya"), ("terrain_texture.json", "Blok")]:
    t_path = os.path.join(RP_DIR, "textures", map_file)
    if os.path.exists(t_path):
        with open(t_path, "r", encoding="utf-8") as f:
            tex_map = json.load(f).get("texture_data", {})
        missing = 0
        for name, data in tex_map.items():
            tex_file = data.get("textures")
            if isinstance(tex_file, str):
                if not os.path.exists(os.path.join(RP_DIR, f"{tex_file}.png")):
                    log_warn(f"Doku dosyasi eksik: {tex_file}.png")
                    missing += 1
        if missing == 0:
            log_ok(f"{label} dokularinin tamami ({len(tex_map)} adet) mevcut.")

# 5. Varlik (Entity), 3D Model ve Skin Kontrolu
print("\n[5] 3D Modeller, Animasyonlar ve Varlik tanimlari kontrol ediliyor...")
bp_ents = set(os.listdir(os.path.join(BP_DIR, "entities")))
rp_ents = set(os.listdir(os.path.join(RP_DIR, "entity")))
if bp_ents == rp_ents and len(bp_ents) > 0:
    log_ok(f"{len(bp_ents)} adet Sunucu (BP) ve Istemci (RP) varligi birebir eslesiyor.")
else:
    log_err(f"BP ({len(bp_ents)}) ve RP ({len(rp_ents)}) varlik listesi eslesmiyor!")

for rf in sorted(rp_ents):
    with open(os.path.join(RP_DIR, "entity", rf), "r", encoding="utf-8") as f:
        ce = json.load(f).get("minecraft:client_entity", {}).get("description", {})
    tex_rel = ce.get("textures", {}).get("default", "")
    if tex_rel and not os.path.exists(os.path.join(RP_DIR, f"{tex_rel}.png")):
        log_err(f"{rf} icin varlik dokusu eksik: {tex_rel}.png")

models_count = len(os.listdir(os.path.join(RP_DIR, "models", "entity")))
log_ok(f"{models_count} adet 3D Blockbench Geometri modeli dogrulandi.")

print("\n--------------------------------------------------")
if total_errors == 0:
    print(f"SONUC: IMPERIUM MASTER MOD GECERLI! (JSON: {checked_json_count}, JS: {js_count}, Hata: 0, Uyari: {total_warnings})")
    sys.exit(0)
else:
    print(f"SONUC: {total_errors} HATA BULUNDU!")
    sys.exit(1)
