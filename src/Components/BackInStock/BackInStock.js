import React, { useState, useCallback } from "react";
import BackInStockModal from "./BackInStockModal";

const BackInStock = ({ ProductId, VariantId, data }) => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const toggleBackInStock = useCallback(() => setIsOpenModal((prev) => !prev), []);
  if (!data?.bis) return null;
  const { product_page_widget, home_page_widget, collection_page_widget } = data.bis;

  let ActiveObject = window.location.pathname === "/"
    ? home_page_widget
    : window.location.pathname.split("/")[1] === "collections" ? collection_page_widget : product_page_widget;

  const StockOutProduct = data?.products?.filter(
    (product) =>
      product.inventoryQuantity <= 0
  );
  const StockOutVariantProduct = data?.products?.filter(
    (product) =>
      product.inventoryQuantity <= 0 &&
      product.variant_id === VariantId
  );

  if (!StockOutVariantProduct || StockOutVariantProduct.length <= 0) return null;
  return (
    <div>
      <button
        className="wcBackInStockButton"
        style={{
          backgroundColor: ActiveObject?.bg_color,
          color: ActiveObject?.text_color,
          borderRadius: `${ActiveObject?.border_radius}px`,
          border: `${ActiveObject?.border_size}px solid ${ActiveObject?.border_color}`,
          padding: `${ActiveObject?.button_top_bottom_padding}px ${ActiveObject?.button_left_right_padding}px`,

        }}
        onClick={toggleBackInStock}
      >  {Number(ActiveObject.is_icon) === 1 && (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
          style={{ margin: "0px 5px" }}>
          <path d="M10.0003 0C10.5525 0 11.0003 0.447716 11.0003 1V3L10.9998 3.0317L10.9988 3.05341L10.9969 3.0824C13.8362 3.55709 16.0003 6.02583 16.0003 9C16.0003 12.0933 16.6253 13.312 17.5989 15.2103L17.6336 15.2781C17.8033 15.6088 17.563 16 17.1912 16H2.80935C2.43753 16 2.19729 15.6088 2.36697 15.2781L2.40164 15.2103C3.37527 13.312 4.00027 12.0933 4.00027 9C4.00027 6.02583 6.16434 3.55709 9.00369 3.0824L9.00149 3.04284C9.00076 3.02863 9.00027 3.01435 9.00027 3V1C9.00027 0.447716 9.44803 0 10.0003 0Z" fill={ActiveObject.icon_color} stock={ActiveObject.icon_color}></path>
          <path d="M12.0003 18C12.0003 19.1046 11.1048 20 10.0003 20C8.89578 20 8.00027 19.1046 8.00027 18H12.0003Z" fill={ActiveObject.icon_color} stock={ActiveObject.icon_color}></path>
        </svg>
      )}
        {ActiveObject.text}
      </button>
      {isOpenModal && (
        <BackInStockModal BackInStock={data.bis} ToggleBISModal={toggleBackInStock} VariantId={VariantId} ProductId={ProductId} StockOutProduct={StockOutProduct} />
      )}
    </div>
  );
};
export default BackInStock;