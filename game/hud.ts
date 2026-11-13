import { type GameEvent, type GameState, terrainAt } from "../core/mod.ts";

function element(id: string): HTMLElement {
  return document.getElementById(id)!;
}

function describe(event: GameEvent): string {
  switch (event.type) {
    case "moved":
      return `moved to ${event.to.x}, ${event.to.y}`;
    case "blocked":
      return `blocked by ${event.terrain} at ${event.toward.x}, ${event.toward.y}`;
    case "gathered":
      return `picked up ${event.at}`; //eventually change to "picked up {item}"
  }
}

// The readout, as ordinary page elements that CSS can style and that assistive
// tools can read. It changes only as events play.
export class Hud {
  private readonly seed: number;

  constructor(state: GameState) {
    this.seed = state.seed;
    this.showPosition(state.player.x, state.player.y);
  }

  show(event: GameEvent) {
    element("live").textContent = describe(event);
    if (event.type === "moved") this.showPosition(event.to.x, event.to.y);
  }

  private showPosition(x: number, y: number) {
    element("position").textContent = `${x}, ${y}`;
    element("terrain").textContent = terrainAt(this.seed, x, y);
  }
}

const INVENTORY_SLOT_AMOUNT = 8;

function createInventory() {
  const inv = element("inventory") as HTMLDivElement;
  const template = element("inventorySlot-template") as HTMLTemplateElement;

  for (let i = 0; i < INVENTORY_SLOT_AMOUNT; i++) {
    const clone = template.content.cloneNode(true) as HTMLTemplateElement;
    const newSlot = clone.querySelector(".inventorySlot") as HTMLDivElement;
    newSlot.setAttribute("id", `slot-${i}`);
    const icon = newSlot.querySelector(".itemIcon") as HTMLImageElement;
    icon.setAttribute("src", "assets/egg.png");

    inv.append(newSlot);
  }
}
createInventory();

// Temporary for coding stuff until we have an actual inventory system
interface tempItem {
  name: string;
  icon: string;
  amount: number;
}

interface slotData {
  label: string;
  icon: string;
}

function getSlotData(slotNum: number): slotData {
  const inv = element("inventory");
  const slot = inv.querySelector(`.slot-${slotNum}`)!;
  const label = slot.querySelector(".itemLabel")!;
  const icon = slot.querySelector(".itemIcon")! as HTMLImageElement;

  return ({ label: label.textContent, icon: icon.src });
}

// deno-lint-ignore no-unused-vars
function replaceSlot(slotNum: number, item: tempItem) {
  const inv = element("inventory");

  const slot = inv.querySelector(`.slot-${slotNum}`)!;

  const label = slot.querySelector("itemLabel")!;
  label.textContent = `${item.name} (${item.amount})`;

  const icon = inv.querySelector(".itemIcon")! as HTMLImageElement;
  icon.setAttribute("src", item.icon);
}

// deno-lint-ignore no-unused-vars
function findEmptySlot(): number {
  for (let i = 0; i < INVENTORY_SLOT_AMOUNT; i++) {
    const slot = getSlotData(i);

    if (slot.label.toLowerCase() == "empty") {
      return i;
    }
  }

  return (-1);
}
