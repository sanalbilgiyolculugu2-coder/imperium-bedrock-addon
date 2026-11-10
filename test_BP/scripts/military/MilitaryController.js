import { SoldierInteractionUI } from '../ui/SoldierInteractionUI.js';
import { world, system } from '@minecraft/server';
import { ActionFormData } from '@minecraft/server-ui';

export class MilitaryController {
    static activeSquadFilter = {}; // player.id -> 'all' | 'infantry' | 'archer' | 'cavalry'
    static escortInitialized = false;

    // Muhafız veya Askeri Komutana Bağlama (Hem C++ Tameable hem Script Etiketi)
    static bindSoldierToCommander(entity, player, stance = 'follow') {
        if (!entity || !player) return;
        try {
            entity.addTag(`owner:${player.id}`);
            entity.removeTag('stance:hold');
            entity.removeTag('stance:charge');
            entity.removeTag('stance:follow');
            entity.addTag(`stance:${stance}`);

            const tameComp = entity.getComponent('minecraft:tameable');
            if (tameComp && typeof tameComp.tame === 'function') {
                tameComp.tame(player);
            }
            if (stance === 'follow') {
                entity.triggerEvent('imperium:order_follow');
                entity.triggerEvent('imperium:set_follow');
            }
        } catch (e) {}
    }

    // Aktif Muhafız & Ordu Takip Döngüsü (Her 10 tick = 0.5 saniyede bir muhafızları seninle yürütür!)
    static initEscortLoop() {
        if (this.escortInitialized) return;
        this.escortInitialized = true;

        system.runInterval(() => {
            for (const player of world.getAllPlayers()) {
                try {
                    const dim = player.dimension;
                    const pLoc = player.location;

                    // Yakındaki dost askerleri ve danışmanı bul
                    const nearbyUnits = dim.getEntities({
                        location: pLoc,
                        maxDistance: 42,
                        families: ['soldier']
                    });

                    // Ayrıca Kraliyet Danışmanı varsa onu da kontrol et
                    const advisors = dim.getEntities({
                        location: pLoc,
                        maxDistance: 42,
                        type: 'megamod:royal_advisor'
                    });

                    const allEscorts = [...nearbyUnits, ...advisors];

                    // Yakında düşman var mı? (Varsa muhafızlar düşmana saldırsın, yoksa seni takip etsin)
                    const nearbyEnemies = dim.getEntities({
                        location: pLoc,
                        maxDistance: 12,
                        families: ['bandit', 'monster']
                    });
                    const inCombat = nearbyEnemies.length > 0;

                    let slotIndex = 0;
                    for (const unit of allEscorts) {
                        const tags = unit.getTags ? unit.getTags() : [];
                        const hasOwner = tags.some(t => t.startsWith('owner:'));
                        if (!hasOwner) {
                            this.bindSoldierToCommander(unit, player, 'follow');
                        } else if (!tags.includes(`owner:${player.id}`)) {
                            continue;
                        }

                        // Eğer 'stance:hold' (Hattı Koru / Sabit Dur) emri verilmişse hareket ettirme
                        if (tags.includes('stance:hold')) continue;

                        // Danışman değilse ve savaş varsa bırak düşmana vursun
                        if (inCombat && unit.typeId !== 'megamod:royal_advisor') continue;

                        const uLoc = unit.location;
                        const dx = pLoc.x - uLoc.x;
                        const dz = pLoc.z - uLoc.z;
                        const dist = Math.hypot(dx, dz);

                        // Her muhafıza oyuncunun etrafında 2.4 blok yarıçaplı koruma çemberinde özel açı ver
                        const angle = (slotIndex * 1.15) + 0.5;
                        slotIndex++;
                        const targetX = pLoc.x + Math.cos(angle) * 2.4;
                        const targetZ = pLoc.z + Math.sin(angle) * 2.4;

                        if (dist > 18.0) {
                            // Çok geride kaldıysa veya çukura düştüyse hemen yanına ışınla
                            unit.teleport({ x: targetX, y: pLoc.y, z: targetZ });
                        } else if (dist > 3.4) {
                            // 3.4 bloktan uzaksa aktif olarak oyuncunun yanındaki formasyon noktasına doğru yürüt!
                            const tx = targetX - uLoc.x;
                            const tz = targetZ - uLoc.z;
                            const tLen = Math.max(0.1, Math.hypot(tx, tz));
                            const dirX = tx / tLen;
                            const dirZ = tz / tLen;

                            if (typeof unit.applyKnockback === 'function') {
                                const speed = dist > 7.5 ? 0.36 : 0.24;
                                unit.applyKnockback(dirX, dirZ, speed, 0.02);
                            } else {
                                unit.teleport({
                                    x: uLoc.x + dirX * 0.65,
                                    y: pLoc.y,
                                    z: uLoc.z + dirZ * 0.65
                                });
                            }
                        }
                    }
                } catch (e) {}
            }
        }, 10);
    }

    static openWarHornMenu(player) {
        const currentFilter = this.activeSquadFilter[player.id] || 'all';
        const filterNames = {
            'all': 'TÜM ORDU',
            'infantry': '1: PİYADELER',
            'archer': '2: OKÇULAR',
            'cavalry': '3: SÜVARİLER'
        };

        const form = new ActionFormData()
            .title(`§l§4📯 ORDU KOMUTA [${filterNames[currentFilter]}]`)
            .body(
                `§e▸ Seçili Birlik: §f${filterNames[currentFilter]}\n` +
                `§7Muhafızlarınıza ve ordunuza anlık taktik emir verin:`
            )
            .button('§l§0👣 BENİ YAKINDAN TAKİP ET (Muhafız)\n§r§0Tüm askerler seninle birlikte yürür ve korur', 'textures/items/campaign_compass')
            .button('§l§0⚡ HÜCUM ET (Tam Taarruz)\n§r§0Düşman hatlarına hız ve güçle saldır', 'textures/items/ottoman_yatagan')
            .button('§l§0🛡️ KALKAN DUVARI (Olduğun Yerde Koru)\n§r§0Sabit savunma hattı kur (%80 ok direnci)', 'textures/items/ottoman_shield')
            .button('§l§0🏹 SALVO YAYLIM ATEŞİ (Okçular)\n§r§0Baktığın yöne aynı anda ok yağmuru başlat', 'textures/items/composite_shortbow')
            .button('§l§0🐎 SÜVARİ KANAT TAARRUZU\n§r§0Atlı birlikler hızlanıp düşmanı yarar', 'textures/items/couch_lance')
            .button('§l§0🏃 TURAN TAKTİĞİ (Sahte Ricat & Pusu)\n§r§0Düşmanı yavaşlatıp çembere al', 'textures/items/war_horn')
            .button('§l§0🎯 BİRLİK GRUBU SEÇ (Piyade/Okçu/Süvari)', 'textures/items/claim_flag');

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

            player.runCommand('particle minecraft:totem_particle ~ ~2 ~');
            player.runCommand('playsound raid.horn @a[r=40] ~ ~ ~ 1.0 1.0');

            if (res.selection === 0) {
                // BENİ YAKINDAN TAKİP ET
                let idx = 0;
                for (const s of soldiers) {
                    this.bindSoldierToCommander(s, player, 'follow');
                    const angle = (idx * 1.15) + 0.5;
                    idx++;
                    s.teleport({
                        x: player.location.x + Math.cos(angle) * 2.5,
                        y: player.location.y,
                        z: player.location.z + Math.sin(angle) * 2.5
                    });
                }
                player.sendMessage(`§a[Komuta] 👣 ${soldiers.length} Asker yanınıza dizildi ve yakın takip moduna geçti!`);
            } else if (res.selection === 1) {
                // HÜCUM ET
                for (const s of soldiers) {
                    s.removeTag('stance:hold');
                    s.addTag('stance:follow');
                    s.triggerEvent('imperium:order_charge');
                    s.addEffect('speed', 200, { amplifier: 1, showParticles: false });
                    s.addEffect('strength', 200, { amplifier: 0, showParticles: false });
                }
                player.sendMessage(`§c[Komuta] ⚡ ${soldiers.length} Asker (${filterNames[currentFilter]}) HÜCUMA KALKTI!`);
            } else if (res.selection === 2) {
                // KALKAN DUVARI / HATTI KORU
                for (const s of soldiers) {
                    s.removeTag('stance:follow');
                    s.addTag('stance:hold');
                    s.triggerEvent('imperium:order_hold_line');
                    s.triggerEvent('imperium:set_hold');
                    s.addEffect('resistance', 400, { amplifier: 2, showParticles: false });
                }
                player.sendMessage(`§b[Komuta] 🛡️ ${soldiers.length} Asker olduğu yerde KALKAN DUVARI kurdu!`);
            } else if (res.selection === 3) {
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
                player.sendMessage(`§a[Komuta] 🏹 ${archers.length} Okçu baktığınız hedefe SALVO yaylım ateşi açtı!`);
            } else if (res.selection === 4) {
                const cavs = player.dimension.getEntities({
                    location: player.location,
                    maxDistance: 48,
                    families: ['cavalry']
                });
                for (const c of cavs) {
                    c.removeTag('stance:hold');
                    c.addTag('stance:follow');
                    c.triggerEvent('imperium:order_charge');
                    c.addEffect('speed', 240, { amplifier: 2, showParticles: false });
                }
                player.sendMessage(`§6[Komuta] 🐎 ${cavs.length} Süvari KANAT TAARRUZUNA geçti!`);
            } else if (res.selection === 5) {
                for (const s of soldiers) {
                    s.addEffect('speed', 160, { amplifier: 2, showParticles: false });
                }
                player.runCommand('effect @e[family=bandit,r=25] slowness 10 2');
                player.runCommand('effect @e[family=bandit,r=25] weakness 10 1');
                player.sendMessage(`§e[Komuta] 🏃 TURAN TAKTİĞİ! Düşman çembere alındı ve zayıflatıldı!`);
            }
        });
    }

    static openSquadFilterMenu(player) {
        const form = new ActionFormData()
            .title('§l§6🎯 BİRLİK GRUBU SEÇİMİ')
            .body('§fEmirlerinizi hangi askeri sınıfa yönlendirmek istiyorsunuz?')
            .button('§l§0⚔️ [TÜMÜ] Tüm Ordu Birlikleri', 'textures/items/war_horn')
            .button('§l§0🛡️ [1] Sadece Piyadeler & Kalkanlılar', 'textures/items/ottoman_shield')
            .button('§l§0🏹 [2] Sadece Okçular & Tüfekçiler', 'textures/items/composite_shortbow')
            .button('§l§0🐎 [3] Sadece Süvariler & Atlılar', 'textures/items/couch_lance');

        form.show(player).then((res) => {
            if (res.canceled) return;
            const keys = ['all', 'infantry', 'archer', 'cavalry'];
            this.activeSquadFilter[player.id] = keys[res.selection];
            this.openWarHornMenu(player);
        });
    }

    static applyKingHealth(player) {
        player.addEffect('health_boost', 20000000, { amplifier: 2, showParticles: false });
    }

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
        revived.nameTag = '§a★2 Kıdemli Gazi (Muhafız)';
        revived.triggerEvent('imperium:promote_veteran');
        this.bindSoldierToCommander(revived, player, 'follow');

        player.runCommand('clear @s megamod:field_bandage 0 1');
        player.runCommand('particle minecraft:heart_particle ~ ~1 ~');
        player.sendMessage('§a[Sıhhiye] Ağır yaralı asker sargı beziyle kurtarıldı ve Kıdemli Muhafız olarak yanınıza katıldı!');
    }

    static handleEntityHurt(event) {
        const hurtEntity = event.hurtEntity;
        const attacker = event.damageSource?.damagingEntity;

        if (!hurtEntity) return;

        if (attacker && attacker.typeId === 'minecraft:player' && hurtEntity.typeId.startsWith('megamod:')) {
            if (!hurtEntity.typeId.includes('bandit') && !hurtEntity.typeId.includes('thief')) {
                hurtEntity.addEffect('instant_health', 1, { amplifier: 5, showParticles: false });
                return;
            }
        }

        if (attacker && attacker.typeId === 'minecraft:player') {
            const equip = attacker.getComponent('equippable');
            const mainhand = equip?.getEquipment('Mainhand');
            if (mainhand) {
                if ((mainhand.typeId.includes('spear') || mainhand.typeId.includes('dory')) && hurtEntity.typeId.includes('cavalry')) {
                    hurtEntity.applyDamage(12);
                    attacker.sendMessage('§a[Taktik Üstünlük] Mızrak süvariyi durdurdu! (2.5x Hasar)');
                }
                if (mainhand.typeId === 'megamod:couch_lance' && attacker.isSprinting) {
                    hurtEntity.applyDamage(20);
                    attacker.sendMessage('§6[Kargı Hücumu] Dörtnala ölümcül mızrak darbesi! (+20 Ezici Hasar)');
                }
            }
        }

        if (hurtEntity.typeId.startsWith('megamod:') && !hurtEntity.typeId.includes('bandit')) {
            const cause = event.damageSource?.cause;
            if (cause === 'entityExplosion' || cause === 'blockExplosion' || cause === 'fire' || cause === 'lava') {
                hurtEntity.addTag('perma_death');
            }
        }
    }

    static handleEntityDie(event) {
        const dead = event.deadEntity;
        const killer = event.damageSource?.damagingEntity;
        if (!dead) return;

        if (killer && killer.typeId.startsWith('megamod:') && !killer.typeId.includes('bandit')) {
            killer.triggerEvent('imperium:promote_veteran');
            killer.addEffect('regeneration', 100, { amplifier: 1, showParticles: true });
            if (killer.nameTag && killer.nameTag.includes('★1')) {
                killer.nameTag = killer.nameTag.replace('★1', '§6★2 Kıdemli');
            }
        }

        if (dead.typeId.startsWith('megamod:') && !dead.typeId.includes('bandit') && dead.typeId !== 'megamod:wounded_soldier') {
            if (dead.typeId.includes('ram') || dead.typeId.includes('catapult') || dead.typeId.includes('wagon') || dead.typeId.includes('cannon')) {
                return;
            }
            const tags = dead.getTags ? dead.getTags() : [];
            if (tags.includes('perma_death')) {
                world.sendMessage('§4[Savaş Kaybı] ☠️ Bir askeriniz ağır patlama/ateş sonucu şehit düştü!');
            } else if (Math.random() < 0.65) {
                try {
                    const w = dead.dimension.spawnEntity('megamod:wounded_soldier', dead.location);
                    w.nameTag = '§e🩹 Ağır Yaralı Asker (Sargı Beziyle Kurtar!)';
                } catch (e) {}
            }
        }
    }
}
