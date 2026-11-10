import { SoldierInteractionUI } from '../ui/SoldierInteractionUI.js';
import { world, system } from '@minecraft/server';
import { ActionFormData } from '@minecraft/server-ui';

export class MilitaryController {
    static activeSquadFilter = {}; // player.id -> 'all' | 'infantry' | 'archer' | 'cavalry'
    static quickOrderIndex = {};   // player.id -> 0 | 1 | 2 | 3

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
            } else if (stance === 'hold') {
                entity.triggerEvent('imperium:order_hold_line');
            } else if (stance === 'charge') {
                entity.triggerEvent('imperium:order_charge');
            }
        } catch (e) {}
    }

    // Doğal hafif mesafe kontrolü (Jerky knockback kaldırıldı! C++ follow_owner yürütür)
    static initEscortLoop() {
        system.runInterval(() => {
            for (const player of world.getAllPlayers()) {
                try {
                    const dim = player.dimension;
                    const pLoc = player.location;

                    const allEscorts = dim.getEntities({
                        location: pLoc,
                        maxDistance: 48,
                        families: ['soldier']
                    });

                    for (const unit of allEscorts) {
                        const tags = unit.getTags ? unit.getTags() : [];
                        if (!tags.some(t => t.startsWith('owner:'))) {
                            this.bindSoldierToCommander(unit, player, 'follow');
                        } else if (!tags.includes(`owner:${player.id}`)) {
                            continue;
                        }

                        // Çok geride kalanları veya sıkışanları güvenle yanına getir
                        const dist = Math.hypot(pLoc.x - unit.location.x, pLoc.z - unit.location.z);
                        if (dist > 24.0 && !tags.includes('stance:hold')) {
                            unit.teleport({
                                x: pLoc.x + (Math.random() - 0.5) * 4,
                                y: pLoc.y,
                                z: pLoc.z + (Math.random() - 0.5) * 4
                            });
                        }
                    }
                } catch (e) {}
            }
        }, 30);
    }

    // Eğilerek (Sneak) tıklandığında ekranı dondurmayan HIZLI EMİR DÖNGÜSÜ!
    static handleWarHornUse(player) {
        if (player.isSneaking) {
            this.cycleQuickOrder(player);
        } else {
            this.openWarHornMenu(player);
        }
    }

    static cycleQuickOrder(player) {
        const idx = (this.quickOrderIndex[player.id] || 0);
        const nextIdx = (idx + 1) % 3;
        this.quickOrderIndex[player.id] = nextIdx;

        const soldiers = player.dimension.getEntities({
            location: player.location,
            maxDistance: 48,
            families: ['soldier']
        });

        if (nextIdx === 0) {
            // YAKIN TAKİP
            for (const s of soldiers) this.bindSoldierToCommander(s, player, 'follow');
            player.runCommand('playsound imperium.march_drum @a[r=30] ~ ~ ~ 1.0 1.0');
            player.onScreenDisplay.setTitle('§a👣 MUHAFIZLAR: BENİ TAKİP ET', {
                stayDuration: 40,
                fadeInDuration: 5,
                fadeOutDuration: 10,
                subtitle: '§7Tüm askerler etrafınızda koruma çemberi kurdu'
            });
        } else if (nextIdx === 1) {
            // HÜCUM
            for (const s of soldiers) {
                s.removeTag('stance:hold');
                s.addTag('stance:charge');
                s.triggerEvent('imperium:order_charge');
                s.addEffect('speed', 200, { amplifier: 1, showParticles: false });
                s.addEffect('strength', 200, { amplifier: 0, showParticles: false });
            }
            player.runCommand('playsound imperium.charge_shout @a[r=35] ~ ~ ~ 1.0 1.0');
            player.onScreenDisplay.setTitle('§c⚡ TÜM ORDU: HÜCUMA KALK!', {
                stayDuration: 40,
                fadeInDuration: 5,
                fadeOutDuration: 10,
                subtitle: '§7Askerler düşman hatlarına taarruz ediyor'
            });
        } else if (nextIdx === 2) {
            // KALKAN DUVARI
            for (const s of soldiers) {
                s.removeTag('stance:charge');
                s.removeTag('stance:follow');
                s.addTag('stance:hold');
                s.triggerEvent('imperium:order_hold_line');
                s.addEffect('resistance', 400, { amplifier: 2, showParticles: false });
            }
            player.runCommand('playsound item.shield.block @a[r=30] ~ ~ ~ 1.0 1.0');
            player.onScreenDisplay.setTitle('§b🛡️ TÜM ORDU: KALKAN DUVARI', {
                stayDuration: 40,
                fadeInDuration: 5,
                fadeOutDuration: 10,
                subtitle: '§7Mevcut mevzide sabit savunma hattı kuruldu (%80 ok direnci)'
            });
        }
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
                `§7💡 İpucu: Eğilerek (Sneak) sağ tıkladığınızda menü açılmadan anında emir verirsiniz!`
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
            player.runCommand('playsound imperium.war_horn @a[r=40] ~ ~ ~ 1.0 1.0');

            if (res.selection === 0) {
                for (const s of soldiers) this.bindSoldierToCommander(s, player, 'follow');
                player.sendMessage(`§a[Komuta] 👣 ${soldiers.length} Asker yakın takip moduna geçti!`);
            } else if (res.selection === 1) {
                for (const s of soldiers) {
                    s.removeTag('stance:hold');
                    s.addTag('stance:charge');
                    s.triggerEvent('imperium:order_charge');
                    s.addEffect('speed', 200, { amplifier: 1, showParticles: false });
                    s.addEffect('strength', 200, { amplifier: 0, showParticles: false });
                }
                player.runCommand('playsound imperium.charge_shout @a[r=35] ~ ~ ~ 1.0 1.0');
                player.sendMessage(`§c[Komuta] ⚡ ${soldiers.length} Asker HÜCUMA KALKTI!`);
            } else if (res.selection === 2) {
                for (const s of soldiers) {
                    s.removeTag('stance:charge');
                    s.removeTag('stance:follow');
                    s.addTag('stance:hold');
                    s.triggerEvent('imperium:order_hold_line');
                    s.addEffect('resistance', 400, { amplifier: 2, showParticles: false });
                }
                player.sendMessage(`§b[Komuta] 🛡️ ${soldiers.length} Asker KALKAN DUVARI kurdu!`);
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
                player.sendMessage(`§a[Komuta] 🏹 ${archers.length} Okçu SALVO yaylım ateşi açtı!`);
            } else if (res.selection === 4) {
                const cavs = player.dimension.getEntities({
                    location: player.location,
                    maxDistance: 48,
                    families: ['cavalry']
                });
                for (const c of cavs) {
                    c.removeTag('stance:hold');
                    c.addTag('stance:charge');
                    c.triggerEvent('imperium:order_charge');
                    c.addEffect('speed', 240, { amplifier: 2, showParticles: false });
                }
                player.runCommand('playsound imperium.war_horse @a[r=35] ~ ~ ~ 1.0 1.0');
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
            player.runCommand('playsound imperium.charge_shout @a[r=30] ~ ~ ~ 1 0.8');
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
