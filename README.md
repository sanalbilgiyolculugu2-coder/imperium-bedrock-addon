# İMPERİUM: Grand Strategy (Minecraft Bedrock Mobile 1.21.0+ / 1.26.62.1)

İMPERİUM, Minecraft Bedrock Edition için geliştirilmiş profesyonel bir **Büyük Strateji (Grand Strategy) & Hanedanlık Simülasyonu** eklentisidir.

---

## Özellikler
- **3D Arazi Sahiplenme (Polygon Land Claim):** 3+ Sınır bayrağı ile arazi çevirme, arazi eğimini takip eden sınır taşları ve shoelace formüllü alan hesabı.
- **Kademeli Askeri Kışla & Ordu:** Askeri yapılar (Kışla, Kale, Dökümhane) inşa edilmeden üst kademe birlikler açılamaz. Osmanlı Yeniçerisi/Sipahisi, Roma Lejyoneri, İngiliz Uzun Yaylısı ve 18 farklı askeri sınıf.
- **Gerçekçi Kuşatma ve Topçuluk:** Patlayıcı gülle atan Şahi Topu, kaya fırlatan Ağır Mancınık, lağımcı barut fıçıları ve kaynar katran kazanları.
- **Dinamik Borsa & Ekonomi:** 3 kademeli sikke sistemi (Bakır Dinar, Gümüş Sikke, Kraliyet Altını), arz-talep borsa hareketleri, tefeci kredisi ve sigortalı ticaret kervanları.
- **Çok Oyunculu Toprak Koruması (Grief-Prevention):** Yetkisiz yabancı oyuncuların kurulan krallık binalarını kırması otomatik olarak engellenir.
- **Açık Dünya Keşfi & Haydut Baskınları:** Keşfedilen yeni arazilerde prosedürel haydut kampları, pazar karakolları ve zengin köylere saldıran haydut akıncıları.

---

## Otomatik Test & Resmi BDS Doğrulaması

Bu eklenti, her kod değişikliğinde **resmi C++ Minecraft Bedrock Dedicated Server (BDS)** ve **13 SimulatedPlayer GameTest senaryosu** ile doğrulanmaktadır.

Detaylı test kılavuzu için [**TESTING_AND_CI.md**](TESTING_AND_CI.md) belgesini inceleyin.

### Tek Komutla Yerel Test
```bash
python3 bds_run.py --local-sim
```
*Tüm JSON şemalarını, doku haritalarını, 3D Blockbench modellerini ve 13 SimulatedPlayer senaryosunu sıfır hata ile doğrular.*

---

## .mcaddon Paketleme & Kurulum

Android / Mobil cihazlarda doğrudan açıp Minecraft'a yüklemek için:
```bash
bash build.sh
```
Oluşan `Imperium_Grand_Strategy_v1.4.mcaddon` veya `MegaMod_1.26.62.1.mcaddon` dosyasına telefonunuzun dosya yöneticisinden tıkladığınızda Minecraft otomatik olarak açılıp modu yükleyecektir.
