# BİYOM EKONOMİSİ, PAZAR ARBİTRAJI VE DOĞA OLAYLARI (BIOMES & WEATHER)

---

## 1. BÖLGESEL PAZAR ARBİTRAJI
`EconomyEngine.getRegionalMultiplier` fonksiyonu oyuncunun bulunduğu biyom ve yüksekliğe göre pazar fiyatlarını farklılaştırır:
- **Çöl ve Kurak Bölgeler:** Odun (`+60%`) ve Buğday (`+50%`) çok pahalıdır. Orman pazarından ucuza odun alıp çöl pazarında satmak yüksek kervan kârı bırakır.
- **Orman ve Ovalar:** Kereste ucuzdur (`-30%`), ancak Demir Külçesi (`+35%`) daha pahalıdır.
- **Yüksek Dağlar ve Karlı Biyomlar (Y > 95):** Demir ve Kömür ucuzdur (`-25%`), ancak Ekmek ve Tarım ürünleri (`+40%`) pahalıdır.

## 2. DİNAMİK HAVA OLAYLARI (`WeatherEngine.js`)
- **Açık & Bereketli:** Ordular tam hızda hareket eder, tarım üretimi yüksek.
- **Sağanak Yağmur & Çamur:** Kuşatma makineleri yavaşlar.
- **Yoğun Sis (Pusu Havası):** Görüş mesafesi düşer, Turan Taktiği ve pusu saldırıları ölümcül olur.
- **Şiddetli Kar & Tipi:** Rus Kızıl Muhafızları dışındaki birlikler kamp ateşinden uzaklaşırsa üşür.
- **Kuraklık & Sıcak:** Buğday fiyatları borsada yükselir.
