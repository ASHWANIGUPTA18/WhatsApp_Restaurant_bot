import type { ParsedMessageEvent, ListReplyEvent } from "../../whatsapp/types.js";
import type { UserSession } from "../states.js";
import { ConversationState } from "../states.js";
import { outgoingQueue } from "../../queues/whatsapp-outgoing.queue.js";
import {
  buildListMessage,
  buildTextMessage,
} from "../../whatsapp/message-builder.js";
import {
  getActiveCategories,
  getItemsByCategory,
} from "../../services/menu.service.js";
import type { MenuItem } from "@prisma/client";

const MAX_LIST_ROWS = 10; // WhatsApp list message limit per section

export async function handleShowCategories(
  session: UserSession,
  _event: ParsedMessageEvent
): Promise<UserSession> {
  const categories = await getActiveCategories();

  if (categories.length === 0) {
    const msg = buildTextMessage(
      session.phoneNumber,
      "Sorry, no menu items are available right now. Please try again later!"
    );
    await outgoingQueue.add("menu-empty", { message: msg });
    return { ...session, state: ConversationState.MAIN_MENU };
  }

  const categoryIds = categories.map((cat) => `cat_${cat.id}`);

  const sections = chunkIntoSections(
    categories.map((cat) => ({
      id: `cat_${cat.id}`,
      title: cat.name.slice(0, 24),
      description: undefined,
    })),
    MAX_LIST_ROWS
  );

  const msg = buildListMessage(
    session.phoneNumber,
    `🍽️ *Our Menu Categories*\n\nSelect a category to browse items:`,
    "View Categories",
    sections
  );

  await outgoingQueue.add("menu-categories", { message: msg });

  return {
    ...session,
    state: ConversationState.BROWSING_CATEGORIES,
    data: { ...session.data, currentListIds: categoryIds },
  };
}

export async function handleShowItems(
  session: UserSession,
  event: ParsedMessageEvent
): Promise<UserSession> {
  const listEvent = event as ListReplyEvent;
  const categoryId = listEvent.listId.replace("cat_", "");
  return renderItemsForCategory(session, categoryId);
}

export async function handleShowCurrentCategoryItems(
  session: UserSession,
  _event: ParsedMessageEvent
): Promise<UserSession> {
  const categoryId = session.data.selectedCategoryId;
  if (!categoryId) {
    return handleShowCategories(session, _event);
  }
  return renderItemsForCategory(session, categoryId);
}

// ─── Shared rendering logic ───

async function renderItemsForCategory(
  session: UserSession,
  categoryId: string
): Promise<UserSession> {
  const items = await getItemsByCategory(categoryId);

  if (items.length === 0) {
    const msg = buildTextMessage(
      session.phoneNumber,
      "No items available in this category right now.\n\nType *back* to see all categories."
    );
    await outgoingQueue.add("menu-items-empty", { message: msg });
    return { ...session, state: ConversationState.BROWSING_CATEGORIES };
  }

  const itemIds = items.map((item) => `item_${item.id}`);

  if (items.length > MAX_LIST_ROWS) {
    // Plain text numbered list — nav hint is embedded in the same message
    await sendTextItemList(session.phoneNumber, items);
  } else {
    // Interactive list message — nav hint is in the body text
    const msg = buildListMessage(
      session.phoneNumber,
      `Select an item to add to your cart:\n\n_Type *back* for categories · *cart* to view cart_`,
      "Choose Item",
      [
        {
          title: "Items",
          rows: items.map((item) => ({
            id: `item_${item.id}`,
            title: item.name.slice(0, 24),
            description: `£${Number(item.price).toFixed(2)}${item.description ? ` · ${item.description}` : ""}`.slice(0, 72),
          })),
        },
      ]
    );
    await outgoingQueue.add("menu-items", { message: msg });
  }

  return {
    ...session,
    state: ConversationState.BROWSING_ITEMS,
    data: {
      ...session.data,
      selectedCategoryId: categoryId,
      currentListIds: itemIds,
    },
  };
}

// ─── Helpers ───

async function sendTextItemList(
  phoneNumber: string,
  items: MenuItem[]
): Promise<void> {
  const lines = items
    .map((item, i) => `${i + 1}. ${item.name} — £${Number(item.price).toFixed(2)}`)
    .join("\n");

  const msg = buildTextMessage(
    phoneNumber,
    `*Select an item to add to your cart:*\n\n${lines}\n\n_Reply with a number to add · Type *back* for categories · *cart* to view cart_`
  );
  await outgoingQueue.add("menu-items-text", { message: msg });
}

function chunkIntoSections<T extends { id: string; title: string; description?: string }>(
  rows: T[],
  size: number
): Array<{ title: string; rows: T[] }> {
  const sections: Array<{ title: string; rows: T[] }> = [];
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    sections.push({
      title: sections.length === 0 ? "Categories" : `More Categories`,
      rows: chunk,
    });
  }
  return sections;
}
