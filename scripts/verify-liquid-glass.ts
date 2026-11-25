import assert from "node:assert/strict";

import { refractionAt } from "../src/components/home/liquid-glass";

const size = [400, 200, 40, 30] as const;

assert.deepEqual(
  refractionAt(200, 100, ...size),
  [0, 0],
  "centre stays straight",
);

const [leftX, leftY] = refractionAt(2, 100, ...size);
assert.ok(leftX > 0.5 && leftY === 0, "left bezel bends toward the centre");

const [rightX] = refractionAt(398, 100, ...size);
assert.ok(rightX < -0.5, "right bezel bends toward the centre");

const [, topY] = refractionAt(200, 2, ...size);
assert.ok(topY > 0.5, "top bezel bends toward the centre");

const [cornerX, cornerY] = refractionAt(14, 14, ...size);
assert.ok(cornerX > 0 && cornerY > 0, "corners bend diagonally");

assert.deepEqual(
  refractionAt(0, 0, ...size),
  [0, 0],
  "outside the corner is flat",
);

console.log("Liquid glass refraction verified.");
