import React from 'react';
import { createRoot } from 'react-dom/client';
import { apiService, wcSetting, wcCustomerId, wcShop, wishlistData, wishlistProducts, updateWishlistCount } from "../utils/constent";
import WishlistWidget from "./Components/Wishlist/WishlistWidget";
import BackInStock from './Components/BackInStock/BackInStock';
import "./index.css"
let wcIsCallCss = true;
let wc_wishlistProductIds = [];
let wc_BackinStockProductIds = [];
const roots = new Map();
let cachedProductData = [];
window.wishlistClubScript = async function () {
  const checkData = wishlistData() || null;
  if (!checkData) {
    const payload = { is_setting: 1, customer_id: wcCustomerId, ip: null, shop: wcShop };
    const data = await apiService.getSetting(payload);
    if (data.status === 200) {
      localStorage.setItem(`wishlistClubData`, JSON.stringify(data.data));
    }
  }
  const count = localStorage.getItem(`wishlistClubTotal`);
  updateWishlistCount(count);
  if (wcIsCallCss) {
    getWishlistClubCss();
  }
}
document.addEventListener('DOMContentLoaded', () => {
  $th_refreshWishlistItems();
  wishlistClubScript();
  setTimeout(() => {
    console.log("load...===========>");
    $th_refreshWishlistItems();
    wishlistClubScript();
  }, 3000);
});

window.$th_refreshWishlistItems = (function () {
  let observer = null;
  return function (badgeFlg = false) {
    if (badgeFlg) {
      wc_get_product_wishlist();
    } else {
      wc_get_product_wishlist(); // Call immediately
      if (!observer) {
        const targetNode = document.body; // Change this to a specific wishlist container if needed
        observer = new MutationObserver(() => {
          wc_get_product_wishlist();
        });
        observer.observe(targetNode, { childList: true, subtree: true });
      }
    }
  };
})();
let backInStockDataLoaded = false;
const backInStockRoots = new Map();
let backInStockInitInProgress = false;
async function wc_get_product_wishlist() {
  if (backInStockInitInProgress) return;
  console.log('load');
  backInStockInitInProgress = true;
  try {
    await Promise.all([
      wcWishlistButtonProcess(".th_prd_wl_btn", "product"),
      wcWishlistButtonProcess(".th_wl_col_btn", "collection"),
      wcWishlistButtonProcess(".th_wl_btn", __st?.p === 'product' ? "product" : "collection"),
    ]);
    if (wc_wishlistProductIds.length > 0) {
      await getWishlistProducts(wc_wishlistProductIds);
    }
    const stored = sessionStorage.getItem("product");
    if (stored) {
      cachedProductData = JSON.parse(stored);
      backInStockDataLoaded = true;
    }
    if (!backInStockDataLoaded && wc_BackinStockProductIds.length > 0) {
      cachedProductData = await wcGetBackInStockData(wc_BackinStockProductIds);
      sessionStorage.setItem("product", JSON.stringify(cachedProductData));
      backInStockDataLoaded = true;
    }
    await wcBackinStockButtonProcess(".wc_wl_bis_btn", "backinstock");
  } catch (error) {
    console.error("Error in wc_get_product_wishlist:", error);
  }
  backInStockInitInProgress = false;
}
async function wcGetBackInStockData(productIds) {
  try {
    const uniqueIds = [...new Set(productIds)];
    if (uniqueIds.length === 0) return [];

    const response = await apiService.getproduact({
      shop: wcShop,
      product_ids: uniqueIds
    });

    return response?.data || [];
  } catch (error) {
    console.error("Error fetching BIS data:", error);
    return [];
  }
}
async function wcBackinStockButtonProcess(selector, type) {
  try {
    const bisButtons = document.querySelectorAll(selector);
    if (bisButtons.length === 0) return;

    for (const el of bisButtons) {
      const pId = el.getAttribute("data-product_id");
      const vId = el.getAttribute("data-variant_id");

      if (!pId) continue;

      // Deduplicate product IDs for data fetching
      if (!wc_BackinStockProductIds.includes(pId)) {
        wc_BackinStockProductIds.push(pId);
      }

      // Prevent duplicate rendering
      if (backInStockRoots.has(el)) continue;

      const root = createRoot(el);
      backInStockRoots.set(el, root);

      root.render(
        <BackInStock
          ProductId={pId}
          VariantId={vId}
          type={type}
          data={cachedProductData}
        />
      );
    }
  } catch (error) {
    console.error("Error in wcBackinStockButtonProcess:", error);
  }
}
function wcWishlistButtonProcess(selector, type) {
  const wishlist_badge = document.querySelectorAll(selector);
  wishlist_badge.forEach((this_data) => {

    if (!this_data.querySelector(".wc_wishlistBlock")) {

      const pcClone = createRoot(this_data);
      const pId = this_data.getAttribute("data-product_id");
      const vId = this_data.getAttribute("data-variant_id");
      let findWishlist = (wishlistProducts() || []).find((item) => item.shopify_product_id === Number(pId) && item.shopify_variant_id === Number(vId));
      if (!findWishlist) {
        findWishlist = (wishlistProducts() || []).find((item) => item.shopify_product_id === Number(pId));
        findWishlist = { ...findWishlist, wishlisted: false }
      }
      if (findWishlist?.shopify_product_id) {
        pcClone.render(<WishlistWidget productId={pId} variantId={vId} type={type} data={findWishlist} />);
      } else {
        const findIndex = (wc_wishlistProductIds || []).findIndex((item) => item == pId);
        if (findIndex === -1) {
          wc_wishlistProductIds.push(pId);
        }
      }
    }
  });
}
const getWishlistProducts = async (productIds = []) => {
  wc_wishlistProductIds = [];
  const productListClone = wishlistProducts() || [];
  const checkData = wishlistData() || null;
  const payload = { customer_id: wcCustomerId, ip: checkData?.ip || null, shop: wcShop, product_ids: productIds };
  const data = await apiService.getWishlists(payload);

  const payload1 = { customer_id: wcCustomerId, ip: checkData?.ip || null, shop: wcShop, product_ids: productIds };
  const data1 = await apiService.getproduact(payload1);
  if (data1.status === 200) {
    cachedProductData = data1.data
  }
  if (data.status === 200) {
    const clone = [];
    const mergedClone = [...productListClone, ...data.data.products];
    localStorage.setItem(`wishlistClubProducts`, JSON.stringify(mergedClone));
    updateWishlistCount(data.data.total);
    wc_get_product_wishlist();
  }
};
function getWishlistClubCss() {
  const { product, collection, general } = wcSetting;
  let collectionpositionStyle = "";

  if (collection?.button_position == 1) {
    collectionpositionStyle = "margin-right:auto;";
  } else if (collection?.button_position == 2) {
    collectionpositionStyle = "display: flex !important;justify-content: right !important;";
  } else if (collection?.button_position == 3) {
    collectionpositionStyle = "display: flex !important;justify-content: center !important;";
  } else {
    collectionpositionStyle = "width:100%;disp";
  }
  let positionStyle = "";
  if (product?.button_position == 1) {
    positionStyle = "margin-right:auto;";
  } else if (product?.button_position == 2) {
    positionStyle = "display: flex !important;justify-content: right !important;";
  } else if (product?.button_position == 3) {
    positionStyle = "display: flex !important;justify-content: center !important;";
  } else {
    positionStyle = "width:100%;disp";
  }

  let wcWishlistCss = '';
  wcWishlistCss += `.th_wl_col_btn .wc_wishlistBlock{padding: ${collection?.button_top_bottom_padding}px ${collection?.button_left_right_padding}px;color:${collection?.button_color_before};background-color: ${collection?.button_bg_color_before};border: ${collection?.button_border_width}px solid ${collection?.button_border_color_before};border-radius:${collection?.button_border_radius}px}` +
    `.th_wl_col_btn { ${collectionpositionStyle}}` +
    `.th_prd_wl_btn { ${positionStyle}}` +
    `.th_wl_col_btn .wc_wishlistBlock .wc_wishlistIcon svg path{stroke:${collection?.button_color_before};}` +
    `.th_wl_col_btn .wc_wishlistBlock svg.wcSpinner{fill:${collection?.button_color_before};}` +
    `.th_wl_col_btn .wc_wishlistBlock.isActive{color:${collection?.button_color_after};background-color: ${collection?.button_bg_color_after};border-color: ${collection?.button_border_color_after};}` +
    `.th_wl_col_btn .wc_wishlistBlock.isActive .wc_wishlistIcon svg path{fill:${collection?.button_color_after};stroke:${collection?.button_color_after}}` +
    `.th_wl_col_btn .wc_wishlistBlock.isActive .wc_wishlistDropdown svg,.th_wl_col_btn .wc_wishlistBlock.isActive svg.wcSpinner{fill:${collection?.button_color_after};}` +

    `.th_prd_wl_btn .wc_wishlistBlock{padding: ${product?.button_top_bottom_padding}px ${product?.button_left_right_padding}px;color:${product?.button_color_before};background-color: ${product?.button_bg_color_before};border: ${product?.button_border_width}px solid ${product?.button_border_color_before};border-radius:${product?.button_border_radius}px}` +
    `.th_prd_wl_btn .wc_wishlistBlock .wc_wishlistIcon svg path{stroke:${product?.button_color_before};}` +
    `.th_prd_wl_btn .wc_wishlistBlock svg.wcSpinner{fill:${product?.button_color_before};}` +
    `.th_prd_wl_btn .wc_wishlistBlock.isActive{color:${product?.button_color_after};background-color: ${product?.button_bg_color_after};border-color: ${product?.button_border_color_after};}` +
    `.th_prd_wl_btn .wc_wishlistBlock.isActive .wc_wishlistIcon svg path{fill:${product?.button_color_after};stroke:${product?.button_color_after}}` +
    `.th_prd_wl_btn .wc_wishlistBlock.isActive .wc_wishlistDropdown svg,.th_prd_wl_btn .wc_wishlistBlock.isActive svg.wcSpinner{fill:${product?.button_color_after};}`
    ;
  const existingStyle = document.getElementById('wcWishlistStyle');
  if (existingStyle) {
    existingStyle.innerHTML = wcWishlistCss;
  }
  wcIsCallCss = false;
}
window.wlBackInStockProductVariantChange = (oldId, newId) => {
  document.querySelectorAll(`[data-variant_id="${oldId}"]`).forEach((el) => {
    el.setAttribute("data-variant_id", newId);
    const productId = el.getAttribute("data-product_id");
    const isBackInStockBtn = el.classList.contains("wc_wl_bis_btn");
    if (!roots.has(el)) return;
    if (isBackInStockBtn) {
      roots.get(el).render(
        <BackInStock
          ProductId={productId}
          VariantId={newId}
          type="backinstock"
          data={cachedProductData}
        />
      );
    }
  });
};
