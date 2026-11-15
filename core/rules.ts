// The rules of the game. There is no clock here: a command updates the state at
// once, and the events it returns are a record of what happened. Whoever called
// apply() decides how, or whether, to show them over time.

//import { objectPos } from "./mod.ts";
import { isPassable, type Terrain, terrainAt } from "./terrain.ts";
import { Gatherable, hasGatherable, itemAt } from "./mod.ts";
import { cellCenter } from "./objects.ts";

export type Cell = { x: number; y: number };

export type Direction = "north" | "south" | "east" | "west";

// Plain data that survives JSON. Terrain is absent because the seed can recompute
// it: besides the seed, only what the player has caused belongs here.
export type GameState = {
  seed: number;
  player: Cell;
  inventory: Gatherable[];
};

// Command: https://gameprogrammingpatterns.com/command.html
export type Command = { type: "move"; direction: Direction };

// Domain Event: https://martinfowler.com/eaaDev/DomainEvent.html
export type GameEvent =
  | { type: "moved"; from: Cell; to: Cell }
  | { type: "blocked"; at: Cell; toward: Cell; terrain: Terrain }
  | { type: "gathered"; at: Cell; item: Gatherable; state: GameState };

const STEPS: Record<Direction, Cell> = {
  north: { x: 0, y: -1 },
  south: { x: 0, y: 1 },
  east: { x: 1, y: 0 },
  west: { x: -1, y: 0 },
};

// Singleton, avoided on purpose: tests make as many games as they need. https://gameprogrammingpatterns.com/singleton.html
export function newGame(seed: number): GameState {
  return { seed, player: { x: 0, y: 0 }, inventory: new Array<Gatherable>() };
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
  const events: GameEvent[] = [];

  if (!isPassable(terrain)) {
    return [{ type: "blocked", at: from, toward: to, terrain }];
  }
  //if gatherable is on cell {return gathered}
  if (hasGatherable(state.seed, to.x, to.y)) {
    const newEvent = gatherPossibleItem(state.seed, to.x, to.y, state);
    if (newEvent != null) {
      events.push(newEvent);
    }
  }

  state.player.x = to.x;
  state.player.y = to.y;
  events.push({ type: "moved", from, to });

  return events;
}

function gatherPossibleItem(
  seed: number,
  xPos: number,
  yPos: number,
  state: GameState,
): GameEvent | null {
  const itemAtCell: Gatherable | null = itemAt(seed, xPos, yPos);
  if (itemAtCell != null) { // Meaning it has already been grabbed
    const { x, y }: Cell = cellCenter({ x: xPos, y: yPos });
    return { type: "gathered", at: { x, y }, item: itemAtCell, state: state };
  } else {
    console.log(`Already gathered at (${xPos}, ${yPos})`);
    return (null);
  }
}

export const INVENTORY_SIZE = 8;

/** The item placeholder for empty inventory slots */
export const EMPTY_ITEM: Gatherable = {
  name: "Empty",
  icon: "./assets/blank.png",
  amount: -1,
};

/**
 * Adds an item to the inventory. Will place item in either the first empty slot or slot with a matching name.
 *
 * @param state The current game state to get the inventory from
 * @param item The item to add
 * @returns Returns success if there was space in the inventory and failure if there wasn't
 */
export function inventoryAdd(state: GameState, item: Gatherable): boolean {
  console.log(item);
  const slotIndex = findItem(state, item.name);
  if (slotIndex > -1) {
    state.inventory[slotIndex].amount += item.amount;
    console.log("Inventory is now", state.inventory);
    return (true);
  }

  if (inventoryFull(state.inventory) == false) {
    state.inventory.push(copyItem(item));
    console.log("Inventory is now", state.inventory);
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
export function inventoryRemove(state: GameState, item: Gatherable): boolean {
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
  for (let i = 0; i < INVENTORY_SIZE; i++) {
    const currItem = state.inventory[i];
    if (currItem?.name == itemName) return i;
  }

  return (-1);
}

/**
 * Detect if the inventory is full.
 * @param inventory The inventory attribute of the gamestate
 * @returns True if the length is greater than or equal to the max inv size, otherwise false
 */
function inventoryFull(inventory: Gatherable[]): boolean {
  return (inventory.length >= INVENTORY_SIZE);
}

function copyItem(original: Gatherable): Gatherable {
  return ({
    name: original.name,
    amount: original.amount,
    icon: original.icon,
  });
}
