import { Transaction, ReportSource } from "./types";

export const SAMPLE_SOURCES: ReportSource[] = [
  {
    id: "source-shopify-june",
    name: "Shopify Storefront (June 2026)",
    channel: "Shopify",
    recordCount: 12,
    addedAt: "2026-06-30T18:30:00Z",
    status: "processed"
  },
  {
    id: "source-amazon-june",
    name: "Amazon US Channel (June 2026)",
    channel: "Amazon",
    recordCount: 8,
    addedAt: "2026-06-29T21:45:00Z",
    status: "processed"
  },
  {
    id: "source-pos-june",
    name: "Physical POS Terminals (June 2026)",
    channel: "POS",
    recordCount: 9,
    addedAt: "2026-06-28T16:20:00Z",
    status: "processed"
  },
  {
    id: "source-shopify-may",
    name: "Shopify Storefront (May 2026)",
    channel: "Shopify",
    recordCount: 11,
    addedAt: "2026-05-31T18:00:00Z",
    status: "processed"
  }
];

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  // --- JUNE 2026 ---
  // Shopify June
  {
    id: "tx-sh-1",
    date: "2026-06-02",
    item: "UltraFit Running Shoes",
    amount: 129.99,
    quantity: 1,
    region: "North America",
    source: "Shopify Storefront (June 2026)",
    type: "sale"
  },
  {
    id: "tx-sh-2",
    date: "2026-06-03",
    item: "Cotton Crewneck T-Shirt",
    amount: 28.00,
    quantity: 3,
    region: "North America",
    source: "Shopify Storefront (June 2026)",
    type: "sale"
  },
  {
    id: "tx-sh-3",
    date: "2026-06-05",
    item: "Waterproof Shell Jacket",
    amount: 189.50,
    quantity: 1,
    region: "Europe",
    source: "Shopify Storefront (June 2026)",
    type: "sale"
  },
  {
    id: "tx-sh-4",
    date: "2026-06-08",
    item: "Ergonomic Daypack",
    amount: 85.00,
    quantity: 1,
    region: "North America",
    source: "Shopify Storefront (June 2026)",
    type: "sale"
  },
  {
    id: "tx-sh-5",
    date: "2026-06-12",
    item: "UltraFit Running Shoes",
    amount: 129.99,
    quantity: 1,
    region: "Europe",
    source: "Shopify Storefront (June 2026)",
    type: "return" // Return of shoes
  },
  {
    id: "tx-sh-6",
    date: "2026-06-15",
    item: "Polarized Sport Sunglasses",
    amount: 45.00,
    quantity: 2,
    region: "Asia-Pacific",
    source: "Shopify Storefront (June 2026)",
    type: "sale"
  },
  {
    id: "tx-sh-7",
    date: "2026-06-18",
    item: "Waterproof Shell Jacket",
    amount: 189.50,
    quantity: 1,
    region: "Europe",
    source: "Shopify Storefront (June 2026)",
    type: "sale"
  },
  {
    id: "tx-sh-8",
    date: "2026-06-20",
    item: "Quick-Dry Training Shorts",
    amount: 38.00,
    quantity: 2,
    region: "North America",
    source: "Shopify Storefront (June 2026)",
    type: "sale"
  },
  {
    id: "tx-sh-9",
    date: "2026-06-22",
    item: "Ergonomic Daypack",
    amount: 85.00,
    quantity: 1,
    region: "North America",
    source: "Shopify Storefront (June 2026)",
    type: "return" // Return of daypack
  },
  {
    id: "tx-sh-10",
    date: "2026-06-25",
    item: "Smart Thermal Hydration Flask",
    amount: 32.00,
    quantity: 4,
    region: "Asia-Pacific",
    source: "Shopify Storefront (June 2026)",
    type: "sale"
  },
  {
    id: "tx-sh-11",
    date: "2026-06-27",
    item: "UltraFit Running Shoes",
    amount: 129.99,
    quantity: 2,
    region: "North America",
    source: "Shopify Storefront (June 2026)",
    type: "sale"
  },
  {
    id: "tx-sh-12",
    date: "2026-06-29",
    item: "Cotton Crewneck T-Shirt",
    amount: 28.00,
    quantity: 1,
    region: "Europe",
    source: "Shopify Storefront (June 2026)",
    type: "sale"
  },

  // Amazon US June
  {
    id: "tx-az-1",
    date: "2026-06-01",
    item: "Ergonomic Daypack",
    amount: 89.99,
    quantity: 2,
    region: "North America",
    source: "Amazon US Channel (June 2026)",
    type: "sale"
  },
  {
    id: "tx-az-2",
    date: "2026-06-04",
    item: "Smart Thermal Hydration Flask",
    amount: 34.50,
    quantity: 5,
    region: "North America",
    source: "Amazon US Channel (June 2026)",
    type: "sale"
  },
  {
    id: "tx-az-3",
    date: "2026-06-10",
    item: "Polarized Sport Sunglasses",
    amount: 49.99,
    quantity: 1,
    region: "North America",
    source: "Amazon US Channel (June 2026)",
    type: "sale"
  },
  {
    id: "tx-az-4",
    date: "2026-06-14",
    item: "Polarized Sport Sunglasses",
    amount: 49.99,
    quantity: 1,
    region: "North America",
    source: "Amazon US Channel (June 2026)",
    type: "return" // Return of sunglasses
  },
  {
    id: "tx-az-5",
    date: "2026-06-18",
    item: "UltraFit Running Shoes",
    amount: 139.99,
    quantity: 1,
    region: "North America",
    source: "Amazon US Channel (June 2026)",
    type: "sale"
  },
  {
    id: "tx-az-6",
    date: "2026-06-22",
    item: "Cotton Crewneck T-Shirt",
    amount: 29.99,
    quantity: 3,
    region: "North America",
    source: "Amazon US Channel (June 2026)",
    type: "sale"
  },
  {
    id: "tx-az-7",
    date: "2026-06-25",
    item: "Waterproof Shell Jacket",
    amount: 199.00,
    quantity: 1,
    region: "North America",
    source: "Amazon US Channel (June 2026)",
    type: "sale"
  },
  {
    id: "tx-az-8",
    date: "2026-06-28",
    item: "Ergonomic Daypack",
    amount: 89.99,
    quantity: 1,
    region: "North America",
    source: "Amazon US Channel (June 2026)",
    type: "sale"
  },

  // POS Physical Store June
  {
    id: "tx-pos-1",
    date: "2026-06-03",
    item: "Cotton Crewneck T-Shirt",
    amount: 30.00,
    quantity: 2,
    region: "North America",
    source: "Physical POS Terminals (June 2026)",
    type: "sale"
  },
  {
    id: "tx-pos-2",
    date: "2026-06-06",
    item: "Polarized Sport Sunglasses",
    amount: 50.00,
    quantity: 1,
    region: "North America",
    source: "Physical POS Terminals (June 2026)",
    type: "sale"
  },
  {
    id: "tx-pos-3",
    date: "2026-06-10",
    item: "Quick-Dry Training Shorts",
    amount: 40.00,
    quantity: 1,
    region: "North America",
    source: "Physical POS Terminals (June 2026)",
    type: "sale"
  },
  {
    id: "tx-pos-4",
    date: "2026-06-12",
    item: "Cotton Crewneck T-Shirt",
    amount: 30.00,
    quantity: 1,
    region: "North America",
    source: "Physical POS Terminals (June 2026)",
    type: "return" // Return of T-shirt
  },
  {
    id: "tx-pos-5",
    date: "2026-06-15",
    item: "UltraFit Running Shoes",
    amount: 130.00,
    quantity: 1,
    region: "North America",
    source: "Physical POS Terminals (June 2026)",
    type: "sale"
  },
  {
    id: "tx-pos-6",
    date: "2026-06-19",
    item: "Waterproof Shell Jacket",
    amount: 190.00,
    quantity: 1,
    region: "North America",
    source: "Physical POS Terminals (June 2026)",
    type: "sale"
  },
  {
    id: "tx-pos-7",
    date: "2026-06-22",
    item: "Cotton Crewneck T-Shirt",
    amount: 30.00,
    quantity: 4,
    region: "North America",
    source: "Physical POS Terminals (June 2026)",
    type: "sale"
  },
  {
    id: "tx-pos-8",
    date: "2026-06-25",
    item: "Polarized Sport Sunglasses",
    amount: 50.00,
    quantity: 1,
    region: "North America",
    source: "Physical POS Terminals (June 2026)",
    type: "sale"
  },
  {
    id: "tx-pos-9",
    date: "2026-06-28",
    item: "Ergonomic Daypack",
    amount: 90.00,
    quantity: 1,
    region: "North America",
    source: "Physical POS Terminals (June 2026)",
    type: "sale"
  },

  // --- MAY 2026 ---
  // Shopify May (used to calculate previous month comparison!)
  {
    id: "tx-sh-may-1",
    date: "2026-05-02",
    item: "UltraFit Running Shoes",
    amount: 129.99,
    quantity: 2,
    region: "North America",
    source: "Shopify Storefront (May 2026)",
    type: "sale"
  },
  {
    id: "tx-sh-may-2",
    date: "2026-05-04",
    item: "Cotton Crewneck T-Shirt",
    amount: 28.00,
    quantity: 5,
    region: "North America",
    source: "Shopify Storefront (May 2026)",
    type: "sale"
  },
  {
    id: "tx-sh-may-3",
    date: "2026-05-08",
    item: "Waterproof Shell Jacket",
    amount: 189.50,
    quantity: 1,
    region: "Europe",
    source: "Shopify Storefront (May 2026)",
    type: "sale"
  },
  {
    id: "tx-sh-may-4",
    date: "2026-05-11",
    item: "Ergonomic Daypack",
    amount: 85.00,
    quantity: 1,
    region: "North America",
    source: "Shopify Storefront (May 2026)",
    type: "sale"
  },
  {
    id: "tx-sh-may-5",
    date: "2026-05-14",
    item: "Cotton Crewneck T-Shirt",
    amount: 28.00,
    quantity: 1,
    region: "North America",
    source: "Shopify Storefront (May 2026)",
    type: "return" // Return
  },
  {
    id: "tx-sh-may-6",
    date: "2026-05-18",
    item: "Polarized Sport Sunglasses",
    amount: 45.00,
    quantity: 2,
    region: "Asia-Pacific",
    source: "Shopify Storefront (May 2026)",
    type: "sale"
  },
  {
    id: "tx-sh-may-7",
    date: "2026-05-20",
    item: "Waterproof Shell Jacket",
    amount: 189.50,
    quantity: 1,
    region: "Europe",
    source: "Shopify Storefront (May 2026)",
    type: "sale"
  },
  {
    id: "tx-sh-may-8",
    date: "2026-05-22",
    item: "Quick-Dry Training Shorts",
    amount: 38.00,
    quantity: 2,
    region: "North America",
    source: "Shopify Storefront (May 2026)",
    type: "sale"
  },
  {
    id: "tx-sh-may-9",
    date: "2026-05-25",
    item: "Ergonomic Daypack",
    amount: 85.00,
    quantity: 1,
    region: "North America",
    source: "Shopify Storefront (May 2026)",
    type: "sale"
  },
  {
    id: "tx-sh-may-10",
    date: "2026-05-27",
    item: "Smart Thermal Hydration Flask",
    amount: 32.00,
    quantity: 3,
    region: "Asia-Pacific",
    source: "Shopify Storefront (May 2026)",
    type: "sale"
  },
  {
    id: "tx-sh-may-11",
    date: "2026-05-30",
    item: "UltraFit Running Shoes",
    amount: 129.99,
    quantity: 1,
    region: "North America",
    source: "Shopify Storefront (May 2026)",
    type: "sale"
  }
];

// Helper prompts for users to copy/paste to test custom integrations
export const COPY_PASTE_TEMPLATES = [
  {
    name: "Shopify CSV Paste Style (July 2026)",
    channel: "Shopify",
    text: `Order ID,Date,Product Name,Net Sales,Quantity,Shipping Country,Type
#1031,2026-07-02,UltraFit Running Shoes,129.99,1,United States,sale
#1032,2026-07-02,Cotton Crewneck T-Shirt,56.00,2,Canada,sale
#1033,2026-07-03,Waterproof Shell Jacket,189.50,1,United Kingdom,sale
#1034,2026-07-05,Cotton Crewneck T-Shirt,-28.00,1,United States,return
#1035,2026-07-06,Ergonomic Daypack,85.00,1,United States,sale
#1036,2026-07-08,Polarized Sport Sunglasses,90.00,2,Australia,sale`
  },
  {
    name: "Amazon Raw Copy/Paste Report (July 2026)",
    channel: "Amazon",
    text: `--- AMAZON SELLER CENTRAL SYSTEM REPORT ---
Generated on: 2026-07-10 02:30 UTC
Merchant: ActiveLife Outlet US

Date | Order ID | Product SKU | Units | Price Each | Ship Region | Item Status
07/01/2026 | AMZ-993-219 | SKU-SHOES-RUN | 2 | $139.99 | US West | Shipped
07/03/2026 | AMZ-842-120 | SKU-JACKET-RAIN | 1 | $199.00 | US East | Shipped
07/04/2026 | AMZ-773-102 | SKU-SUNGLASS-POL | 1 | $49.99 | US South | Shipped
07/05/2026 | AMZ-842-120 | SKU-JACKET-RAIN | 1 | $199.00 | US East | Refunded (Return)
07/07/2026 | AMZ-541-984 | SKU-FLASK-HYDR | 4 | $34.50 | US West | Shipped
07/09/2026 | AMZ-311-042 | SKU-DAYPACK-ERG | 1 | $89.99 | US Midwest | Shipped`
  },
  {
    name: "Stripe Retail Terminal Ledger (July 2026)",
    channel: "POS",
    text: `ST_POS_07022026_01 | TXN_019284 | Cotton Crewneck T-Shirt | $30.00 | Qty: 2 | NY_Terminal_A | CHARGED
ST_POS_07022026_02 | TXN_019285 | Polarized Sport Sunglasses | $50.00 | Qty: 1 | NY_Terminal_A | CHARGED
ST_POS_07032026_01 | TXN_019289 | Waterproof Shell Jacket | $190.00 | Qty: 1 | CA_Terminal_B | CHARGED
ST_POS_07052026_01 | TXN_019293 | Polarized Sport Sunglasses | $50.00 | Qty: 1 | NY_Terminal_A | REFUNDED
ST_POS_07072026_01 | TXN_019299 | Quick-Dry Training Shorts | $40.00 | Qty: 3 | CA_Terminal_B | CHARGED`
  }
];
