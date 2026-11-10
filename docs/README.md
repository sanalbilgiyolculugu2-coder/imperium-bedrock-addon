# Mega Mod (Minecraft Bedrock Mobile 1.26.62.1)

Bu klasör, Minecraft Bedrock (Mobil / Android) için profesyonel eklenti (Add-on) geliştirme ortamıdır.

## Klasör Yapısı
- **BP/ (Behavior Pack)**: Davranış paketi. Varlık mekanikleri, eşyalar, bloklar, ganimet tabloları, tarifler ve `@minecraft/server` JavaScript scriptleri burada yer alır.
- **RP/ (Resource Pack)**: Kaynak paketi. Modeller, kaplamalar/dokular (textures), animasyonlar, sesler ve dil çevirileri burada yer alır.
- **build.sh**: Modu tek tıkla telefonda doğrudan açılabilecek `.mcaddon` formatına dönüştüren derleme betiği.

## .mcaddon Oluşturma & Oyuna Yükleme
Termux üzerinden çalıştırmak için:
```bash
bash /storage/emulated/0/MinecraftMegaMod/build.sh
```
Oluşan `MegaMod_1.26.62.1.mcaddon` dosyasına telefonunuzun dosya yöneticisinden tıkladığınızda Minecraft doğrudan açılıp modu otomatik yükleyecektir.
