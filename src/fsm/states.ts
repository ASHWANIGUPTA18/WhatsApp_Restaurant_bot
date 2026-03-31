export enum ConversationState {
  IDLE = "IDLE",
  AWAITING_NAME = "AWAITING_NAME",
  AWAITING_LOCATION = "AWAITING_LOCATION",
  MAIN_MENU = "MAIN_MENU",
  BROWSING_CATEGORIES = "BROWSING_CATEGORIES",
  BROWSING_ITEMS = "BROWSING_ITEMS",
  VIEWING_CART = "VIEWING_CART",
  AWAITING_DELIVERY_LOCATION = "AWAITING_DELIVERY_LOCATION",
  AWAITING_PAYMENT = "AWAITING_PAYMENT",
  ORDER_ACTIVE = "ORDER_ACTIVE",
}

export interface UserSession {
  state: ConversationState;
  userId: string;
  phoneNumber: string;
  data: SessionData;
  updatedAt: number;
}

export interface SessionData {
  selectedCategoryId?: string;
  pendingOrderId?: string;
  // Tracks list items shown so numbered replies (1,2,3) can resolve to IDs
  currentListIds?: string[];
}
