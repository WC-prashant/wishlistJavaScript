import { ApiService } from "./ApiService";
export const apiService = new ApiService();
if (typeof window.wishlistClubMeta === "undefined") {
  window.wishlistClubMeta = { wcSetting: {}, wcCustomerId: "", wcShop: "" };
}
export const showMessage = (message, type = "success", duration = 2500) => {
  let bgColor = JSON.parse(localStorage.getItem("wishlistClubData"))['setting']['success_message_bg_color']
  let Color = JSON.parse(localStorage.getItem("wishlistClubData"))['setting']['success_message_text_color']
  let bgColor1 = JSON.parse(localStorage.getItem("wishlistClubData"))['setting']['error_message_bg_color']
  let Color1 = JSON.parse(localStorage.getItem("wishlistClubData"))['setting']['error_message_text_color']
  if (type === "success") {
    if (typeof $th_wishlistAdd_callback_successMessage == 'function') {
      // eslint-disable-next-line no-undef
      $th_wishlistAdd_callback_successMessage(message);
    } else {
      document.querySelector('body').insertAdjacentHTML(
        'beforeend',
        '<div id="th-wl-sucess-mgs" style="background:' + bgColor + ';color:' + Color + '">' + message + '</div>'
      );
      setTimeout(function () { document.getElementById("th-wl-sucess-mgs").remove(); }, duration);
    }
  } else {
    if (typeof $th_wishlistAdd_callback_errorMessage == 'function') {
      // eslint-disable-next-line no-undef
      $th_wishlistAdd_callback_errorMessage(message);
    } else {
      document.querySelector('body').insertAdjacentHTML(
        'beforeend',
        '<div id="th-wl-error-mgs" style="background:' + bgColor1 + ';color:' + Color1 + '"">' + message + '</div>'
      );
      setTimeout(function () { document.getElementById("th-wl-error-mgs").remove(); }, duration);
    }
  }
}
export const { wcSetting, wcCustomerId, wcShop } = window.wishlistClubMeta;
export const wishlistData = function () {
  return JSON.parse(localStorage.getItem('wishlistClubData')) || null;
};
export const getLocalRecords = () => {
  let defaultContent;
  if (localStorage.getItem("th_wishlist_products_list")) {
    defaultContent = localStorage.getItem("th_wishlist_products_list");
  }
  var valueInJSON2;
  if (typeof defaultContent == 'string') {
    valueInJSON2 = JSON.parse(defaultContent);
  }
  return valueInJSON2;
}
const getLocalthWishlists = () => {
  let defaultContent;
  if (localStorage.getItem("th_wishlist_lists")) {
    defaultContent = localStorage.getItem("th_wishlist_lists");
  }
  var valueInJSON2;
  if (typeof defaultContent == 'string') {
    valueInJSON2 = JSON.parse(defaultContent);
  }
  return valueInJSON2;
}
export const wishlistProducts = function () {
  return JSON.parse(localStorage.getItem('wishlistClubProducts')) || [];
};
export const wishlistVariant = function () {
  return JSON.parse(localStorage.getItem('wishlistClubVariant')) || [];
};
export const wcUniqueId = function (id) {
  const dateUniq = Date.now().toString(36) + Math.random().toString(36).substr(2);
  return `${dateUniq}`;
};
export const cartAddJson = async function (items) {
  const data = await apiService.addCartAPI({ items: items });
  return data
}
export const updateWishlistCount = function (count) {
  const wishlistclubElements = document.querySelectorAll(".th_wlc_product_count");
  wishlistclubElements.forEach((element) => {
    element.style.display = count >= 1 ? "flex" : "none";
    element.textContent = count == null ? 0 : count;
    element.setAttribute("data-count", count == null ? 0 : count);
  });
  console.log("count=========>", count);
  localStorage.setItem("th_wlc_pro_count", count);
  localStorage.setItem("wishlistClubTotal", count);
};