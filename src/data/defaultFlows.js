/**
 * defaultFlows.js — Pre-built bot conversation flows for every business mode.
 *
 * Each entry provides:
 *   messages: the 4 customMessages fields (welcomeMessage, closed, loopFallback, fallback)
 *   faqs:     array of { trigger, reply } pairs the bot auto-replies to
 */

const SHARED_LOOP = () =>
  `😊 It looks like we keep going in circles — let me take you back to the main menu so we can get you sorted!`;

export const DEFAULT_FLOWS = {
  RESTAURANT: {
    label: '🍽️ Restaurant / Food',
    messages: {
      welcomeMessage: `👋 Welcome! I'm your virtual assistant.\n\nHere's what I can help you with:\n\n🍽️ *1. View our menu*\n🛒 *2. Place an order*\n📍 *3. Our location & hours*\nℹ️ *4. About us*\n\nJust type a number or tell me what you need! 😊`,
      closed: `⏰ We're currently closed.\n\nOur opening hours are shown on our profile. We look forward to serving you soon! 🙏`,
      loopFallback: SHARED_LOOP(),
      fallback: `I didn't quite catch that 😊 Type *menu* to see our dishes, *order* to place an order, or *help* for more options.`,
    },
    faqs: [
      { trigger: 'menu',     reply: `🍽️ *Our Menu*\n\nType *order* to place your order, or ask me about a specific dish for details and price! You can also browse by category name.` },
      { trigger: 'order',    reply: `🛒 *Ready to order?*\n\nTell me what you'd like and your delivery address (or say *pickup* if collecting). I'll confirm price and estimated time! ✅` },
      { trigger: 'delivery', reply: `🚚 *Delivery Info*\n\nWe deliver to nearby areas — usually 30–45 minutes. Type your address and I'll confirm if we deliver to you! 📍` },
      { trigger: 'location', reply: `📍 *Find Us*\n\nOur address is in our business profile. WhatsApp us directly for exact directions! 🗺️` },
      { trigger: 'hours',    reply: `🕐 *Opening Hours*\n\nCheck our business profile for current hours — we update them there whenever they change! ⏰` },
      { trigger: 'price',    reply: `💰 *Pricing*\n\nAll prices are on our menu. Type *menu* to see everything, or ask about a specific dish! 😊` },
      { trigger: 'payment',  reply: `💳 *Payment*\n\nWe accept cash on delivery and mobile money (Wave, Orange Money). Payment confirmed when your order is ready! ✅` },
      { trigger: 'cancel',   reply: `❌ *Cancel an order?*\n\nSend your order reference and we'll cancel it right away. Sorry for any inconvenience! 🙏` },
      { trigger: 'hi',       reply: `👋 Hello! Welcome! Type *menu* to see today's dishes or *order* to place an order. How can I help? 😊` },
      { trigger: 'hello',    reply: `👋 Hello! Welcome! Type *menu* to see today's dishes or *order* to place an order. How can I help? 😊` },
      { trigger: 'help',     reply: `🆘 *Help Menu:*\n\n• *menu* — view our dishes\n• *order* — place an order\n• *delivery* — delivery info\n• *payment* — payment options\n• *hours* — opening hours\n• *location* — find us\n\nOr just ask your question! 😊` },
    ],
  },

  SALON: {
    label: '✂️ Salon / Spa / Services',
    messages: {
      welcomeMessage: `👋 Welcome! I'm your virtual assistant.\n\nHere's how I can help:\n\n💇 *1. View our services & prices*\n📅 *2. Book an appointment*\n⏰ *3. Hours & availability*\nℹ️ *4. About us*\n\nJust type a number or tell me what you need! 😊`,
      closed: `⏰ We're currently closed.\n\nYou can still send your booking request and we'll confirm it when we open! 📅`,
      loopFallback: SHARED_LOOP(),
      fallback: `I didn't quite get that 😊 Type *services* to see what we offer, *book* to make an appointment, or *help* for all options.`,
    },
    faqs: [
      { trigger: 'services',    reply: `💇 *Our Services*\n\nWe offer hair, beauty, and wellness treatments. Type *book* to make an appointment or ask about a specific service for price and duration! ✨` },
      { trigger: 'book',        reply: `📅 *Book an Appointment*\n\nGreat! Tell me:\n1. Which service you'd like\n2. Preferred date & time\n3. Your name\n\nI'll check availability and confirm your slot! ✅` },
      { trigger: 'appointment', reply: `📅 *Book an Appointment*\n\nGreat! Tell me:\n1. Which service you'd like\n2. Preferred date & time\n3. Your name\n\nI'll check availability and confirm your slot! ✅` },
      { trigger: 'price',       reply: `💰 *Prices*\n\nType *services* for our full list with prices, or ask about a specific treatment for the exact cost! 😊` },
      { trigger: 'hours',       reply: `🕐 *Opening Hours*\n\nCheck our business profile for current hours. We recommend booking in advance to secure your preferred slot! 📅` },
      { trigger: 'cancel',      reply: `❌ *Cancel a booking?*\n\nPlease give us at least 2 hours notice. Send your name and appointment time and we'll sort it! 🙏` },
      { trigger: 'reschedule',  reply: `🔄 *Reschedule?*\n\nNo problem! Tell me your name, current appointment time, and new preferred slot — we'll update it right away! 📅` },
      { trigger: 'location',    reply: `📍 *Find Us*\n\nOur address is in our business profile. WhatsApp us if you need directions! 🗺️` },
      { trigger: 'hi',          reply: `👋 Hello! Welcome! I can help you book an appointment or check our services. Type *book* to get started or *services* to see what we offer! 💇` },
      { trigger: 'hello',       reply: `👋 Hello! Welcome! I can help you book an appointment or check our services. Type *book* to get started or *services* to see what we offer! 💇` },
      { trigger: 'help',        reply: `🆘 *Help Menu:*\n\n• *services* — all services & prices\n• *book* — book an appointment\n• *hours* — opening hours\n• *location* — find us\n• *cancel* — cancel a booking\n• *reschedule* — change your booking\n\nOr just ask! 😊` },
    ],
  },

  FASHION: {
    label: '👗 Fashion / Retail',
    messages: {
      welcomeMessage: `👋 Welcome to our store! I'm your virtual shopping assistant.\n\nHere's how I can help:\n\n👗 *1. Browse our collection*\n🛒 *2. Place an order*\n📦 *3. Track my order*\nℹ️ *4. Sizes & returns*\n\nWhat are you looking for today? 😊`,
      closed: `⏰ We're currently closed.\n\nFeel free to browse and send your order — we'll process it as soon as we open! 🛍️`,
      loopFallback: SHARED_LOOP(),
      fallback: `Not sure I understood that 😊 Type *shop* to browse, *order* to buy, or *help* to see all options.`,
    },
    faqs: [
      { trigger: 'shop',     reply: `👗 *Browse Our Collection*\n\nTell me what you're looking for (type, size, colour) and I'll show you what's available! ✨` },
      { trigger: 'order',    reply: `🛒 *Place an Order*\n\nTell me:\n1. What you'd like\n2. Your size\n3. Delivery address\n\nI'll confirm availability and total price! ✅` },
      { trigger: 'sizes',    reply: `📏 *Sizes*\n\nWe stock XS to 3XL for most items. Tell me your measurements and I'll recommend the best fit! 😊` },
      { trigger: 'price',    reply: `💰 *Prices*\n\nAsk about a specific item for its exact price! Type *deals* to see current promotions. 🎉` },
      { trigger: 'deals',    reply: `🎉 *Current Deals*\n\nAsk us about our latest promotions! We update regularly — follow our WhatsApp status for the freshest offers! 📱` },
      { trigger: 'delivery', reply: `📦 *Delivery*\n\nWe deliver to your door in 1–3 business days. Tell me your area and I'll confirm the cost! 🚚` },
      { trigger: 'return',   reply: `🔄 *Returns & Exchanges*\n\nWe accept returns within 7 days for unworn items with tags. Tell me what you'd like to exchange! 😊` },
      { trigger: 'track',    reply: `📍 *Track Your Order*\n\nShare your order reference and I'll give you a delivery update! 🚚` },
      { trigger: 'payment',  reply: `💳 *Payment*\n\nWe accept Wave, Orange Money, and cash on delivery! ✅` },
      { trigger: 'hi',       reply: `👋 Hello! Welcome to our store! Tell me what style, size, or colour you want and I'll find the perfect match! 👗` },
      { trigger: 'help',     reply: `🆘 *Shopping Help:*\n\n• *shop* — browse collection\n• *order* — place an order\n• *sizes* — sizing guide\n• *delivery* — delivery info\n• *return* — returns policy\n• *track* — track your order\n• *deals* — current promotions\n\nOr just describe what you want! 😊` },
    ],
  },

  ELECTRONICS: {
    label: '📱 Electronics / Tech',
    messages: {
      welcomeMessage: `👋 Welcome! I'm your virtual assistant.\n\nHere's how I can help:\n\n📱 *1. Browse products*\n🛒 *2. Place an order*\n🔧 *3. Repairs & services*\n💳 *4. Pricing & warranty*\n\nWhat can I help you with today? 😊`,
      closed: `⏰ We're currently closed.\n\nLeave your enquiry and we'll respond as soon as we open! 💻`,
      loopFallback: SHARED_LOOP(),
      fallback: `I didn't quite catch that 😊 Type *products* to browse, *order* to buy, *repair* for services, or *help* for all options.`,
    },
    faqs: [
      { trigger: 'products', reply: `📱 *Our Products*\n\nWe stock phones, tablets, laptops, and accessories. Tell me what you're looking for and I'll check stock and prices! 💻` },
      { trigger: 'order',    reply: `🛒 *Place an Order*\n\nTell me:\n1. The product you want\n2. Preferred colour/spec\n3. Delivery address\n\nI'll confirm availability, price, and warranty! ✅` },
      { trigger: 'price',    reply: `💰 *Pricing*\n\nAsk about a specific product for the current price including any promotions! 😊` },
      { trigger: 'repair',   reply: `🔧 *Repair Services*\n\nTell me:\n1. Device model\n2. The problem\n\nI'll give you an estimated cost and turnaround time! ⚙️` },
      { trigger: 'warranty', reply: `🛡️ *Warranty*\n\nAll products come with manufacturer warranty. Ask about a specific product for its warranty period! ✅` },
      { trigger: 'delivery', reply: `📦 *Delivery*\n\nWe deliver nationwide in 1–3 business days. Tell me your location for the exact cost! 🚚` },
      { trigger: 'payment',  reply: `💳 *Payment*\n\nWe accept Wave, Orange Money, bank transfer, and cash. Payment plans available for high-value items — ask us! ✅` },
      { trigger: 'stock',    reply: `📦 *Stock Check*\n\nTell me which product you want and I'll confirm if it's in stock right now! 😊` },
      { trigger: 'hi',       reply: `👋 Hello! Welcome! Looking for something specific? Tell me what you need and I'll find the best option at the best price! 📱` },
      { trigger: 'help',     reply: `🆘 *Help Menu:*\n\n• *products* — browse products\n• *order* — place an order\n• *price* — check a price\n• *repair* — repair services\n• *warranty* — warranty info\n• *stock* — check availability\n• *delivery* — delivery details\n• *payment* — payment options\n\nOr just tell me what you need! 😊` },
    ],
  },

  BAKERY: {
    label: '🧁 Bakery / Pastry',
    messages: {
      welcomeMessage: `👋 Welcome! I'm your virtual assistant. 🧁\n\nHere's how I can help:\n\n🍞 *1. Today's menu & specials*\n🛒 *2. Place an order*\n🎂 *3. Custom cakes & orders*\n📍 *4. Location & hours*\n\nWhat would you like today? 😊`,
      closed: `⏰ We're currently closed.\n\nSend your order now and we'll have it ready when we open! 🧁 Custom orders need at least 24 hours notice. 🙏`,
      loopFallback: SHARED_LOOP(),
      fallback: `I didn't quite get that 😊 Type *menu* to see our baked goods, *order* to place an order, or *custom* for custom cakes.`,
    },
    faqs: [
      { trigger: 'menu',     reply: `🍞 *Today's Menu*\n\nWe bake fresh every day! Type *order* to place your order or ask about a specific item for availability and price! 🧁` },
      { trigger: 'order',    reply: `🛒 *Place an Order*\n\nTell me:\n1. What you'd like\n2. Quantity\n3. Pickup or delivery?\n\nFor same-day orders, please order before 10am! ✅` },
      { trigger: 'custom',   reply: `🎂 *Custom Orders*\n\nTell me:\n1. What you need (cake, pastries, etc.)\n2. Size / quantity\n3. Occasion and date\n4. Any specific design or flavour\n\nWe need at least 24 hours notice! 🎨` },
      { trigger: 'delivery', reply: `🚚 *Delivery*\n\nWe deliver locally! Tell me your address and I'll confirm cost and availability! 📍` },
      { trigger: 'pickup',   reply: `🏃 *Pickup*\n\nYou're welcome to pick up from our shop! Just tell me your preferred pickup time when ordering. ✅` },
      { trigger: 'price',    reply: `💰 *Prices*\n\nAsk about a specific item for its price! Type *specials* to hear today's deals. 🎉` },
      { trigger: 'specials', reply: `🌟 *Today's Specials*\n\nAsk us about today's freshly baked specials and discounts! We update every morning. 🥐` },
      { trigger: 'hi',       reply: `👋 Hello! Something smells delicious today! 🧁 Type *menu* to see today's bakes or *order* to get started! 😊` },
      { trigger: 'help',     reply: `🆘 *Bakery Help:*\n\n• *menu* — today's menu\n• *order* — place an order\n• *custom* — custom cake orders\n• *delivery* — delivery info\n• *pickup* — pickup info\n• *specials* — today's specials\n\nOr just ask! 😊` },
    ],
  },

  COSMETICS: {
    label: '💄 Cosmetics / Beauty',
    messages: {
      welcomeMessage: `👋 Welcome! ✨ I'm your virtual beauty assistant.\n\nHere's how I can help:\n\n💄 *1. Browse products*\n🛒 *2. Place an order*\n💡 *3. Get a recommendation*\n📦 *4. Delivery & returns*\n\nWhat are you looking for today? 😊`,
      closed: `⏰ We're currently closed. ✨\n\nFeel free to send your order and we'll confirm it as soon as we open! 💄`,
      loopFallback: SHARED_LOOP(),
      fallback: `I didn't quite catch that 😊 Type *products* to browse, *recommend* for personalised advice, or *help* for all options.`,
    },
    faqs: [
      { trigger: 'products',  reply: `💄 *Our Products*\n\nWe stock skincare, makeup, haircare, and fragrances from top brands. Tell me what you're looking for! ✨` },
      { trigger: 'order',     reply: `🛒 *Place an Order*\n\nTell me:\n1. Product name or type\n2. Your shade / skin type (if relevant)\n3. Delivery address\n\nI'll confirm availability and price! ✅` },
      { trigger: 'skincare',  reply: `🌿 *Skincare Range*\n\nWe have cleansers, moisturisers, serums, and SPF for all skin types. Tell me your skin type and concern and I'll recommend the best products! 💆` },
      { trigger: 'recommend', reply: `💡 *Get a Recommendation*\n\nTell me:\n1. What you want to achieve (glow, moisturising, anti-ageing, etc.)\n2. Your skin type\n3. Your budget\n\nI'll find the perfect product! ✨` },
      { trigger: 'original',  reply: `✅ *100% Authentic*\n\nAll our products are 100% original from authorised distributors. We never sell fakes — your skin deserves the best! 💯` },
      { trigger: 'delivery',  reply: `📦 *Delivery*\n\nWe deliver locally and nationally. Tell me your location for delivery time and cost! 🚚` },
      { trigger: 'return',    reply: `🔄 *Returns*\n\nOpened products can't be returned for hygiene reasons unless defective. Unopened items can be exchanged within 7 days with receipt. 😊` },
      { trigger: 'hi',        reply: `👋 Hello gorgeous! ✨ Welcome! Looking for something specific or need a beauty recommendation? Tell me what you need! 💄` },
      { trigger: 'help',      reply: `🆘 *Beauty Help:*\n\n• *products* — browse products\n• *order* — place an order\n• *skincare* — skincare range\n• *recommend* — personalised advice\n• *delivery* — delivery info\n• *return* — returns policy\n• *original* — authenticity\n\nOr just ask! 😊` },
    ],
  },


  BARBERSHOP: {
    label: '💈 Barbershop',
    messages: {
      welcomeMessage: `👋 Welcome to our barbershop! I'm your virtual assistant. 💈\n\nHere's how I can help:\n\n💈 *1. View services & prices*\n📅 *2. Book an appointment*\n⏰ *3. Hours & availability*\nℹ️ *4. About us*\n\nJust type a number or tell me what you need! 😊`,
      closed: `⏰ We're currently closed.\n\nYou can still send your booking request and we'll confirm it when we open! 📅`,
      loopFallback: SHARED_LOOP(),
      fallback: `I didn't quite get that 😊 Type *services* to see cuts & prices, *book* to make an appointment, or *help* for all options.`,
    },
    faqs: [
      { trigger: 'services',    reply: `💈 *Our Services*\n\nWe offer haircuts, shaves, beard trims, and styling. Ask about a specific service for price and time! ✂️` },
      { trigger: 'book',        reply: `📅 *Book an Appointment*\n\nGreat! Tell me:\n1. Service you want\n2. Preferred date & time\n3. Your name\n\nWe'll confirm your slot! ✅` },
      { trigger: 'appointment', reply: `📅 *Book an Appointment*\n\nTell me your preferred date, time, and service and I'll get you booked in! ✅` },
      { trigger: 'price',       reply: `💰 *Prices*\n\nType *services* for our full price list, or ask about a specific cut or service! 😊` },
      { trigger: 'hours',       reply: `🕐 *Opening Hours*\n\nCheck our business profile for current hours. Walk-ins welcome when available — book to guarantee your slot! 📅` },
      { trigger: 'cancel',      reply: `❌ *Cancel a booking?*\n\nPlease give us at least 2 hours notice. Send your name and appointment time and we'll sort it! 🙏` },
      { trigger: 'location',    reply: `📍 *Find Us*\n\nOur address is in our business profile. WhatsApp us if you need directions! 🗺️` },
      { trigger: 'hi',          reply: `👋 Hey! Fresh cut today? 💈 Type *book* to lock in your appointment or *services* to check prices! 😊` },
      { trigger: 'hello',       reply: `👋 Hey! Fresh cut today? 💈 Type *book* to lock in your appointment or *services* to check prices! 😊` },
      { trigger: 'help',        reply: `🆘 *Barbershop Help:*\n\n• *services* — cuts & prices\n• *book* — book an appointment\n• *hours* — opening hours\n• *location* — find us\n• *cancel* — cancel a booking\n\nOr just ask! 😊` },
    ],
  },

  RETAIL: {
    label: '🛍 Retail',
    messages: {
      welcomeMessage: `👋 Welcome to our store! I'm your virtual shopping assistant.\n\nHere's how I can help:\n\n🛍️ *1. Browse products*\n🛒 *2. Place an order*\n📦 *3. Track my order*\nℹ️ *4. Pricing & returns*\n\nWhat are you looking for today? 😊`,
      closed: `⏰ We're currently closed.\n\nFeel free to browse and send your order — we'll process it as soon as we open! 🛍️`,
      loopFallback: SHARED_LOOP(),
      fallback: `Not sure I got that 😊 Type *shop* to browse, *order* to buy, or *help* to see all options.`,
    },
    faqs: [
      { trigger: 'shop',     reply: `🛍️ *Browse Our Products*\n\nTell me what you're looking for and I'll check availability and price for you! ✨` },
      { trigger: 'order',    reply: `🛒 *Place an Order*\n\nTell me:\n1. What you'd like\n2. Quantity\n3. Delivery address\n\nI'll confirm availability and total! ✅` },
      { trigger: 'price',    reply: `💰 *Prices*\n\nAsk about a specific item for the current price. Type *deals* to see promotions! 🎉` },
      { trigger: 'deals',    reply: `🎉 *Current Deals*\n\nAsk about our latest promotions! We update regularly — check our WhatsApp status for fresh offers! 📱` },
      { trigger: 'delivery', reply: `📦 *Delivery*\n\nWe deliver to your door. Tell me your area and I'll confirm cost and timeline! 🚚` },
      { trigger: 'return',   reply: `🔄 *Returns*\n\nWe accept returns within 7 days for unused items in original packaging. Tell me what you'd like to return! 😊` },
      { trigger: 'track',    reply: `📍 *Track Your Order*\n\nShare your order reference and I'll give you an update! 🚚` },
      { trigger: 'payment',  reply: `💳 *Payment*\n\nWe accept Wave, Orange Money, and cash on delivery! ✅` },
      { trigger: 'hi',       reply: `👋 Hello! Welcome to our store! Tell me what you're looking for and I'll help you find it! 🛍️` },
      { trigger: 'hello',    reply: `👋 Hello! Welcome! Tell me what you need and I'll check our stock for you! 😊` },
      { trigger: 'help',     reply: `🆘 *Shopping Help:*\n\n• *shop* — browse products\n• *order* — place an order\n• *price* — check prices\n• *delivery* — delivery info\n• *return* — returns policy\n• *track* — track your order\n• *deals* — promotions\n\nOr just describe what you want! 😊` },
    ],
  },

  SUPERMARKET: {
    label: '🛒 Supermarket',
    messages: {
      welcomeMessage: `👋 Welcome! I'm your virtual shopping assistant. 🛒\n\nHere's how I can help:\n\n🛒 *1. Browse & order groceries*\n📦 *2. Track my order*\n⏰ *3. Hours & delivery info*\nℹ️ *4. About us*\n\nWhat do you need today? 😊`,
      closed: `⏰ We're currently closed.\n\nSend your order now and we'll process it when we open! 🛒`,
      loopFallback: SHARED_LOOP(),
      fallback: `I didn't quite catch that 😊 Type *order* to shop, *delivery* for delivery info, or *help* for all options.`,
    },
    faqs: [
      { trigger: 'order',    reply: `🛒 *Place an Order*\n\nTell me what groceries you need and your delivery address! I'll confirm availability and total cost. ✅` },
      { trigger: 'delivery', reply: `🚚 *Delivery*\n\nWe deliver to nearby areas. Tell me your address and I'll confirm delivery time and cost! 📍` },
      { trigger: 'pickup',   reply: `🏃 *In-Store Pickup*\n\nYou're welcome to pick up from our store! Just tell me your preferred time when ordering. ✅` },
      { trigger: 'price',    reply: `💰 *Prices*\n\nAsk about a specific product for its current price! We try to keep prices updated daily. 😊` },
      { trigger: 'stock',    reply: `📦 *Stock Check*\n\nTell me what you're looking for and I'll confirm if it's in stock! 😊` },
      { trigger: 'hours',    reply: `🕐 *Store Hours*\n\nCheck our business profile for current opening hours — we update them whenever they change! ⏰` },
      { trigger: 'payment',  reply: `💳 *Payment*\n\nWe accept Wave, Orange Money, and cash on delivery! ✅` },
      { trigger: 'track',    reply: `📍 *Track Your Order*\n\nShare your order reference and I'll give you a delivery update! 🚚` },
      { trigger: 'hi',       reply: `👋 Hello! What can I help you shop for today? Tell me what you need and I'll check our stock! 🛒` },
      { trigger: 'hello',    reply: `👋 Hello! Ready to shop? Tell me what groceries you need! 🛒` },
      { trigger: 'help',     reply: `🆘 *Shopping Help:*\n\n• *order* — place a grocery order\n• *delivery* — delivery info\n• *pickup* — store pickup\n• *stock* — check availability\n• *hours* — store hours\n• *track* — track your order\n\nOr just tell me what you need! 😊` },
    ],
  },

  PHARMACY: {
    label: '💊 Pharmacy',
    messages: {
      welcomeMessage: `👋 Welcome to our pharmacy! I'm your virtual assistant. 💊\n\nHere's how I can help:\n\n💊 *1. Order medication or health products*\n🔍 *2. Check product availability*\n⏰ *3. Hours & info*\nℹ️ *4. About us*\n\nHow can I assist you today? 😊`,
      closed: `⏰ We're currently closed.\n\nFor urgent medical needs please visit your nearest open pharmacy. Leave your enquiry and we'll respond as soon as we open! 🙏`,
      loopFallback: SHARED_LOOP(),
      fallback: `I didn't quite get that 😊 Type *products* to browse, *order* to request medication, or *help* for all options.`,
    },
    faqs: [
      { trigger: 'products',     reply: `💊 *Our Products*\n\nWe stock medicines, vitamins, health supplements, first aid, and personal care products. Tell me what you're looking for! 😊` },
      { trigger: 'order',        reply: `🛒 *Place an Order*\n\nTell me:\n1. Product name or description\n2. Quantity\n3. Delivery address or pickup preference\n\nFor prescription meds, we'll ask for your prescription. ✅` },
      { trigger: 'prescription', reply: `📋 *Prescription Medicines*\n\nFor prescription medications, please have your prescription ready. Send a photo and we'll confirm availability and process your order. ✅` },
      { trigger: 'delivery',     reply: `🚚 *Delivery*\n\nWe deliver to nearby areas. Tell me your address and I'll confirm cost and time! 📍` },
      { trigger: 'stock',        reply: `📦 *Stock Check*\n\nTell me the product name and I'll check if we have it in stock right now! 😊` },
      { trigger: 'price',        reply: `💰 *Prices*\n\nAsk about a specific product for the current price! Generic alternatives may be available at a lower cost — just ask. 😊` },
      { trigger: 'hours',        reply: `🕐 *Opening Hours*\n\nCheck our business profile for current hours. For urgent needs outside hours, please visit your nearest 24-hour pharmacy. ⏰` },
      { trigger: 'hi',           reply: `👋 Hello! How can I help you today? Tell me what health product or medication you need! 💊` },
      { trigger: 'hello',        reply: `👋 Hello! How can I assist you today? 💊` },
      { trigger: 'help',         reply: `🆘 *Pharmacy Help:*\n\n• *products* — browse products\n• *order* — place an order\n• *prescription* — prescription meds\n• *stock* — check availability\n• *delivery* — delivery info\n• *hours* — opening hours\n\nOr just ask your question! 😊` },
    ],
  },

  DELIVERY: {
    label: '🚚 Delivery',
    messages: {
      welcomeMessage: `👋 Welcome! I'm your virtual assistant for delivery & logistics. 🚚\n\nHere's how I can help:\n\n📦 *1. Request a delivery*\n📍 *2. Track a delivery*\n💰 *3. Delivery rates & zones*\nℹ️ *4. About us*\n\nWhat do you need today? 😊`,
      closed: `⏰ We're currently closed.\n\nSend your delivery request now and we'll process it when we open! 🚚`,
      loopFallback: SHARED_LOOP(),
      fallback: `I didn't quite get that 😊 Type *delivery* to request a pickup, *track* to follow your parcel, or *help* for all options.`,
    },
    faqs: [
      { trigger: 'delivery', reply: `📦 *Request a Delivery*\n\nTell me:\n1. Pickup address\n2. Delivery address\n3. Item description & size\n4. Urgency (standard / express)\n\nI'll give you a quote and confirm pickup time! ✅` },
      { trigger: 'track',    reply: `📍 *Track Your Delivery*\n\nShare your tracking reference or order number and I'll give you an update! 🚚` },
      { trigger: 'price',    reply: `💰 *Delivery Rates*\n\nRates depend on distance, size, and urgency. Tell me pickup and delivery location and I'll give you a quote! 😊` },
      { trigger: 'rates',    reply: `💰 *Delivery Rates*\n\nShare your pickup and drop-off locations and I'll calculate the cost for you! 📍` },
      { trigger: 'zone',     reply: `🗺️ *Delivery Zones*\n\nWe cover the main city and surrounding areas. Tell me your location and I'll confirm if we deliver there! 📍` },
      { trigger: 'time',     reply: `⏱️ *Delivery Times*\n\nStandard delivery: 2–4 hours. Express: 1–2 hours (subject to availability). Tell me your location for a more accurate estimate! 🚀` },
      { trigger: 'payment',  reply: `💳 *Payment*\n\nWe accept Wave, Orange Money, and cash on pickup! ✅` },
      { trigger: 'hi',       reply: `👋 Hello! Need something delivered? Tell me pickup and drop-off location and I'll get it sorted! 🚚` },
      { trigger: 'hello',    reply: `👋 Hello! Ready to send or receive a parcel? Tell me what you need! 😊` },
      { trigger: 'help',     reply: `🆘 *Delivery Help:*\n\n• *delivery* — request a pickup\n• *track* — track a delivery\n• *rates* — delivery pricing\n• *zone* — delivery zones\n• *time* — delivery times\n• *payment* — payment options\n\nOr just tell me what you need! 😊` },
    ],
  },

  GENERIC: {
    label: '🏪 General Business',
    messages: {
      welcomeMessage: `👋 Welcome! I'm your virtual assistant.\n\nHere's how I can help:\n\n🛍️ *1. Browse products / services*\n🛒 *2. Place an order or enquiry*\n📍 *3. Location & hours*\nℹ️ *4. About us*\n\nJust type a number or tell me what you need! 😊`,
      closed: `⏰ We're currently closed.\n\nLeave your message and we'll get back to you as soon as we open! 🙏`,
      loopFallback: SHARED_LOOP(),
      fallback: `I didn't quite catch that 😊 Type *help* to see what I can do, or just ask your question!`,
    },
    faqs: [
      { trigger: 'products', reply: `🛍️ *Products & Services*\n\nTell me what you're looking for and I'll do my best to help! Ask about prices, availability, or anything else. 😊` },
      { trigger: 'order',    reply: `🛒 *Place an Order*\n\nTell me what you'd like and I'll help complete your order! Include your contact details and delivery address if needed. ✅` },
      { trigger: 'price',    reply: `💰 *Pricing*\n\nAsk about a specific product or service and I'll give you the price right away! 😊` },
      { trigger: 'hours',    reply: `🕐 *Business Hours*\n\nCheck our business profile for current opening hours — we update them there whenever they change! ⏰` },
      { trigger: 'location', reply: `📍 *Find Us*\n\nOur address is in our business profile. WhatsApp us if you need directions! 🗺️` },
      { trigger: 'delivery', reply: `📦 *Delivery*\n\nTell me your location and what you need and I'll confirm delivery availability and cost! 🚚` },
      { trigger: 'payment',  reply: `💳 *Payment*\n\nWe accept mobile money and cash. Ask about a specific order for payment details! ✅` },
      { trigger: 'hi',       reply: `👋 Hello! Welcome! How can I help you today? Type *help* to see all options or just tell me what you need! 😊` },
      { trigger: 'hello',    reply: `👋 Hello! Welcome! How can I help you today? Type *help* to see all options or just tell me what you need! 😊` },
      { trigger: 'help',     reply: `🆘 *Here to Help:*\n\n• *products* — what we offer\n• *order* — place an order\n• *price* — check a price\n• *hours* — opening hours\n• *location* — find us\n• *delivery* — delivery info\n• *payment* — payment options\n\nOr just ask your question! 😊` },
    ],
  },
};

export function getDefaultFlow(businessMode) {
  return DEFAULT_FLOWS[businessMode] || DEFAULT_FLOWS.GENERIC;
}

export const BUSINESS_MODES = Object.keys(DEFAULT_FLOWS);
