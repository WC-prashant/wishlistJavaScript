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
let isFetching = false;
let wc_wishlistProductIds = [];
let cachedProductData = null;
let cachedWishlistProductsData = null;
let isFetchingData = null;
let pId
const checkData = wishlistData() || null;
let Ipadd = checkData?.ip || null
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
const Wishlistcount = (count) => {
  localStorage.setItem("th_wlc_pro_count", count);
  console.log("count====>", count);

  localStorage.setItem("wishlistClubTotal", count);
  const wishlistclubElements = document.querySelectorAll(".th_wlc_product_count");
  wishlistclubElements.forEach((element) => {
    element.style.display = count >= 1 ? "flex" : "none";
    element.textContent = count == null ? 0 : count;
    element.setAttribute("data-count", count == null ? 0 : count);
  });
}
window.addEventListener("load", (event) => {

  setTimeout(function () {
    // eslint-disable-next-line no-undef
    $th_refreshWishlistItems();
    // eslint-disable-next-line no-undef
    $th_refreshBackInStockItems();
    // eslint-disable-next-line no-undef
    wishlistClubScript();
    // wishlistPage();
  }, 2000);
});
document.addEventListener('DOMContentLoaded', async () => {
  console.log("load...");
  // eslint-disable-next-line no-undef
  $th_refreshWishlistItems();
  // eslint-disable-next-line no-undef
  $th_refreshBackInStockItems();
  // eslint-disable-next-line no-undef
  wishlistClubScript();
  wishlistPage();
});
window.$th_refreshWishlistItems = () => {
  wcGetProductWishlist()
};
window.$th_refreshBackInStockItems = () => {
  // localStorage.removeItem("wishlistClubProducts");
  // localStorage.removeItem("wishlistClubTotal");
  wcGetProductWishlist();
}

function wlcCreateCookie(name, value, days) {
  let date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  let expires = "; expires=" + date.toGMTString();
  document.cookie = name + "=" + value + expires + "; path=/";
}
async function wcGetBackInStockData(productIds) {
  const uncachedIds = productIds?.filter((id) => !backInStockCache.has(id)) || [];
  if (uncachedIds.length) {
    try {
      const response = await apiService.getproduact({ shop: wcShop, product_ids: uncachedIds });
      sessionStorage.setItem("product", JSON.stringify(response?.data))
      return response?.data;
    } catch (error) {
      console.error("Error fetching back in stock data:", error);
    }
  }
}
async function wcGetWishlistProducts(productIds = []) {
  const payload = { customer_id: wcCustomerId, ip: Ipadd, shop: wcShop, product_ids: productIds };
  console.log("checkData?.ip", Ipadd, wcShop);
  const data = await apiService.getWishlists(payload);
  if (data.status === 200) {
    const mergedClone = [...data.data.products];
    localStorage.setItem(`wishlistClubProducts`, JSON.stringify(mergedClone));
    updateWishlistCount(data.data.total);
    return await data.data.products
  }
};
// ===== Wishlist & Back-In-Stock Buttons =====
async function wcGetProductWishlist(variantId) {
  if (isFetching) return;
  isFetching = true;
  console.log("load");
  let count = localStorage.getItem("th_wlc_pro_count") || 0
  console.log("count", count);

  // eslint-disable-next-line no-undef
  Wishlistcount(count)
  const selectors = [
    { selector: ".th_prd_wl_btn", type: "product" },
    { selector: ".wc_wl_bis_btn", type: "backinstock" },
    { selector: ".th_wl_col_btn", type: "collection" },
    { selector: ".th_wl_btn", type: __st?.p === 'product' ? "product" : "collection" }
  ];

  for (const { selector, type } of selectors) {
    await wcWishlistButtonProcess(selector, type, variantId);
  }
  isFetching = false;
}


// async function wcWishlistButtonProcess(selector, type, variantId) {
//   console.groupCollapsed(`[WC Wishlist] Processing ${type} buttons`);
//   console.log('Initial check - Selector:', selector, 'Type:', type, 'Variant ID:', variantId);

//   if (Number(wcSetting?.general?.app_enable) !== 1) {
//     console.warn('[WC Wishlist] App is disabled in settings');
//     console.groupEnd();
//     return;
//   }

//   // Safely handle null/undefined from querySelectorAll
//   const elements = document.querySelectorAll(selector);
//   const wishlistItems = elements ? [...elements].filter(el => !el.querySelector(".wc_wishlistBlock")) : [];

//   console.log('Found elements:', wishlistItems.length, 'matching selector');
//   if (!wishlistItems.length) {
//     console.log('[WC Wishlist] No valid elements found');
//     console.groupEnd();
//     return;
//   }
//   const productIds = wishlistItems
//     .map(el => el.getAttribute("data-product_id"))
//     .filter(Boolean);
//   console.log("productIds", productIds);

//   const uniqueProductIds = [...new Set(productIds)] || [];
//   console.log('Unique product IDs:', uniqueProductIds);

//   if (!uniqueProductIds.length) {
//     console.warn('[WC Wishlist] No product IDs found in elements');
//     console.groupEnd();
//     return;
//   }

//   if (typeof wc_wishlistProductIds === "undefined") {
//     console.error('[WC Wishlist] Critical: wc_wishlistProductIds is not defined');
//     console.groupEnd();
//     return;
//   }

//   // Rest of your function remains the same...
//   console.log('[WC Wishlist] Rendering initial loading state');
//   wishlistItems.forEach((el) => {
//     if (!roots.has(el)) {
//       console.log('Creating root for element:', el);
//       const root = createRoot(el);
//       roots.set(el, root);
//       const pId = el.getAttribute("data-product_id") || "";
//       const vId = variantId ?? el.getAttribute("data-variant_id");

//       root.render(
//         type === "backinstock"
//           ? <Backinstock ProductId={pId} VariantId={vId} type={type} data={null} loading={true} />
//           : <WishlistWidget ProductId={pId} VariantId={vId} type={type} data={null} cachedProductData={null} loading={true} />
//       );
//     } else {
//       console.log('Reusing existing root for element:', el);
//     }
//   });
//   try {
//     if (type === "backinstock") {
//       console.log('[WC Wishlist] Checking back in stock data needs');
//       if (window.isFetchingBackInStockData) {
//         console.log('[WC Wishlist] Back in stock data fetch already in progress');
//       } else {
//         console.log('[WC Wishlist] Fetching back in stock data for products:', uniqueProductIds);
//         window.isFetchingBackInStockData = true;
//         try {
//           cachedProductData = await wcGetBackInStockData(uniqueProductIds);
//           console.log('[WC Wishlist] Back in stock data received:', cachedProductData);
//         } catch (err) {
//           console.error('[WC Wishlist] Error fetching back in stock data:', err);
//         } finally {
//           window.isFetchingBackInStockData = false;
//         }
//       }
//     }
//     if (type !== "backinstock") {
//       console.log('[WC Wishlist] Checking wishlist data needs');
//       if (!cachedWishlistProductsData) {
//         if (window.isFetchingWishlistData) {
//           console.log('[WC Wishlist] Wishlist data fetch already in progress');
//         } else {
//           console.log('[WC Wishlist] Fetching wishlist data for products:', uniqueProductIds);
//           window.isFetchingWishlistData = true;
//           try {
//             cachedWishlistProductsData = await wcGetWishlistProducts(uniqueProductIds);
//             console.log('[WC Wishlist] Wishlist data received:', cachedWishlistProductsData);
//           } catch (err) {
//             console.error('[WC Wishlist] Error fetching wishlist products:', err);
//           } finally {
//             window.isFetchingWishlistData = false;
//           }
//         }
//       } else {
//         console.log('[WC Wishlist] Using cached wishlist data');
//       }
//     }
//     console.log('[WC Wishlist] Updating buttons with final data');
//     wishlistItems.forEach((el) => {
//       const pId = el.getAttribute("data-product_id") || "";
//       const vId = variantId ?? el.getAttribute("data-variant_id");

//       console.log(`Processing element - Product: ${pId}, Variant: ${vId}`);

//       let findWishlist = null;
//       let backInStockData = null;

//       if (type === "backinstock") {
//         backInStockData = cachedProductData?.products?.find(
//           product => String(product.product_id) === String(pId)
//         );
//         console.log('Back in stock data for product:', backInStockData);
//       } else {
//         if (Number(wcSetting?.general?.is_variant_wishlist) === 0) {
//           findWishlist = cachedWishlistProductsData?.find(
//             item => String(item.shopify_product_id) === String(pId) ||
//               String(item.shopify_variant_id) === String(vId)
//           );
//         } else {
//           findWishlist = (wishlistProducts() || []).find(
//             item => Number(item.shopify_product_id) === Number(pId) &&
//               Number(item.shopify_variant_id) === Number(vId)
//           ) || (wishlistProducts() || []).find(
//             item => Number(item.shopify_product_id) === Number(pId)
//           );

//           if (findWishlist) {
//             findWishlist = { ...findWishlist, wishlisted: false };
//           }
//         }
//         console.log('Wishlist data for product:', findWishlist);
//       }
//       roots.get(el)?.render(
//         type === "backinstock"
//           ? <Backinstock ProductId={pId} VariantId={vId} type={type} data={cachedProductData || null} loading={false} />
//           : <WishlistWidget ProductId={pId} VariantId={vId} type={type} data={findWishlist ?? null} cachedProductData={cachedProductData || null} loading={false} />
//       );

//       if (!wc_wishlistProductIds.includes(pId)) {
//         wc_wishlistProductIds.push(pId);
//         console.log('Added product ID to tracking:', pId);
//       }
//     });

//   } catch (error) {
//     // console.error('[WC Wishlist] Critical processing error:', error);
//     // window.isFetchingBackInStockData = false;
//     // window.isFetchingWishlistData = false;
//     // wishlistItems.forEach((el) => {
//     //   const pId = el.getAttribute("data-product_id") || "";
//     //   const vId = variantId ?? el.getAttribute("data-variant_id");

//     //   console.log('Rendering error state for product:', pId);
//     //   roots.get(el)?.render(
//     //     type === "backinstock"
//     //       ? <Backinstock ProductId={pId} VariantId={vId} type={type} data={null} error={true} />
//     //       : <WishlistWidget ProductId={pId} VariantId={vId} type={type} data={null} error={true} />
//     //   );
//     // });
//   } finally {
//     console.log('[WC Wishlist] Process completed');
//     console.groupEnd();
//   }
// }







// =======================


async function wcWishlistButtonProcess(selector, type, variantId) {
  try {
    // Validate required global variable
    if (typeof wc_wishlistProductIds === "undefined") {
      console.error("wc_wishlistProductIds is not defined");
      return;
    }

    // Check if feature is enabled
    if (Number(wcSetting?.general?.app_enable) !== 1) return;

    // Get all eligible elements
    const wishlistItems = [...document.querySelectorAll(selector)].filter(
      el => !el.querySelector(".wc_wishlistBlock")
    );
    if (!wishlistItems.length) return;

    // Get unique product IDs
    const productIds = [...new Set(wishlistItems.map(el => el.getAttribute("data-product_id")))];
    if (!productIds.length) return;
    const backInStockEls = document.querySelectorAll(`.wc_wl_bis_btn`);
    console.log("backInStockEls", backInStockEls);

    // Fetch product data if not already cached
    if (!cachedProductData && !isFetchingData) {
      isFetchingData = true;
      try {
        cachedProductData = await wcGetBackInStockData(productIds);
      } catch (err) {
        console.error("Error fetching wishlist products:", err);
      } finally {
        isFetchingData = false;
      }
    }

    // Check local storage for existing products
    const localdata = JSON.parse(localStorage.getItem("wishlistClubProducts")) || [];
    const allIncluded = productIds.every(id =>
      localdata.some(product => product?.shopify_product_id?.toString() === id)
    );

    // Fetch wishlist data if needed
    if (!cachedWishlistProductsData && !isFetchingData && !allIncluded) {
      isFetchingData = true;
      try {
        cachedWishlistProductsData = await wcGetWishlistProducts(productIds);
      } catch (err) {
        console.error("Error fetching wishlist products:", err);
      } finally {
        isFetchingData = false;
      }
    }

    // Process each wishlist item
    for (const el of wishlistItems) {
      const pId = el.getAttribute("data-product_id");
      const vId = variantId ?? el.getAttribute("data-variant_id");

      let findWishlist = null;

      // Find wishlist item based on settings
      if (Number(wcSetting?.general?.is_variant_wishlist) === 0) {
        findWishlist = cachedWishlistProductsData?.find(
          item => String(item.shopify_product_id) === String(pId) ||
            String(item.shopify_variant_id) === String(vId)
        );
      } else {
        const wishlist = wishlistProducts() || [];
        findWishlist = wishlist.find(
          item => Number(item.shopify_product_id) === Number(pId) &&
            Number(item.shopify_variant_id) === Number(vId)
        ) || wishlist.find(
          item => Number(item.shopify_product_id) === Number(pId)
        );

        if (findWishlist) {
          findWishlist = { ...findWishlist, wishlisted: false };
        }
      }

      // Create or update React root
      if (!roots.has(el)) {
        const root = createRoot(el);
        roots.set(el, root);
        root.render(
          type === "backinstock" ? (
            <Backinstock
              ProductId={pId}
              VariantId={vId}
              type={type}
              data={cachedProductData}
            />
          ) : (
            <WishlistWidget
              ProductId={pId}
              VariantId={vId}
              type={type}
              data={findWishlist ?? null}
              cachedProductData={cachedProductData?.products}
            />
          )
        );
      } else {
        const currentType = el.classList.contains("th_prd_wl_btn") ? "product" : el.classList.contains("wc_wl_bis_btn") ? "backinstock" : type;

        if (currentType === "product") {
          const wishlist = wishlistProducts() || [];
          const updatedWishlist = wishlist.find(
            item => Number(item.shopify_variant_id) === Number(vId)
          );

          roots.get(el).render(
            <WishlistWidget
              ProductId={pId}
              VariantId={vId}
              type={currentType}
              data={updatedWishlist ? { ...updatedWishlist, wishlisted: true } : { wishlisted: false }}
              cachedProductData={cachedProductData?.products}
            />
          );
        } else {
          roots.get(el).render(
            <Backinstock
              ProductId={pId}
              VariantId={vId}
              type={currentType}
              data={cachedProductData}
            />
          );
        }
      }

      // Update global product IDs if needed
      if (!wc_wishlistProductIds.includes(pId)) {
        wc_wishlistProductIds.push(pId);
      }
    }
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
  const wishlistEls = document.querySelectorAll(`[data-variant_id="${oldId}"].th_prd_wl_btn`);
  const backInStockEls = document.querySelectorAll(`[data-variant_id="${oldId}"].wc_wl_bis_btn`);
  console.log("backInStockEls", backInStockEls);
  // Handle Wishlist Buttons
  wishlistEls.forEach((el) => {
    el.setAttribute("data-variant_id", newId);
    const variantId = Number(newId);
    let findWishlist = (wishlistProducts() || []).find(item => Number(item.shopify_variant_id) === variantId);

    if (findWishlist !== undefined) {
      findWishlist = { ...findWishlist, wishlisted: true };
    } else {
      findWishlist = { shopify_variant_id: variantId, wishlisted: false };
    }

    roots.get(el)?.render(
      <WishlistWidget
        ProductId={el.getAttribute("data-product_id")}
        VariantId={newId}
        type="product"
        data={findWishlist}
        cachedProductData={cachedProductData['products']}
      />
    );
  });
  // Handle Back In Stock Buttons
  backInStockEls.forEach((el) => {
    el.setAttribute("data-variant_id", newId);

    roots.get(el)?.render(
      <Backinstock
        ProductId={el.getAttribute("data-product_id")}
        VariantId={newId}
        type="backinstock"
        data={cachedProductData}
      />
    );
  });
};

// export const wlProductVariantChange = (oldId, newId) => {
//   document.querySelectorAll(`[data-variant_id="${oldId}"]`).forEach(async (el) => {
//     await el.setAttribute("data-variant_id", newId);
//     console.log("newId==========>", newId);
//     if (el.classList.contains("th_prd_wl_btn")) {
//       let findWishlist = (wishlistProducts() || []).find(
//         item => Number(item.shopify_variant_id) === Number(newId)
//       )
//       console.log("findWishlist==========>", findWishlist);
//       if (findWishlist !== undefined) {
//         findWishlist = { ...findWishlist, wishlisted: true };
//       } else {
//         findWishlist = { ...findWishlist, wishlisted: !true };
//       }
//       console.log("findWishlist==========>", findWishlist);
//       roots.get(el).render(
//         <WishlistWidget ProductId={el.getAttribute("data-product_id")} VariantId={newId} type={"product"} data={findWishlist ?? null} cachedProductData={cachedProductData['products']} />
//       );
//     }
//   });
//   document.querySelectorAll(`[data-variant_id="${oldId}"]`).forEach(async (el) => {
//     console.log("el========================>", el);

//     if (el.classList.contains("th_prd_wl_btn")) {
//       let findWishlist = (wishlistProducts() || []).find(
//         item => Number(item.shopify_variant_id) === Number(newId)
//       )
//       console.log("findWishlist==========>", findWishlist);
//       if (findWishlist !== undefined) {
//         findWishlist = { ...findWishlist, wishlisted: true };
//       } else {
//         findWishlist = { ...findWishlist, wishlisted: !true };
//       }
//       console.log("findWishlist==========>", findWishlist);
//       roots.get(el).render(
//         <Backinstock ProductId={el.getAttribute("data-product_id")} VariantId={newId} type={"backinstock"} data={cachedProductData} />
//       );
//     }
//   });
// };
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
  wcWishlistCss += `.th_wl_col_btn .wc_wishlistBlock{padding: ${collection?.button_top_bottom_padding}px ${collection?.button_left_right_padding}px;display:flex; color:${collection?.button_color_before}; border-radius:${collection?.button_border_radius}px;background:${collection?.button_bg_color_before};border:${collection?.button_border_width}px solid ${collection?.button_color_before}}}` +
    `.th_wl_col_btn {padding: ${collection?.button_position}px ${collection?.button_left_right_padding}px;}` +
    `.th_wl_col_btn { ${collectionpositionStyle}}` +
    `.th_prd_wl_btn { ${positionStyle}}` +
    // `.th_wl_col_btn .wc_wishlistBlock .wc_wishlistIcon svg path{fill:${collection?.button_color_before};stroke:${collection?.button_color_before};}` +
    `.th_wl_col_btn .wc_wishlistBlock.isActive .wc_wishlistIcon svg path{fill:${collection?.button_color_after};stroke:${collection?.button_color_after};}` +
    `.th_wl_col_btn .wc_wishlistBlock svg.wcSpinner{fill:${collection?.button_color_before};}` +
    `.th_wl_col_btn .wc_wishlistBlock.isActive {padding:${collection?.button_top_bottom_padding}px ${collection?.button_left_right_padding}px;display:flex; color:${collection?.button_color_after}; border-radius:${collection?.button_border_radius}px;background:${collection?.button_bg_color_after};border:${collection?.button_border_width}px solid ${collection?.button_color_after}}}` + +
    `.th_wl_col_btn .wc_wishlistBlock.isActive .wc_wishlistIcon svg path{fill:${collection?.button_color_after};stroke:${collection?.button_color_after}}` +
    `.th_wl_col_btn .wc_wishlistBlock.isActive .wc_wishlistDropdown svg,.th_wl_col_btn .wc_wishlistBlock.isActive svg.wcSpinner{fill:${collection?.button_color_after};}` +
    `.th_prd_wl_btn .wc_wishlistBlock{padding: ${product?.button_top_bottom_padding}px ${product?.button_left_right_padding}px;color:${product?.button_color_before};background-color: ${product?.button_bg_color_before};border: ${product?.button_border_width}px solid ${product?.button_border_color_before};border-radius:${product?.button_border_radius}px}` +
    `.th_prd_wl_btn .wc_wishlistBlock .wc_wishlistIcon svg path{stroke:${product?.button_color_before};}` +
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