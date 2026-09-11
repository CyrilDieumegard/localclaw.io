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
];
