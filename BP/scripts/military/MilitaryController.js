import { SoldierInteractionUI } from '../ui/SoldierInteractionUI.js';
import { world, system } from '@minecraft/server';
import { ActionFormData } from '@minecraft/server-ui';
import { PolygonClaimEngine } from '../territory/PolygonClaimEngine.js';

export class MilitaryController {
    static activeSquadFilter = {}; // player.id -> 'all' | 'infantry' | 'archer' | 'cavalry'
    static quickOrderIndex = {};   // player.id -> 0 | 1 | 2

    static bindSoldierToCommander(entity, player, stance = 'follow') {
        if (!entity || !player) return;
        try {
            entity.addTag(`owner:${player.id}`);
            entity.removeTag('stance:hold');
            entity.removeTag('stance:charge');
            entity.removeTag('stance:follow');
            entity.removeTag('stance:patrol_village');
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

    // Doğal Yürüyüş & Devriye Döngüsü: ASKERLER ASLA IŞINLANMAZ (TELEPORT YOK)!
    static initEscortLoop() {
        system.runInterval(() => {
            for (const player of world.getAllPlayers()) {
                try {
                    const dim = player.dimension;
                    const pLoc = player.location;

                    const allEscorts = dim.getEntities({
                        location: pLoc,
                        maxDistance: 64,
                        families: ['soldier']
                    });

                    for (const unit of allEscorts) {
                        const tags = unit.getTags ? unit.getTags() : [];
                        if (!tags.some(t => t.startsWith('owner:'))) {
                            this.bindSoldierToCommander(unit, player, 'follow');
                        }
                    }
                } catch (e) {}
            }
        }, 60);
    }

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
            for (const s of soldiers) this.bindSoldierToCommander(s, player, 'follow');
            player.sendMessage(`§a[Emir] 👣 Mesafeli Takip: ${soldiers.length} asker 5-7 blok mesafeden yürüyerek sizi takip ediyor.`);
        } else if (nextIdx === 1) {
            for (const s of soldiers) this.bindSoldierToCommander(s, player, 'hold');
            player.sendMessage(`§e[Emir] 🛑 Olduğun Yerde Bekle: ${soldiers.length} asker mevcut konumunda nöbete geçti (peşinizden gelmez).`);
        } else if (nextIdx === 2) {
            for (const s of soldiers) {
                this.bindSoldierToCommander(s, player, 'charge');
                s.addEffect('speed', 200, { amplifier: 1, showParticles: false });
            }
            player.sendMessage(`§c[Emir] ⚔️ Serbest Taarruz: ${soldiers.length} asker yakındaki düşmanlara hücum ediyor!`);
        }
    }

    static openWarHornMenu(player) {
        const currentFilter = this.activeSquadFilter[player.id] || 'all';
        const filterNames = {
            'all': 'TÜM ORDU',
            'infantry': 'SADECE PİYADELER',
            'archer': 'SADECE OKÇULAR',
            'cavalry': 'SADECE SÜVARİLER'
        };

        const familyFilter = currentFilter === 'all' ? 'soldier' : currentFilter;
        const nearbySoldiers = player.dimension.getEntities({
            location: player.location,
            maxDistance: 64,
            families: [familyFilter]
        });

        const form = new ActionFormData()
            .title(`§l§4📯 ORDU KOMUTA MERKEZİ`)
            .body(
                `§e▸ Seçili Birlik: §f${filterNames[currentFilter]} §7(${nearbySoldiers.length} Asker)\n` +
                `§e▸ Takip Mesafesi: §a5 - 7 Blok (Işınlanma Kapalı, Doğal Yürüyüş)\n` +
                `§7────────────────────────────────\n` +
                `§fOrdunuza vermek istediğiniz emri seçin:`
            )
            .button('§l§0👣 BENİ MESAFELİ TAKİP ET (5-7 Blok)\n§r§0Askerler dibinize girmeden 5-7m geriden yürür', 'textures/items/campaign_compass')
            .button('§l§0🛑 OLDUĞUN YERDE BEKLE / NÖBET TUT\n§r§0Askerler peşinizden gelmeyi bırakır ve olduğu yeri korur', 'textures/items/claim_flag')
            .button('§l§0⚔️ SERBEST TAARRUZ (Düşmanlara Saldır)\n§r§0Yakındaki tüm haydut, canavar ve düşmanlara hücum eder', 'textures/items/ottoman_yatagan')
            .button('§l§0🛡️ KALKAN DUVARI & YAKIN SAVUNMA\n§r§0Askerler mevzide kalkan kapatır (+%80 Ok ve Hasar Direnci)', 'textures/items/ottoman_shield')
            .button('§l§0🏕️ KÖY MERKEZİNE ÇEKİL (Karargah Nöbeti)\n§r§0Askerler köy sancağının etrafında toplanıp nöbet tutar', 'textures/items/barracks_desk')
            .button('§l§0🏹 OKÇU YAYLIM ATEŞİ (Baktığın Hedefe)\n§r§0Tüm okçular baktığınız yöne aynı anda ok yağdırır', 'textures/items/composite_shortbow')
            .button(`§l§0🎯 BİRLİK GRUBU SEÇ (${filterNames[currentFilter]})\n§r§0Emirleri sadece Piyade, Okçu veya Süvarilere ver`, 'textures/items/war_horn');

        form.show(player).then((res) => {
            if (res.canceled) return;
            if (res.selection === 6) {
                this.openSquadFilterMenu(player);
                return;
            }

            const soldiers = player.dimension.getEntities({
                location: player.location,
                maxDistance: 64,
                families: [familyFilter]
            });

            if (soldiers.length === 0 && res.selection !== 5) {
                player.sendMessage('§c[Komuta] Yakınınızda (64 blok) bu gruptan emir alacak asker bulunmuyor.');
                return;
            }

            if (res.selection === 0) {
                for (const s of soldiers) {
                    s.removeEffect('slowness');
                    this.bindSoldierToCommander(s, player, 'follow');
                }
                player.sendMessage(`§a[Komuta] 👣 ${soldiers.length} asker 5-7 blok mesafeli yürüyüş düzenine geçti.`);
            } else if (res.selection === 1) {
                for (const s of soldiers) {
                    this.bindSoldierToCommander(s, player, 'hold');
                }
                player.sendMessage(`§e[Komuta] 🛑 ${soldiers.length} asker olduğu yerde sabit nöbete geçti. Artık peşinizden gelmeyecekler.`);
            } else if (res.selection === 2) {
                for (const s of soldiers) {
                    s.removeEffect('slowness');
                    this.bindSoldierToCommander(s, player, 'charge');
                    s.addEffect('speed', 240, { amplifier: 1, showParticles: false });
                    s.addEffect('strength', 240, { amplifier: 0, showParticles: false });
                }
                player.sendMessage(`§c[Komuta] ⚔️ ${soldiers.length} asker SERBEST TAARRUZA geçti! Yakındaki düşmanları temizliyorlar.`);
            } else if (res.selection === 3) {
                for (const s of soldiers) {
                    this.bindSoldierToCommander(s, player, 'hold');
                    s.addEffect('resistance', 600, { amplifier: 2, showParticles: false });
                }
                player.runCommand('playsound item.shield.block @s ~ ~ ~ 0.8 1.0');
                player.sendMessage(`§b[Komuta] 🛡️ ${soldiers.length} asker Kalkan Duvarı kurdu ve mevziyi tutuyor!`);
            } else if (res.selection === 4) {
                for (const s of soldiers) {
                    this.bindSoldierToCommander(s, player, 'hold');
                    s.addTag('stance:patrol_village');
                }
                player.sendMessage(`§6[Komuta] 🏕️ ${soldiers.length} asker Köy Garnizon Nöbetine atandı.`);
            } else if (res.selection === 5) {
                const archers = player.dimension.getEntities({
                    location: player.location,
                    maxDistance: 64,
                    families: ['archer']
                });
                if (archers.length === 0) {
                    player.sendMessage('§c[Komuta] Yakınınızda yaylım ateşi açacak Okçu birliği yok!');
                    return;
                }
                const viewDir = player.getViewDirection();
                for (const a of archers) {
                    try {
                        const spawnPos = { x: a.location.x, y: a.location.y + 1.8, z: a.location.z };
                        const arrow = player.dimension.spawnEntity('minecraft:arrow', spawnPos);
                        arrow.applyImpulse({ x: viewDir.x * 2.4, y: Math.max(0.25, viewDir.y + 0.35), z: viewDir.z * 2.4 });
                    } catch (e) {}
                }
                player.runCommand('playsound random.bow @s ~ ~ ~ 1.0 0.9');
                player.sendMessage(`§a[Komuta] 🏹 ${archers.length} Okçu baktığınız hedefe yaylım ateşi açtı!`);
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
