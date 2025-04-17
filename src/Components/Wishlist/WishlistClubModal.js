import React, { useState, Fragment } from 'react';
import { apiService, wcSetting, wcCustomerId, wishlistData, wcShop, updateWishlistCount } from "../../../utils/constent";
import { Icons } from "../../../utils/Icons";
import ReactDOM from "react-dom";

const WishlistClubModal = ({ onActiceModal, onAddWishlist }) => {
  const checkData = wishlistData() || null;
  const { wishlist_model } = wcSetting;
  const [wishlistText, setWishlistText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onChangeText = (e) => {
    setWishlistText(e.target.value);
  };
  const onCreateWishlist = async () => {
    setIsLoading(true);
    const payload = { customer_id: wcCustomerId, ip: checkData.ip, shop: wcShop, name: wishlistText };
    const data = await apiService.createWishlist(payload);
    if (data.status === 200) {
      const clone = { ...checkData };
      clone.wishlist.push({ id: data.id, name: wishlistText, user_id: data.user_id });
      onAddWishlist(data.id);
      localStorage.setItem(`wishlistClubData`, JSON.stringify(clone));
    }
  }


  return ReactDOM.createPortal(
    <Fragment>
      <div className="wcWishlistModal">
        <div className="wcWishlistModal_header">
          <h3>{wishlist_model.title}</h3>
          <button onClick={onActiceModal} className="wcWishlistModal_close">
            {Icons.closeIcon}
          </button>
        </div>
        <div className="wcWishlistModal_body">
          <div className={"wcWishlistCreate"}>
            <label>{wishlist_model.label}</label>
            <input type="text" placeholder={wishlist_model.placeholder} value={wishlistText} onChange={onChangeText} />
            <small>{wishlist_model.description}</small>
          </div>
        </div>
        <div className="wcWishlistModal_footer">
          <button onClick={onActiceModal} style={{ backgroundColor: wishlist_model.cancel_button_bg_colour, color: wishlist_model.cancel_button_text_colour }}>{wishlist_model.cancel_button}</button>
          <button onClick={onCreateWishlist} style={{ backgroundColor: wishlist_model.create_button_bg_colour, color: wishlist_model.create_button_text_colour }}>{wishlist_model.create_button}
            {isLoading ? <span>{Icons.loadingIcon}</span> : ''}
          </button>
        </div>
      </div><div className="wcWishlistModalOverlay" /></Fragment>,
    document.body
  );
}
export default WishlistClubModal;