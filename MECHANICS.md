# İMPERİUM: BÜYÜK KRALLIKLAR VE İMPARATORLUKLAR (MASTER GDD)

**Oyun Adı:** İMPERİUM  
**Platform:** Minecraft Bedrock Edition (Mobil 1.26.62.1+)  
**Tür:** Grand Strategy / Gerçek Zamanlı Krallık Simülasyonu, Taktik Savaş ve Dinamik Borsa  
**Esinlenilen Yapımlar:** Mount & Blade, Rise of Kingdoms, Total War, Crusader Kings  

---

## 1. OYUN VİZYONU VE TEMEL DÖNGÜ (CORE LOOP)
Oyuncu dünyaya **Sürgün Edilmiş bir Soylu (Exiled Noble)** olarak başlar. Yanında bir miktar altın, kişisel bir koruma askeri ve **Kraliyet Danışmanı (Advisor NPC)** bulunur.
1. **Rehberlik & İlk Adımlar:** Kraliyet Danışmanı ve ekrandan açılan **Görev Defteri UI** adım adım krallığın temellerini öğretir ('3 Bayrak Dik', 'Pazar Kur', '10 Asker Bas').
2. **Köşeli Çokgen (Polygon) Toprak Sahiplenme:** En az 3 adet köşe bayrağı (`claim_flag`) dikilerek serbest geometrik krallık sınırı çizilir.
3. **Ekonomi ve Pazar:** Dünyadaki yarı güvenli pazar karakollarıyla ticaret yapılır, biyomlar arası fiyat farklarından (arbitraj) kâr edilir, kervanlar yollanır ve vergi toplanır.
4. **Şehir İnşası & Zanaat:** Kışla, revir, tahıl ambarı, banka ve lonca kurulur. Köylüler çıraklıktan usta demirci ve fırıncıya dönüşür.
5. **Ordu & Taktiksel Savaş:** Askerler eğitilir, zırh giydirilir, rütbe atlatılır. Komutan Borusu ve dokunmatik birlik çarkı ile taktik formasyonlarda savaşa sürülür.
6. **Kuşatma, Diplomasi ve Zafer:** 6 farklı lider kişiliğine sahip NPC krallıklarla diplomasi yürütülür, casusluk operasyonları yapılır, koçbaşı ve lağımcılarla kaleler fethedilir.

---

## 2. KÖŞELİ ÇOKGEN (POLYGON) TOPRAK SAHİPLENME VE EMLAK SİSTEMİ
- **Geometrik Köşe Bayrakları (`megamod:claim_flag`):**
  - Sabit daire yarıçapı yoktur; sınırlar bayrakların köşe noktalarıyla belirlenir.
  - Minimum **3 Bayrak** ile üçgen bir bölge çizilerek başlanır. 4 bayrakla dörtgen, 5+ bayrakla istenen serbest çokgen sınır oluşturulur.
- **Shoelace Formülü (Gauss Alan Hesabı):**
  - Bayrakların X ve Z koordinatları üzerinden toplam blok alanı (m²) tam olarak hesaplanır.
- **Bayrak Yönetim Arayüzü (Flag UI):**
  - **Genişletme:** Bayrağı daha uzağa taşıyıp m² artırılırsa ek blok başına altın ödenir.
  - **Daraltma:** Bayrak içeri çekilirse, aradaki fark kısmen iade edilir.
  - **Fesih / Satış:** Toprak feshedilirse değer kaybıyla (amortismanlı) satılır.
- **Altyapı ve Yollar:** Sınırlar içine taş/çakıl yol yapıldığında askerler ve kervanlar **%30 daha hızlı yürür**. Köprü gümrük kapılarıyla yabancılardan geçiş ücreti alınır.

---

## 3. SEÇİLEBİLİR 9 BÜYÜK UYGARLIK VE SABİT TARİHİ RENKLER
Tüm uluslar uzaktan kolayca tanınan **sabit otantik renklere** sahiptir. Her ulusun kışlasında zamanla açılan **7-9 farklı askeri birlik kademesi** bulunur:

1. **Osmanlı İmparatorluğu (Kırmızı - Yeşil - Altın Hilal):**
   - *Özel Birimler:* **Yeniçeri** (Tüfek ateşi + kılıçlı yakın dövüş) & **Sipahi** (Ağır zırhlı süvari).
   - *Efsanevi Yadigar:* Fatih Kılıcı (Ordunun yakın dövüş hasarını %40 artırır).
   - *Pasif Bonus:* Pazar ve gümrük vergilerinde +%15 ek gelir.
2. **Roma İmparatorluğu (Kızıl Kırmızı - Altın Kartal):**
   - *Özel Birim:* **Lejyoner** (Testudo kalkan duvarı ustası, oklara %80 direnç).
   - *Efsanevi Yadigar:* Sezar Gladyusu.
   - *Pasif Bonus:* Asker eğitim maliyetlerinde -%10 indirim, yol yürüyüş hızı bonusu.
3. **Britanya İmparatorluğu (Lacivert - Beyaz - Kırmızı Haç):**
   - *Özel Birim:* **Uzun Yaylılar** (Ekstrem menzilli zırh delen salvo atışı).
   - *Efsanevi Yadigar:* Excalibur.
   - *Pasif Bonus:* Kule savunmasında menzil ve isabet üstünlüğü.
4. **Sovyetler Birliği / Rusya (Kızıl - Beyaz - Demir):**
   - *Özel Birim:* **Kızıl Muhafız** (Soğuk biyomlarda donma direnci, devasa can havuzu).
   - *Pasif Bonus:* Kış soğuklarında askerler zayıflamaz, hızlı kışla basımı.
5. **Fransa (Kraliyet Mavisi - Altın Zambak):**
   - *Özel Birim:* **Şövalye / Paladin** (Mızraklı ölümcül hücum süvarisi).
   - *Pasif Bonus:* Tarım ve şölen/ziyafet verimliliğinde %20 artış.
6. **Çin İmparatorluğu (İmparatorluk Sarısı - Yeşim Yeşili):**
   - *Özel Birim:* **Chu-Ko-Nu** (Seri ok fırlatan kundaklı yaycı).
   - *Pasif Bonus:* Kale surları ve binalarda %25 ekstra dayanıklılık puanı.
7. **İspanya İmparatorluğu (Altın Sarısı - Kan Kırmızısı):**
   - *Özel Birim:* **Fatih / Conquistador** (Zırhlı atlı tüfekçi).
   - *Pasif Bonus:* Altın ve maden çıkarma hızında %20 artış.
8. **Moğol İmparatorluğu (Bozkır Mavisi - Beyaz Kurt):**
   - *Özel Birim:* **Keshik** (Dörtnala giderken arkaya ok atabilen atlı okçu).
   - *Efsanevi Yadigar:* Cengiz Han Yayı.
   - *Pasif Bonus:* Süvari hızında +%30, sefere çıkan ordunun erzak tüketiminde %25 tasarruf.
9. **Sparta (Koyu Bordo - Bronz Lambda):**
   - *Özel Birim:* **Spartalı Hoplit** (Geçit vermez uzun kargı duvarı).
   - *Pasif Bonus:* Askerler asla paniklemez; canları %30 altına indiğinde hasarları ikiye katlanır.

---

## 4. DİNAMİK BORSA, TİCARET ARBİTRAJI VE YARI GÜVENLİ PAZARLAR
1. **Hibrit Para Birimi:**
   - Envanterde fiziksel taşınan **Bakır Dinar**, **Gümüş Sikke**, **Kraliyet Altını** ve Krallık Bankasında tutulan dijital hazine.
2. **Yarı Güvenli Pazar Karakolları (Market Outposts):**
   - Dünyanın farklı biyomlarında doğal olarak spawn olan tarafsız kalelerdir.
   - Normal oyuncudan **1.25 kat daha iri cüsseli Elit Pazar Muhafızları (`elite_market_guard`)** tarafından korunur.
   - Yalnız bir haydut veya oyuncu saldırırsa muhafızlar yok eder; ancak **büyük bir ordu getiren oyuncu pazarı basıp yağmalayabilir**.
3. **Bölgesel Fiyat Farkları (Arbitraj) & Dinamik Fiyatlandırma:**
   - Çöl pazarında odun pahalı, orman pazarında demir pahalıdır. Ucuza alıp uzaktaki pazarda pahalıya satarak tüccar karı elde edilir.
   - Taban ve tavan fiyat sınırı: Ürünler en fazla %50 ucuzlar, en fazla 3 katına çıkar.
4. **Kervanlar, Güvenlik ve Sigorta:**
   - Oyuncular deve veya katır kervanları donatıp ticaret rotaları kurabilir. Kervan muhafızları atanabilir, pazar loncasından sigorta yaptırılabilir veya düşman kervanları pusuya düşürülüp yağmalanabilir.
5. **Bankacılık, Borç & Tefecilik:**
   - Krallık Bankasında altın biriktirilebilir. Acil durumlarda tefecilerden borç altın alınabilir; vadesinde ödenmezse tefecilerin kiralık haydutları şehre haciz baskını yapar!
6. **Vergi Döngüsü:**
   - Her Minecraft gününde bir (20 dakikada bir, şafakta) hazineye akar.

---

## 5. ASKERİ SİSTEM: KOMUTA, TAKTİK, DENGELER VE HİBRİT ÖLÜM
1. **Komutan Borusu (`megamod:war_horn`) & Dokunmatik Kontroller:**
   - Ekranda hızlı birlik seçimi: `[1: Piyadeler]`, `[2: Okçular]`, `[3: Süvariler]`, `[TÜMÜ]`.
   - **Komutan İşaretleme Işığı:** Boruyla nişan alınan noktaya dikey görsel ışık sütunu inerek askerlere 'Buraya gidin' hedefini gösterir.
   - **Güvenli Dost Ateşi Kapalı:** Komutan ve askerler yanlışlıkla birbirine vuramaz; silahlar dostların içinden geçer.
2. **Taktiksel Birlik Dengelemesi (Combat Counters):**
   - **Mızrak**, Süvariyi durdurur ve atı devirir.
   - **Süvari**, Okçuları ezer ve çiğneme hasarı (Trample Damage) verir.
   - **Okçu**, uzaktan Mızraklıları biçer.
   - **Kalkanlı Piyade**, ok yağmurunu engeller.
   - **Gürz ve Kundaklı Yay (Crossbow)**, ağır zırhları deler.
3. **Formasyonlar & Özel Taktikler:**
   - Hat Formasyonu, Kama Hücumu, Kalkan Duvarı, Kare Savunma.
   - **Süvari Kanat Saldırısı:** Süvarileri düşman okçularının arkasına gönderme.
   - **Sahte Geri Çekilme (Turan Taktiği):** Kaçar gibi yapıp düşmanı pusuya çekme.
   - **Ok Salvosu:** Okçuların gökyüzüne aynı anda yaylım ateşi açması.
   - **Kargı Yatırma (Couch Lance):** At tam hızdayken mızrağı yatırıp ölümcül tek vuruş yapma.
4. **Hibrit Ölüm & Ezici Hasar:**
   - **Hafif / Normal Hasar:** Kılıç veya okla vurulan asker %50 şansla yaralanıp yere yığılır (`wounded_soldier`). Saha sargı beziyle veya revirde tedavi edilirse kurtulur.
   - **EZİCİ / AĞIR HASAR (Kalıcı Ölüm):** Top güllesi, mancınık kayası, TNT patlaması ve yüksekten düşmede asker **ANINDA VE KALICI OLARAK PARÇALANIP ÖLÜR**.
   - **Kralın Canı:** Kral (oyuncu) normal bir insandan **1.6 kat daha fazla (32 HP)** cana sahiptir. Normal ölümlerde tahtında canlanır; kalıcı krallık mağlubiyetinde ise yetiştirdiği kıdemli komutan veya varis tahta geçer.
5. **Moral, Firar ve Ölümüne Savaşanlar:**
   - Kademe 1-2 acemi askerler komutan ölürse veya %70 kayıp verilirse panikleyip kılıçlarını atarak firar edebilir.
   - Ulusal Elit birlikler ve Sparta Hoplitleri **Ölümüne Savaşır**, asla kaçmazlar.
6. **Erzak Çeşitliliği & Lojistik:**
   - Sadece ekmek yerine et, balık ve sebze verilirse ordunun hücum gücü ve morali %20 artar. Uzun seferler için tuzlanmış balık ve kuru et bozulmaz. Uzak sefere çıkan ordunun arkasında **Erzak Arabası (`supply_wagon`)** bulunmalıdır.

---

## 6. KUŞATMA VE KALE SAVUNMASI MEKANİKLERİ
1. **Sur & Kapı Dayanıklılık Puanı (HP Bar):** Dünyayı delik deşik edip cihazı kastırmamak için kalenin sur ve ana kapılarının dayanıklılık çubuğu bulunur.
2. **Kuşatma Silahları ve Taktikleri:**
   - **Koçbaşı (Battering Ram):** Askerlerin ittiği ıslak deri çatılı (kaynar katrana dayanıklı) kapı kırıcısı.
   - **Mancınık (Catapult):** Surlara taş gülle atar.
   - **Lağımcı Tünelleri:** Surların altına tünel kazıp patlayıcıyla gedik açma.
   - **Tırmanma Kancası ve Halat Merdiven:** Gece gizlice surlara sızma.
   - **Seyyar Ahşap Siperler (Mantlet):** Okçuları sur atışlarından koruyan siperler.
3. **Sur Savunma Donanımları:**
   - **Kaynar Katran / Yağ Kazanı:** Sura yaklaşan düşmanların üstüne dökülen ölümcül savunma.
   - **Mazgallı Okçu Kuleleri:** İçindeki okçuların korunaklı şekilde ok yağdırmasını sağlar.
   - **Sivri Kazık Hatları (Wooden Stakes):** Surların önüne dikilir; üstüne koşan düşman süvarilerini anında devirir.
   - **Hendekler ve Dikenli Tuzaklar (Caltrops):** Düşmanı yavaşlatır.
4. **Kuşatma Yangınları & İtfaiye:**
   - Alevli oklar ve mancınık katranı ahşap binaları yakar; köylüler su kovalarıyla yangını söndürmeye koşar. Taş kale duvarları yangına tam dayanıklıdır.
5. **Teslim Olma & Fetih Sonrası Kararlar:**
   - Erzakı biten kale garnizonu açlıktan kan dökülmeden teslim olabilir.
   - Kale düştüğünde komutan karar verir: 'Şehri Yağmala' (Çok altın, yüksek nefret) veya 'Halkı Koru' (Düşük altın, yüksek sadakat).

---

## 7. HAYDUT, HIRSIZ VE YABAN HAYATI EKOSİSTEMİ (GROUNDED REALISM)
Fantastik canavarlar yerine gerçekçi tehlikeler yer alır:
- **Pazar Yankesicileri:** Yollarda ve pazarlarda yalnız gezenlerin parasını çalar.
- **Yol Kesen Haydut Çeteleri (4-8 Kişilik):** Orman yollarında pusu kurup kervanlara saldırır.
- **Gizli Dağ ve Orman Kampları:** Temizlendiğinde ganimet ve kaçırılmış köylüler kurtarılır.
- **Yaban Hayvanları & Avcılık:** Ormanlarda geyik, yaban domuzu ve kurtlar; avcılar et ve değerli kürk toplar. Soğuk biyom pazarlarında kürk fiyatı tavan yapar.
- **Adalet, Zindan ve Ceza:** Yakalanan suçlular **Krallık Zindanına** atılır; fidye istenebilir, taş ocaklarında amele yapılabilir veya darağacında ibret cezası verilebilir.

---

## 8. DİPLOMASİ VE 6 FARKLI YAPAY ZEKA (AI) KRALLIK KİŞİLİĞİ
Dünyadaki rakip NPC krallıklar bağımsız olarak gelişir, birbirleriyle savaşır ve ticaret yapar. Lider kişilikleri:
1. **Agresif (Warmonger):** Sürekli ordu toplar, ilk fırsatta savaş ilan eder.
2. **Barışçıl (Builder):** Ticarete odaklanır, saldırmazlık paktına sadıktır.
3. **Kurnaz / Fırsatçı (Shrewd):** Başka bir krallıkla savaştığınız anda sizi arkadan vurur.
4. **Sinsi (Espionage Master):** Doğrudan savaş yerine casus sızdırır, su kuyularınızı zehirler.
5. **Yalaka (Submissive):** Güçlü komutanlara hemen haraç ve vasallık teklif eder.
6. **Kibirli (Arrogant):** Barış tekliflerini reddeder, son nefesine kadar savaşır.
- **Casusluk Operasyonları:** Gece kale kapısını içeriden açma, erzak ambarını kundaklama, su kuyusunu zehirleme, düşman generali suikastı.
- **Haberleşme:** Kuşatılan kale **Posta Güvercini** veya tepelerdeki **İşaret Ateşi Kuleleri** ile müttefiklerini yardıma çağırabilir.

---

## 9. ŞEHİR YAŞAMI, LONCALAR, DERİN MADENLER VE FERMANLAR
1. **Lonca ve Zanaatkarlar:** Boş köylüler loncaya atanarak usta fırıncı, usta demirci, taş ustası olur. Usta demirci daha sağlam zırh döver.
2. **Silah ve Zırh Kalite Kademeleri:** Paslı -> Sıradan -> Kaliteli -> Usta İşi -> Efsanevi.
3. **Derin Maden Ocakları:** Düzenli olarak kömür, demir ve altın üretip dökümhaneye aktarır. Ancak binlerce cevher çıkarıldıktan sonra damar tükenebilir ve yeni ocak aranır.
4. **Kraliyet Fermanları:** Kral tahta oturup ferman çıkarabilir:
   - 'Sıkıyönetim Fermanı' (Suçları sıfırlar, huzursuzluk yaratır).
   - 'Hasat Seferberliği Fermanı' (Tarım üretimini katlar).
   - 'Büyük Şenlik Fermanı' (Halkın mutluluğunu ve ordu moralini tavan yaptırır).
   - 'Vergi İndirimi Fermanı' (Şehre göçmen ve tüccar akını başlatır).
5. **Önemli Şehir Binaları:**
   - **Şehir Meydanı Çanı:** Kuşatmada çalar; köylüler kaleye sığınır, askerler surlara koşar.
   - **Kütüphane & Kayıt Odası:** Krallığın fetih geçmişi ve muhasebe defterleri.
   - **Ziyafet & Şölen Masası:** Büyük zaferlerden sonra kutlama yapılır.
   - **İbadethane (Cami / Tapınak / Kilise):** Maneviyatı ve sadakati yüksek tutar, isyanları önler.
   - **Revir & Şifacı Çadırı:** Yaralıları tedavi eder, veba/salgın hastalıkları engeller.
6. **Aktif Savaş Alanı Yağmalama:**
   - Savaş bittiğinde ganimet sandıkları sihirli şekilde belirmez; **oyuncu ve askerleri savaş alanında bizzat gezerek** düşman cesetlerinin silahlarını, zırhlarını ve altınlarını toplar.

---

## 10. ÇEVRE, DOĞA OLAYLARI VE MEVSİMLER
- **Sağanak Yağmur & Çamur:** Askerler ve kuşatma arabaları yavaşlar, ateşli silahlar/meşaleler söner.
- **Şiddetli Kar & Tipi:** Donma hasarı; nehirler donar ve süvariler buz üstünden karşıya geçer.
- **Yoğun Sis:** Görüş 15 bloğa düşer, pusu taktikleri için ideal ortam oluşur.
- **Çöl Kum Fırtınası:** Görüşü sıfırlar, birlikleri yavaşlatır.
- **Bahar Taşkınları:** Eriyen karlarla nehirler kabarır, köprüler hayati geçit noktaları olur.
- **Vardiyalı Nöbet & Dinlenme:** Askerlerin yarısı surlarda nöbet tutarken yarısı kamp ateşinde veya kışlada uyuyup dinlenir. Gece kampa sızılırsa askerler zırhsız yakalanır.

---

## 11. MOBİL PERFORMANS VE SIFIR LAG KURALLARI
1. **Matematiksel Arka Plan Simülasyonu:** Oyuncudan uzaktaki NPC krallıklar 3D varlık olarak dünyayı yormaz; üretim, savaş ve kervan hareketleri arkada saf matematik olarak döner. Oyuncu yaklaştığında 3D olarak canlanır.
2. **Aktif Savaşçı Sınırı:** Ekranda aynı anda maksimum 40-60 aktif savaşçı entity çarpışır; arkadaki ordu rezervi dalga dalga takviye olarak gelir.
3. **Minecraft Vanilla / Blockbench 16x16 Düşük Poligon:** Modeller nostaljik kareli Minecraft dokusuna tam uyar, gereksiz yüksek poligon kullanılmaz.
4. **Otomatik Temizlik Kuralı:** Savaş bittiğinde boşta kalan kırık oklar temizlenir; **ANCAK DÜŞEN GANİMETLER VE EŞYALAR ASLA SİLİNMEZ.**
