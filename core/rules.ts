// The rules of the game. There is no clock here: a command updates the state at
// once, and the events it returns are a record of what happened. Whoever called
// apply() decides how, or whether, to show them over time.

//import { objectPos } from "./mod.ts";
import { isPassable, type Terrain, terrainAt } from "./terrain.ts";
import { Gatherable } from "./mod.ts";

export type Cell = { x: number; y: number };

export type Direction = "north" | "south" | "east" | "west";

// Plain data that survives JSON. Terrain is absent because the seed can recompute
// it: besides the seed, only what the player has caused belongs here.
export type GameState = {
  seed: number;
  player: Cell;
  inventory: tempItem[];
};

// Command: https://gameprogrammingpatterns.com/command.html
export type Command = { type: "move"; direction: Direction };

// Domain Event: https://martinfowler.com/eaaDev/DomainEvent.html
export type GameEvent =
  | { type: "moved"; from: Cell; to: Cell }
  | { type: "blocked"; at: Cell; toward: Cell; terrain: Terrain }
  | { type: "gathered"; at: Cell; item: Gatherable };

const STEPS: Record<Direction, Cell> = {
  north: { x: 0, y: -1 },
  south: { x: 0, y: 1 },
  east: { x: 1, y: 0 },
  west: { x: -1, y: 0 },
};

// Singleton, avoided on purpose: tests make as many games as they need. https://gameprogrammingpatterns.com/singleton.html
export function newGame(seed: number): GameState {
  return { seed, player: { x: 0, y: 0 }, inventory: new Array<tempItem>() };
}

// The single way in. It updates the state it is given and returns the events.
export function apply(state: GameState, command: Command): GameEvent[] {
  switch (command.type) {
    case "move":
      return move(state, command.direction);
  }
}

function move(state: GameState, direction: Direction): GameEvent[] {
  const step = STEPS[direction];
  // Events are retained and played back later, while state keeps changing. So an
  // event gets cells of its own, never an object that state still holds.
  // Aliasing Bug: https://martinfowler.com/bliki/AliasingBug.html
  // Cells in events act as a Value Object: https://martinfowler.com/bliki/ValueObject.html
  const from = { ...state.player };
  const to = { x: from.x + step.x, y: from.y + step.y };
  const terrain = terrainAt(state.seed, to.x, to.y);
  if (!isPassable(terrain)) {
    return [{ type: "blocked", at: from, toward: to, terrain }];
  }
  //if gatherable is on cell {return gathered}
  state.player.x = to.x;
  state.player.y = to.y;
  return [{ type: "moved", from, to }];
}

export const INVENTORY_SLOT_COUNT = 8;

/** Temporary item object type for coding stuff until we have an actual object type */
export interface tempItem {
  name: string;
  icon: string;
  amount: number;
}

/** The item placeholder for empty inventory slots */
export const EMPTY_ITEM: tempItem = { name: "Empty", icon: "", amount: -1 };

/**
 * Adds an item to the inventory. Will place item in either the first empty slot or slot with a matching name.
 *
 * @param state The current game state to get the inventory from
 * @param item The item to add
 * @returns Returns success if there was space in the inventory and failure if there wasn't
 */
export function inventoryAdd(state: GameState, item: tempItem): boolean {
  let slotIndex = findItem(state, item.name);
  if (slotIndex > -1) {
    state.inventory[slotIndex].amount += item.amount;
    return (true);
  }

  slotIndex = findEmptySlot(state);
  if (slotIndex > -1) {
    state.inventory[slotIndex] = item;
    return (true);
  }

  return (false);
}

/**
 * Adds an item to the inventory. Will place item in either the first empty slot or slot with a matching name.
 *
 * @param state The current game state to get the inventory from
 * @param item The item to add
 */
export function inventoryRemove(state: GameState, item: tempItem): boolean {
  const slotIndex = findItem(state, item.name);
  if (slotIndex > -1) {
    const slot = state.inventory[slotIndex];
    state.inventory[slotIndex].amount -= item.amount;

    if (slot.amount <= 0) {
      state.inventory[slotIndex] = EMPTY_ITEM;
    }

    return (true);
  } else {
    return (false);
  }
}

/**
 * Finds and returns the index of the first item that matches this name
 *
 * @param state The current game state to read inventory from
 * @param itemName The name of the item to search for
 * @returns The index of the item or -1 if it wasn't found
 */
export function findItem(state: GameState, itemName: string): number {
  for (let i = 0; i < INVENTORY_SLOT_COUNT; i++) {
    const slot = state.inventory[i];
    if (slot.name == itemName) return i;
  }

  return (-1);
}

/**
 * Finds and returns the first empty (null) index in the inventory.
 *
 * @param state The game state to read inventory from
 * @returns Either the inidex of the first empty slot or -1 if none
 */
function findEmptySlot(state: GameState): number {
  return (findItem(state, EMPTY_ITEM.name));
}
