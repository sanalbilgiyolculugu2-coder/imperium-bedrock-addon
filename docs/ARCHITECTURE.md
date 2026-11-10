# SİSTEM MİMARİSİ VE TEKNİK TASARIM (ARCHITECTURE)

Bu belge, modun Bedrock Edition mimarisinde nasıl organize edileceğini ve veri akışını gösterir.

---

## 1. KATMANLI MİMARİ (LAYERED ARCHITECTURE)

- **UI KATMANI (@minecraft/server-ui):**
  - Krallık Paneli (KingdomForm)
  - Borsa & Pazar (MarketForm)
  - Kışla & Ordu (BarracksForm)
  - Diplomasi (DiplomacyForm)
- **ÇEKİRDEK SERVİSLER (Core Script Services):**
  - EconomyEngine (Dinamik Fiyatlandırma, Vergi Döngüsü, Hazine)
  - MilitaryController (Asker AI, Formasyonlar, Hedefleme)
  - KingdomManager (Sınırlar, Hak İddiası, Nüfus, Seviye)
  - DiplomacyManager (İttifaklar, Savaş Durumları, Ateşkes)
- **KALICI VERİ DEPOLAMA (Persistence Layer):**
  - Bedrock DynamicProperties (Dünya ve Varlık üzerine JSON saklama)
- **VERİ & KAYNAK PAKETİ (BP / RP Data):**
  - Custom Entities (Askerler, Koruma Muhafızları, Kuşatma Silahları)
  - Custom Items (Komuta Borusu, Krallık Mührü, Para Birimleri)
  - Animations & Textures (Kalkan duruşları, bayraklar, zırhlar)

---

## 2. VERİ YÖNETİMİ (DYNAMIC PROPERTIES)
Oyun kaydedilip kapatıldığında hiçbir krallık verisinin kaybolmaması için Bedrock'un yerel world.setDynamicProperty sistemi kullanılır:
- kingdom:<id>:data -> Krallık adı, kurucusu, hazine altını, vergi oranı, müttefik listesi.
- market:prices -> Tüm emtiaların (buğday, demir, odun, elmas vb.) anlık borsa fiyatları.
- unit:<entity_id>:stats -> Askerin ait olduğu birlik, kademesi, bağlı olduğu komutan.

---

## 3. ZAMAN DÖNGÜSÜ VE PERFORMANS YÖNETİMİ (TICK SCHEDULER)
Mobil performansını korumak için her şey aynı tick içinde hesaplanmaz:
- Tick (1/20 sn): Sadece yakın dövüş çarpışmaları ve acil hareket komutları.
- Her 5 Saniyede Bir (100 Tick): Asker hedef arama ve formasyon kontrolü.
- Her 60 Saniyede Bir (1200 Tick): Pazar arz-talep fiyat güncellemeleri ve kervan hareketleri.
- Her Minecraft Gününde Bir (24000 Tick): Vergi tahsilatı, asker maaş ödemeleri ve krallık gelir-gider raporu.
