# İMPERİUM: OTOMATİK BDS + GAMETEST (SIMULATED PLAYER) DOĞRULAMA SİSTEMİ

Bu belge, İMPERİUM add-on paketinin insan müdahalesi olmadan hem **GitHub Actions üzerinde gerçek Bedrock Dedicated Server (BDS)** ile hem de **yerel `bds_run.py` simülatörü** ile nasıl test edildiğini açıklar.

## Mimari İlkeler
1. **Temiz Ana Paket (`BP/`):** Oyuncuların kuracağı ana `BP/` paketi `server-gametest` bağımlılığı içermez; böylece normal dünyaları gereksiz yere test moduna sokmaz.
2. **İzole Test Kopyası (`test_BP/`):** `BP/` paketinin birebir kopyası üzerine `@minecraft/server-gametest` (`1.0.0-beta`) modülü ve `scripts/gametest/ImperiumGameTestSuite.js` eklenerek oluşturulur.
3. **`TEST_RESULT:` Log Protokolü:** Her `SimulatedPlayer` senaryosu çalıştığında sonuçları `console.warn("TEST_RESULT: " + JSON.stringify(...))` formatında standart sunucu çıktısına yazar.
4. **Content-Log Hata Yakalama:** Sunucu açılışında JSON, model, doku veya varlık şeması hatası (`[ContentLog] [error]` veya `[Scripting] [error]`) oluşursa `bds_run.py` testi anında başarısız (`EXIT 1`) sayar.
