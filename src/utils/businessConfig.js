/**
 * businessConfig.js — Central source of truth for business-mode-aware UI text,
 * navigation, icons, and terminology throughout the WhatSales dashboard.
 *
 * BACKEND MODES (11 total):
 *   FULL modules (dedicated bot flows):
 *     RESTAURANT, BAKERY, SALON, BARBERSHOP, FASHION, COSMETICS, ELECTRONICS
 *   BASIC modes (inherit RETAIL_CONFIG — basic order flow only):
 *     RETAIL, SUPERMARKET, PHARMACY, DELIVERY
 *
 * GENERIC does NOT exist in the backend enum — only used as UI fallback.
 */

import {
  UtensilsCrossed, Scissors, Shirt, Cpu, CakeSlice, Sparkles,
  ShoppingBag, ShoppingCart, Pill, Truck,
  Package, CalendarCheck, ClipboardList, LayoutGrid,
  Zap, Star,
} from 'lucide-react';

/**
 * Per-mode config shape:
 *  emoji             — shown in headers / empty states
 *  label             — display name shown in UI
 *  tier              — 'full' = dedicated bot flow module | 'basic' = RETAIL_CONFIG
 *
 *  catalog           — the "Menu / Products / Services" section
 *    navLabel          — sidebar nav text
 *    pageTitle         — <PageHeader title>
 *    pageSubtitle      — <PageHeader subtitle>
 *    itemLabel         — singular noun  ("dish", "product", "service")
 *    itemLabelPlural   — plural noun
 *    addLabel          — CTA button text ("Add Dish", "Add Product")
 *    emptyTitle        — EmptyState heading
 *    emptyBody         — EmptyState body
 *    categoryPlaceholder — category field placeholder
 *    icon              — Lucide icon component for nav + empty state
 *    hasStock          — whether to show a stock quantity field
 *    hasDuration       — whether to show a duration field (minutes)
 *    hasImage          — whether image upload is relevant
 *    isServiceBased    — true = uses /services API, false = uses /menu API
 *
 *  transactions      — the "Orders / Bookings" section
 *    type              — 'orders' | 'bookings' | 'both'
 *    ordersNavLabel    — sidebar label for orders
 *    bookingsNavLabel  — sidebar label for bookings
 *    ordersPageTitle
 *    bookingsPageTitle
 *    ordersSubtitle
 *    bookingsSubtitle
 *    orderItemLabel    — what the "item" field is called in an order row
 *    emptyOrdersBody
 *    emptyBookingsBody
 *
 *  dashboard         — overrides for dashboard page copy
 *    greeting          — suffix after "Here's what's happening..."
 *    ordersStatLabel   — stat card label (e.g. "Total Orders")
 *    bookingsStatLabel
 *    tipText           — contextual tip shown on dashboard
 *
 *  customers         — customer page copy overrides
 *    orderHistoryLabel — label for "order history" in customer detail
 *
 *  faq               — FAQ page copy
 *    importLabel       — label on "import defaults" button
 *    importHint        — short hint about what gets imported
 */

const CONFIGS = {
  // ─── FULL MODULES ──────────────────────────────────────────────────────────

  RESTAURANT: {
    emoji: '🍽️',
    label: 'Restaurant',
    tier: 'full',
    catalog: {
      navLabel: 'Menu',
      pageTitle: 'Menu',
      pageSubtitle: 'Dishes & drinks customers can order via WhatsApp',
      itemLabel: 'dish',
      itemLabelPlural: 'dishes',
      addLabel: 'Add Dish',
      emptyTitle: 'No dishes on the menu yet',
      emptyBody: 'Add your first dish — starters, mains, desserts, or drinks — to start receiving WhatsApp orders.',
      categoryPlaceholder: 'e.g. Starters, Mains, Grills, Drinks, Desserts',
      icon: UtensilsCrossed,
      hasStock: false,
      hasDuration: false,
      hasImage: true,
      isServiceBased: false,
    },
    transactions: {
      type: 'orders',
      ordersNavLabel: 'Orders',
      ordersPageTitle: 'Food Orders',
      ordersSubtitle: 'Customer food orders placed via WhatsApp',
      orderItemLabel: 'Dish ordered',
      emptyOrdersBody: 'Food orders from WhatsApp will appear here. Share your WhatsApp number to start receiving orders.',
    },
    dashboard: {
      greeting: 'your restaurant is doing today',
      ordersStatLabel: 'Food Orders',
      bookingsStatLabel: 'Reservations',
      tipText: 'Keep your menu updated with fresh daily specials to boost orders.',
    },
    customers: {
      orderHistoryLabel: 'Order history',
    },
    faq: {
      importLabel: 'Import restaurant FAQs',
      importHint: 'Menu, delivery, payment & hours — pre-written for a food business.',
    },
  },

  BAKERY: {
    emoji: '🧁',
    label: 'Bakery',
    tier: 'full',
    catalog: {
      navLabel: 'Menu',
      pageTitle: 'Menu',
      pageSubtitle: 'Baked goods & products customers can order via WhatsApp',
      itemLabel: 'product',
      itemLabelPlural: 'products',
      addLabel: 'Add Product',
      emptyTitle: 'No baked goods listed yet',
      emptyBody: 'Add your breads, cakes, and pastries to start receiving WhatsApp orders.',
      categoryPlaceholder: 'e.g. Breads, Cakes, Pastries, Custom Orders',
      icon: CakeSlice,
      hasStock: false,
      hasDuration: false,
      hasImage: true,
      isServiceBased: false,
    },
    transactions: {
      type: 'orders',
      ordersNavLabel: 'Orders',
      ordersPageTitle: 'Bakery Orders',
      ordersSubtitle: 'Bakery orders placed via WhatsApp',
      orderItemLabel: 'Item ordered',
      emptyOrdersBody: 'Bakery orders from WhatsApp will appear here. Share your number to start taking orders.',
    },
    dashboard: {
      greeting: 'your bakery is doing today',
      ordersStatLabel: 'Bakery Orders',
      bookingsStatLabel: 'Pre-orders',
      tipText: 'Add custom cake options with lead-time notes to manage expectations.',
    },
    customers: {
      orderHistoryLabel: 'Order history',
    },
    faq: {
      importLabel: 'Import bakery FAQs',
      importHint: 'Custom orders, flavours, pickup times & pricing — pre-written.',
    },
  },

  SALON: {
    emoji: '✂️',
    label: 'Salon',
    tier: 'full',
    catalog: {
      navLabel: 'Services',
      pageTitle: 'Services',
      pageSubtitle: 'Treatments & services customers can book via WhatsApp',
      itemLabel: 'service',
      itemLabelPlural: 'services',
      addLabel: 'Add Service',
      emptyTitle: 'No salon services listed yet',
      emptyBody: 'Add your treatments — hair, nails, facials, or massage — to start receiving WhatsApp bookings.',
      categoryPlaceholder: 'e.g. Hair, Nails, Facials, Waxing, Massage',
      icon: Scissors,
      hasStock: false,
      hasDuration: true,
      hasImage: false,
      isServiceBased: true,
    },
    transactions: {
      type: 'bookings',
      bookingsNavLabel: 'Appointments',
      bookingsPageTitle: 'Appointments',
      bookingsSubtitle: 'Customer appointment requests via WhatsApp',
      emptyBookingsBody: 'Appointment requests from WhatsApp will appear here. Add your services to get started.',
    },
    dashboard: {
      greeting: 'your salon is doing today',
      ordersStatLabel: 'Orders',
      bookingsStatLabel: 'Appointments',
      tipText: 'Set accurate service durations so customers can book the right slot.',
    },
    customers: {
      orderHistoryLabel: 'Appointment history',
    },
    faq: {
      importLabel: 'Import salon FAQs',
      importHint: 'Booking, pricing, cancellation & hours — pre-written for salons.',
    },
  },

  BARBERSHOP: {
    emoji: '💈',
    label: 'Barbershop',
    tier: 'full',
    catalog: {
      navLabel: 'Services',
      pageTitle: 'Services',
      pageSubtitle: 'Cuts & services customers can book via WhatsApp',
      itemLabel: 'service',
      itemLabelPlural: 'services',
      addLabel: 'Add Service',
      emptyTitle: 'No barbershop services listed yet',
      emptyBody: 'Add your cuts, shaves, and styling services to start receiving WhatsApp bookings.',
      categoryPlaceholder: 'e.g. Haircuts, Shaves, Beard Trim, Styling',
      icon: Scissors,
      hasStock: false,
      hasDuration: true,
      hasImage: false,
      isServiceBased: true,
    },
    transactions: {
      type: 'bookings',
      bookingsNavLabel: 'Appointments',
      bookingsPageTitle: 'Appointments',
      bookingsSubtitle: 'Customer appointment requests via WhatsApp',
      emptyBookingsBody: 'Booking requests from WhatsApp will appear here. Add your services to get started.',
    },
    dashboard: {
      greeting: 'your barbershop is doing today',
      ordersStatLabel: 'Orders',
      bookingsStatLabel: 'Appointments',
      tipText: 'Add durations per service so the bot blocks off the right time slot.',
    },
    customers: {
      orderHistoryLabel: 'Appointment history',
    },
    faq: {
      importLabel: 'Import barbershop FAQs',
      importHint: 'Booking, walk-ins, pricing & cancellation — pre-written.',
    },
  },

  FASHION: {
    emoji: '👗',
    label: 'Fashion',
    tier: 'full',
    catalog: {
      navLabel: 'Products',
      pageTitle: 'Collection',
      pageSubtitle: 'Clothing & accessories customers can order via WhatsApp',
      itemLabel: 'item',
      itemLabelPlural: 'items',
      addLabel: 'Add Item',
      emptyTitle: 'No collection items yet',
      emptyBody: 'Add your dresses, tops, trousers, and accessories to start receiving WhatsApp orders.',
      categoryPlaceholder: 'e.g. Dresses, Tops, Trousers, Accessories, Shoes',
      icon: Shirt,
      hasStock: true,
      hasDuration: false,
      hasImage: true,
      isServiceBased: false,
    },
    transactions: {
      type: 'orders',
      ordersNavLabel: 'Orders',
      ordersPageTitle: 'Fashion Orders',
      ordersSubtitle: 'Fashion orders placed via WhatsApp',
      orderItemLabel: 'Item ordered',
      emptyOrdersBody: 'Fashion orders from WhatsApp will appear here. Share your number to start selling.',
    },
    dashboard: {
      greeting: 'your fashion store is doing today',
      ordersStatLabel: 'Fashion Orders',
      bookingsStatLabel: 'Bookings',
      tipText: 'Mention sizes and available colours in product descriptions to reduce back-and-forth.',
    },
    customers: {
      orderHistoryLabel: 'Purchase history',
    },
    faq: {
      importLabel: 'Import fashion FAQs',
      importHint: 'Sizing, returns, delivery & payment — pre-written for fashion stores.',
    },
  },

  COSMETICS: {
    emoji: '💄',
    label: 'Cosmetics',
    tier: 'full',
    catalog: {
      navLabel: 'Products',
      pageTitle: 'Products',
      pageSubtitle: 'Beauty & cosmetic products customers can order via WhatsApp',
      itemLabel: 'product',
      itemLabelPlural: 'products',
      addLabel: 'Add Product',
      emptyTitle: 'No beauty products listed yet',
      emptyBody: 'Add your skincare, makeup, and haircare products to start receiving WhatsApp orders.',
      categoryPlaceholder: 'e.g. Skincare, Makeup, Haircare, Fragrances, Nail Care',
      icon: Sparkles,
      hasStock: true,
      hasDuration: false,
      hasImage: true,
      isServiceBased: false,
    },
    transactions: {
      type: 'orders',
      ordersNavLabel: 'Orders',
      ordersPageTitle: 'Beauty Orders',
      ordersSubtitle: 'Beauty product orders placed via WhatsApp',
      orderItemLabel: 'Product ordered',
      emptyOrdersBody: 'Cosmetics orders from WhatsApp will appear here. Share your number to start selling.',
    },
    dashboard: {
      greeting: 'your beauty store is doing today',
      ordersStatLabel: 'Beauty Orders',
      bookingsStatLabel: 'Bookings',
      tipText: 'Include skin type or shade info in product descriptions to help customers choose.',
    },
    customers: {
      orderHistoryLabel: 'Purchase history',
    },
    faq: {
      importLabel: 'Import cosmetics FAQs',
      importHint: 'Products, skin types, delivery & returns — pre-written for beauty stores.',
    },
  },

  ELECTRONICS: {
    emoji: '🔌',
    label: 'Electronics',
    tier: 'full',
    catalog: {
      navLabel: 'Products',
      pageTitle: 'Products',
      pageSubtitle: 'Electronics & tech products customers can order via WhatsApp',
      itemLabel: 'product',
      itemLabelPlural: 'products',
      addLabel: 'Add Product',
      emptyTitle: 'No electronics listed yet',
      emptyBody: 'Add your phones, laptops, accessories, and gadgets to start receiving WhatsApp orders.',
      categoryPlaceholder: 'e.g. Phones, Laptops, Tablets, Accessories, Audio',
      icon: Cpu,
      hasStock: true,
      hasDuration: false,
      hasImage: true,
      isServiceBased: false,
    },
    transactions: {
      type: 'orders',
      ordersNavLabel: 'Orders',
      ordersPageTitle: 'Electronics Orders',
      ordersSubtitle: 'Electronics orders placed via WhatsApp',
      orderItemLabel: 'Product ordered',
      emptyOrdersBody: 'Electronics orders from WhatsApp will appear here. Share your number to start selling.',
    },
    dashboard: {
      greeting: 'your electronics store is doing today',
      ordersStatLabel: 'Electronics Orders',
      bookingsStatLabel: 'Bookings',
      tipText: 'Add specs like storage, RAM, or colour options in product descriptions to close sales faster.',
    },
    customers: {
      orderHistoryLabel: 'Purchase history',
    },
    faq: {
      importLabel: 'Import electronics FAQs',
      importHint: 'Products, specs, warranty, repairs & delivery — pre-written for tech stores.',
    },
  },

  // ─── BASIC MODES (inherit RETAIL_CONFIG — basic order flow) ────────────────

  RETAIL: {
    emoji: '🛍️',
    label: 'Retail',
    tier: 'basic',
    catalog: {
      navLabel: 'Products',
      pageTitle: 'Products',
      pageSubtitle: 'Products customers can order via WhatsApp',
      itemLabel: 'product',
      itemLabelPlural: 'products',
      addLabel: 'Add Product',
      emptyTitle: 'No products listed yet',
      emptyBody: 'Add your retail products to start receiving WhatsApp orders.',
      categoryPlaceholder: 'e.g. Category name',
      icon: ShoppingBag,
      hasStock: true,
      hasDuration: false,
      hasImage: true,
      isServiceBased: false,
    },
    transactions: {
      type: 'orders',
      ordersNavLabel: 'Orders',
      ordersPageTitle: 'Orders',
      ordersSubtitle: 'Customer orders placed via WhatsApp',
      orderItemLabel: 'Item ordered',
      emptyOrdersBody: 'Orders from WhatsApp will appear here.',
    },
    dashboard: {
      greeting: 'your store is doing today',
      ordersStatLabel: 'Orders',
      bookingsStatLabel: 'Bookings',
      tipText: 'Keep product stock levels updated so customers see accurate availability.',
    },
    customers: {
      orderHistoryLabel: 'Order history',
    },
    faq: {
      importLabel: 'Import retail FAQs',
      importHint: 'Basic ordering, delivery & payment auto-replies.',
    },
  },

  SUPERMARKET: {
    emoji: '🛒',
    label: 'Supermarket',
    tier: 'basic',
    catalog: {
      navLabel: 'Products',
      pageTitle: 'Products',
      pageSubtitle: 'Grocery & supermarket items customers can order via WhatsApp',
      itemLabel: 'product',
      itemLabelPlural: 'products',
      addLabel: 'Add Product',
      emptyTitle: 'No grocery items listed yet',
      emptyBody: 'Add your grocery products to start receiving WhatsApp orders.',
      categoryPlaceholder: 'e.g. Produce, Dairy, Beverages, Snacks, Household',
      icon: ShoppingCart,
      hasStock: true,
      hasDuration: false,
      hasImage: true,
      isServiceBased: false,
    },
    transactions: {
      type: 'orders',
      ordersNavLabel: 'Orders',
      ordersPageTitle: 'Grocery Orders',
      ordersSubtitle: 'Grocery orders placed via WhatsApp',
      orderItemLabel: 'Item ordered',
      emptyOrdersBody: 'Grocery orders from WhatsApp will appear here.',
    },
    dashboard: {
      greeting: 'your supermarket is doing today',
      ordersStatLabel: 'Grocery Orders',
      bookingsStatLabel: 'Bookings',
      tipText: 'Group products by category (Produce, Dairy, Beverages) so customers browse easily.',
    },
    customers: {
      orderHistoryLabel: 'Order history',
    },
    faq: {
      importLabel: 'Import supermarket FAQs',
      importHint: 'Ordering, delivery areas & stock FAQs — pre-written.',
    },
  },

  PHARMACY: {
    emoji: '💊',
    label: 'Pharmacy',
    tier: 'basic',
    catalog: {
      navLabel: 'Products',
      pageTitle: 'Products',
      pageSubtitle: 'Medicines & health products customers can order via WhatsApp',
      itemLabel: 'product',
      itemLabelPlural: 'products',
      addLabel: 'Add Product',
      emptyTitle: 'No pharmacy products listed yet',
      emptyBody: 'Add your medicines, vitamins, and health products to start receiving WhatsApp orders.',
      categoryPlaceholder: 'e.g. Medicines, Vitamins, First Aid, Baby Care, Supplements',
      icon: Pill,
      hasStock: true,
      hasDuration: false,
      hasImage: false,
      isServiceBased: false,
    },
    transactions: {
      type: 'orders',
      ordersNavLabel: 'Orders',
      ordersPageTitle: 'Pharmacy Orders',
      ordersSubtitle: 'Pharmacy orders placed via WhatsApp',
      orderItemLabel: 'Product ordered',
      emptyOrdersBody: 'Pharmacy orders from WhatsApp will appear here.',
    },
    dashboard: {
      greeting: 'your pharmacy is doing today',
      ordersStatLabel: 'Pharmacy Orders',
      bookingsStatLabel: 'Bookings',
      tipText: 'Add dosage or usage notes to product descriptions for clarity.',
    },
    customers: {
      orderHistoryLabel: 'Order history',
    },
    faq: {
      importLabel: 'Import pharmacy FAQs',
      importHint: 'Medications, dosage questions & delivery — pre-written.',
    },
  },

  DELIVERY: {
    emoji: '🚚',
    label: 'Delivery',
    tier: 'basic',
    catalog: {
      navLabel: 'Services',
      pageTitle: 'Delivery Services',
      pageSubtitle: 'Delivery service types customers can book via WhatsApp',
      itemLabel: 'service',
      itemLabelPlural: 'services',
      addLabel: 'Add Service',
      emptyTitle: 'No delivery services listed yet',
      emptyBody: 'Add your delivery service types — standard, express, or overnight — to start receiving WhatsApp orders.',
      categoryPlaceholder: 'e.g. Standard, Express, Overnight, Same-Day',
      icon: Truck,
      hasStock: false,
      hasDuration: false,
      hasImage: false,
      isServiceBased: true,
    },
    transactions: {
      type: 'orders',
      ordersNavLabel: 'Deliveries',
      ordersPageTitle: 'Deliveries',
      ordersSubtitle: 'Delivery requests placed via WhatsApp',
      orderItemLabel: 'Delivery details',
      emptyOrdersBody: 'Delivery requests from WhatsApp will appear here.',
    },
    dashboard: {
      greeting: 'your delivery service is doing today',
      ordersStatLabel: 'Deliveries',
      bookingsStatLabel: 'Bookings',
      tipText: 'List your coverage zones and estimated times per service type.',
    },
    customers: {
      orderHistoryLabel: 'Delivery history',
    },
    faq: {
      importLabel: 'Import delivery FAQs',
      importHint: 'Coverage zones, rates, tracking & timing — pre-written.',
    },
  },

  // ─── GENERIC FALLBACK (UI only — not a real backend enum value) ────────────

  GENERIC: {
    emoji: '🏪',
    label: 'Business',
    tier: 'basic',
    catalog: {
      navLabel: 'Products',
      pageTitle: 'Products & Services',
      pageSubtitle: 'Items customers can enquire about via WhatsApp',
      itemLabel: 'item',
      itemLabelPlural: 'items',
      addLabel: 'Add Item',
      emptyTitle: 'No items yet',
      emptyBody: 'Add your first item to start receiving WhatsApp enquiries.',
      categoryPlaceholder: 'e.g. Category name',
      icon: Package,
      hasStock: false,
      hasDuration: false,
      hasImage: true,
      isServiceBased: false,
    },
    transactions: {
      type: 'both',
      ordersNavLabel: 'Orders',
      bookingsNavLabel: 'Bookings',
      ordersPageTitle: 'Orders',
      bookingsPageTitle: 'Bookings',
      ordersSubtitle: 'Customer orders placed via WhatsApp',
      bookingsSubtitle: 'Customer bookings placed via WhatsApp',
      orderItemLabel: 'Item',
      emptyOrdersBody: 'Orders from WhatsApp will appear here.',
      emptyBookingsBody: 'Bookings from WhatsApp will appear here.',
    },
    dashboard: {
      greeting: 'your business is doing today',
      ordersStatLabel: 'Orders',
      bookingsStatLabel: 'Bookings',
      tipText: 'Set your business mode in Business Info to unlock tailored bot flows.',
    },
    customers: {
      orderHistoryLabel: 'Order history',
    },
    faq: {
      importLabel: 'Import default FAQs',
      importHint: 'Generic ordering, hours & contact auto-replies.',
    },
  },
};

/**
 * Returns the full config for a business mode.
 * Falls back to GENERIC for unknown modes.
 */
export function getBizConfig(businessMode) {
  return CONFIGS[businessMode] || CONFIGS.GENERIC;
}

/**
 * Returns which nav items to show based on business mode.
 * type: 'orders'   → show orders, hide bookings
 * type: 'bookings' → show bookings, hide orders
 * type: 'both'     → show both
 */
export function getNavVisibility(businessMode) {
  const cfg = getBizConfig(businessMode);
  const t = cfg.transactions.type;
  return {
    showMenu:     !cfg.catalog.isServiceBased,
    showServices: cfg.catalog.isServiceBased,
    showOrders:   t === 'orders' || t === 'both',
    showBookings: t === 'bookings' || t === 'both',
  };
}

/**
 * Ordered list of all business modes with metadata for selection UIs.
 * Grouped by tier: full modules first, then basic.
 */
export const BUSINESS_MODES = [
  // Full-module modes
  { value: 'RESTAURANT',  label: '🍽️  Restaurant',  desc: 'Full food ordering flow',               tier: 'full' },
  { value: 'BAKERY',      label: '🧁  Bakery',        desc: 'Custom cake & bakery orders',           tier: 'full' },
  { value: 'SALON',       label: '✂️  Salon / Spa',   desc: 'Appointments & beauty bookings',        tier: 'full' },
  { value: 'BARBERSHOP',  label: '💈  Barbershop',    desc: 'Haircut & grooming bookings',           tier: 'full' },
  { value: 'FASHION',     label: '👗  Fashion',        desc: 'Clothing & accessories orders',         tier: 'full' },
  { value: 'COSMETICS',   label: '💄  Cosmetics',     desc: 'Beauty products & consultations',       tier: 'full' },
  { value: 'ELECTRONICS', label: '🔌  Electronics',   desc: 'Tech products, specs & orders',         tier: 'full' },
  // Basic modes
  { value: 'RETAIL',      label: '🛍️  Retail',        desc: 'General shop — basic order flow',       tier: 'basic' },
  { value: 'SUPERMARKET', label: '🛒  Supermarket',   desc: 'Grocery orders — basic flow',           tier: 'basic' },
  { value: 'PHARMACY',    label: '💊  Pharmacy',       desc: 'Health products — basic flow',          tier: 'basic' },
  { value: 'DELIVERY',    label: '🚚  Delivery',       desc: 'Delivery service — basic flow',         tier: 'basic' },
];

export default getBizConfig;
