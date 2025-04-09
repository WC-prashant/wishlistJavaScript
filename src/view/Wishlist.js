import React, { useState, useEffect, useCallback } from "react";
import { apiService } from "../../utils/constent";
import { convertIPv4ToIPv6Like } from "../index";
const APP_BASE_URL = 'https://wishlist.thimatic-apps.com/';
const apiUrlWishlist = `${APP_BASE_URL}api/public/api`;
const initialState = {
    add_to_cart: "",
    button_bg_color_after: "",
    button_bg_color_before: "",
    button_border_color_after: "",
    button_border_color_before: "",
    button_border_radius: "",
    button_border_type: "",
    button_border_width: "",
    button_color_after: "",
    button_color_before: "",
    button_left_right_padding: "",
    button_position: "",
    button_text_after: "",
    button_text_before: "",
    button_top_bottom_padding: "",
    button_type: "",
    currency: "",
    domain: "",
    desktop_bottom_spacing: "",
    desktop_placement: "",
    desktop_side_spacing: "",
    id: "",
    item_count: "",
    launcher_button_color: "",
    launcher_icon: "",
    mobile_bottom_spacing: "",
    mobile_placement: "",
    mobile_side_spacing: "",
    module_name: "",
    no_product: "",
    notification_banner_button_bg_color: "",
    notification_banner_button_text: "",
    notification_banner_button_text_color: "",
    notification_banner_header_bg_color: "",
    notification_banner_header_text: "",
    notification_banner_header_text_color: "",
    product_add_to_cart: "",
    product_add_to_cart_error_message: "",
    product_add_to_cart_error_title: "",
    product_add_to_wishlist: "",
    product_remove_wishlist: "",
    remove_product: "",
    share_description: "",
    share_title: "",
    sold_out: "",
    total_count: "",
    type: "",
    view_cart_button: "",
    view_list_button: "",
    wishlist_button_color_after: "",
    wishlist_button_color_before: "",
    wishlist_button_text_after: "",
    wishlist_button_text_before: "",
    wishlist_page_title: "",
    wishlist_type: "",
    layout_type: 0,
    money_format: "",
    wishlist_page_Register_text: "",
    wishlist_page_description: "",
    wishlist_page_login_text: "",
    Wishlist_page_login_or_register: "",
    is_variant_wishlist: 0
};
// ===== Helper Function =====
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value?.split(`; ${name}=`);

    if (parts.length === 2) return parts.pop().split(';').shift();
    return "";
};
const createCookie = (name, value, days) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const ipv6 = convertIPv4ToIPv6Like(value);
    document.cookie = `${name}=${ipv6};expires=${date.toUTCString()};path=/`;
};
const moneyFormat = (amount, format) => {
    if (typeof amount === "string") amount = amount.replace(".", "");
    if (isNaN(amount) || amount == null) return "0";

    amount = (amount / 100).toFixed(2);
    const [integer, decimal] = amount.split(".");

    const formats = {
        amount: `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${decimal ? `.${decimal}` : ""}`,
        amount_no_decimals: integer.replace(/\B(?=(\d{3})+(?!\d))/g, ","),
        amount_with_comma_separator: `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${decimal}`,
        amount_with_space_separator: `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, " ")},${decimal}`,
        amount_with_period_and_space_separator: `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}.${decimal}`,
        amount_no_decimals_with_comma_separator: integer.replace(/\B(?=(\d{3})+(?!\d))/g, "."),
        amount_no_decimals_with_space_separator: integer.replace(/\B(?=(\d{3})+(?!\d))/g, " "),
        amount_with_apostrophe_separator: `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, "'")}.${decimal}`
    };

    return format.replace(/\{\{\s*(\w+)\s*\}\}/, formats[format.match(/\{\{\s*(\w+)\s*\}\}/)[1]] || amount);
};

const Wishlist = () => {
    const Shopify = window.Shopify;
    const shop = window.Shopify?.shop;
    const customerId = (window.__st && window.__st.cid) || "";
    const activeCurrency = window.Shopify?.currency?.active;
    const country = window.Shopify?.country;
    const moneyFormatString = document.querySelector(".wc_wishlist_page")?.getAttribute("data-money");
    const [tabPages, setTabPages] = React.useState({});
    const [isLoadMoreLoading, setIsLoadMoreLoading] = React.useState(false);
    const [settingData, setSettingData] = useState(initialState);
    const [wishlists, setWishlists] = useState([]);
    const [currentProducts, setCurrentProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState(0);
    const [wlcIp, setWlcIp] = useState(getCookie("wlcIp"));
    const [addToCartProductLoading, setAddToCartProductLoading] = useState(null);
    const [isRemoveOldCartProduct, setIsRemoveOldCartProduct] = useState(false);
    const [notification, setNotification] = useState({
        isSuccess: false,
        isError: false,
        message: ""
    });
    const [tabManagement, setTabManagement] = useState({
        editingTabIndex: null,
        editingWishlistId: null,
        newTabName: "",
        isLoading: false
    });
    const urlParams = new URLSearchParams(window.location.search);
    const wlid = urlParams.get("wlid") || "";
    const fetchWishlistSettings = useCallback(async () => {
        setIsLoading(true);
        try {
            const payload = {
                shop,
                customer_id: customerId,
                ip: wlcIp
            };
            const response = await apiService.getSetting(payload);
            const { status, data } = await response;

            if (status === 200) {
                setSettingData(data.setting);
                if (!wlcIp) {
                    const storedData = JSON.parse(localStorage.getItem("wishlistClubData"));
                    const newIp = storedData?.ip || "";
                    setWlcIp(newIp);
                    if (newIp) {
                        createCookie("wlcIp", newIp, 1);
                        console.log("newIp====>>>", newIp);
                    }
                }

                await fetchWishlistProducts(wlcIp || data.ip);

                addDynamicCSS(data.setting);

                if (typeof window.wc_wishlist_items_update_callback === 'function') {
                    window.wc_wishlist_items_update_callback();
                }

                if (typeof window.wc_wishlist_items_callback_function === 'function' &&
                    data?.setting?.plan_type === '8') {
                    window.wc_wishlist_items_callback_function(data);
                }
            }
        } catch (error) {
            console.error("Error fetching wishlist settings:", error);
        } finally {
            setIsLoading(false);
        }
    }, [shop, customerId, wlcIp]);
    const addDynamicCSS = (settings) => {
        const css = `
            #th-wl-sucess-mgs {
                color: ${settings.success_message_text_color};
                background-color: ${settings.success_message_bg_color};
            }
            #th-wl-error-mgs {
                color: ${settings.error_message_text_color};
                background-color: ${settings.error_message_bg_color};
            }
        `;

        const style = document.createElement('style');
        style.type = 'text/css';
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    };
    const fetchWishlistProductDetails = async (productHandle) => {
        try {
            const rootUrl = window.Shopify.routes.root || window.Shopify.routes.root_url;
            const response = await fetch(`${rootUrl}products/${productHandle}.js`);
            if (!response.ok) throw new Error("Failed to fetch product details");
            return await response.json();
        } catch (error) {
            return "wl_draft_product";
        }
    };
    const updateWishlistProductDetails = (wishlistProduct, productDetails) => {
        if (!wishlistProduct || !productDetails) return null;

        return {
            ...productDetails,
            shopify_product_id: productDetails.id,
            id: wishlistProduct.id,
            product_id: wishlistProduct.product_id,
            quantity: wishlistProduct.quantity,
            shop_id: wishlistProduct.shop_id,
            updated_at: wishlistProduct.updated_at,
            variant_id: wishlistProduct.variant_id,
            wishlist_id: wishlistProduct.wishlist_id,
            image: productDetails.featured_image,
            product_status: "ACTIVE",
            images: productDetails.media ? JSON.stringify(productDetails.media) : "[]",
            variants: productDetails.variants ? JSON.stringify(productDetails.variants) : "[]",
            variant: extractVariant(productDetails.variants, wishlistProduct.variant_id)
        };
    };
    const extractVariant = (variants, variantId) => {
        if (!variants) return null;

        const parsedVariants = typeof variants === "string" ? JSON.parse(variants) : variants;
        const matchedVariant = parsedVariants.find(v => Number(v.id) === Number(variantId));

        if (matchedVariant) {
            return JSON.stringify(matchedVariant);
        }
        return null;
    };
    const fetchWishlistProducts = async (ip) => {
        try {
            const response = await apiService.getWishlistsV4({
                shop,
                customer_id: customerId,
                ip: wlcIp,
                wishlist_share: wlid,
                country: Shopify.country,
            });
            const jsonData = await response;

            if (!jsonData || jsonData.status !== 200) {
                setIsLoading(false);
                return;
            }

            let wishlistTabs = jsonData.data?.wishlists || [];
            let productCount = 0;

            for (let tab of wishlistTabs) {
                let updatedProducts = [];
                for (let product of tab.wishlists) {
                    const storageKey = `wc_wl_page_pro_detail_${product.handle}`;
                    let storedProduct = localStorage.getItem(storageKey);
                    let fetchNewDetails = true;

                    if (storedProduct) {
                        storedProduct = JSON.parse(storedProduct);
                        const timeElapsed = (Date.now() - storedProduct.timestamp) / 1000 / 60;
                        fetchNewDetails = timeElapsed >= 2;
                    }

                    if (fetchNewDetails) {
                        let productDetail = await fetchWishlistProductDetails(product.handle);
                        if (productDetail === 'wl_draft_product') continue;
                        productDetail.timestamp = Date.now();
                        localStorage.setItem(storageKey, JSON.stringify(productDetail));
                        product = updateWishlistProductDetails(product, productDetail);
                    } else {
                        product = updateWishlistProductDetails(product, storedProduct);
                    }
                    updatedProducts.push(product);
                    productCount++;
                }
                tab.wishlists = updatedProducts;
            }

            localStorage.setItem("th_wlc_pro_count", productCount);
            document.querySelectorAll('.th_wlc_product_count').forEach(el => {
                el.innerHTML = `<span>${jsonData.data.total}</span>`;
            });

            setCurrentProducts(wishlistTabs[0]?.wishlists || []);
            setWishlists(wishlistTabs);

            if (typeof wc_wishlist_items_added_callback === 'function') {
                // eslint-disable-next-line no-undef
                wc_wishlist_items_added_callback(jsonData);
            }
        } catch (error) {
            console.error("Error fetching wishlists:", error);
        } finally {
            setIsLoading(false);
        }
    };
    const updateProductCountUI = (count) => {
        document.querySelectorAll('.th_wlc_product_count').forEach(el => {
            el.innerHTML = `<span>${count}</span>`;
        });
    };
    const loadMoreProducts = async (tabIndex, page) => {
        try {
            setIsLoadMoreLoading(true);
            const payload = {
                shop,
                customer_id: customerId,
                ip: wlcIp,
                page,
                id: wishlists[tabIndex]?.id,
                country
            };

            const response = await apiService.fetchWishlistFolders(payload);
            const { status, data } = await response

            if (status === 200) {
                const updatedWishlists = [...wishlists];
                const updatedTab = { ...updatedWishlists[tabIndex] };

                updatedTab.wishlists = [...updatedTab.wishlists, ...data];
                updatedWishlists[tabIndex] = updatedTab;

                setWishlists(updatedWishlists);
                setCurrentProducts(updatedTab.wishlists);
            }
        } catch (error) {
            console.error("Error loading more products:", error);
        } finally {
            setIsLoadMoreLoading(false);
        }
    };
    const handleLoadMore = () => {
        const currentPage = tabPages[selectedTab] || 1;
        const nextPage = currentPage + 1;
        setTabPages((prev) => ({ ...prev, [selectedTab]: nextPage, }));
        loadMoreProducts(selectedTab, nextPage);
    };
    const handleQuantityChange = (index, type, value) => {
        const updatedProducts = [...currentProducts];
        const product = updatedProducts[index];

        switch (type) {
            case "plus":
                product.quantity += 1;
                break;
            case "minus":
                product.quantity = Math.max(1, product.quantity - 1);
                break;
            case "input":
                product.quantity = Math.max(1, parseInt(value) || 1);
                break;
            default:
                break;
        }

        setCurrentProducts(updatedProducts);
    };
    const handleVariantChange = (index, variantId) => {
        const updatedProducts = [...currentProducts];
        const product = updatedProducts[index];
        const variants = JSON.parse(product.variants);
        const variant = variants.find(v => Number(v.id) === Number(variantId));

        if (variant) {
            product.variant = JSON.stringify(variant);
            product.variant_id = variantId;
            if (variant.featured_image) {
                product.image = variant.featured_image.src;
            }
            setCurrentProducts(updatedProducts);
        }
    };
    const quantityUpdate = async (dbId, quantity, res) => {
        let quantityData = [];
        let payload = {};
        if (dbId && quantity) {
            const obj = {
                id: dbId,
                quantity: quantity,
            }
            quantityData.push(obj)
            payload = { shop: shop, customer_id: customerId, ip: wlcIp, quantityData }

        } else {
            // eslint-disable-next-line array-callback-return
            (currentProducts || []).map((x, j) => {
                let obj = { id: x.id, quantity: x.quantity, };
                quantityData.push(obj);
                payload = { shop: shop, customer_id: customerId, ip: wlcIp, quantityData }
            })
        }
        const response = await apiService.WishlistQuantity(payload);
        const jsonData = await response
        if (jsonData.status === 200) {
            setAddToCartProductLoading(null);
            if (Number(settingData?.redirect_type) === 0) {
                window.location.href = Shopify.routes.root + "cart";
            } else if (Number(settingData?.redirect_type) === 1) {
                window.location.href = Shopify.routes.root + "checkout";
            } else if (Number(settingData?.redirect_type) === 2) {
                if (typeof $wc_item_added_to_cart == 'function') {
                    window.$wc_item_added_to_cart(res);
                } else {
                    console.log('wishlist club no callback function created');
                    window.location.href = Shopify.routes.root + "cart";
                }
            } else {
                window.location.href = Shopify.routes.root + "cart";
            }
        } else {
            setAddToCartProductLoading(null);
        }
    };
    const addToCartProduct = async (id, dbId, quantity) => {
        let product = [];
        let wc_add_to_cart_all_clicked = false;

        if (id && dbId && quantity) {
            setAddToCartProductLoading(dbId);
            product.push(createProductObject(id, quantity));
        } else {
            wc_add_to_cart_all_clicked = true;
            setAddToCartProductLoading("all");
            product = (currentProducts || []).map(x => createProductObject(x?.variant ? JSON.parse(x.variant).id : null, x.quantity));
        }

        if (wc_add_to_cart_all_clicked && isRemoveOldCartProduct) {
            await clearCart();
        }

        processCartAddition(product, dbId, quantity, wc_add_to_cart_all_clicked);
    };
    const createProductObject = (id, quantity) => ({
        id,
        quantity,
        properties: { _th_wishlist: customerId ? customerId : wlcIp }
    });
    const clearCart = async () => {
        try {
            const response = await apiService.clearCart();
            return response;
        } catch (error) {
            console.error("Error clearing cart:", error);
        }
    };
    const processCartAddition = async (product, dbId, quantity, wc_add_to_cart_all_clicked) => {
        try {
            const payload = { items: product };
            const response = await apiService.addToCart(payload);

            await handleCartResponse(response, dbId, quantity, wc_add_to_cart_all_clicked);
        } catch (error) {
            console.error("Error adding to cart:", error);
        }
    };
    const handleCartResponse = async (jsonData, dbId, quantity, wc_add_to_cart_all_clicked) => {
        if (jsonData?.items?.length > 0) {
            let payloadAddToCart = dbId ? [dbId] : (currentProducts || []).map(x => x.id);
            const response = await apiService.Wishlistcart(payloadAddToCart);
            handleWishlistResponse(response, jsonData, dbId, quantity, wc_add_to_cart_all_clicked)
        } else {
            setNotification({ isSuccess: false, isError: true, message: jsonData.description });
            setAddToCartProductLoading(null);
        }
    };
    const handleWishlistResponse = (res, jsonData, dbId, quantity, wc_add_to_cart_all_clicked) => {
        if (wc_add_to_cart_all_clicked ? typeof th_all_products_added_callback === 'function' : typeof th_single_products_added_callback === 'function') {
            // eslint-disable-next-line no-undef
            wc_add_to_cart_all_clicked ? th_all_products_added_callback?.() : th_single_products_added_callback?.();
        } else {
            if (res.status === 200) {
                setNotification({ isSuccess: true, isError: false, message: settingData.product_add_to_cart });
                quantityUpdate(dbId, quantity, jsonData);
            } else {
                setAddToCartProductLoading(null);
                setNotification({ isSuccess: false, isError: true, message: jsonData.description });
            }
        }
    };
    const removeProduct = async (product) => {
        try {
            const payload = {
                shop,
                customer_id: customerId,
                ip: wlcIp,
                id: product.id
            };
            const response = await apiService.WishlistRemove(payload);
            const { status, data, message } = await response;
            if (status === 200) {
                // Update UI
                const updatedWishlists = [...wishlists];
                const currentTab = { ...updatedWishlists[selectedTab] };

                currentTab.wishlists = currentTab.wishlists.filter(p => p.id !== product.id);
                currentTab.total = currentTab.total - 1;
                updatedWishlists[selectedTab] = currentTab;

                setWishlists(updatedWishlists);
                setCurrentProducts(currentTab.wishlists);

                // Update product count
                const newCount = (Number(localStorage.getItem("th_wlc_pro_count")) || 0) - 1;
                localStorage.setItem("th_wlc_pro_count", Math.max(0, newCount));
                updateProductCountUI(data.total);

                // Call callbacks
                if (typeof window.th_remove_from_lsl_changes === 'function') {
                    window.th_remove_from_lsl_changes(product.shopify_product_id, product.variant_id);
                }

                if (typeof window.wc_wishlist_items_update_callback === 'function') {
                    window.wc_wishlist_items_update_callback();
                }

                setNotification({
                    isSuccess: true,
                    isError: false,
                    message: settingData.product_remove_wishlist
                });
            } else {
                throw new Error(message);
            }
        } catch (error) {
            setNotification({
                isSuccess: false,
                isError: true,
                message: error.message
            });
        }
    };
    const shareWishlist = (platform) => {
        const baseUrl = `https://${settingData.domain || shop}/apps/wishlist/?wlid=${wishlists[selectedTab]?.id}`;
        const encodedDescription = encodeURIComponent(settingData.share_description);

        const shareLinks = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${baseUrl}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodedDescription}&url=${baseUrl}`,
            whatsapp: `https://api.whatsapp.com/send?text=${baseUrl}`,
            email: `mailto:?subject=${encodedDescription}&body=${baseUrl}`,
            sms: `sms:?&body=${encodedDescription}%0A${baseUrl}`,
            copy: () => {
                navigator.clipboard.writeText(baseUrl)
                    .then(() => alert("📋 Wishlist link copied successfully!"))
                    .catch(err => console.error("Failed to copy the link", err));
            }
        };

        if (platform === "copy") {
            shareLinks.copy();
        } else {
            window.open(shareLinks[platform], "_blank");
        }
    };
    const switchTab = (index, id) => {
        setSelectedTab(index);
        setTabManagement({
            editingTabIndex: null,
            editingWishlistId: null,
            newTabName: "",
            isLoading: false
        });

        const selectedWishlist = wishlists.find(w => w.id === id);
        setCurrentProducts(selectedWishlist?.wishlists || []);
    };
    const deleteWishlist = async (wishlistId) => {
        try {
            const payload = {
                shop,
                wishlistid: wishlistId,
                ip: wlcIp,
                customer_id: customerId
            };
            const response = await apiService.WishlistTabRemove(payload);
            const { status, data, message } = await response
            if (status === 200) {
                const updatedWishlists = wishlists.filter(w => w.id !== wishlistId);

                // Update localStorage
                updateLocalStorageWishlists(wishlistId);

                setWishlists(updatedWishlists);
                setCurrentProducts(updatedWishlists[0]?.wishlists || []);
                setSelectedTab(0);

                // Update product count
                localStorage.setItem('th_wlc_pro_count', data.total);
                if (typeof window.totalCountUpdate === 'function') {
                    window.totalCountUpdate();
                }

                // Call callbacks
                if (typeof window.th_set_previous_time === 'function') {
                    window.th_set_previous_time();
                }

                if (typeof window.$th_refreshWishlistItems === 'function') {
                    window.$th_refreshWishlistItems();
                }

                if (typeof window.wc_wishlist_items_update_callback === 'function') {
                    window.wc_wishlist_items_update_callback();
                }
            } else {
                throw new Error(message);
            }
        } catch (error) {
            setNotification({
                isSuccess: false,
                isError: true,
                message: error.message
            });
        }
    };
    const updateLocalStorageWishlists = (wishlistId) => {
        const wishlistsString = localStorage.getItem("th_wishlist_lists");
        let wishlists = [];

        if (wishlistsString) {
            wishlists = JSON.parse(wishlistsString);
            const index = wishlists.findIndex(w => w.id === parseInt(wishlistId));

            if (index !== -1) {
                wishlists.splice(index, 1);
                localStorage.setItem('th_wishlist_lists', JSON.stringify(wishlists));
            }
        }
    };
    const startEditingWishlist = (wishlist, index) => {
        setTabManagement({
            editingTabIndex: index,
            editingWishlistId: wishlist.id,
            newTabName: wishlist.name,
            isLoading: false
        });
    };
    const updateWishlistNameInLocalStorage = (identifier, newName) => {
        let localData = JSON.parse(localStorage.getItem("wishlistClubData"));

        if (!localData || !Array.isArray(localData.wishlist)) return;

        const updatedWishlist = localData.wishlist.map(wishlist => {
            if (Number(wishlist.id) === Number(identifier)) {
                return { ...wishlist, name: newName };
            }
            return wishlist;
        });
        setWishlists(updatedWishlist);
        localData.wishlist = updatedWishlist;
        localStorage.setItem("wishlistClubData", JSON.stringify(localData));
    };

    const updateWishlistName = async () => {
        setTabManagement(prev => ({ ...prev, isLoading: true }));

        try {
            const payload = {
                shop,
                id: tabManagement.editingWishlistId,
                ip: wlcIp,
                customer_id: customerId,
                name: tabManagement.newTabName
            };
            const response = await apiService.WishlistTabRename(payload);
            const { status, message } = response;

            if (status === 200) {
                const updatedWishlists = [...wishlists];
                setWishlists(updatedWishlists);
                setNotification({
                    isSuccess: true,
                    isError: false,
                    message
                });
                updateWishlistNameInLocalStorage(tabManagement.editingWishlistId, tabManagement.newTabName);
                setTabManagement({
                    editingTabIndex: null,
                    editingWishlistId: null,
                    newTabName: "",
                    isLoading: false
                });
            } else {
                throw new Error(message);
            }
        } catch (error) {
            setNotification({
                isSuccess: false,
                isError: true,
                message: error.message
            });
            setTabManagement(prev => ({ ...prev, isLoading: false }));
        }
    };
    const cancelEditing = () => {
        setTabManagement({
            editingTabIndex: null,
            editingWishlistId: null,
            newTabName: "",
            isLoading: false
        });
    };
    useEffect(() => {
        if (notification.isSuccess || notification.isError) {
            const timer = setTimeout(() => {
                setNotification({
                    isSuccess: false,
                    isError: false,
                    message: ""
                });
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [notification]);
    useEffect(() => {
        fetchWishlistSettings();
    }, [fetchWishlistSettings]);
    const btnLoading = (
        <svg id="loading-spinner" width="18" height="18" viewBox="0 0 48 48">
            <g fill="none">
                <path
                    id="track"
                    fill="#C6CCD2"
                    d="M24,48 C10.745166,48 0,37.254834 0,24 C0,10.745166 10.745166,0 24,0 C37.254834,0 48,10.745166 48,24 C48,37.254834 37.254834,48 24,48 Z M24,44 C35.045695,44 44,35.045695 44,24 C44,12.954305 35.045695,4 24,4 C12.954305,4 4,12.954305 4,24 C4,35.045695 12.954305,44 24,44 Z"
                />
                <path
                    id="section"
                    fill="#000000"
                    d="M24,0 C37.254834,0 48,10.745166 48,24 L44,24 C44,12.954305 35.045695,4 24,4 L24,0 Z"
                />
            </g>
        </svg>
    );
    return (
        <React.Fragment>
            {notification.isError && (
                <div id="th-wl-error-mgs" className="notification error">
                    {notification.message}
                </div>
            )}
            {notification.isSuccess && (
                <div id="th-wl-sucess-mgs" className="notification success">
                    {notification.message}
                </div>
            )}
            <div className="th-wl-container">
                <div className="th-wl-container-header">
                    <h3>{settingData.wishlist_page_title}</h3>
                    {customerId === "" && (
                        <p>
                            {settingData?.wishlist_page_description}{" "}
                            <a href={`https://${shop}${window.Shopify.routes.root}account/login`}>
                                {settingData?.wishlist_page_login_text}
                            </a>{" "}
                            {settingData?.Wishlist_page_login_or_register}{" "}
                            <a href={`https://${shop}${window.Shopify.routes.root}account/register`}>
                                {settingData?.wishlist_page_Register_text}
                            </a>
                        </p>
                    )}
                </div>

                {isLoading ? (
                    <figure className="th-wl-loader">
                        <svg width="60px" height="60px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" className="uil-ripple">
                            <rect x="0" y="0" width="100" height="100" fill="none" className="bk" />
                            <g>
                                <animate attributeName="opacity" dur="2s" repeatCount="indefinite" begin="-1s" keyTimes="0;0.33;1" values="1;1;0" />
                                <circle cx="50" cy="50" r="41.2637" stroke="#000" fill="none" strokeWidth="6" strokeLinecap="round">
                                    <animate attributeName="r" dur="2s" repeatCount="indefinite" begin="-1s" keyTimes="0;0.33;1" values="0;22;44" />
                                </circle>
                            </g>
                            <g>
                                <animate attributeName="opacity" dur="2s" repeatCount="indefinite" begin="0s" keyTimes="0;0.33;1" values="1;1;0" />
                                <circle cx="50" cy="50" r="24.8458" stroke="#000000" fill="none" strokeWidth="6" strokeLinecap="round">
                                    <animate attributeName="r" dur="2s" repeatCount="indefinite" begin="0s" keyTimes="0;0.33;1" values="0;22;44" />
                                </circle>
                            </g>
                        </svg>
                    </figure>
                ) : wishlists.length === 0 ? (
                    <div className="th-wl-no-wishlist">
                        <h3>{settingData.no_product || "Your wishlist is empty"}</h3>
                    </div>
                ) : (
                    <React.Fragment>
                        <ul className="th-wl-tab">
                            {wishlists.map((wishlist, index) => (
                                <li
                                    key={wishlist.id}
                                    className={`tab-link ${selectedTab === index ? "current" : ""}`}
                                    id={`th-wl-tab-${index}`}
                                >
                                    {tabManagement.editingTabIndex === index ? (
                                        <React.Fragment>
                                            <input
                                                value={tabManagement.newTabName}
                                                onChange={(e) => setTabManagement(prev => ({
                                                    ...prev,
                                                    newTabName: e.target.value
                                                }))}
                                            />
                                            <button
                                                className="tab-link-delete"
                                                onClick={tabManagement.isLoading ? null : updateWishlistName}
                                            >
                                                {tabManagement.isLoading ? (
                                                    <svg id="loading-spinner" width="18" height="18" viewBox="0 0 48 48">
                                                        <g fill="none">
                                                            <path
                                                                id="track"
                                                                fill="#C6CCD2"
                                                                d="M24,48 C10.745166,48 0,37.254834 0,24 C0,10.745166 10.745166,0 24,0 C37.254834,0 48,10.745166 48,24 C48,37.254834 37.254834,48 24,48 Z M24,44 C35.045695,44 44,35.045695 44,24 C44,12.954305 35.045695,4 24,4 C12.954305,4 4,12.954305 4,24 C4,35.045695 12.954305,44 24,44 Z"
                                                            />
                                                            <path
                                                                id="section"
                                                                fill="#000000"
                                                                d="M24,0 C37.254834,0 48,10.745166 48,24 L44,24 C44,12.954305 35.045695,4 24,4 L24,0 Z"
                                                            />
                                                        </g>
                                                    </svg>
                                                ) : (
                                                    <svg viewBox="0 0 15 15" fill="none">
                                                        <path d="M1.5686 11.6968V3.13574C1.5686 2.58346 2.01632 2.13574 2.5686 2.13574H9.93047C10.1957 2.13574 10.45 2.2411 10.6376 2.42864L12.4317 4.2228C12.6193 4.41034 12.7246 4.66469 12.7246 4.92991V11.6968C12.7246 12.2491 12.2769 12.6968 11.7246 12.6968H2.5686C2.01632 12.6968 1.5686 12.2491 1.5686 11.6968Z" strokeWidth="0.7" />
                                                        <path d="M4.0896 5.91401V2.2251H9.41473V5.91401H4.0896Z" strokeWidth="0.7" />
                                                        <circle cx="6.75205" cy="9.24326" r="2.0002" stroke="white" strokeWidth="0.7" />
                                                    </svg>
                                                )}
                                            </button>
                                            <button className="tab-link-delete" onClick={cancelEditing}>
                                                <svg viewBox="0 0 15 15" fill="none">
                                                    <path d="M3.47412 2.93555L11.8346 11.2964" strokeWidth="0.9" strokeLinecap="round" />
                                                    <path d="M11.8347 2.93555L3.4742 11.2964" strokeWidth="0.9" strokeLinecap="round" />
                                                </svg>
                                            </button>
                                        </React.Fragment>
                                    ) : (
                                        <React.Fragment>
                                            <button
                                                className="tab-link-label"
                                                onClick={() => switchTab(index, wishlist.id)}
                                            >
                                                {wishlist.name}
                                            </button>
                                            <button
                                                className="tab-link-delete"
                                                onClick={() => startEditingWishlist(wishlist, index)}
                                            >
                                                <svg viewBox="0 0 15 15" fill="none">
                                                    <path d="M3.97478 8.45506L3.36712 11.2282C3.33698 11.3657 3.45459 11.4905 3.59366 11.4685L6.48541 11.0122C6.52692 11.0056 6.5653 10.9862 6.59513 10.9566L12.1708 5.42216C12.2494 5.34415 12.2497 5.21711 12.1714 5.1388L9.89187 2.85913C9.81418 2.78143 9.68836 2.78096 9.61009 2.85807L4.02978 8.35539C4.00218 8.38259 3.98307 8.41721 3.97478 8.45506Z" strokeWidth="0.7" strokeLinecap="round" />
                                                    <path d="M8.13281 4.7085L10.3961 6.97212" strokeWidth="0.7" strokeLinecap="round" />
                                                </svg>
                                            </button>
                                            <button
                                                className="tab-link-delete"
                                                onClick={() => deleteWishlist(wishlist.id)}
                                            >
                                                <svg viewBox="0 0 15 15" fill="none">
                                                    <path d="M4.51831 3.40771V10.8752C4.51831 11.5379 5.05557 12.0752 5.71831 12.0752H10.4053C11.068 12.0752 11.6053 11.5379 11.6053 10.8752V3.40771" strokeWidth="0.7" />
                                                    <path d="M3.44287 3.24561L12.4851 3.24561" strokeWidth="0.7" strokeLinecap="round" />
                                                    <path d="M6.10205 2.02441L9.82617 2.02441" strokeWidth="0.7" strokeLinecap="round" />
                                                    <path d="M6.79663 9.3877L6.79663 5.66357" strokeWidth="0.7" strokeLinecap="round" />
                                                    <path d="M9.3269 9.3877L9.3269 5.66357" strokeWidth="0.7" strokeLinecap="round" />
                                                </svg>
                                            </button>
                                        </React.Fragment>
                                    )}
                                </li>
                            ))}
                        </ul>
                        <div className="tab-content current">
                            {settingData.share_wishlist === 1 && wlid === "" && (
                                <div className="th-wl-header-row">
                                    <div className="th-wl-header-col"></div>
                                    <div className="th-wl-header-col">
                                        <div className="th-wl-share_on">
                                            <h3>{settingData.share_title} :</h3>
                                            <div className="share-buttons">
                                                <button onClick={() => shareWishlist("facebook")} aria-label="Share Via Facebook">
                                                    <svg viewBox="0 0 512 512" fill="none">
                                                        <path className="wl-bg-social-icon" d="M0 256C0 114.615 114.615 0 256 0V0C397.385 0 512 114.615 512 256V256C512 397.385 397.385 512 256 512V512C114.615 512 0 397.385 0 256V256Z" fill="black" />
                                                        <path className="wl-social-icon" d="M278.6 401.92V268.808H323.262L329.962 216.916H278.6V183.791C278.6 168.772 282.753 158.537 304.315 158.537L331.77 158.525V112.112C327.022 111.495 310.724 110.08 291.754 110.08C252.143 110.08 225.024 134.259 225.024 178.652V216.916H180.227V268.808H225.024V401.92H278.6Z" fill="white" />
                                                    </svg>
                                                </button>
                                                <button onClick={() => shareWishlist("twitter")} aria-label="Share Via Twitter">
                                                    <svg viewBox="0 0 512 512" fill="none">
                                                        <path className="wl-bg-social-icon" d="M0 256C0 114.615 114.615 0 256 0V0C397.385 0 512 114.615 512 256V256C512 397.385 397.385 512 256 512V512C114.615 512 0 397.385 0 256V256Z" fill="black" />
                                                        <path className="wl-social-icon" d="M279.355 236.79L370.742 130.56H349.087L269.735 222.798L206.357 130.56H133.258L229.098 270.041L133.258 381.44H154.915L238.712 284.033L305.644 381.44H378.743L279.35 236.79H279.355ZM249.693 271.269L239.982 257.38L162.718 146.863H195.982L258.335 236.054L268.046 249.943L349.097 365.878H315.833L249.693 271.275V271.269Z" fill="white" />
                                                    </svg>
                                                </button>
                                                <button onClick={() => shareWishlist("whatsapp")} aria-label="Share Via WhatsApp">
                                                    <svg viewBox="0 0 512 512" fill="none">
                                                        <path className="wl-bg-social-icon" d="M0 256C0 114.615 114.615 0 256 0V0C397.385 0 512 114.615 512 256V256C512 397.385 397.385 512 256 512V512C114.615 512 0 397.385 0 256V256Z" fill="black" />
                                                        <path className="wl-social-icon" d="M320.62 283.067L320.515 283.947C294.713 271.087 292.014 269.374 288.682 274.372C286.371 277.834 279.636 285.683 277.606 288.006C275.552 290.294 273.511 290.47 270.026 288.886C266.506 287.126 255.207 283.43 241.831 271.462C231.412 262.134 224.419 250.694 222.354 247.174C218.916 241.237 226.108 240.393 232.655 228.002C233.829 225.538 233.23 223.602 232.362 221.854C231.482 220.094 224.477 202.846 221.544 195.97C218.728 189.118 215.83 189.986 213.659 189.986C206.901 189.4 201.961 189.493 197.608 194.022C178.67 214.837 183.446 236.309 199.65 259.142C231.494 300.819 248.46 308.493 279.483 319.147C287.861 321.81 295.499 321.435 301.542 320.566C308.277 319.499 322.275 312.107 325.196 303.835C328.188 295.563 328.188 288.699 327.308 287.115C326.44 285.531 324.14 284.651 320.62 283.067Z" fill="white" />
                                                        <path className="wl-social-icon" d="M355.971 155.662C265.754 68.4479 116.447 131.702 116.388 254.738C116.388 279.331 122.83 303.314 135.103 324.493L115.203 396.794L189.534 377.41C282.286 427.511 396.756 360.983 396.803 254.808C396.803 217.543 382.254 182.472 355.795 156.119L355.971 155.662ZM373.36 254.421C373.29 343.982 274.976 399.915 197.219 354.202L192.995 351.691L148.995 363.131L160.787 320.363L157.983 315.963C109.595 238.933 165.187 138.261 256.848 138.261C272.155 138.223 287.317 141.221 301.458 147.082C315.598 152.942 328.436 161.55 339.228 172.405C350.078 183.125 358.685 195.898 364.545 209.979C370.405 224.061 373.402 239.169 373.36 254.421Z" fill="white" />
                                                    </svg>
                                                </button>
                                                <button onClick={() => shareWishlist("email")} aria-label="Share Via Email">
                                                    <svg viewBox="0 0 512 512" fill="none">
                                                        <path className="wl-bg-social-icon" d="M0 256C0 114.615 114.615 0 256 0V0C397.385 0 512 114.615 512 256V256C512 397.385 397.385 512 256 512V512C114.615 512 0 397.385 0 256V256Z" fill="black" />
                                                        <path className="wl-social-icon" d="M376.268 153.4H135.728C121.614 153.4 110.078 164.885 110.078 179.05V332.95C110.078 347.121 121.621 358.6 135.728 358.6H376.268C390.382 358.6 401.918 347.115 401.918 332.95V179.05C401.918 164.882 390.377 153.4 376.268 153.4ZM372.329 170.5L262.624 280.564C259.281 283.917 252.717 283.919 249.372 280.564L139.667 170.5H372.329ZM127.178 329.807V182.194L200.745 256L127.178 329.807ZM139.667 341.5L212.817 268.112L237.262 292.636C247.279 302.686 264.721 302.682 274.735 292.636L299.18 268.112L372.329 341.5H139.667ZM384.818 329.807L311.251 256L384.818 182.194V329.807Z" fill="white" />
                                                    </svg>
                                                </button>
                                                <button onClick={() => shareWishlist("sms")} aria-label="Share Via SMS">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none">
                                                        <path fillRule="evenodd" clipRule="evenodd" d="M256 512C397.389 512 512 397.389 512 256C512 114.611 397.389 0 256 0C114.611 0 0 114.611 0 256C0 397.389 114.611 512 256 512Z" fill="black"></path>
                                                        <path fillRule="evenodd" clipRule="evenodd" d="M251.076 137.847C177.664 137.847 118.153 185.37 118.153 243.985C118.153 273.766 133.538 300.672 158.285 319.949C165.325 358.46 131.328 365.577 131.328 365.577C131.328 365.577 127.087 371.004 137.634 373.009C180.079 380.749 214.409 346.692 214.409 346.692L214.443 346.01C226.461 348.749 238.75 350.129 251.076 350.123C324.489 350.123 384 302.601 384 243.985C384 185.37 324.489 137.847 251.076 137.847Z" fill="white"></path>
                                                    </svg>
                                                </button>
                                                <button onClick={() => shareWishlist("copy")} aria-label="Copy Share Link">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
                                                        <circle cx="13.2619" cy="12.7539" r="12.5" fill="black" />
                                                        <g clipPath="url(#clip0_327_392)">
                                                            <path d="M14.5309 18.6606H10.1241C9.10631 18.6606 8.27832 17.8327 8.27832 16.8149V10.5623C8.27832 9.54449 9.10631 8.71651 10.1241 8.71651H14.5309C15.5487 8.71651 16.3767 9.54449 16.3767 10.5623V16.8149C16.3767 17.8327 15.5487 18.6606 14.5309 18.6606ZM10.1241 9.6394C9.61525 9.6394 9.20121 10.0534 9.20121 10.5623V16.8149C9.20121 17.3237 9.61525 17.7378 10.1241 17.7378H14.5309C15.0397 17.7378 15.4538 17.3237 15.4538 16.8149V10.5623C15.4538 10.0534 15.0397 9.6394 14.5309 9.6394H10.1241ZM18.2225 15.6613V8.69344C18.2225 7.67564 17.3945 6.84766 16.3767 6.84766H11.2546C10.9998 6.84766 10.7932 7.05422 10.7932 7.3091C10.7932 7.56398 10.9998 7.77055 11.2546 7.77055H16.3767C16.8855 7.77055 17.2996 8.18458 17.2996 8.69344V15.6613C17.2996 15.9161 17.5061 16.1227 17.761 16.1227C18.0159 16.1227 18.2225 15.9161 18.2225 15.6613Z" fill="white" />
                                                        </g>
                                                        <defs>
                                                            <clipPath id="clip0_327_392">
                                                                <rect width="11.813" height="11.813" fill="white" transform="translate(7.35541 6.84766)" />
                                                            </clipPath>
                                                        </defs>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentProducts.length === 0 ? (
                                <div className="th-wl-no-wishlist">
                                    <h3>{settingData.no_product}</h3>
                                </div>
                            ) : (
                                <React.Fragment>
                                    {settingData.layout_type === 1 ? (
                                        <ul className="th-wl-product-list">
                                            {currentProducts.map((product, index) => {
                                                const variant = product.variant ? JSON.parse(product.variant) : {};
                                                const variants = product.variants ? JSON.parse(product.variants) : [];
                                                const priceObj = variant ?
                                                    (variant.presentment_prices || []).find(f => f.price.currency_code === activeCurrency) ||
                                                    { price: { amount: Number(variant.price) } } :
                                                    { price: { amount: Number(variant.price) } };
                                                return (
                                                    <li key={product.id} className="th-wl-product-list-row">
                                                        <div className="th-wl-product-list-col th-wl-product">
                                                            <div className="th-wl-product-list-image">
                                                                <img
                                                                    src={product.image || `${APP_BASE_URL}assets/images/noPhoto.png`}
                                                                    alt={`Go to product page of: ${product.title} in ${variant.title}`}
                                                                />
                                                            </div>
                                                            <div className="th-wl-product-list-text">
                                                                <h4 className="th-wl-product-title">
                                                                    <a href={`/products/${product.handle}?variant=${product.variant_id}`}>
                                                                        <span dangerouslySetInnerHTML={{ __html: product.title }} />
                                                                    </a>
                                                                </h4>
                                                                <span className="th-wl-product-price" data-price={Number(priceObj.price.amount)}>
                                                                    {moneyFormat(Number(priceObj.price.amount), moneyFormatString)}
                                                                </span>
                                                                {settingData.is_variant_wishlist === 1 ? (
                                                                    variant.title !== "Default Title" && (
                                                                        <h4 className="th-wl-product-variant">
                                                                            <a href={`/products/${product.handle}?variant=${variant.id}`}>
                                                                                {variant.title}
                                                                            </a>
                                                                        </h4>
                                                                    )
                                                                ) : variants.length > 1 && variants[0].title !== "Default Title" ? (
                                                                    <select
                                                                        onChange={(e) => handleVariantChange(index, e.target.value)}
                                                                        value={variant.id}
                                                                        className="th-wl-variant-option"
                                                                    >
                                                                        {variants.map(v => (
                                                                            <option key={v.id} value={v.id}>
                                                                                {v.title}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                        <div className="th-wl-product-list-col th-wl-qty">
                                                            <div className="th-wl-quantity-box">
                                                                <button
                                                                    className="qut-btn btn-minus"
                                                                    aria-label="Reduce item quantity by one"
                                                                    onClick={() => handleQuantityChange(index, "minus")}
                                                                    disabled={product.quantity <= 1}
                                                                >
                                                                    <svg viewBox="0 0 20 20">
                                                                        <path d="M15 9H5a1 1 0 100 2h10a1 1 0 100-2z" fill="#5C5F62" />
                                                                    </svg>
                                                                </button>
                                                                <div className="qut-val">
                                                                    <label
                                                                        className="qut-val-label"
                                                                        htmlFor={`wishlist-input-${variant.sku}-${variant.title}`}
                                                                    ></label>
                                                                    <input
                                                                        id={`wishlist-input-${variant.sku}-${variant.title}`}
                                                                        type="number"
                                                                        onChange={(e) => handleQuantityChange(index, "input", e.target.value)}
                                                                        value={product.quantity}
                                                                    />
                                                                </div>
                                                                <button
                                                                    className="qut-btn btn-plus"
                                                                    aria-label="Increase item quantity by one"
                                                                    onClick={() => handleQuantityChange(index, "plus")}
                                                                >
                                                                    <svg viewBox="0 0 20 20">
                                                                        <path d="M17 9h-6V3a1 1 0 00-2 0v6H3a1 1 0 000 2h6v6a1 1 0 102 0v-6h6a1 1 0 000-2z" fill="#5C5F62" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="th-wl-product-list-col th-wl-add-cart">
                                                            <div
                                                                className={`th-wl-product-add-to-cart ${variant.available ? '' : 'th-wl-product-sold-out'}`}
                                                                onClick={variant.available ? () => addToCartProduct(variant.id, product.id, product.quantity) : null}
                                                            >
                                                                {addToCartProductLoading === product.id ? (
                                                                    <svg id="loading-spinner" width="18" height="18" viewBox="0 0 48 48">
                                                                        <g fill="none">
                                                                            <path id="track" fill="#C6CCD2" d="M24,48 C10.745166,48 0,37.254834 0,24 C0,10.745166 10.745166,0 24,0 C37.254834,0 48,10.745166 48,24 C48,37.254834 37.254834,48 24,48 Z M24,44 C35.045695,44 44,35.045695 44,24 C44,12.954305 35.045695,4 24,4 C12.954305,4 4,12.954305 4,24 C4,35.045695 12.954305,44 24,44 Z" />
                                                                            <path id="section" fill="#000000" d="M24,0 C37.254834,0 48,10.745166 48,24 L44,24 C44,12.954305 35.045695,4 24,4 L24,0 Z" />
                                                                        </g>
                                                                    </svg>
                                                                ) : variant.available ? (
                                                                    settingData.add_to_cart
                                                                ) : (
                                                                    settingData.sold_out
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="th-wl-product-list-col th-wl-remove"
                                                            onClick={() => removeProduct(product)}
                                                        >
                                                            <svg viewBox="0 0 512 512" fill="none">
                                                                <g clipPath="url(#clip0_8311_112)">
                                                                    <path className="wl-bg-icon" d="M0 256C0 114.615 114.615 0 256 0V0C397.385 0 512 114.615 512 256V256C512 397.385 397.385 512 256 512V512C114.615 512 0 397.385 0 256V256Z" fill="black" />
                                                                    <path className="wl-icon" d="M160.326 372.69C154.552 373.026 148.873 371.106 144.487 367.336C135.838 358.635 135.838 344.582 144.487 335.881L333.887 146.48C342.884 138.062 357 138.53 365.419 147.526C373.031 155.662 373.475 168.166 366.458 176.82L175.942 367.336C171.613 371.052 166.024 372.968 160.326 372.69Z" fill="white" />
                                                                    <path className="wl-icon" d="M349.503 372.69C343.651 372.665 338.043 370.342 333.887 366.221L144.487 176.82C136.473 167.462 137.563 153.379 146.92 145.364C155.273 138.212 167.59 138.212 175.942 145.364L366.458 334.765C375.452 343.185 375.917 357.303 367.496 366.297C367.161 366.655 366.815 367.001 366.458 367.336C364.149 369.343 361.453 370.854 358.537 371.775C355.62 372.696 352.545 373.008 349.503 372.69Z" fill="white" />
                                                                </g>
                                                                <defs>
                                                                    <clipPath id="clip0_8311_112">
                                                                        <rect width="512" height="512" fill="white" />
                                                                    </clipPath>
                                                                </defs>
                                                            </svg>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <div className="th-wl-product-row">
                                            {(currentProducts || []).map((x, j) => {
                                                const variant = x.variant ? JSON.parse(x.variant) : {};
                                                const variants = x.variants ? JSON.parse(x.variants) : [];
                                                const priceObj = variant ?
                                                    (variant.presentment_prices || []).find(f => f.price.currency_code === activeCurrency) ||
                                                    { price: { amount: Number(variant.price) } } :
                                                    { price: { amount: Number(variant.price) } };
                                                const priceObj_compare = variant.compare_at_price;
                                                return (
                                                    <div className="th-wl-product-col-4" key={j}>
                                                        <div className="th-wl-product-item">
                                                            <figure>
                                                                <a href={`/products/${x.handle}?variant=${variant.id}`} aria-label={`Go to product page of: ${x.title} in ${variant.title}`}>
                                                                    <img src={x && x.image ? x.image : `${apiUrlWishlist}assets/images/noPhoto.png`} alt={`Go to product page of: ${x.title} in ${variant.title}`} />
                                                                </a>
                                                                <div className="th-wl-product-remove-product" onClick={() => removeProduct(x)}>
                                                                    <svg viewBox="0 0 512 512" fill="none">
                                                                        <g clipPath="url(#clip0_8311_112)">
                                                                            <path className={"wl-bg-icon"} d="M0 256C0 114.615 114.615 0 256 0V0C397.385 0 512 114.615 512 256V256C512 397.385 397.385 512 256 512V512C114.615 512 0 397.385 0 256V256Z" fill="black" />
                                                                            <path className={"wl-icon"} d="M160.326 372.69C154.552 373.026 148.873 371.106 144.487 367.336C135.838 358.635 135.838 344.582 144.487 335.881L333.887 146.48C342.884 138.062 357 138.53 365.419 147.526C373.031 155.662 373.475 168.166 366.458 176.82L175.942 367.336C171.613 371.052 166.024 372.968 160.326 372.69Z" fill="white" />
                                                                            <path className={"wl-icon"} d="M349.503 372.69C343.651 372.665 338.043 370.342 333.887 366.221L144.487 176.82C136.473 167.462 137.563 153.379 146.92 145.364C155.273 138.212 167.59 138.212 175.942 145.364L366.458 334.765C375.452 343.185 375.917 357.303 367.496 366.297C367.161 366.655 366.815 367.001 366.458 367.336C364.149 369.343 361.453 370.854 358.537 371.775C355.62 372.696 352.545 373.008 349.503 372.69Z" fill="white" />
                                                                        </g>
                                                                        <defs>
                                                                            <clipPath id="clip0_8311_112">
                                                                                <rect width="512" height="512" fill="white" />
                                                                            </clipPath>
                                                                        </defs>
                                                                    </svg>
                                                                </div>
                                                            </figure>
                                                            <div className="th-wl-product-content">
                                                                <h4 className="th-wl-product-title">
                                                                    <a href={`/products/${x.handle}?variant=${variant.id}`}>
                                                                        <span dangerouslySetInnerHTML={{ __html: x.title }} />
                                                                    </a>
                                                                </h4>
                                                                {
                                                                    settingData.is_variant_wishlist === 1 ? variant.title === "Default Title" ? ("") : (
                                                                        <h4 className="th-wl-product-variant">
                                                                            <a href={`/products/${x.handle}?variant=${variant.id}`}>
                                                                                {variant.title}
                                                                            </a>
                                                                        </h4>
                                                                    ) : variants.length > 1 && variants[0].title !== "Default Title" ? <select onChange={(e) => handleVariantChange(j, e)} value={variant.id} className={"th-wl-variant-option"}>
                                                                        {
                                                                            variants.map((v, ind) => {
                                                                                return <option value={v.id}>{v.title}</option>
                                                                            })
                                                                        }

                                                                    </select> : ''
                                                                }

                                                                <div className="th-wl-pr-qt" style={{ alignItems: "center" }}>
                                                                    <div className='th-wl-product-price-containor'>
                                                                        <span className="th-wl-product-price" data-price={Number(priceObj.price.amount)}>
                                                                            {moneyFormat(Number(priceObj.price.amount), moneyFormatString)}
                                                                        </span>
                                                                        {priceObj_compare != null && priceObj_compare > priceObj.price.amount ? (
                                                                            <span className="th_compare_price" style={{ textDecoration: "line-through", fontSize: "12px", marginLeft: "6px" }}>{moneyFormat(Number(priceObj_compare), moneyFormatString)}</span>
                                                                        ) : null}
                                                                    </div>
                                                                    <div className="th-wl-quantity-box">
                                                                        <button className="qut-btn btn-minus" aria-label="Reduce item quantity by one" onClick={() => handleQuantityChange(j, "minus")}>
                                                                            <svg viewBox="0 0 20 20">
                                                                                <path d="M15 9H5a1 1 0 100 2h10a1 1 0 100-2z" fill="#5C5F62" />
                                                                            </svg>
                                                                        </button>
                                                                        <div className="qut-val">
                                                                            <label className="qut-val-label" htmlFor={`wishlist-input-${variant.sku}-${variant.title}`}></label>
                                                                            <input id={`wishlist-input-${variant.sku}-${variant.title}`} type="number" onChange={(e) => handleQuantityChange(j, "input", e)} value={x.quantity} />
                                                                        </div>
                                                                        <button className="qut-btn btn-plus" aria-label="Increase item quantity by one"
                                                                            onClick={() => handleQuantityChange(j, "plus")}>
                                                                            <svg viewBox="0 0 20 20">
                                                                                <path
                                                                                    d="M17 9h-6V3a1 1 0 00-2 0v6H3a1 1 0 000 2h6v6a1 1 0 102 0v-6h6a1 1 0 000-2z"
                                                                                    fill="#5C5F62" />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className={`th-wl-product-add-to-cart ${variant.available ? '' : 'th-wl-product-sold-out'}`}
                                                                onClick={variant.available ? () => addToCartProduct(variant.id, x.id, x.quantity) : ''}>
                                                                {Number(addToCartProductLoading) === Number(x.id) ? btnLoading : variant.available ? settingData.add_to_cart : settingData.sold_out}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </React.Fragment>
                            )}
                            {((wishlists[selectedTab]?.total > currentProducts.length) && (currentProducts.length > 0)) ?
                                <div className="th-wl-header-row ">
                                    <div className="th-wl-header-col">
                                        <div className="add-to-cart-all-product">
                                            <button
                                                onClick={handleLoadMore}
                                                style={{
                                                    backgroundColor: settingData.load_more_button_bg_color,
                                                    color: settingData.load_more_button_text_color,
                                                    borderColor: settingData.load_more_button_bg_color,
                                                }}
                                                className={"add-to-cart-all-product-btn"}
                                                disabled={isLoadMoreLoading}
                                            >
                                                {isLoadMoreLoading ? btnLoading : (settingData.load_more_button_text || 'Load more')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                : ""}
                            {
                                currentProducts && currentProducts.length ? (settingData.is_clear_cart === 1 && settingData.is_dispaly_add_to_cart_all === 1) ?
                                    <div className="th-wl-header-row ">
                                        <div className="th-wl-header-col">
                                            <div className={"th_wl_clear_cart_checkbox"}>
                                                <input id="th_wl_clear_cart_message" className={"th_wl_clear_cart_message"} name="clear_cart_message" type="checkbox" checked={isRemoveOldCartProduct} onChange={() => setIsRemoveOldCartProduct(!isRemoveOldCartProduct)} />
                                                <label htmlFor="th_wl_clear_cart_message">  {settingData.clear_cart_message}</label>
                                            </div>

                                        </div>
                                    </div> : "" : ""
                            }
                            {
                                currentProducts && currentProducts.length ? settingData.is_dispaly_add_to_cart_all === 1 ? <div className="th-wl-header-row ">
                                    <div className="th-wl-header-col">
                                        <div className="add-to-cart-all-product">
                                            <button onClick={addToCartProductLoading === "all" ? null : () => addToCartProduct("", "", "")} style={{ backgroundColor: settingData.all_product_add_to_cart_button_bg_color, color: settingData.all_product_add_to_cart_button_text_color, borderColor: settingData.all_product_add_to_cart_button_bg_color }} className={"add-to-cart-all-product-btn"}>{addToCartProductLoading === "all" ? btnLoading : settingData.all_product_add_to_cart_button_text}</button>
                                        </div>
                                    </div>
                                </div> : "" : ""
                            }

                        </div>
                    </React.Fragment>
                )}
            </div>
        </React.Fragment >
    );
};
export default Wishlist;