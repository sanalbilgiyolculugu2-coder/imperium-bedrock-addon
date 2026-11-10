# İMPERİUM: GÖREV VE FAZ TAKİP LİSTESİ (TODO)

Tüm geliştirme aşamaları **%100 tamamlanmış** ve `validate.py` ile **0 Hata / 0 Uyarı** olarak doğrulanmıştır.

---

## Faz 1: Çekirdek Ekonomi, Pazar ve Poligon Sınır Motoru
- [x] **3 Kademeli Para Birimi:** Bakır Dinar (`copper_dinar`), Gümüş Sikke (`silver_coin`), Kraliyet Altını (`royal_gold`) ve otomatik para bozdurma/tümleme motoru (`EconomyEngine.js`).
- [x] **Dinamik Arz-Talep Pazarı (`MarketUI.js`):** Taban (%50) ve tavan (3x) fiyat sınırları, biyom bazlı bölgesel fiyat arbitrajı (Çöl, Orman, Dağ).
- [x] **Poligon Sınır ve Arazi Motoru (`PolygonClaimEngine.js`, `FlagUI.js`):** En az 3 köşe bayrağı (`claim_flag`), Shoelace m² alan hesabı, Ray-Casting sınır kontrolü, bayrak kaydırmada alan farkı mahsubu, bayrak sökmede %70 ikinci el iade.
- [x] **Kraliyet Bankası ve Kervan Sistemi (`BankAndCaravanUI.js`):** Mevduat faizi, Tefeci/Banka kredisi, Deve Kervanı (`pack_camel`) sigortalı ticaret seferi.
- [x] **Günlük Vergi ve Maaş Döngüsü (`TaxCycle.js`):** 20 dakikada bir otomatik vergi tahsilatı ve asker maaşı ödemesi; ödenmeyen maaşta asker firarı/eşkıya isyanı; >%35 vergide köylü ayaklanması.

## Faz 2: 9 Medeniyet, Ordu, Kışla ve Saha Savaşı
- [x] **9 Tarihsel Medeniyet (`NationManager.js`, `NationSelectUI.js`):** Osmanlı, Roma, Britanya, Sovyet/Rusya, Fransa, Çin, İspanya, Moğol, Sparta; her ulusa özel pasif bonuslar ve sabit bayrak renkleri.
- [x] **40 Özel Varlık (`BP/entities/` & `RP/entity/`):** 10 Ulusa Özel Elit Birim, 7 Genel Ordu Kademesi, 4 Uzman Birlik (`combat_medic`, `sapper_engineer`, `fire_brigade_soldier`, `rival_kingdom_lord`), 3 Kuşatma/Lojistik Aracı, 3 Deniz Aracı, 7 Şehir/Zindan NPC'si, 3 Haydut/Yankesici, 3 Binek/Yük Hayvanı.
- [x] **Taktiksel Savaş Borusu (`MilitaryController.js`):** Bölük filtreleri (`[1: Piyade]`, `[2: Okçu]`, `[3: Süvari]`, `[Tümü]`), formasyonlar (Hilal/Turan, Testudo, Falanks, Kama), taş-kağıt-makas silah dengesi, dost ateşi koruması.
- [x] **Hibrit Ölüm ve Sıhhiye (`wounded_soldier`, `combat_medic`):** Normal hasarda %50 yaralı düşme, sargı bezi veya Sıhhiye Hekimi ile kurtarma; ezici/patlama hasarında kalıcı ölüm (`perma_death`).
- [x] **Bireysel Asker Etkileşimi (`SoldierInteractionUI.js`):** Ulusal sesli replikler, zırh giydirme, erzak yedirme, terfi ve dinamik baş üstü can barı (`[|||||...]`).

## Faz 3: Kuşatma, Denizcilik, Maden, Diplomasi ve Dünya Üretimi
- [x] **Kuşatma Mühendisliği (`SiegeEngine.js`):** 500 HP Sürgülü Kale Kapısı, Kaynar Katran Kazanı, Lağımcı Barut Fıçısı, Kuşatma Kancası, Kazık/Demir Diken tuzakları.
- [x] **Tersane ve Maden Ocakları (`HarborAndMineUI.js`):** Savaş Kadırgası, Ticaret Karavelası, Korsan Kalyonu ve Tam Otomatik Maden Kuyusu üretimi.
- [x] **Diplomasi, Casusluk ve Fermanlar (`DiplomacyUI.js`, `SpyUI.js`, `EdictUI.js`):** İttifak, haraç, ambargo, suikast, kuyu zehirleme, kapı içeriden açma ve 5 Kraliyet Fermanı.
- [x] **Prosedürel Dünya Yapıları & Otomatik İnşaat (`BlueprintBuilder.js`, `WorldGenManager.js`):** 5 hazır yapı şeması ile tek tıkla inşaat; keşif sırasında otomatik oluşan Tarafsız Pazar Karakolları, Gizli Haydut Kampları, Rakip Krallık Sınır Kaleleri ve arka plan matematiksel AI simülasyonu.
- [x] **Mobil Sıfır-Lag Koruması (`WeatherEngine.js`, `BarracksUI.js`):** Aktif 50 asker sınırı (fazlası Yedek Ordu'da), yere saplanan sahipsiz okların periyodik temizliği ve **ganimet/eşya silmeme garantisi**.
