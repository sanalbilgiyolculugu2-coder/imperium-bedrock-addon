import { SoldierInteractionUI } from '../ui/SoldierInteractionUI.js';
import { world, system } from '@minecraft/server';
import { ActionFormData } from '@minecraft/server-ui';

export class MilitaryController {
    static activeSquadFilter = {}; // player.id -> 'all' | 'infantry' | 'archer' | 'cavalry'

    static openWarHornMenu(player) {
        const currentFilter = this.activeSquadFilter[player.id] || 'all';
        const filterNames = {
            'all': 'TÜM ORDU',
            'infantry': '1: PİYADELER',
            'archer': '2: OKÇULAR',
            'cavalry': '3: SÜVARİLER'
        };

        const form = new ActionFormData()
            .title(`§4⚔️ KOMUTA BORUSU [${filterNames[currentFilter]}]`)
            .body(`§eSeçili Birlik Grubu: §6${filterNames[currentFilter]}\n` +
                  `§7Birlik grubunu değiştirebilir veya anlık taktik emir verebilirsiniz:`)
            .button('§c⚡ HÜCUM ET (Charge)\n§8Düşman hatlarına tam güç saldır')
            .button('§1🛡️ KALKAN DUVARI / HATTI KORU\n§8Savunma pozisyonu al (%80 ok direnci)')
            .button('§2🏹 SALVO YAYLIM ATEŞİ\n§8Tüm okçular aynı anda hedefi ok yağmuruna tutar')
            .button('§6🐎 SÜVARİ KANAT TAARRUZU\n§8Süvariler hızlanıp düşman arkasını ezer')
            .button('§e🏃 TURAN TAKTİĞİ (Sahte Ricat)\n§8Geri çekilip düşmanı pusuya düşür')
            .button('§a👣 KOMUTANI TAKİP ET\n§8Etrafımda koruma çemberi kur')
            .button('§b🎯 BİRLİK GRUBU SEÇ (1:Piyade / 2:Okçu / 3:Süvari / Tümü)');

        form.show(player).then((res) => {
            if (res.canceled) return;

            if (res.selection === 6) {
                this.openSquadFilterMenu(player);
                return;
            }

            const familyFilter = currentFilter === 'all' ? 'soldier' : currentFilter;
            const soldiers = player.dimension.getEntities({
                location: player.location,
                maxDistance: 48,
                families: [familyFilter]
            });

            // Görsel Komutan İşaret Işığı Sütunu
            player.runCommand('particle minecraft:beacon_aura_particle ~ ~1 ~');
            player.runCommand('particle minecraft:totem_particle ~ ~2 ~');
            player.runCommand('playsound raid.horn @a[r=40] ~ ~ ~ 1.0 1.0');

            if (res.selection === 0) {
                for (const s of soldiers) {
                    s.triggerEvent('imperium:order_charge');
                    s.addEffect('speed', 200, { amplifier: 1, showParticles: false });
                    s.addEffect('strength', 200, { amplifier: 0, showParticles: false });
                }
                player.sendMessage(`§c[Savaş Borusu] ⚡ ${soldiers.length} Asker (${filterNames[currentFilter]}) HÜCUMA KALKTI!`);
            } else if (res.selection === 1) {
                for (const s of soldiers) {
                    s.triggerEvent('imperium:order_hold_line');
                    s.addEffect('resistance', 400, { amplifier: 2, showParticles: false });
                }
                player.sendMessage(`§9[Savaş Borusu] 🛡️ ${soldiers.length} Asker KALKAN DUVARI kurdu!`);
            } else if (res.selection === 2) {
                const archers = player.dimension.getEntities({
                    location: player.location,
                    maxDistance: 48,
                    families: ['archer']
                });
                const viewDir = player.getViewDirection();
                for (const a of archers) {
                    const spawnPos = { x: a.location.x, y: a.location.y + 1.8, z: a.location.z };
                    const arrow = player.dimension.spawnEntity('minecraft:arrow', spawnPos);
                    arrow.applyImpulse({ x: viewDir.x * 2.2, y: 0.45, z: viewDir.z * 2.2 });
                }
                player.sendMessage(`§2[Savaş Borusu] 🏹 ${archers.length} Okçu gökyüzüne SALVO yaylım ateşi açtı!`);
            } else if (res.selection === 3) {
                const cavs = player.dimension.getEntities({
                    location: player.location,
                    maxDistance: 48,
                    families: ['cavalry']
                });
                for (const c of cavs) {
                    c.triggerEvent('imperium:order_charge');
                    c.addEffect('speed', 240, { amplifier: 2, showParticles: false });
                }
                player.sendMessage(`§6[Savaş Borusu] 🐎 ${cavs.length} Süvari KANAT TAARRUZUNA geçti!`);
            } else if (res.selection === 4) {
                for (const s of soldiers) {
                    s.addEffect('speed', 160, { amplifier: 2, showParticles: false });
                }
                player.runCommand('effect @e[family=bandit,r=25] slowness 10 2');
                player.runCommand('effect @e[family=bandit,r=25] weakness 10 1');
                player.sendMessage(`§e[Savaş Borusu] 🏃 TURAN TAKTİĞİ! Düşman çembere alındı ve zayıflatıldı!`);
            } else if (res.selection === 5) {
                for (const s of soldiers) {
                    s.triggerEvent('imperium:order_follow');
                    const dx = (Math.random() - 0.5) * 6;
                    const dz = (Math.random() - 0.5) * 6;
                    s.teleport({ x: player.location.x + dx, y: player.location.y, z: player.location.z + dz });
                }
                player.sendMessage(`§a[Savaş Borusu] 👣 ${soldiers.length} Asker etrafınızda koruma çemberi oluşturdu!`);
            }
        });
    }

    static openSquadFilterMenu(player) {
        const form = new ActionFormData()
            .title('§0Birlik Grubu Seçimi')
            .body('§7Emirlerinizi hangi askeri sınıfa yönlendirmek istiyorsunuz?')
            .button('§6[TÜMÜ] Tüm Ordu Birlikleri')
            .button('§c[1] Sadece Piyadeler & Kalkanlılar')
            .button('§2[2] Sadece Okçular & Tüfekçiler')
            .button('§e[3] Sadece Süvariler & Atlılar');

        form.show(player).then((res) => {
            if (res.canceled) return;
            const keys = ['all', 'infantry', 'archer', 'cavalry'];
            this.activeSquadFilter[player.id] = keys[res.selection];
            this.openWarHornMenu(player);
        });
    }

    // Kralın Canı (1.6x = 32 HP)
    static applyKingHealth(player) {
        player.addEffect('health_boost', 20000000, { amplifier: 2, showParticles: false });
    }

    // Efsanevi Yadigar Silah Yetenekleri
    static triggerRelicPower(player, itemTypeId) {
        if (itemTypeId === 'megamod:relic_fatih_sword') {
            player.runCommand('effect @e[family=soldier,r=30] strength 15 1');
            player.runCommand('playsound raid.horn @a[r=30] ~ ~ ~ 1 0.8');
            player.sendMessage('§6[Fatih Kılıcı] §c"İleri Yeniçeriler!" §eTüm ordunun yakın dövüş hasarı 15 saniye boyunca %40 arttı!');
        } else if (itemTypeId === 'megamod:relic_caesar_gladius') {
            player.runCommand('effect @e[family=soldier,r=30] resistance 20 3');
            player.sendMessage('§6[Sezar Gladyusu] §c"Roma İçin!" §eLejyonların kalkan duvarı 20 saniye boyunca kırılmaz oldu!');
        } else if (itemTypeId === 'megamod:relic_excalibur') {
            player.runCommand('effect @e[family=soldier,r=30] regeneration 15 2');
            player.sendMessage('§b[Excalibur] §eKutsal kılıç parladı! Tüm ordunun yaraları iyileşiyor!');
        } else if (itemTypeId === 'megamod:relic_khan_bow') {
            player.runCommand('effect @e[family=soldier,r=30] speed 20 2');
            player.sendMessage('§6[Cengiz Han Yayı] §bBozkır rüzgarı arkamızda! Tüm süvari ve okçuların hızı katlandı!');
        }
    }

    // Saha Sargı Bezi ile Yaralı Askeri Kurtarma
    static reviveWoundedSoldier(player) {
        const wounded = player.dimension.getEntities({
            location: player.location,
            maxDistance: 5,
            type: 'megamod:wounded_soldier'
        });

        if (wounded.length === 0) {
            player.sendMessage('§e[Sıhhiye] Yakınınızda (5 blok) tedavi edilecek ağır yaralı asker yok.');
            return;
        }

        const target = wounded[0];
        const pos = target.location;
        target.remove();
        const revived = player.dimension.spawnEntity('megamod:regular_footman', pos);
        revived.nameTag = '§a★2 Kıdemli Gaziler (Tedavi Edildi)';
        revived.triggerEvent('imperium:promote_veteran');

        player.runCommand('clear @s megamod:field_bandage 0 1');
        player.runCommand('particle minecraft:heart_particle ~ ~1 ~');
        player.sendMessage('§a[Sıhhiye] Ağır yaralı asker sargı beziyle kurtarıldı ve Kıdemli rütbesiyle yeniden saflara katıldı!');
    }

    // Silah Taş-Kağıt-Makas Dengesi, Dost Ateşi Koruması ve Hibrit Ölüm
    static handleEntityHurt(event) {
        const hurtEntity = event.hurtEntity;
        const attacker = event.damageSource?.damagingEntity;
        const cause = event.damageSource?.cause;

        if (!hurtEntity) return;

        // 1. Güvenli Dost Ateşi Koruması (Komutan kendi askerine zarar veremez)
        if (attacker && attacker.typeId === 'minecraft:player' && hurtEntity.typeId.startsWith('megamod:')) {
            if (!hurtEntity.typeId.includes('bandit') && !hurtEntity.typeId.includes('thief')) {
                hurtEntity.addEffect('instant_health', 1, { amplifier: 5, showParticles: false });
                return;
            }
        }

        // 2. Taktiksel Silah Üstünlükleri (Combat Counters)
        if (attacker && attacker.typeId === 'minecraft:player') {
            const equip = attacker.getComponent('equippable');
            const mainhand = equip?.getEquipment('Mainhand');
            if (mainhand) {
                // Mızrak Süvariyi devirir
                if ((mainhand.typeId.includes('spear') || mainhand.typeId.includes('dory')) && hurtEntity.typeId.includes('cavalry')) {
                    hurtEntity.applyDamage(12);
                    attacker.sendMessage('§a[Taktik Üstünlük] Mızrak süvariyi durdurdu! (2.5x Hasar)');
                }
                // Kargı Yatırma (Couch Lance)
                if (mainhand.typeId === 'megamod:couch_lance' && attacker.isSprinting) {
                    hurtEntity.applyDamage(20);
                    attacker.sendMessage('§6[Kargı Hücumu] Dörtnala ölümcül mızrak darbesi! (+20 Ezici Hasar)');
                }
                // Gürz ve Kundaklı Yay zırh deler
                if (mainhand.typeId === 'megamod:flanged_mace' || mainhand.typeId === 'megamod:steel_crossbow') {
                    hurtEntity.applyDamage(6);
                }
            }
        }

        // 3. Ezici Hasar vs Hafif Hasar (Hibrit Ölüm Mekaniği)
        const fatalCauses = ['blockExplosion', 'entityExplosion', 'anvil', 'fallingBlock', 'crush', 'fire', 'lava'];
        if (fatalCauses.includes(cause)) {
            hurtEntity.addTag('perma_death');
        }
        if (hurtEntity.typeId.startsWith('megamod:')) {
            system.run(() => SoldierInteractionUI.updateOverheadBar(hurtEntity));
        }
    }

    static handleEntityDie(event) {
        const dead = event.deadEntity;
        const killer = event.damageSource?.damagingEntity;
        if (!dead) return;

        // Savaşta hayatta kalan askerin Terfi / Rütbe atlaması (Acemi -> Kıdemli -> Elit)
        if (killer && killer.typeId.startsWith('megamod:') && !killer.typeId.includes('bandit')) {
            if (!killer.hasTag('veteran')) {
                killer.addTag('veteran');
                killer.triggerEvent('imperium:promote_veteran');
                killer.nameTag = `§b★★ Kıdemli Birlik`;
            } else if (!killer.hasTag('elite')) {
                killer.addTag('elite');
                killer.triggerEvent('imperium:promote_elite');
                killer.nameTag = `§6★★★ Elit Muhafız`;
            }
        }

        // Asker öldüğünde: Ezici hasar almadıysa %50 şansla Yaralı Asker olarak yere yığılır
        if (dead.typeId.startsWith('megamod:') &&
            !dead.typeId.includes('bandit') &&
            !dead.typeId.includes('thief') &&
            dead.typeId !== 'megamod:wounded_soldier' &&
            !dead.hasTag('perma_death')) {
            if (Math.random() < 0.5) {
                const pos = dead.location;
                const dim = dead.dimension;
                system.run(() => {
                    try {
                        const w = dim.spawnEntity('megamod:wounded_soldier', pos);
                        w.nameTag = '§c✚ Ağır Yaralı Asker (Sargı Beziyle Kurtar!)';
                    } catch (e) {}
                });
            }
        }
    }
}
