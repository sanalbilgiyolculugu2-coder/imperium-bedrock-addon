# AGENT VE GELİŞTİRİCİ ÇALIŞMA KURALLARI (AGENT GUIDELINES)

Bu kurallar, bu büyük mod projesinde kod yazacak tüm AI agent'lar ve geliştiriciler için zorunludur.

---

## 1. MOBİL PERFORMANS KURALLARI (BEDROCK CONSTRAINTS)
- **Asla sonsuz `system.runInterval` döngülerinde ağır arama yapmayın:** Her tickte tüm dünyadaki entity'leri taramak (`world.getDimension().getEntities()`) mobil cihazda FPS'i sıfıra düşürür.
- **Entity Sınırlarına Uyun:** Birlik sisteminde aynı anda spawn edilecek asker sayısını makul sınırlar içinde tutun (Ekran başı maksimum 40-60 aktif savaşçı).
- **Doğrulamadan (validate) Oyuna Aktarmayın:** Her kod yazımından sonra `python3 /storage/emulated/0/MinecraftMegaMod/validate.py` çalıştırılarak JSON ve JS geçerliliği kontrol edilmelidir.

## 2. KOD STANDARTLARI
- **Komut ve Betik Entegrasyonu:** Mümkün olan yerlerde `@minecraft/server` v1.14.0+ ve `@minecraft/server-ui` v1.3.0+ modern API standartlarını kullanın.
- **İsimlendirme (Identifiers):** Tüm mod eşya, blok ve varlıkları `megamod:<ad>` ön ekiyle başlamalıdır.
- **Geriye Dönük Uyumluluk:** Kayıtlı krallık verilerini bozacak `DynamicProperties` anahtar değişiklikleri yaparken veri göçü (migration) mekanizmasını koruyun.
