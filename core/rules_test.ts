import { assert, assertEquals } from "@std/assert";
import {
  apply,
  EMPTY_ITEM,
  type GameState,
  isPassable,
  terrainAt,
} from "./mod.ts";
import { hasGatherable } from "./objects.ts";

// Each test has a Given-When-Then shape: https://martinfowler.com/bliki/GivenWhenThen.html
const SEED = 121;

// A state with the player just west of a cell that is, or is not, passable.
// Searching keeps these tests honest if the terrain formula changes.
function besideEasternCell(passable: boolean): GameState {
  for (let x = 2; x < 10_000; x++) {
    const here = isPassable(terrainAt(SEED, x, 0));
    const east = isPassable(terrainAt(SEED, x + 1, 0));
    if (here && east === passable) {
      return {
        seed: SEED,
        player: { x, y: 0 },
        inventory: [
          EMPTY_ITEM,
          EMPTY_ITEM,
          EMPTY_ITEM,
          EMPTY_ITEM,
          EMPTY_ITEM,
          EMPTY_ITEM,
          EMPTY_ITEM,
          EMPTY_ITEM,
        ],
        gatheredCells: [],
      };
    }
  }
  throw new Error("Found no suitable cell on this row.");
}

Deno.test("moving onto passable terrain moves the player", () => {
  const state = besideEasternCell(true);
  const { x, y } = state.player;

  const events = apply(state, { type: "move", direction: "east" });

  assertEquals(state.player, { x: x + 1, y });
  assertEquals(events, [{
    type: "moved",
    from: { x, y },
    to: { x: x + 1, y },
    state,
  }]);
});

Deno.test("a blocked move changes nothing and reports why", () => {
  const state = besideEasternCell(false);
  const snapshot = JSON.parse(JSON.stringify(state));
  const { x, y } = state.player;
  const target = { x: x + 1, y };

  const events = apply(state, { type: "move", direction: "east" });

  assertEquals(state, snapshot);
  assertEquals(events, [{
    type: "blocked",
    at: { x, y },
    toward: target,
    terrain: terrainAt(SEED, target.x, target.y),
  }]);
});

Deno.test("an event keeps its cells while state moves on", () => {
  const state = besideEasternCell(true);
  const { x, y } = state.player;

  const first = apply(state, { type: "move", direction: "east" });
  const second = apply(state, { type: "move", direction: "west" });
  apply(state, { type: "move", direction: "east" });

  // Both retained events still report the cells from when they happened, even
  // though state.player has since changed.
  assertEquals(first, [{
    type: "moved",
    from: { x, y },
    to: { x: x + 1, y },
    state,
  }]);
  assertEquals(second, [{
    type: "moved",
    from: { x: x + 1, y },
    to: { x, y },
    state,
  }]);
});

Deno.test("there is a known gatherable at -1,-8", () => {
  const state: GameState = {
    seed: SEED,
    player: { x: -1, y: -8 },
    inventory: [],
    gatheredCells: [],
  };

  const res = hasGatherable(state.seed, state.player.x, state.player.y);
  assert(res, "no gatherable here");
});
