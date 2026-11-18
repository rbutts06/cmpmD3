import {
  findItem,
  type GameEvent,
  type GameState,
  Gatherable,
  INVENTORY_SIZE,
  inventoryRemove,
  terrainAt,
} from "../core/mod.ts";
import {
  cheeseItem,
  ratBurgerItem,
  ratPotionItem,
  ratvioliItem,
} from "../core/objects.ts";
import { EMPTY_ITEM, inventoryAdd } from "../core/rules.ts";
import recipeInfo from "./craftingRecipes.json" with { type: "json" };
import "../assets/ratBurger.png";
import "../assets/ratvioli.png";
import "../assets/cheese.png";
import "../assets/ratPotion.png";

let recipesCrafted = 0;

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
      return `picked up ${event.item}`; //eventually change to "picked up {item}"
  }
}

// The readout, as ordinary page elements that CSS can style and that assistive
// tools can read. It changes only as events play.
export class Hud {
  private readonly seed: number;

  constructor(state: GameState) {
    this.seed = state.seed;
    this.showPosition(state.player.x, state.player.y);
    this.createInventory(state.inventory);
    this.createRecipeList(state);
  }

  show(event: GameEvent) {
    element("live").textContent = describe(event);
    if (event.type === "moved") this.showPosition(event.to.x, event.to.y);
    if (event.type === "gathered") this.createInventory(event.state.inventory);
  }

  private showPosition(x: number, y: number) {
    element("position").textContent = `${x}, ${y}`;
    element("terrain").textContent = terrainAt(this.seed, x, y);
    element("win").textContent = `${recipesCrafted}/4`;
  }

  private createInventory(inventory: Gatherable[]) {
    console.log("--------------");
    console.log(inventory);

    const inv = element("inventory") as HTMLDivElement;
    const template = element("inventorySlot-template") as HTMLTemplateElement;

    inv.replaceChildren();

    for (let i = 0; i < INVENTORY_SIZE; i++) {
      const clone = template.content.cloneNode(true)! as HTMLTemplateElement;
      const newSlot = clone.querySelector(".inventorySlot")! as HTMLDivElement;
      newSlot.setAttribute("id", `slot-${i}`);
      const icon = newSlot.querySelector(".itemIcon")! as HTMLImageElement;
      const label = newSlot.querySelector(
        ".itemLabel",
      )! as HTMLParagraphElement;

      if (i < inventory.length) {
        const item = inventory[i];
        label.textContent = `${item.name} (${item.amount})`;
        icon.src = item.icon;
      } else {
        label.textContent = EMPTY_ITEM.name;
        icon.src = EMPTY_ITEM.icon;
      }
      inv.append(newSlot);
    }
  }

  private recipeToItem(name: string): Gatherable {
    switch (name) {
      case "ratvioli": {
        return ratvioliItem;
      }
      case "rat burger": {
        return ratBurgerItem;
      }
      case "cheese": {
        return cheeseItem;
      }
      case "rat potion": {
        return ratPotionItem;
      }
    }
    return EMPTY_ITEM;
  }

  private createRecipeList(state: GameState): void {
    const recipes = element("recipes") as HTMLDivElement;
    const template = element("recipeSlot-template") as HTMLTemplateElement;
    let recipeItem: Gatherable;

    for (const recipe of recipeInfo.recipes) {
      const clone = template.content.cloneNode(true)! as HTMLTemplateElement;

      const newButton = clone.querySelector(
        ".recipe-button",
      ) as HTMLButtonElement;

      newButton.title = recipe.name + ": ";
      let ingredientIndex = 0;
      for (const ingredient of recipe.ingredients) {
        if (ingredientIndex == recipe.ingredients.length - 1) {
          newButton.title += "and " + ingredient.amount + " " +
            ingredient.name + ".";
        } else {
          newButton.title += ingredient.amount + " " + ingredient.name + ", ";
        }
        ingredientIndex++;
      }

      const buttonImg = clone.querySelector(".recipeIcon") as HTMLImageElement;

      buttonImg.src = "./assets/" + recipe.imgFile + ".png";

      const buttonLabel = clone.querySelector(
        ".recipeLabel",
      ) as HTMLHeadingElement;

      buttonLabel.textContent = recipe.name + " (" + recipe.amountOwned + ")";
      newButton?.addEventListener("click", (_event: MouseEvent) => {
        for (const ingredient of recipe.ingredients) {
          const itemIndex = findItem(state, ingredient.name);
          if (
            itemIndex == -1 ||
            ingredient.amount > state.inventory[itemIndex].amount
          ) {
            console.log("can't craft a " + recipe.name + " right now.");
            return;
          }
        }
        recipeItem = this.recipeToItem(recipe.name);
        if (recipe.amountOwned == 0) {
          recipesCrafted++;
        }
        recipe.amountOwned++;
        inventoryAdd(state, recipeItem);
        for (const ingredient of recipe.ingredients) {
          const itemIndex = findItem(state, ingredient.name);
          for (let i = 0; i < ingredient.amount; i++) {
            inventoryRemove(state, state.inventory[itemIndex]);
          }
        }

        buttonLabel.textContent = recipe.name + "(" + recipe.amountOwned + ")";
      });

      recipes.append(newButton);
    }
  }
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
function replaceSlot(slotNum: number, item: Gatherable) {
  const inv = element("inventory");

  const slot = inv.querySelector(`.slot-${slotNum}`)!;

  const label = slot.querySelector("itemLabel")!;
  label.textContent = `${item.name} (${item.amount})`;

  const icon = inv.querySelector(".itemIcon")! as HTMLImageElement;
  icon.setAttribute("src", item.icon);
}

// deno-lint-ignore no-unused-vars
function findEmptySlot(): number {
  for (let i = 0; i < INVENTORY_SIZE; i++) {
    const slot = getSlotData(i);

    if (slot.label.toLowerCase() == "empty") {
      return i;
    }
  }

  return (-1);
}
