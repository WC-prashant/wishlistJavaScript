async function wcWishlistButtonProcess(selector, type, variantId) {
    console.groupCollapsed(`[WC Wishlist] Processing ${type} buttons`);
    console.log('Initial check - Selector:', selector, 'Type:', type, 'Variant ID:', variantId);

    if (Number(wcSetting?.general?.app_enable) !== 1) {
        console.warn('[WC Wishlist] App is disabled in settings');
        console.groupEnd();
        return;
    }

    // Safely handle null/undefined from querySelectorAll
    const elements = document.querySelectorAll(selector);
    const wishlistItems = elements ? [...elements].filter(el => !el.querySelector(".wc_wishlistBlock")) : [];

    console.log('Found elements:', wishlistItems.length, 'matching selector');
    if (!wishlistItems.length) {
        console.log('[WC Wishlist] No valid elements found');
        console.groupEnd();
        return;
    }

    // Safely extract product IDs with null checks
    const productIds = wishlistItems
        .map(el => el.getAttribute("data-product_id"))
        .filter(Boolean);

    const uniqueProductIds = [...new Set(productIds)] || [];
    console.log('Unique product IDs:', uniqueProductIds);

    if (!uniqueProductIds.length) {
        console.warn('[WC Wishlist] No product IDs found in elements');
        console.groupEnd();
        return;
    }

    if (typeof wc_wishlistProductIds === "undefined") {
        console.error('[WC Wishlist] Critical: wc_wishlistProductIds is not defined');
        console.groupEnd();
        return;
    }

    // Rest of your function remains the same...
    console.log('[WC Wishlist] Rendering initial loading state');
    wishlistItems.forEach((el) => {
        if (!roots.has(el)) {
            console.log('Creating root for element:', el);
            const root = createRoot(el);
            roots.set(el, root);
            const pId = el.getAttribute("data-product_id") || "";
            const vId = variantId ?? el.getAttribute("data-variant_id");

            root.render(
                type === "backinstock"
                    ? <Backinstock ProductId={pId} VariantId={vId} type={type} data={null} loading={true} />
                    : <WishlistWidget ProductId={pId} VariantId={vId} type={type} data={null} cachedProductData={null} loading={true} />
            );
        } else {
            console.log('Reusing existing root for element:', el);
        }
    });

    try {
        if (type === "backinstock") {
            console.log('[WC Wishlist] Checking back in stock data needs');
            if (!cachedProductData) {
                if (window.isFetchingBackInStockData) {
                    console.log('[WC Wishlist] Back in stock data fetch already in progress');
                } else {
                    console.log('[WC Wishlist] Fetching back in stock data for products:', uniqueProductIds);
                    window.isFetchingBackInStockData = true;
                    try {
                        cachedProductData = await wcGetBackInStockData(uniqueProductIds);
                        console.log('[WC Wishlist] Back in stock data received:', cachedProductData);
                    } catch (err) {
                        console.error('[WC Wishlist] Error fetching back in stock data:', err);
                    } finally {
                        window.isFetchingBackInStockData = false;
                    }
                }
            } else {
                console.log('[WC Wishlist] Using cached back in stock data');
            }
        }
        if (type !== "backinstock") {
            console.log('[WC Wishlist] Checking wishlist data needs');
            if (!cachedWishlistProductsData) {
                if (window.isFetchingWishlistData) {
                    console.log('[WC Wishlist] Wishlist data fetch already in progress');
                } else {
                    console.log('[WC Wishlist] Fetching wishlist data for products:', uniqueProductIds);
                    window.isFetchingWishlistData = true;
                    try {
                        cachedWishlistProductsData = await wcGetWishlistProducts(uniqueProductIds);
                        console.log('[WC Wishlist] Wishlist data received:', cachedWishlistProductsData);
                    } catch (err) {
                        console.error('[WC Wishlist] Error fetching wishlist products:', err);
                    } finally {
                        window.isFetchingWishlistData = false;
                    }
                }
            } else {
                console.log('[WC Wishlist] Using cached wishlist data');
            }
        }
        console.log('[WC Wishlist] Updating buttons with final data');
        wishlistItems.forEach((el) => {
            const pId = el.getAttribute("data-product_id") || "";
            const vId = variantId ?? el.getAttribute("data-variant_id");

            console.log(`Processing element - Product: ${pId}, Variant: ${vId}`);

            let findWishlist = null;
            let backInStockData = null;

            if (type === "backinstock") {
                backInStockData = cachedProductData?.products?.find(
                    product => String(product.product_id) === String(pId)
                );
                console.log('Back in stock data for product:', backInStockData);
            } else {
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
                console.log('Wishlist data for product:', findWishlist);
            }
            roots.get(el)?.render(
                type === "backinstock"
                    ? <Backinstock ProductId={pId} VariantId={vId} type={type} data={cachedProductData || null} loading={false} />
                    : <WishlistWidget ProductId={pId} VariantId={vId} type={type} data={findWishlist ?? null} cachedProductData={cachedProductData || null} loading={false} />
            );

            if (!wc_wishlistProductIds.includes(pId)) {
                wc_wishlistProductIds.push(pId);
                console.log('Added product ID to tracking:', pId);
            }
        });

    } catch (error) {
        console.error('[WC Wishlist] Critical processing error:', error);
        window.isFetchingBackInStockData = false;
        window.isFetchingWishlistData = false;

        wishlistItems.forEach((el) => {
            const pId = el.getAttribute("data-product_id") || "";
            const vId = variantId ?? el.getAttribute("data-variant_id");

            console.log('Rendering error state for product:', pId);
            roots.get(el)?.render(
                type === "backinstock"
                    ? <Backinstock ProductId={pId} VariantId={vId} type={type} data={null} error={true} />
                    : <WishlistWidget ProductId={pId} VariantId={vId} type={type} data={null} error={true} />
            );
        });
    } finally {
        console.log('[WC Wishlist] Process completed');
        console.groupEnd();
    }
}