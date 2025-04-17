import React, { useState, useEffect, Fragment, useCallback } from 'react';
import {
  apiService,
  wcSetting,
  wcCustomerId,
  wishlistData,
  wcShop,
  wishlistProducts,
  updateWishlistCount,
  showMessage
} from "../../../utils/constent";
import { Icons } from "../../../utils/Icons";
import { wlProductVariantChange } from '../../index';
import WishlistClubModal from "./WishlistClubModal";

const WishlistWidget = ({ ProductId, VariantId, type, data, cachedProductData }) => {
  const checkData = wishlistData() || null;
  const allProductWishlist = wishlistProducts() || [];
  const { general, product, collection, language } = wcSetting;
  const settingType = type === 'product' ? product : collection;
  const [isActive, setIsActive] = useState(false);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [selectedData, setSelectedData] = useState({});
  const [wishlist, setWishlist] = useState([]);
  const [isSaveLoading, setIsSaveLoading] = useState('');
  // eslint-disable-next-line no-restricted-globals
  const [lastUrl, setLastUrl] = useState(location && location.href);
  const [selectedVarId, setSelectedVarId] = useState(VariantId);
  const onOpenDropdown = useCallback(() => setIsActive((isActive) => !isActive), []);
  const toggleWishlistModal = useCallback(() => setIsOpenModal((isOpenModal) => !isOpenModal), []);
  const AppEnable = general?.app_enable
  const WishlistVariant = general?.is_variant_wishlist

  const onRemoveWishlistTab = async (id, index) => {
    setIsSaveLoading(id);
    const payload = { customer_id: wcCustomerId, ip: checkData.ip, shop: wcShop, wishlistid: id };
    const data = await apiService.removeWishlistTab(payload);
    if (data.status === 200) {
      const clone = [...wishlist];
      clone.splice(index, 1);
      localStorage.setItem(`wishlistClubData`, JSON.stringify({ ip: checkData.ip, wishlist: clone }));
      let findIndex = (allProductWishlist || []).findIndex((item) => Number(item.shopify_product_id) === Number(ProductId) && Number(item.shopify_variant_id) === Number(VariantId));
      const selectedCount = (selectedData?.wishlistCount - 1 <= 0 ? 0 : selectedData?.wishlistCount - 1);
      const wishlistClone = {
        ...selectedData,
        folder: [...(selectedData?.folder || []), id],
        wishlisted: !true,
        wishlistCount: selectedCount,
        shopify_variant_id: Number(VariantId)
      };
      if (findIndex === -1) {
        allProductWishlist.push(wishlistClone);
      } else {
        allProductWishlist[findIndex] = wishlistClone;
      }
      let allUpdateWishlist = allProductWishlist.map(item => item.shopify_product_id === Number(ProductId) ? { ...item, wishlistCount: selectedCount } : item);
      localStorage.setItem(`wishlistClubProducts`, JSON.stringify(allUpdateWishlist));
      updateWishlistCount(data.data.total);
      showMessage(data.message, "success");
      setSelectedData(wishlistClone);
      setIsActive(general.is_same_wishlist === 0 ? false : true);
      setWishlist(clone);
    }
    setIsSaveLoading('');
  }
  const onCheckWishList = (id, event) => {
    id ? onAddWishlist(id, event) : onCreateWishlist();
  };

  const onCreateWishlist = async () => {
    const payload = { customer_id: wcCustomerId, ip: checkData.ip, shop: wcShop, name: language.default_wishlist_title };
    console.log("getWishlists", payload);
    const data = await apiService.createWishlist(payload);
    if (data.status === 200) {
      const clone = { ...checkData };
      clone.wishlist.push({ id: data.id, name: language.default_wishlist_title, user_id: data.user_id });
      localStorage.setItem(`wishlistClubData`, JSON.stringify(clone));
      onAddWishlist(data.id);
      showMessage(data.message, "success");
    }
  }
  const updateLocalStorage = (wishlist) => {
    localStorage.setItem("wishlistClubProducts", JSON.stringify(wishlist));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".wc_wishlistBlock, .wc_wishlistBox, .wcWishlistModal")) {
        setIsActive(false);
      }
    };
    let wishlistData = JSON.parse(localStorage.getItem("wishlistClubProducts")) || [];
    if (wishlistData.length > 0) {
      let highestWishlistItem = wishlistData.reduce((max, item) =>
        item.wishlistCount > max.wishlistCount ? item : max
      );
      let selectedData = wishlistData.find((el) => Number(el.shopify_variant_id) === Number(VariantId)) || null;
      setSelectedData(selectedData);
      if (!selectedData) {
        const productVariants = cachedProductData?.filter(item => Number(item.product_id) === Number(ProductId));
        const wishlistCount = highestWishlistItem?.wishlistCount || 0;
        const newWishlistItems = productVariants?.map((variant) => {
          if (wishlistData.length === 0) return null;
          if (Number(WishlistVariant) !== 0 && Number(wishlistData[0].shopify_variant_id) !== Number(variant.variant_id)) {
            return {
              shopify_product_id: ProductId,
              shopify_variant_id: variant.variant_id,
              wishlistCount,
              folder: WishlistVariant !== 1 ? highestWishlistItem.folder : [],
              wishlisted: WishlistVariant !== 1 ? highestWishlistItem.folder.length > 0 : false,
            };
          }
          if (Number(WishlistVariant) !== 1 && Number(wishlistData[0].shopify_product_id) !== Number(variant.product_id)) {
            return {
              shopify_product_id: ProductId,
              wishlistCount,
              folder: highestWishlistItem.folder,
              wishlisted: highestWishlistItem.folder.length > 0,
            };
          }
          return null;
        })?.filter(Boolean) || [];
        wishlistData = [...wishlistData, ...newWishlistItems];
        if (type !== "collection") {
          let selectedData = Number(WishlistVariant) !== 1 ? wishlistData.find((el) => Number(el.shopify_product_id) === Number(ProductId)) : wishlistData.find((el) => Number(el.shopify_variant_id) === Number(selectedVarId)) || null;
          setSelectedData(selectedData);
          localStorage.setItem("wishlistClubProducts", JSON.stringify(wishlistData));
        } else {
          let selectedData = wishlistData.find((el) => Number(el.shopify_product_id) === Number(ProductId)) || null;
          setSelectedData(selectedData);
        }
      }
      window.addEventListener("click", handleClickOutside);
      return () => window.removeEventListener("click", handleClickOutside);
    }
  }, [cachedProductData, data, WishlistVariant, ProductId, selectedVarId, type, VariantId]);

  useEffect(() => {
    const handleMutation = () => {
      // eslint-disable-next-line no-restricted-globals
      const newUrl = location.href;
      if (newUrl !== lastUrl) {
        setLastUrl(newUrl);
        const queryParams = new URLSearchParams(window.location.search);
        const value = queryParams.get('variant');
        console.log("Wishliat_value============>>", value);

        wlProductVariantChange(selectedVarId, value);
        setSelectedVarId(value);
      }
    };
    const observer = new MutationObserver(handleMutation);
    observer.observe(document, { subtree: true, childList: true });
    return () => {
      observer.disconnect();
    };
  }, [lastUrl, selectedVarId, type]);

  useEffect(() => {
    if (!isOpenModal) {
      setWishlist(checkData?.wishlist || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpenModal, isActive])
  const handleWishlistUpdate = async (id, isAdding) => {

    setIsSaveLoading(id);
    const payload = {
      customer_id: wcCustomerId,
      ip: checkData.ip
        || null,
      shop: wcShop,
      wishlist_id: id,
      product_id: ProductId,
      variant_id: selectedVarId,
    };
    const data = isAdding ? await apiService.addWishlist(payload) : await apiService.removeWishlist(payload);
    if (data.status === 200) {
      let updatedWishlist = [...allProductWishlist];
      let findItem = Number(WishlistVariant) !== 1 ? updatedWishlist.find((el) => Number(el.shopify_product_id) === Number(ProductId)) : updatedWishlist.find((el) => Number(el.shopify_variant_id) === Number(selectedVarId)) || null;
      if (isAdding) {
        const wishlistCount = updatedWishlist[0]?.wishlistCount || 0 + 1;
        if (!findItem) {
          updatedWishlist.push({
            wishlisted: true,
            wishlistCount,
            shopify_product_id: ProductId,
            shopify_variant_id: selectedVarId,
            folder: [id],
          });
        } else {
          updatedWishlist = updatedWishlist.map(item => ({
            ...item,
            wishlistCount: item.wishlistCount + 1,
            wishlisted: Number(WishlistVariant) !== 0 ?
              Number(item.shopify_variant_id) === Number(selectedVarId) ? true : !true :
              Number(item.shopify_product_id) === Number(ProductId) ? true : !true,
            folder: Number(WishlistVariant) !== 0 ?
              Number(item.shopify_variant_id) === Number(selectedVarId) ? [...new Set([...item.folder, id])] : item.folder :
              Number(item.shopify_product_id) === Number(ProductId) ? [...new Set([...item.folder, id])] : item.folder,
          }));
        }
      } else {
        if (!findItem && findItem.folder.length > 1) {
          updatedWishlist = updatedWishlist.map(item => ({
            ...item,
            wishlistCount: item.wishlistCount - 1,
            folder: Number(WishlistVariant) !== 0 ?
              Number(item.shopify_variant_id) === Number(selectedVarId) ? item.folder?.filter(folderId => folderId !== id) : item.folder :
              Number(item.shopify_product_id) === Number(ProductId) ? item.folder?.filter(folderId => folderId !== id) : item.folder,
            wishlisted: Number(WishlistVariant) !== 0 ?
              Number(item.shopify_variant_id) === Number(selectedVarId) ? item.folder.length > 1 : item.folder.length > 0 :
              Number(item.shopify_product_id) === Number(ProductId) ? item.folder.length > 1 : item.folder.length > 0,
          }));
        } else {
          updatedWishlist = updatedWishlist.map(item => ({
            ...item,
            wishlistCount: item.wishlistCount - 1,
            wishlisted: Number(WishlistVariant) !== 0 ?
              Number(item.shopify_variant_id) === Number(selectedVarId) ? item.folder.length > 1 : item.folder.length > 0 :
              Number(item.shopify_product_id) === Number(ProductId) ? item.folder.length > 1 : item.folder.length > 0,
            folder: Number(WishlistVariant) !== 0 ?
              Number(item.shopify_variant_id) === Number(selectedVarId) ? item.folder?.filter(folderId => Number(folderId) !== Number(id)) : item.folder :
              Number(item.shopify_product_id) === Number(ProductId) ? item.folder?.filter(folderId => Number(folderId) !== Number(id)) : item.folder,
          }));
        }
      }
      let message = JSON.parse(localStorage.getItem("wishlistClubData"))['setting'][isAdding ? 'product_add_to_wishlist' : 'product_remove_wishlist']
      setSelectedData(Number(WishlistVariant) !== 1 ? updatedWishlist.find((el) => Number(el.shopify_product_id) === Number(ProductId)) : updatedWishlist.find((el) => Number(el.shopify_variant_id) === Number(selectedVarId)) || {});
      updateLocalStorage(updatedWishlist);
      showMessage(message, "success");
      updateWishlistCount(data.data.total);
      setIsActive(Number(general?.is_same_wishlist) === 0 ? false : true);
    } else {
      localStorage.clear();
      setTimeout(() => window.location.href = `https://${window.location.hostname}/account/login`, 1000);
    }
    setIsSaveLoading('');
  };
  const onAddWishlist = (id, event) => {
    var wc_return = 0;
    const container = document.querySelector(`[data-wishlist_id="${ProductId}"]`);
    console.log("~~~~~~~~~~~~~~~~container&event~~~~~~~~~~~~~~~~~", container, event);
    const isCheckOpenDropdown = (Number(general?.multiple_wishlist) === 0 && !isCheckWishlist) ? 'add' : Number(general?.is_same_wishlist) === 1 ? 'drop' : Number(general.is_same_wishlist) === 0 && selectedData?.wishlisted ? 'remove' : 'drop';
    if (isCheckOpenDropdown === "add") {
      console.log("~~~~~~~~~~~~~~~~~wc_wishlist_addToWishlist~~~~~~~~~~~~~~~~~~~~");
      if (typeof $wc_wishlist_addToWishlist == 'function') {
        wc_return = window.$wc_wishlist_addToWishlist(container, event);
      }
      if (wc_return) {
        return;
      }
    }
    if (isCheckOpenDropdown !== "add") {
      console.log("~~~~~~~~~~~~wc_wishlist_button_clickedtoaddItem~~~~~~~~~~~~~~");
      if (typeof $wc_wishlist_additemwishlisted == 'function') {
        wc_return = window.$wc_wishlist_additemwishlisted(container, event);
      }
      if (wc_return) {
        return;
      }
    }
    handleWishlistUpdate(id, true);
  }
  const onRemoveWishlist = (id) => handleWishlistUpdate(id, false);

  const modifySVGColor = (svgString, fillColor = "red", fillStoke = "red") => {
    return svgString
      .replace(/fill="[^"]*"/g, `fill="${fillColor}"`)
      .replace(/stroke="[^"]*"/g, `stroke="${fillStoke}"`)
  };
  const updatedIcon = modifySVGColor(general.icon, selectedData?.wishlisted ? settingType?.button_color_after : "none", selectedData?.wishlisted ? settingType?.button_color_after : settingType?.button_color_before);
  const isCheckWishlist = (Number(general.is_same_wishlist) === 0 && selectedData?.wishlisted) ? true : false;
  const isCheckOpenDropdown = (Number(general?.multiple_wishlist) === 0 && !isCheckWishlist) ? 'add' : Number(general?.is_same_wishlist) === 1 ? 'drop' : Number(general.is_same_wishlist) === 0 && selectedData?.wishlisted ? 'remove' : 'drop';
  if (AppEnable === 1) {
    return (
      <Fragment>
        {isOpenModal ?
          <WishlistClubModal
            ToggleWLModal={toggleWishlistModal}
            onAddWishlist={onAddWishlist}
          /> : ''
        }
        <div data-wishlist_id={ProductId} onClick={(event) => isCheckOpenDropdown === 'add' ? onCheckWishList(wishlist[0]?.id, event) : isCheckOpenDropdown === 'drop' ? onOpenDropdown() : onRemoveWishlist(selectedData?.folder[0], event)} className={`wc_wishlistBlock wc_btn_${settingType.button_position} 
        ${selectedData?.wishlisted ? 'isActive' : ''}`}>
          <div className={`wc_wishlistTrigger`}>
            <span className="wc_wishlistIcon" dangerouslySetInnerHTML={{ __html: updatedIcon }} />
            {Number(settingType?.button_type) === 3 ? <span className='wc_wishlistText'>{selectedData?.wishlisted ? settingType?.button_text_after : settingType?.button_text_before}</span> : ''}
            {Number(settingType?.total_count) === 1 ? <span className='wc_wishlistCount'>({selectedData?.wishlistCount || '0'})</span> : ''}
            {Number(settingType?.button_type) === 3 && ((isCheckOpenDropdown === 'remove' && isSaveLoading === selectedData?.folder[0]) || (isCheckOpenDropdown === 'add' && isSaveLoading === wishlist[0]?.id)) ? Icons.loadingIcon : ''}
          </div>
          {(Number(general?.multiple_wishlist) === 1 && !isCheckWishlist) ? <div className={`wc_wishlistDropdown ${isActive ? 'isOpen' : ''}`}>{Icons.DownIcon}</div> : ''}
        </div>
        {
          isActive ?
            <div className="wc_wishlistBox">
              <ul className="wc_wishlistView">
                {
                  wishlist?.length ? <Fragment>
                    {
                      (wishlist || []).map((item, index) => {
                        let isCheckbox
                        if (Number(WishlistVariant) !== 1) {
                          isCheckbox = (selectedData?.folder || []).find((x) => Number(x) === Number(item.id))
                        } else {
                          isCheckbox = (selectedData?.folder || []).find((x) => Number(x) === Number(item.id));
                        }
                        return (
                          <li className="wc_wishlistOption" key={`wishlist_${ProductId}_${index}`}>
                            <div className="wc_wishlistContent" onClick={isCheckbox ? () => onRemoveWishlist(item.id) : () => onCheckWishList(item.id)}>
                              {Number(general.is_same_wishlist) === 1 ? <input checked={isCheckbox ? true : false} onChange={() => { }} type="checkbox" className="wc_wishlistCheckbox" value={item.id} /> : ''}
                              {item.name}{Number(isSaveLoading) === Number(item.id) ? Icons.loadingIcon : ''}
                              <div className="wc_wishlistRemonve" onClick={(value) => {
                                value.stopPropagation();
                                onRemoveWishlistTab(item.id, index)
                              }
                              }>{Icons.deleteIcon}</div>
                            </div>
                          </li>
                        )
                      })
                    }
                  </Fragment> : <li className="wc_wishlistOption">
                    <div className="wc_wishlistContent">No found</div>
                  </li>
                }
                <li className="wc_wishlistOption">
                  <div className="wc_wishlistContent" onClick={toggleWishlistModal}>{Icons.plusIcon} {JSON.parse(localStorage.getItem("wishlistClubData"))['setting']['wishlist_dropdown_text']}</div>
                </li>
              </ul></div>
            : ''
        }
      </Fragment>
    )
  }
}
export default WishlistWidget;