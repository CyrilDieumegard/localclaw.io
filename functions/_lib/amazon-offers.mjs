// Only add an ASIN after inspecting its selected variant on that marketplace.
// Never copy ASINs between countries: Amazon may redirect a missing variant.
export const verifiedOffers = [
  {
    query: 'Apple Mac mini M4 16GB 256GB', market: 'US', asin: 'B0DTPPBN95',
    title: 'Mac mini M4', memory: '16GB unified memory', storage: '256GB SSD',
    condition: 'Renewed', checked: '2026-09-11',
    note: 'Amazon Renewed listing. This US listing did not offer delivery to Switzerland when checked.'
  },
  {
    query: 'Apple Mac mini M4 Pro 24GB 512GB', market: 'DE', asin: 'B0DLBWRZS5',
    title: 'Mac mini M4 Pro · 12-core CPU / 16-core GPU', memory: '24GB unified memory', storage: '512GB SSD',
    condition: 'New', checked: '2026-09-11',
    note: 'Sold and dispatched by Amazon when checked. Delivery to Switzerland was offered; confirm your own address at checkout.'
  }
  ,{
    query: 'GMKtec EVO-X2 Ryzen AI Max+ 395 128GB 2TB', market: 'DE', asin: 'B0F6X332N6',
    title: 'GMKtec EVO-X2 · Ryzen AI Max+ 395', memory: '128GB shared CPU/GPU memory', storage: '2TB SSD',
    condition: 'New', checked: '2026-09-11',
    note: 'In stock with delivery to Switzerland offered when checked. Confirm your address, seller and selected configuration on Amazon.'
  }
  ,{
    query: 'Minisforum MS-S1 MAX Ryzen AI Max+ 395 128GB 2TB', market: 'DE', asin: 'B0HCNRF4Y1',
    title: 'Minisforum MS-S1 MAX · Ryzen AI Max+ 395', memory: '128GB shared CPU/GPU memory', storage: '2TB SSD',
    condition: 'New', checked: '2026-09-11',
    note: 'In stock and dispatched by Amazon with delivery to Switzerland offered when checked. Confirm the seller and delivery at checkout.'
  }
  ,{
    query: 'ASUS Ascent GX10 NVIDIA GB10 128GB 2TB', market: 'FR', asin: 'B0GBXPZ8V8',
    title: 'ASUS Ascent GX10 · NVIDIA GB10', memory: '128GB shared CPU/GPU memory', storage: '2TB SSD',
    condition: 'New', checked: '2026-09-11',
    note: 'New offer in stock on Amazon France when checked. Delivery to Switzerland has not been verified for this offer; confirm your own address.'
  }
];
