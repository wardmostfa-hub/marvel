# Telegram Web App Setup

This repository includes a static Web App front-end for Telegram.

Files:
- index.html
- webapp.css
- webapp.js
- assets/default-app.svg
- assets/product-images.example.json

## Security
- No bot token or API token in web files.
- Front-end must call your bot backend only.
- Front-end sends X-Telegram-Init-Data.
- Backend must verify Telegram initData.

## Required backend endpoints
1) POST /webapp/bootstrap
2) POST /webapp/checkout

## Images per app
Priority:
1) product.image_url from backend
2) assets/product-images.json mapping
3) assets/default-app.svg fallback

Create assets/product-images.json from the example and add your images.
