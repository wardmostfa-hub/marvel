# Telegram Web App Setup

This repository now includes a static Web App front-end for Telegram:

- index.html
- webapp.css
- webapp.js
- assets/default-app.svg
- assets/product-images.example.json

## Security Rules

- No bot token or API token exists in web files.
- Front-end must call your bot backend only.
- Front-end sends `X-Telegram-Init-Data` header.
- Backend must verify Telegram initData before returning user data or creating orders.

## Required Backend Endpoints

Your bot backend should provide these HTTPS endpoints:

1. `POST /webapp/bootstrap`
- Verify Telegram initData.
- Return categories and products in JSON.
- Response example:

```json
{
  "categories": [
    {"id": 1, "name": "شحن التطبيقات"}
  ],
  "products_by_category": {
    "1": [
      {"id": 1001, "name": "Netflix 1M", "description": "...", "image_url": "https://..."}
    ]
  }
}
```

2. `POST /webapp/checkout`
- Verify Telegram initData.
- Body includes `product_id`, `category_id`.
- Execute same secure flow as bot checkout.

## Image Strategy Per App

The UI uses this priority:

1. `product.image_url` from backend.
2. Local mapping from `assets/product-images.json`.
3. Fallback `assets/default-app.svg`.

To use local mapping:

1. Copy `assets/product-images.example.json` to `assets/product-images.json`.
2. Add your image files under `assets/images/`.
3. Fill mappings by:
- Product ID: `id:123`
- Product slug: `slug:شحن-ببجي`
- Keyword: `kw:netflix`

## GitHub Pages Note

Your pages URL can host this front-end.
But data still must come from your bot backend (HTTPS), not direct third-party API from browser.
