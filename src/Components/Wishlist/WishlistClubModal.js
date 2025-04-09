import React, { useState, Fragment, useEffect } from "react";
import ReactDOM from "react-dom";
import { apiService, wcSetting, wcCustomerId, wishlistData, wcShop } from "../../../utils/constent";
import { Icons } from "../../../utils/Icons";

const WishlistClubModal = ({ ToggleWLModal, onAddWishlist, backinstock, ProductId, stockoutProduct }) => {
  const checkData = wishlistData() || {};
  const { wishlist_model } = wcSetting;
  const [wishlistText, setWishlistText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(stockoutProduct?.[0]?.variant_id || "");
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);
  const onChangeText = (e) => {
    setWishlistText(e.target.value);
    if (message) setMessage("");
  };
  const handleSubmit = async () => {
    if (!wishlistText) {
      setMessage(backinstock.subscription_form.email_validation_message);
      setMessageType("error");
      return;
    }
    if (!isValidEmail(wishlistText)) {
      setMessage(backinstock.subscription_form.email_validation_message);
      setMessageType("error");
      return;
    }
    const payload = {
      shop: window.location.hostname,
      product_id: ProductId,
      variant_id: selectedVariant,
      email: wishlistText,
    };
    setIsLoading(true);
    try {
      const data = await apiService.getbaclInstock(payload);
      setMessageType(data.status === 200 ? "success" : "error");
      setMessage(data.status === 200 ? backinstock.subscription_message.success_message : data.message);
      if (data.status === 200) {
        setTimeout(ToggleWLModal, 1500);
      }
    } catch (error) {
      setMessage("Something went wrong. Please try again.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };
  const onCreateWishlist = async () => {
    if (!wishlistText) {
      setMessage(backinstock.subscription_form.email_validation_message);
      setMessageType("error");
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        customer_id: wcCustomerId,
        ip: checkData.ip,
        shop: wcShop,
        name: wishlistText,
      };
      const data = await apiService.createWishlist(payload);
      if (data.status === 200) {
        checkData.wishlist.push({ id: data.id, name: wishlistText, user_id: data.user_id });
        onAddWishlist(data.id);
        localStorage.setItem("wishlistClubData", JSON.stringify(checkData));
        setMessageType("success");
        ToggleWLModal()
      } else {
        setMessage(data.message || "Failed to create wishlist.");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Something went wrong. Please try again.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };
  return ReactDOM.createPortal(
    <Fragment>
      <div className="wcWishlistModal">
        <div className="wcWishlistModal_header">
          <h5 className="ModalTitle">{wishlist_model.title}</h5>
          <button onClick={ToggleWLModal} className="wcWishlistModal_close">{Icons.closeIcon}</button>
        </div>
        <div className="wcWishlistModal_body">
          <div className="wcWishlistCreate" style={{ marginBottom: 13 }}>
            <label className="wcLabelColor" ToggleWLModal>
              {wishlist_model.label}
            </label>
            <input
              type={backinstock ? "email" : "text"}
              placeholder={wishlist_model.placeholder}
              value={wishlistText}
              onChange={onChangeText}
            />
            {message && (
              <div
                className="wcErrorMessage"
                style={{
                  color: messageType === "error" ? "red" : messageType === "success" ? "green" : "#ffcc00",
                }}
              >
                {message}
              </div>
            )}
          </div>
          {backinstock && (
            <div className="wcWishlistCreate">
              <select
                value={selectedVariant}
                className=""
                onChange={(e) => setSelectedVariant(e.target.value)}
              >
                {stockoutProduct.map((el, i) => (
                  <option value={el.variant_id} key={i}>{el.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="wcWishlistModal_footer">
          <button
            onClick={ToggleWLModal}
            style={{
              backgroundColor: wishlist_model.cancel_button_bg_colour,
              color: wishlist_model.cancel_button_text_colour,
              cursor: "pointer",
            }}
          >
            {wishlist_model.cancel_button}
          </button>
          <button
            className="wcBackInStockSubmitButton"
            onClick={backinstock ? handleSubmit : onCreateWishlist}
            disabled={isLoading}
            style={{
              backgroundColor: wishlist_model.create_button_bg_colour,
              color: wishlist_model.create_button_text_colour,
              cursor: isLoading ? "not-allowed" : "pointer",

            }}
          >
            {wishlist_model.create_button}
            {isLoading && <span>{Icons.loadingIcon}</span>}
          </button>
        </div>
      </div>
      <div className="wcWishlistModalOverlay" />
    </Fragment>,
    document.body
  );
};

export default WishlistClubModal;
