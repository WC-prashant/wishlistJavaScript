import React from 'react'
import { createRoot } from 'react-dom/client';
import { apiService, wcSetting, wcCustomerId, wcShop, wishlistData, wishlistProducts, updateWishlistCount } from "../utils/constent";
import WishlistWidget from "./Components/Wishlist/WishlistWidget";
import Backinstock from './Components/BackInStock/BackInStock';
import Wishlist from './view/Wishlist';
import "../src/index.css"
let wcIsCallCss = true;
const roots = new Map();
const backInStockCache = new Map();
let apiCallTimeout;
let isFetching = false;
let wc_wishlistProductIds = [];
let cachedProductData = null;
let cachedWishlistProductsData = null;
let isFetchingData = false;
let pId

// ===== Helper Function =====

window.wishlistClubScript = async function () {
  console.log("wcShop", wcShop);
  const domain = window.location.hostname;
  console.log(domain);
  const payload = { is_setting: wcShop ? 1 : 0, customer_id: wcCustomerId, ip: null, shop: wcShop ? wcShop : domain, };
  const storedData = JSON.parse(localStorage.getItem("wishlistClubData"));
  if (!Array.isArray(storedData?.wishlist)) {
    const data = await apiService.getSetting(payload);
    if (data.status === 200) {
      localStorage.setItem(`wishlistClubData`, JSON.stringify(data.data));
      const newIp = data.data?.ip || "";
      if (newIp) {
        wlcCreateCookie("wlcIp", newIp, 1);
      }

    }
    updateWishlistCount(localStorage.getItem(`wishlistClubTotal`));
  }
  if (wcIsCallCss) {
    getWishlistClubCss();
  }
};
document.addEventListener('DOMContentLoaded', () => {
  // eslint-disable-next-line no-undef
  $th_refreshWishlistItems();
  // eslint-disable-next-line no-undef
  // $th_refreshBackInStockItems();
  // eslint-disable-next-line no-undef
  wishlistClubScript();
  wishlistPage();
});
window.$th_refreshWishlistItems = (() => {
  console.log("======run====callback_$th_refreshWishlistItems");
  let observer = null;
  return function (badgeFlg = false) {
    if (badgeFlg) {
      wcGetProductWishlist();

    } else {
      if (!observer) {
        observer = new MutationObserver(debounce(() => wcGetProductWishlist(), 500));
        observer.observe(document.body, { childList: true, subtree: true });
      }
    }
  };
})();
window.$th_refreshBackInStockItems = () => {
  console.log("======run====callback_$th_refreshBackInStockItems");
  localStorage.removeItem("wishlistClubProducts");
  localStorage.removeItem("wishlistClubTotal");
  cachedProductData = null;
  cachedWishlistProductsData = null;
  wcGetProductWishlist();
}
export function convertIPv4ToIPv6Like(ipv4) {
  const parts = ipv4.split('.').map(Number);
  if (parts.length !== 4) return null;

  // const hexParts = parts.map(part => part.toString(16).padStart(2, '0'));
  // const ipv6Like = `2405:201:200c:6165:${hexParts[0]}${hexParts[1]}:${hexParts[2]}${hexParts[3]}`;
  return ipv4;
};
function debounce(func, delay = 300) {
  return (...args) => {
    clearTimeout(apiCallTimeout);
    apiCallTimeout = setTimeout(() => func(...args), delay);
  };
};
function wlcCreateCookie(name, value, days) {
  let date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  let expires = "; expires=" + date.toGMTString();
  document.cookie = name + "=" + value + expires + "; path=/";
}
async function wcGetBackInStockData(productIds) {
  const uncachedIds = productIds.filter((id) => !backInStockCache.has(id));

  if (uncachedIds.length) {
    try {
      const response = await apiService.getproduact({ shop: wcShop, product_ids: uncachedIds });
      sessionStorage.setItem("product", JSON.stringify(response?.data))
      cachedProductData = response?.data;
      return response?.data;
    } catch (error) {
      console.error("Error fetching back in stock data:", error);
    }
  }
}
async function wcGetWishlistProducts(productIds = []) {
  const checkData = wishlistData() || null;
  const payload = { customer_id: wcCustomerId, ip: convertIPv4ToIPv6Like(checkData?.ip) || null, shop: wcShop, product_ids: productIds };
  const wishListdata = JSON.parse(localStorage.getItem(`wishlistClubProducts`)) || [];
  if (wishListdata.length !== productIds.length) {
    const data = await apiService.getWishlists(payload);
    if (data.status === 200) {
      const mergedClone = [...data.data.products];
      localStorage.setItem(`wishlistClubProducts`, JSON.stringify(mergedClone));
      updateWishlistCount(data.data.total);
      return await data.data.products
    }
  }
};

// ===== Wishlist & Back-In-Stock Buttons =====

async function wcGetProductWishlist(variantId) {
  if (isFetching) return;
  isFetching = true;
  console.log("load");

  const selectors = [
    { selector: ".th_prd_wl_btn", type: "product" },
    { selector: ".th_wl_col_btn", type: "collection" },
    { selector: ".wc_wl_bis_btn", type: "backinstock" }
  ];

  await Promise.all(
    selectors.map(({ selector, type }) => wcWishlistButtonProcess(selector, type, variantId))
  );

  isFetching = false;
}
async function wcWishlistButtonProcess(selector, type, variantId) {
  const wishlistItems = [...document.querySelectorAll(selector)].filter(
    el => !el.querySelector(".wc_wishlistBlock")
  );
  if (!wishlistItems.length) return;
  const productIds = [...new Set(wishlistItems.map(el => el.getAttribute("data-product_id")))];
  if (!productIds.length) return;
  if (typeof wc_wishlistProductIds == "undefined") {
    console.error("wc_wishlistProductIds is not defined");
    return;
  }
  try {
    if (cachedProductData == null && cachedWishlistProductsData == null) {
      if (isFetchingData) return;
      isFetchingData = true;
      let productData
      productData = await wcGetBackInStockData(productIds);
      const wishlistData = await wcGetWishlistProducts(productIds);
      cachedProductData = productData;
      cachedWishlistProductsData = wishlistData;
      isFetchingData = false;
    }

    if (Number(wcSetting?.general?.app_enable) !== 1) return;
    wishlistItems.forEach((el) => {
      const pId = el.getAttribute("data-product_id");
      const vId = variantId ?? el.getAttribute("data-variant_id");
      let findWishlist = null;
      if (Number(wcSetting?.general?.is_variant_wishlist) === 0) {
        findWishlist = cachedWishlistProductsData?.find(
          item => String(item.shopify_product_id) === String(pId) ||
            String(item.shopify_variant_id) === String(vId)
        );
      } else {
        findWishlist = (wishlistProducts() || []).find(
          item => Number(item.shopify_product_id) === Number(pId) &&
            Number(item.shopify_variant_id) === Number(vId)
        ) || (wishlistProducts() || []).find(
          item => Number(item.shopify_product_id) === Number(pId)
        );
        if (findWishlist) {
          findWishlist = { ...findWishlist, wishlisted: false };
        }
      }

      if (!roots.has(el)) {
        const root = createRoot(el);
        roots.set(el, root);
        root.render(
          type === "backinstock"
            ? <Backinstock ProductId={pId} VariantId={vId} type={type} data={cachedProductData} />
            : <WishlistWidget ProductId={pId} VariantId={vId} type={type} data={findWishlist ?? null} cachedProductData={cachedProductData['products']} />
        );
      } else {
        if (roots.has(el) && el.classList.contains("th_prd_wl_btn")) {
          let findWishlist = (wishlistProducts() || []).find(
            item => Number(item.shopify_variant_id) === Number(vId)
          )
          console.log("~~~~~~~~~~~~~~~~DONE~~~~~~~~~~~~~~~");
          if (findWishlist !== undefined) {
            findWishlist = { ...findWishlist, wishlisted: true };
          } else {
            findWishlist = { ...findWishlist, wishlisted: !true };
          }
          roots.get(el).render(
            <WishlistWidget ProductId={el.getAttribute("data-product_id")} VariantId={vId} type={"product"} data={findWishlist ?? null} cachedProductData={cachedProductData['products']} />
          );
        }
        if (roots.has(el) && el.classList.contains("wc_wl_bis_btn")) {
          roots.get(el).render(
            <Backinstock ProductId={pId} VariantId={vId} type={"backinstock"} data={cachedProductData} />
          );
        }
      }
      if (!wc_wishlistProductIds.includes(pId)) {
        wc_wishlistProductIds.push(pId);
      }
    });

  } catch (error) {
    console.error("Error processing wishlist button:", error);
    isFetchingData = false;
  }
}
window.wlBackInStockProductVariantChange = (oldId, newId) => {
  document.querySelectorAll(`[data-variant_id="${oldId}"]`).forEach((el) => {
    el.setAttribute("data-variant_id", newId);
    const productId = el.getAttribute("data-product_id");
    const isBackInStockBtn = el.classList.contains("wc_wl_bis_btn");
    if (!roots.has(el)) return;
    if (isBackInStockBtn) {
      roots.get(el).render(
        <Backinstock
          ProductId={productId}
          VariantId={newId}
          type="backinstock"
          data={cachedProductData}
        />
      );
    }
  });
};
export const wlProductVariantChange = (oldId, newId) => {
  document.querySelectorAll(`[data-variant_id="${oldId}"]`).forEach((el) => {
    el.setAttribute("data-variant_id", newId);
    if (roots.has(el) && el.classList.contains("th_prd_wl_btn")) {
      let findWishlist = (wishlistProducts() || []).find(
        item => Number(item.shopify_variant_id) === Number(newId)
      )

      if (findWishlist !== undefined) {
        findWishlist = { ...findWishlist, wishlisted: true };
      } else {
        findWishlist = { ...findWishlist, wishlisted: !true };
      }
      roots.get(el).render(
        <WishlistWidget ProductId={el.getAttribute("data-product_id")} VariantId={newId} type={"product"} data={findWishlist ?? null} cachedProductData={cachedProductData['products']} />
      );
    }
    if (roots.has(el) && el.classList.contains("wc_wl_bis_btn")) {
      roots.get(el).render(
        <Backinstock ProductId={pId} VariantId={newId} type={"backinstock"} data={cachedProductData} />
      );
    }
  });
};
async function wishlistPage() {
  if (document.querySelectorAll(".wc_wishlist_page").length > 0) {
    const element = document.querySelector(".wc_wishlist_page")
    await element.setAttribute("data-money", "Rs. {{amount}}");
    await element.setAttribute("data-shop", "wcdev-prasantv.myshopify.com");
    const root = await createRoot(element);
    root.render(
      <Wishlist />
    )
  }
}

// ===== CSS Wrapper =====

function getWishlistClubCss() {
  const { product, collection } = wcSetting;
  let wcWishlistCss = '';
  wcWishlistCss += `.th_wl_col_btn .wc_wishlistBlock{padding: ${collection?.button_top_bottom_padding}px ${collection?.button_left_right_padding}px;color:${collection?.button_color_before}; border-radius:${collection?.button_border_radius}px}` +
    `.th_wl_col_btn .wc_wishlistBlock .wc_wishlistIcon svg path{fill:${collection?.button_color_before};stroke:${collection?.button_color_before};}` +
    `.th_wl_col_btn .wc_wishlistBlock svg.wcSpinner{fill:${collection?.button_color_before};}` +
    `.th_wl_col_btn .wc_wishlistBlock.isActive{color:${collection?.button_color_after}; }` +
    `.th_wl_col_btn .wc_wishlistBlock.isActive .wc_wishlistIcon svg path{fill:${collection?.button_color_after};stroke:${collection?.button_color_after}}` +
    `.th_wl_col_btn .wc_wishlistBlock.isActive .wc_wishlistDropdown svg,.th_wl_col_btn .wc_wishlistBlock.isActive svg.wcSpinner{fill:${collection?.button_color_after};}` +
    `.th_prd_wl_btn .wc_wishlistBlock{padding: ${product?.button_top_bottom_padding}px ${product?.button_left_right_padding}px;color:${product?.button_color_before};background-color: ${product?.button_bg_color_before};border: ${product?.button_border_width}px solid ${product?.button_border_color_before};border-radius:${product?.button_border_radius}px}` +
    `.th_prd_wl_btn .wc_wishlistBlock .wc_wishlistIcon svg path{fill:${product?.button_color_before};stroke:${product?.button_color_before};}` +
    `.th_prd_wl_btn .wc_wishlistBlock svg.wcSpinner{fill:${product?.button_color_before};}` +
    `.th_prd_wl_btn .wc_wishlistBlock.isActive{color:${product?.button_color_after};background-color: ${product?.button_bg_color_after};border-color: ${product?.button_border_color_after};}` +
    `.th_prd_wl_btn .wc_wishlistBlock.isActive .wc_wishlistIcon svg path{fill:${product?.button_color_after};stroke:${product?.button_color_after}}` +
    `.th_prd_wl_btn .wc_wishlistBlock.isActive .wc_wishlistDropdown svg,.th_prd_wl_btn .wc_wishlistBlock.isActive svg.wcSpinner{fill:${product?.button_color_after};}`;
  const existingStyle = document.getElementById('wcWishlistStyle');
  if (existingStyle) {
    existingStyle.innerHTML = wcWishlistCss;
  }
  wcIsCallCss = false;
}