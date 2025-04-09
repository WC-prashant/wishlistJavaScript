import React, { useState, Fragment, useEffect } from "react";
import ReactDOM from "react-dom";
import { apiService, showMessage } from "../../../utils/constent";
import { Icons } from "../../../utils/Icons";

const BackInStockModal = ({ ToggleBISModal, BackInStock, ProductId, StockOutProduct }) => {
  const [wishlistText, setWishlistText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(StockOutProduct?.[0]?.variant_id || "");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const onChangeText = (e) => {
    setWishlistText(e.target.value);
    if (message) setMessage("");
  };

  const handleSubmit = async () => {
    if (!wishlistText) {
      setMessage(BackInStock.subscription_form.email_validation_message);
      setMessageType("error");
      return;
    }
    if (!isValidEmail(wishlistText)) {
      setMessage(BackInStock.subscription_form.email_validation_message);
      setMessageType("error");
      return;
    }

    const payload = {
      shop: window.location.hostname,
      product_id: StockOutProduct?.[0]['product_id'],
      variant_id: selectedVariant,
      email: wishlistText,
    };

    setIsLoading(true);
    try {
      const data = await apiService.getbaclInstock(payload);

      showMessage(
        data.status === 200 ? BackInStock.subscription_message.success_message : data.message,
        data.status === 200 ? "custom" : "custom",
        5000,
        BackInStock.subscription_message
      );
      ToggleBISModal()
    } catch (error) {
      showMessage("Something went wrong. Please try again.", "error")
    } finally {
      setIsLoading(false);
    }
  };
  return ReactDOM.createPortal(
    <Fragment>
      <div className="wcWishlistModal">
        <div className="wcWishlistModal_header">
          <h5 className="ModalTitle">{BackInStock.subscription_form.title}</h5>
          <button onClick={ToggleBISModal} className="wcWishlistModal_close">{Icons.closeIcon}</button>
        </div>
        <div className="wcWishlistModal_body">
          <div className="wcWishlistCreate" style={{ marginBottom: 13 }}>
            <label className="wclabelcolor" ToggleBISModal>
              {BackInStock.subscription_form.email_lable}
            </label>
            <input
              type={BackInStock ? "email" : "text"}
              placeholder={BackInStock.subscription_form.email_placeholder}
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


          {BackInStock && (
            <div className="wcWishlistCreate">
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
              >
                {StockOutProduct.map((el, i) => (
                  <option value={el.variant_id} key={i}>{el.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="wcWishlistSubmitButton"
            style={{
              backgroundColor: BackInStock.subscription_form.background_color,
              color: BackInStock.subscription_form.text_color,
              padding: `${BackInStock.subscription_form.button_top_bottom_padding}px ${BackInStock.subscription_form.button_left_right_padding}px`,
              borderRadius: `${BackInStock.subscription_form.border_radius}px`,
              border: `${BackInStock.subscription_form.border_size}px solid ${BackInStock.subscription_form.border_color}`,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {BackInStock.subscription_form.submit_button_text}
            {isLoading && <span>{Icons.loadingIcon}</span>}
          </button>
        </div>
      </div>
      <div className="wcWishlistModalOverlay" />
    </Fragment >,
    document.body
  );
};

export default BackInStockModal;
