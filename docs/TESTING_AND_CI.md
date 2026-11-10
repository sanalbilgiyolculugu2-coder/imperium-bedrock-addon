# İMPERİUM: BEDROCK DEDICATED SERVER (BDS) & GAMETEST TEST REHBERİ

Bu belge, **İMPERİUM: Grand Strategy** eklentisinin otomatik test altyapısını, **Bedrock Dedicated Server (BDS)** ile yapılan gerçek sunucu doğrulamalarını, **SimulatedPlayer GameTest** senaryolarını ve yerel ortamda testlerin nasıl çalıştırılacağını eksiksiz olarak açıklar.

---

## 1. BDS Testi Nedir ve Neden Hayatidir?

Minecraft Bedrock istemcileri (özellikle mobil/Android ve konsollar) paket yükleme aşamasında şema hatalarını, geçersiz bileşen değerlerini veya eksik doku/geometri referanslarını çoğu zaman oyuncuya hissettirmeden yok sayar ya da varlığı görünmez yapar.

Ancak **Mojang'ın resmi C++ Bedrock Dedicated Server (BDS)** ikilisi:
1. Başlarken tüm JSON dosyalarını resmi Bedrock şemalarına göre katı biçimde denetler (`Content-Log`).
2. Tek bir geçersiz alan (örneğin float yerine string girilen `saturation_modifier`, mükerrer tarif kimliği veya olmayan 3D geometri) bulursa sunucu günlüğüne anında **`[ERROR]`** yazar.
3. JavaScript betiklerinde `@minecraft/server` ve `@minecraft/server-ui` API çağrılarında meydana gelen çökme veya istisnaları doğrudan yakalar.

Bu nedenle **BDS testi**, modun hem survival hem de multiplayer sunucularda sıfır çökme ve sıfır hata ile çalışacağının **en kesin resmi kanıtıdır**.

---

## 2. Test Mimarisi

İMPERİUM test sistemi iki bağımsız katmandan oluşur:

```
┌─────────────────────────────────────────────────────────────┐
│                       bds_run.py                            │
├──────────────────────────────┬──────────────────────────────┤
│    Yerel Simülasyon          │    Resmi C++ Bedrock Server  │
│    (--local-sim)             │    (--bds-dir ./bds)         │
├──────────────────────────────┼──────────────────────────────┤
│ 1. validate.py Statik Kontrol│ 1. BDS development_* kopyası │
│    - 276 JSON Şema kontrolü  │ 2. server.properties ayarı   │
│    - UUID Bağlantıları       │    (content-log enabled)     │
│    - 74 Eşya, 21 Blok, 43 Ent│ 3. C++ bedrock_server başlat │
│    - 21 3D Blockbench Geomet.│ 4. scriptevent ile test tetik│
│ 2. Node.js SimulatedPlayer   │ 5. Canlı ContentLog tarama   │
│    - 13 GameTest Senaryosu   │ 6. TEST_RESULT_SUMMARY oku   │
│    - Mock Bedrock Server API │ 7. 0 Hata / Başarı doğrula   │
└──────────────────────────────┴──────────────────────────────┘
```

### A. Temiz Ana Paket (`BP/`) & İzole Test Paketi (`test_BP/`)
- Normal oyuncuların kuracağı `BP/` paketi `@minecraft/server-gametest` modülünü içermez. Böylece normal survival dünyaları gereksiz test moduna girmez.
- `test_BP/` paketi, `BP/` paketinin birebir kopyası olup yalnızca GameTest modülünü (`1.0.0-beta`) ve `scripts/gametest/ImperiumGameTestSuite.js` dosyasını barındırır.
- `bds_run.py`, sunucuya `test_BP` ve `RP` paketlerini yükler.

---

## 3. Testler Nasıl Çalıştırılır?

### A. Yerel Hızlı Test (Telefonda / Termux'ta)
Herhangi bir BDS ikilisi indirmeden, tüm JSON'ları, şemaları, 3D modelleri ve 13 SimulatedPlayer senaryosunu saniyeler içinde doğrulamak için:

```bash
cd /storage/emulated/0/MinecraftMegaMod
python3 bds_run.py --local-sim
```

**Başarılı Çıktı Örneği:**
```
==================================================
  IMPERIUM: SIMULATED PLAYER & CONTENT-LOG RUNNER
==================================================
[1] Tum JSON dosyalari kontrol ediliyor...
  [V] 276 adet JSON dosyasi hatasiz.
[2] Paket manifestleri ve UUID baglantilari kontrol ediliyor...
  [V] BP ve RP manifest UUID baglantisi dogru.
[3] Betik (JavaScript) modulleri kontrol ediliyor...
  [V] 25 adet JS dosyasi sozdizimi gecerli.
[4] Esya ve Blok doku haritalari kontrol ediliyor...
  [V] Esya dokularinin tamami (74 adet) mevcut.
  [V] Blok dokularinin tamami (21 adet) mevcut.
[5] 3D Modeller, Animasyonlar ve Varlik tanimlari kontrol ediliyor...
  [V] 43 adet Sunucu (BP) ve Istemci (RP) varligi birebir eslesiyor.
  [V] 21 adet 3D Blockbench Geometri modeli dogrulandi.

TEST_RESULT_SUMMARY: {"suite":"IMPERIUM_FULL_GAMETEST","passed":13,"failed":0,"total":13}
[BASARILI] Tum SimulatedPlayer senaryolari (13/13) ve Content-Log kontrolleri GECTI!
```

### B. Gerçek C++ Bedrock Dedicated Server ile Yerel Test
Bilgisayarınızda veya Linux ortamında resmi BDS ile test etmek için:

```bash
# 1. BDS klasörünü hazırlayın (bedrock-server zip'ini çıkarın)
python3 bds_run.py --bds-dir /path/to/bedrock_server_directory
```

### C. GitHub Actions Üzerinde Otomatik CI (Sıfır Kurulum)
Depoya her `git push origin main` yapıldığında [`.github/workflows/bds-gametest.yml`](file:///.github/workflows/bds-gametest.yml) otomatik olarak devreye girer:
1. Ubuntu runner üzerinde resmi Mojang BDS ikilisini indirir.
2. `python3 bds_run.py --local-sim` ile statik paket kontrolü yapar.
3. BDS sunucusunu başlatıp `scriptevent imperium:run_tests` komutuyla 13 testi koşturur.
4. Çıkan tüm `ContentLog` dosyalarını GitHub Artifact olarak arşivler.

Test durumunu terminalden izlemek için:
```bash
# En son testi listele
gh run list --repo sanalbilgiyolculugu2-coder/imperium-bedrock-addon --limit 1

# Canlı izle
gh run watch <RUN_ID> --repo sanalbilgiyolculugu2-coder/imperium-bedrock-addon

# Hata varsa günlüğü oku
gh run view <RUN_ID> --repo sanalbilgiyolculugu2-coder/imperium-bedrock-addon --log-failed
```

---

## 4. Doğrulanan 13 Otomatik GameTest Senaryosu

`ImperiumGameTestSuite.js` içinde koşturulan 13 senaryo şunlardır:

| No | Senaryo Kimliği | Doğrulanan Mekanik |
|:---|:---|:---|
| **01** | `01_economy_currency_conversion` | 3 Kademeli Para Sistemi (Bakır, Gümüş, Altın). Cüzdandan tam miktar eksiltme ve bakiye tutarlılığı. |
| **02** | `02_market_dynamic_pricing_and_biome` | Dinamik Borsa: %50 taban ve 3x tavan fiyat koruması, alım-satım talebi ve bölgesel biyom çarpanları. |
| **03** | `03_polygon_claim_shoelace_and_refund` | 3+ Köşe Bayrağı ile Poligon Toprak Sahiplenme, Shoelace formülüyle m² alan hesabı, ışın dökümü (ray-casting) ile sınır içi/dışı kontrolü ve son bayrak sökümünde %70 iade. |
| **04** | `04_bank_loan_and_caravan` | Kraliyet Bankası mevduat yatırma/çekme, tefeci kredisi ve sigortalı ticaret devesi kervanı. |
| **05** | `05_nations_and_unique_units` | 9 Medeniyet seçimi (Osmanlı, Roma, Britanya vb.) ve ulusa özel elit birimlerin (Yeniçeri, Sipahi, Lejyoner) doğru çözümlenmesi. |
| **06** | `06_barracks_roster_and_heavy_units` | Kışla kadrosu: 18 farklı birimin varlığı, Şahi Topu, Savaş Fili, Deve Okçusu ve Sıhhiye Hekimi tanımları. |
| **07** | `07_tax_and_upkeep_cycle` | Günlük şafak bilançosu: Şehir vergisi tahsilatı, asker maaşlarının ödenmesi, hazine boşalınca firar ve isyan mekaniği. |
| **08** | `08_combat_friendly_fire_and_hybrid_death` | Savaş hasar sensörleri, dost ateşi koruması ve patlama/ateş kaynaklı ağır kayıplarda `perma_death` etiketi. |
| **09** | `09_siege_engineering_and_defenses` | Kuşatma: 500 HP Kale Kapısı dayanıklılığı, lağımcı barut fıçısı patlaması, kaynar katran kazanı ve kuşatma kancası. |
| **10** | `10_diplomacy_and_treaties` | Diplomasi: AI krallıklarla ticaret/barış/vasallık paktı imzalama ve antlaşma verilerinin kaydedilmesi. |
| **11** | `11_zero_lag_projectile_cleanup_and_weather` | Dinamik mevsimler, hava durumu döngüsü ve periyodik haydut baskını (`BanditRaidEngine`) tetikleyicisi. |
| **12** | `12_procedural_worldgen_and_ai_kingdoms` | Açık dünya üretimi: Sahra pazar karakolları, gizli haydut kampları ve rakip krallık kalelerinin prosedürel inşası. |
| **13** | `13_player_spawn_and_ui_integration` | Oyuncu ilk doğuşu (`main.js`), başlangıç kiti tek seferlik kaydı, kışla kademelerinin binalara kilitli olması ve tüm menülerin hatasız açılması. |

---

## 5. Sorun Giderme (Troubleshooting & ContentLog)

BDS testi sırasında karşılaşılabilecek hatalar ve çözümleri:

1. **`Failed to parse field -> saturation_modifier: invalid value`**:
   - *Sebep:* `minecraft:food` bileşeninde doygunluk çarpanı string (örn: `"normal"`) olarak girilmiştir.
   - *Çözüm:* Her zaman float sayı kullanılmalıdır (`0.6`, `0.8`, `1.2`).

2. **`has duplicate identifier in same pack`**:
   - *Sebep:* İki farklı tarif veya blok dosyasında aynı identifier (`megamod:...`) kullanılmıştır.
   - *Çözüm:* Dosyalardan birindeki identifier tekil hale getirilmeli veya mükerrer dosya silinmelidir.

3. **`Unknown geometry identifier`**:
   - *Sebep:* `RP/entity/` altındaki varlık tanımı `RP/models/` altında tanımlı olmayan hayali bir geometriye işaret ediyordur.
   - *Çözüm:* `RP/models/entity/` altındaki gerçek `.geo.json` dosyasındaki identifier ile eşleştirilmelidir (örn: `geometry.imperium.soldier_humanoid`).

4. **`Unknown animation identifier`**:
   - *Sebep:* Varlık istemcisinde tanımlanan animasyon adı `imperium.animations.json` içinde tanımlanmamıştır.
   - *Çözüm:* İlgili animasyon bloğu JSON dosyasına eklenmeli ya da entity tanımından kaldırılmalıdır.
