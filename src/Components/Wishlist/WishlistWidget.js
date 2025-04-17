import React, { useState, useEffect, Fragment, useCallback, lazy } from 'react';
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
import { Icons } from '../../../utils/Icons';
const WishlistClubModal = lazy(() => import("./WishlistClubModal"));

const WishlistWidget = ({ productId, variantId, type, data }) => {
  console.log("productId, variantId, type, data", productId, variantId, type, data);

  const checkData = wishlistData() || null;
  const allProductWishlist = wishlistProducts() || [];
  const { general, product, collection, language } = wcSetting;
  const settingType = type === 'product' ? product : collection;
  const [isActive, setIsActive] = useState(false);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [selectedData, setSelectedData] = useState(data || {});
  const [wishlist, setWishlist] = useState([]);
  const [isSaveLoading, setIsSaveLoading] = useState('');
  const [lastUrl, setLastUrl] = useState(location.href);
  const [selectedVarId, setSelectedVarId] = useState(variantId);

  const onOpenDropdown = useCallback(() => setIsActive((isActive) => !isActive), []);
  const onActiceModal = useCallback(() => setIsOpenModal((isOpenModal) => !isOpenModal), []);


  const onRemoveWishlistTab = async (id, index) => {
    setIsSaveLoading(id);
    const payload = { customer_id: wcCustomerId, ip: checkData.ip, shop: wcShop, wishlistid: id };
    const data = await apiService.removeWishlistTab(payload);
    if (data.status === 200) {
      const clone = [...wishlist];
      clone.splice(index, 1);
      localStorage.setItem(`wishlistClubData`, JSON.stringify({ ip: checkData.ip, wishlist: clone }));
      setWishlist(clone);
    }
    setIsSaveLoading('');
  }
  const onCheckWishList = (id) => {
    id ? onAddWishlist(id) : onCreateWishlist();
  };

  const onCreateWishlist = async () => {
    const payload = { customer_id: wcCustomerId, ip: checkData.ip, shop: wcShop, name: language.default_wishlist_title };
    const data = await apiService.createWishlist(payload);
    if (data.status === 200) {
      const clone = { ...checkData };
      clone.wishlist.push({ id: data.id, name: language.default_wishlist_title, user_id: data.user_id });
      localStorage.setItem(`wishlistClubData`, JSON.stringify(clone));
      onAddWishlist(data.id);
    }
  }
  const onAddWishlist = async (id) => {
    let wishlistClubData = JSON.parse(localStorage.getItem("wishlistClubData"))
    console.log("wishlistClubData.wishlist.length");
    if (wishlistClubData.wishlist.length <= 0) {
      const payload = { customer_id: wcCustomerId, ip: checkData.ip, shop: wcShop, name: language.default_wishlist_title };
      const data = await apiService.createWishlist(payload);
      if (data.status === 200) {
        const clone = { ...checkData };
        clone.wishlist.push({ id: data.id, name: language.default_wishlist_title, user_id: data.user_id });
        localStorage.setItem(`wishlistClubData`, JSON.stringify(clone));
        onAddWishlist(data.id);
      }
    }
    setIsSaveLoading(id);
    const payload = { customer_id: wcCustomerId, ip: checkData.ip, shop: wcShop, wishlist_id: id, product_id: productId, variant_id: variantId };
    const data = await apiService.addWishlist(payload);

    if (data.status === 200) {
      let findIndex = (allProductWishlist || []).findIndex((item) => item.shopify_product_id == productId && item.shopify_variant_id == variantId);
      const selectedCount = (selectedData.wishlistCount || 0) + 1;
      const wishlistClone = {
        ...selectedData,
        folder: [...(selectedData.folder || []), id],
        wishlisted: true,
        wishlistCount: selectedCount,
        shopify_variant_id: Number(variantId)
      };
      if (findIndex === -1) {
        allProductWishlist.push(wishlistClone);
      } else {
        allProductWishlist[findIndex] = wishlistClone;
      }
      let allUpdateWishlist = allProductWishlist.map(item => item.shopify_product_id === Number(productId) ? { ...item, wishlistCount: selectedCount } : item);
      localStorage.setItem(`wishlistClubProducts`, JSON.stringify(allUpdateWishlist));
      updateWishlistCount(data.data.total);
      showMessage(data.message, "success");
      setSelectedData(wishlistClone);
      setIsActive(general.is_same_wishlist === 0 ? false : true);
      setIsSaveLoading('');
      setIsOpenModal(false)
    }
  }
  const onRemoveWishlist = async (id, index) => {
    setIsSaveLoading(id);
    const payload = { customer_id: wcCustomerId, ip: checkData?.ip || null, shop: wcShop, wishlist_id: id, product_id: productId, variant_id: variantId };
    const data = await apiService.removeWishlist(payload);
    if (data.status === 200) {
      const findIndex = (allProductWishlist || []).findIndex((item) => item.shopify_product_id == productId && item.shopify_variant_id == variantId);
      let findClone = selectedData.folder || [];
      const folderIndex = (findClone).findIndex((x) => x == id);
      findClone.splice(folderIndex, 1);
      const selectedCount = (selectedData.wishlistCount || 0) - 1;
      const clone = {
        ...selectedData,
        folder: findClone,
        wishlisted: findClone.length ? true : false,
        wishlistCount: selectedCount,
        shopify_variant_id: Number(variantId)
      };
      allProductWishlist[findIndex] = clone;

      let allUpdateWishlist = allProductWishlist.map(item => item.shopify_product_id === Number(productId) ? { ...item, wishlistCount: selectedCount } : item);
      localStorage.setItem(`wishlistClubProducts`, JSON.stringify(allUpdateWishlist));
      updateWishlistCount(data.data.total);
      showMessage(data.message, "success");
      setSelectedData(clone);
      setIsSaveLoading('');
    }
  }

  const onChangeVariant = (oldId, newId) => {
    const wishlistBadge = document.querySelectorAll(`.th_prd_wl_btn[data-variant_id="${oldId}"]`);
    wishlistBadge.forEach((this_data) => {
      this_data.setAttribute("data-variant_id", newId);
      this_data.innerHTML = '';
    })
  }

  useEffect(() => {
    if (type === 'product') {
      const handleMutation = () => {
        const newUrl = location.href;
        if (newUrl !== lastUrl) {
          setLastUrl(newUrl);
          setTimeout(() => {
            const queryParams = new URLSearchParams(window.location.search);
            const value = queryParams.get('variant');
            onChangeVariant(selectedVarId, value);
            setSelectedVarId(value);
          }, 100);
        }
      };
      const observer = new MutationObserver(handleMutation);
      observer.observe(document, { subtree: true, childList: true });
      return () => {
        observer.disconnect();
      };
    }
  }, [lastUrl]);

  useEffect(() => {
    if (!isOpenModal) {
      setWishlist(checkData?.wishlist || []);
    }
  }, [isOpenModal, isActive])

  console.log('selectedVarId', selectedVarId);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".wc_wishlistBlock") && !event.target.closest(".wc_wishlistBox") && !event.target.closest(".wcWishlistModal")) {
        setIsActive(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, []);
  const isCheckWishlist = (general.is_same_wishlist === 0 && selectedData.wishlisted) ? true : false;
  const isCheckOpenDropdown = (general?.multiple_wishlist === 0 && !isCheckWishlist) ? 'add' : general?.is_same_wishlist === 1 ? 'drop' : general.is_same_wishlist === 0 && selectedData.wishlisted ? 'remove' : 'drop';
  return (
    <Fragment>
      {isOpenModal ?
        <WishlistClubModal
          onActiceModal={onActiceModal}
          onAddWishlist={onAddWishlist}
        /> : ''
      }
      <div onClick={() => isCheckOpenDropdown === 'add' ? onCheckWishList(wishlist[0]?.id) : isCheckOpenDropdown === 'drop' ? onOpenDropdown() : onRemoveWishlist(selectedData.folder[0])} className={`wc_wishlistBlock wc_btn_${settingType.button_position} ${selectedData?.wishlisted ? 'isActive' : ''}`}>
        <div className={`wc_wishlistTrigger`}>
          <span className='wc_wishlistIcon' dangerouslySetInnerHTML={{ __html: general.icon }}></span>
          {settingType?.button_type === '3' ? <span className='wc_wishlistText'>{selectedData?.wishlisted ? settingType?.button_text_after : settingType?.button_text_before}</span> : ''}
          {settingType?.total_count === 1 ? <span className='wc_wishlistCount'>({selectedData?.wishlistCount || '0'})</span> : ''}
          {settingType?.button_type === '3' && ((isCheckOpenDropdown === 'remove' && isSaveLoading === selectedData.folder[0]) || (isCheckOpenDropdown === 'add' && isSaveLoading === wishlist[0]?.id)) ? Icons.loadingIcon : ''}
        </div>
        {(general?.multiple_wishlist === 1 && !isCheckWishlist) ? <div className={`wc_wishlistDropdown ${isActive ? 'isOpen' : ''}`}>{Icons.DownIcon}</div> : ''}
      </div>
      {
        isActive ?
          <div className="wc_wishlistBox">
            <ul className="wc_wishlistView">
              {
                wishlist?.length ? <Fragment>
                  {
                    (wishlist || []).map((item, index) => {
                      const isCheckbox = (selectedData?.folder || []).find((x) => x == item.id)
                      return (
                        <li className="wc_wishlistOption" key={`wishlist_${productId}_${index}`}>
                          <div className="wc_wishlistContent" onClick={isCheckbox ? () => onRemoveWishlist(item.id) : () => onCheckWishList(item.id)}>
                            {general.is_same_wishlist === 1 ? <input checked={isCheckbox ? true : false} onChange={() => { }} type="checkbox" className="wc_wishlistCheckbox" value={item.id} /> : ''}
                            {item.name}{isSaveLoading == item.id ? Icons.loadingIcon : ''}
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
                <div className="wc_wishlistContent" onClick={onActiceModal}>{Icons.plusIcon} {language.wishlist_dropdown_text}</div>
              </li>
            </ul></div>
          : ''
      }
    </Fragment>
  )
}
export default WishlistWidget;