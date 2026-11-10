import { world, system } from '@minecraft/server';
import { EconomyEngine } from '../economy/EconomyEngine.js';

const CLAIM_PROP = 'imperium:kingdoms_v1';

export class PolygonClaimEngine {
 static COST_PER_SQM = 2; // 1 m2 = 2 Bakir Dinar

 static getAllKingdoms() {
 try {
 const raw = world.getDynamicProperty(CLAIM_PROP);
 if (raw) return JSON.parse(raw);
 } catch (e) {}
 return {};
 }

 static saveKingdoms(data) {
 try {
 world.setDynamicProperty(CLAIM_PROP, JSON.stringify(data));
 } catch (e) {}
 }

 static calculatePolygonArea(pts) {
 if (!pts || pts.length < 2) return 0;
 if (pts.length === 2) {
 const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].z - pts[0].z);
 return Math.max(10, Math.round(dist * 4));
 }
 let sum = 0;
 for (let i = 0; i < pts.length; i++) {
 const p1 = pts[i];
 const p2 = pts[(i + 1) % pts.length];
 sum += (p1.x * p2.z) - (p2.x * p1.z);
 }
 return Math.max(16, Math.round(Math.abs(sum) * 0.5));
 }

 static isPointInPolygon(point, vs) {
 if (!vs || vs.length < 3) return false;
 const x = point.x, z = point.z;
 let inside = false;
 for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
 const xi = vs[i].x, zi = vs[i].z;
 const xj = vs[j].x, zj = vs[j].z;
 const intersect = ((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / ((zj - zi) || 0.0001) + xi);
 if (intersect) inside = !inside;
 }
 return inside;
 }

 static isPointInsidePolygon(point, vs) {
 return this.isPointInPolygon(point, vs);
 }

 static getTitleByArea(area, flagCount = 3) {
 if (flagCount < 3) return 'Gocebe (Koy Kurulmadi)';
 if (area < 150) return 'Oba / Koy Beyi';
 if (area < 500) return 'Ucbeyi (Derebeyi)';
 if (area < 1200) return 'Sancakbeyi (Duk)';
 if (area < 2500) return 'Sultan / Kral';
 return 'Cihan Imparatoru';
 }

 static getPlayerKingdom(playerId) {
 const all = this.getAllKingdoms();
 return all[playerId] || null;
 }

 static markBuildingConstructed(playerId, buildingTag, pos = null) {
 const all = this.getAllKingdoms();
 if (!all[playerId]) return;
 if (buildingTag === 'barracks') {
 all[playerId].hasBarracks = true;
 if (pos) all[playerId].barracksPos = pos;
 }
 if (buildingTag === 'castle') {
 all[playerId].hasCastle = true;
 if (pos) all[playerId].castlePos = pos;
 }
 if (buildingTag === 'siege') {
 all[playerId].hasSiege = true;
 if (pos) all[playerId].siegePos = pos;
 }
 this.saveKingdoms(all);
 }

 static findSurfaceGroundY(dim, x, z, startY = 64) {
 if (!dim || typeof dim.getBlock !== 'function') return Math.round(startY);
 try {
 const sy = Math.round(startY);
 for (let dy = 6; dy >= -16; dy--) {
 const b = dim.getBlock({ x: Math.round(x), y: sy + dy, z: Math.round(z) });
 if (b && !b.isAir && !b.isLiquid) {
 return sy + dy + 1;
 }
 }
 } catch (e) {}
 return Math.round(startY);
 }

 static buildPhysicalFlagPost(dim, pt, flagNumber) {
 if (!dim || typeof dim.runCommand !== 'function' || !pt) return;
 try {
 const x = pt.x, z = pt.z;
 const y = pt.y;
 dim.runCommand(`setblock ${x} ${y} ${z} chiseled_stone_bricks`);
 dim.runCommand(`setblock ${x} ${y + 1} ${z} oak_fence`);
 dim.runCommand(`setblock ${x} ${y + 2} ${z} oak_fence`);
 dim.runCommand(`setblock ${x} ${y + 3} ${z} red_wool`);
 dim.runCommand(`setblock ${x} ${y + 4} ${z} torch`);
 dim.runCommand(`particle minecraft:totem_particle ${x} ${y + 2} ${z}`);
 } catch (e) {}
 }

 static removePhysicalFlagPost(dim, pt) {
 if (!dim || typeof dim.runCommand !== 'function' || !pt) return;
 try {
 const x = pt.x, z = pt.z;
 const y = pt.y;
 for (let dy = 0; dy <= 4; dy++) {
 dim.runCommand(`setblock ${x} ${y + dy} ${z} air`);
 }
 dim.runCommand(`setblock ${x} ${y - 1} ${z} grass_block`);
 } catch (e) {}
 }

 static renderBorderLineBetween(dim, p1, p2, placeBlocks = true) {
 if (!dim || typeof dim.runCommand !== 'function') return;
 try {
 const dx = p2.x - p1.x;
 const dz = p2.z - p1.z;
 const dist = Math.hypot(dx, dz);
 if (dist < 2 || dist > 200) return;
 const steps = Math.min(50, Math.max(3, Math.floor(dist / 2)));
 for (let i = 1; i < steps; i++) {
 const t = i / steps;
 const bx = Math.round(p1.x + dx * t);
 const bz = Math.round(p1.z + dz * t);
 const by = this.findSurfaceGroundY(dim, bx, bz, p1.y);
 dim.runCommand(`particle minecraft:villager_happy ${bx} ${by + 0.6} ${bz}`);
 if (placeBlocks && (i % 3 === 0)) {
 dim.runCommand(`setblock ${bx} ${by} ${bz} stone_brick_slab`);
 }
 }
 } catch (e) {}
 }

 static buildVillageCenterMonument(dim, flags) {
 if (!dim || typeof dim.runCommand !== 'function' || !flags || flags.length < 3) return;
 try {
 const cx = Math.round((flags[0].x + flags[1].x + flags[2].x) / 3);
 const cz = Math.round((flags[0].z + flags[1].z + flags[2].z) / 3);
 const cy = this.findSurfaceGroundY(dim, cx, cz, flags[0].y);
 dim.runCommand(`fill ${cx - 1} ${cy - 1} ${cz - 1} ${cx + 1} ${cy - 1} ${cz + 1} stone_bricks`);
 dim.runCommand(`setblock ${cx} ${cy} ${cz} megamod:claim_flag_block`);
 dim.runCommand(`setblock ${cx} ${cy + 1} ${cz} oak_fence`);
 dim.runCommand(`setblock ${cx} ${cy + 2} ${cz} gold_block`);
 dim.runCommand(`setblock ${cx} ${cy + 3} ${cz} torch`);
 dim.runCommand(`particle minecraft:totem_particle ${cx} ${cy + 2} ${cz}`);
 } catch (e) {}
 }

 static renderAllKingdomBorders(player) {
 try {
 const k = this.getPlayerKingdom(player.id);
 if (!k || !k.flags || k.flags.length < 2) return;
 const dim = player.dimension;
 const pts = k.flags;
 for (let i = 0; i < pts.length; i++) {
 const p1 = pts[i];
 if (Math.hypot(player.location.x - p1.x, player.location.z - p1.z) < 64) {
 dim.runCommand(`particle minecraft:endrod ${p1.x} ${p1.y + 3.5} ${p1.z}`);
 }
 if (pts.length >= 2 && (i < pts.length - 1 || pts.length >= 3)) {
 const p2 = pts[(i + 1) % pts.length];
 this.renderBorderLineBetween(dim, p1, p2, false);
 }
 }
 } catch (e) {}
 }

 static addFlag(player, pos) {
 const all = this.getAllKingdoms();
 const pid = player.id;
 if (!all[pid]) {
 all[pid] = {
 id: pid,
 name: `${player.name} Hanedani`,
 flags: [],
 taxRate: 15,
 happiness: 85,
 population: 5,
 reserveArmy: 0,
 hasBarracks: false,
 hasCastle: false,
 hasSiege: false
 };
 }

 const k = all[pid];
 const view = (typeof player.getViewDirection === 'function') ? player.getViewDirection() : { x: 0, y: 0, z: 1 };
 const rawX = pos?.x !== undefined ? pos.x : (player.location.x + view.x * 2.0);
 const rawZ = pos?.z !== undefined ? pos.z : (player.location.z + view.z * 2.0);
 const targetX = Math.round(rawX);
 const targetZ = Math.round(rawZ);
 const surfaceY = this.findSurfaceGroundY(player.dimension, targetX, targetZ, pos?.y ?? player.location.y);
 const newPt = { x: targetX, y: surfaceY, z: targetZ };

 for (const existing of k.flags) {
 if (Math.hypot(existing.x - newPt.x, existing.z - newPt.z) < 4) {
 return {
 success: false,
 reason: 'Bu noktada zaten bir sinir bayraginiz var! Biraz uzaklasip (en az 8-10 blok oteye) diger koseyi dikin.'
 };
 }
 }

 const oldArea = k.flags.length >= 3 ? this.calculatePolygonArea(k.flags) : 0;
 const nextFlags = [...k.flags, newPt];
 const newArea = nextFlags.length >= 3 ? this.calculatePolygonArea(nextFlags) : 0;
 const addedArea = Math.max(0, newArea - oldArea);
 const cost = nextFlags.length === 1 ? 0 : Math.max(10, addedArea * this.COST_PER_SQM);

 if (cost > 0 && !EconomyEngine.deductMoney(player, cost)) {
 return { success: false, reason: `Sinir genisletmek icin ${cost} Bakir Dinar gerekiyor!` };
 }

 k.flags = nextFlags;
 this.saveKingdoms(all);

 this.buildPhysicalFlagPost(player.dimension, newPt, k.flags.length);
 if (k.flags.length >= 2) {
 const prevPt = k.flags[k.flags.length - 2];
 this.renderBorderLineBetween(player.dimension, prevPt, newPt, true);
 }
 if (k.flags.length >= 3) {
 const firstPt = k.flags[0];
 this.renderBorderLineBetween(player.dimension, newPt, firstPt, true);
 this.buildVillageCenterMonument(player.dimension, k.flags);
 }

 return {
 success: true,
 count: k.flags.length,
 area: newArea,
 cost: cost,
 flagPos: newPt
 };
 }

 static removeLastFlag(player) {
 const all = this.getAllKingdoms();
 const k = all[player.id];
 if (!k || !k.flags || k.flags.length === 0) return { success: false };

 const removedPt = k.flags.pop();
 this.removePhysicalFlagPost(player.dimension, removedPt);

 const remainingArea = k.flags.length >= 3 ? this.calculatePolygonArea(k.flags) : 0;
 const refund = Math.max(15, Math.round(50 * 0.7));
 EconomyEngine.addMoney(player, refund);

 this.saveKingdoms(all);
 return { success: true, remaining: k.flags.length, area: remainingArea, refund: refund };
 }

 static moveLastFlag(player, newPos) {
 const all = this.getAllKingdoms();
 const k = all[player.id];
 if (!k || !k.flags || k.flags.length === 0) return { success: false, reason: 'Tasinacak bayrak yok!' };

 const oldPt = k.flags[k.flags.length - 1];
 this.removePhysicalFlagPost(player.dimension, oldPt);

 const surfaceY = this.findSurfaceGroundY(player.dimension, newPos.x, newPos.z, newPos.y);
 const updatedPt = { x: Math.round(newPos.x), y: surfaceY, z: Math.round(newPos.z) };

 k.flags[k.flags.length - 1] = updatedPt;
 this.saveKingdoms(all);
 this.buildPhysicalFlagPost(player.dimension, updatedPt, k.flags.length);

 const newArea = k.flags.length >= 3 ? this.calculatePolygonArea(k.flags) : 0;
 return { success: true, newArea: newArea, diffArea: 0, paid: 0, refund: 0 };
 }
}
