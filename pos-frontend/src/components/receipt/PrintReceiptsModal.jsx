import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPrint,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaReceipt,
  FaUtensils,
} from "react-icons/fa";
import { enqueueSnackbar } from "notistack";
import companyLogo from "../../assets/images/companylogo.png"; // Adjust the path as needed

const PrintReceiptsModal = ({
  isOpen,
  onClose,
  orderData,
  orderType,
  customerReceipts = [],
  kitchenReceipts = [],
  isNewlyAddedOnly = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [printStatus, setPrintStatus] = useState({
    kitchen: { status: "pending", message: "" },
    customer: { status: "pending", message: "" },
  });
  const [printingStage, setPrintingStage] = useState("ready");

  // Print stages for different order types
  const getPrintStages = () => {
    if (isNewlyAddedOnly) {
      return ["kitchen"];
    }

    switch (orderType) {
      case "DINE":
        return customerReceipts && customerReceipts.length > 0
          ? ["kitchen", "customer"]
          : ["kitchen"];
      case "DELIVERY":
      case "PICKUP":
        return ["kitchen", "customer"];
      default:
        return ["kitchen"];
    }
  };

  const printStages = getPrintStages();

  const printReceipt = async (receiptData, receiptType) => {
    const deliveryFee = receiptData.deliveryFee || 0;

    // Process and normalize the receipt data
    const processedReceiptData = {
      ...receiptData,
      items:
        receiptData.items?.map((item) => {
          const itemData = item._doc || item;
          const basePrice = itemData.basePrice || itemData.originalPrice;
          const options = itemData.selectedOptions || [];
          const optionsPrice = options.reduce(
            (sum, opt) => sum + (opt.price || 0),
            0
          );
          const discount = itemData.discount || itemData.itemDiscount || 0;

          const paymentMethod = receiptData.paymentMethod || "CASH";
          const taxRates = itemData.tax || { card: "0", cash: "0" };
          const taxRate =
            paymentMethod === "CARD"
              ? parseFloat(taxRates.card || "0")
              : parseFloat(taxRates.cash || "");

          const originalAmount = basePrice + optionsPrice;
          const taxAmount = (originalAmount * taxRate) / 100;
          const finalPrice = originalAmount - discount + taxAmount;

          return {
            itemId: itemData.itemId || itemData._id,
            name: itemData.name || "Unknown Item",
            price: finalPrice,
            originalPrice: originalAmount,
            basePrice: basePrice,
            optionsPrice: optionsPrice,
            quantity: itemData.quantity || 1,
            menuId: itemData.menuId,
            menuName: itemData.menuName || "General Items",
            categoryId: itemData.categoryId,
            categoryName: itemData.categoryName || "General",
            options: options,
            itemDiscount: discount,
            itemTax: taxRate + "%",
            totalTax: taxAmount * (itemData.quantity || 1),
            notes: itemData.notes || "",
          };
        }) || [],

      deals:
        receiptData.deals?.map((deal) => {
          const dealData = deal._doc || deal;
          return {
            dealId: dealData.dealId || dealData._id,
            name: dealData.name || "Unknown Deal",
            dealPrice: dealData.dealPrice || 0,
            originalPrice: dealData.originalPrice || 0,
            customization: deal.customization,
            savings: dealData.originalPrice - dealData.dealPrice || 0,
            quantity: dealData.quantity || 1,
            items: dealData.items || [],
          };
        }) || [],
    };

    // Calculate total amounts for the receipt
    let totalOriginalAmount = 0;
    let totalItemDiscount = 0;
    let totalTaxAmount = 0;
    let totalFinalAmount = 0;
    let totalDealAmount = 0;
    let totalDealSavings = 0;

    processedReceiptData.items.forEach((item) => {
      const qty = item.quantity;
      totalOriginalAmount += item.originalPrice * qty;
      totalItemDiscount += item.itemDiscount * qty;
      totalTaxAmount += item.totalTax;
      totalFinalAmount += item.price * qty;
    });

    processedReceiptData.deals.forEach((deal) => {
      const qty = deal.quantity;
      totalDealAmount += deal.dealPrice * qty;
      totalDealSavings += deal.savings * qty;
    });

    processedReceiptData.originalAmount = totalOriginalAmount;
    processedReceiptData.itemDiscount = totalItemDiscount;
    processedReceiptData.totalTax = totalTaxAmount;
    processedReceiptData.totalAmount =
      totalFinalAmount + totalDealAmount + deliveryFee;
    processedReceiptData.subtotal = totalOriginalAmount - totalItemDiscount;
    processedReceiptData.voucherDiscount = 0;
    processedReceiptData.dealAmount = totalDealAmount;
    processedReceiptData.dealSavings = totalDealSavings;
    processedReceiptData.deliveryFee = deliveryFee;

    const dealTotal = (processedReceiptData.deals || []).reduce((sum, deal) => {
      const base = deal.dealPrice * deal.quantity;
      return sum + base;
    }, 0);

    // Group items by menu for better organization
    const menuGroups = {};
    processedReceiptData.items.forEach((item) => {
      const menuKey = item.menuId || "general";
      const menuName = item.menuName || "General Items";

      if (!menuGroups[menuKey]) {
        menuGroups[menuKey] = {
          menuId: item.menuId,
          menuName: menuName,
          menuLogo: null,
          items: [],
          itemCount: 0,
          totalAmount: 0,
        };
      }

      menuGroups[menuKey].items.push(item);
      menuGroups[menuKey].itemCount += item.quantity;
      menuGroups[menuKey].totalAmount += item.price * item.quantity;
    });

    processedReceiptData.menuGroups = Object.values(menuGroups);

    return new Promise((resolve, reject) => {
      try {
        setPrintStatus((prev) => ({
          ...prev,
          [receiptType]: {
            status: "printing",
            message: "Opening print dialog...",
          },
        }));

        const printWindow = window.open("", "_blank", "width=400,height=600");

        if (!printWindow) {
          throw new Error("Please allow popups to print receipts");
        }

        const isKitchen = receiptType === "kitchen";
        const receiptTitle = isKitchen
          ? isNewlyAddedOnly
            ? "KITCHEN ORDER - NEW ITEMS"
            : "KITCHEN ORDER"
          : "CUSTOMER RECEIPT";

        // Enhanced print content with tabular format for customer receipts
        const printContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${receiptTitle}</title>
            <style>
              @media print {
                @page { margin: 0; size: 80mm auto; }
                body { margin: 0; padding: 5mm; }
              }
              
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 11px;
                line-height: 1.3;
                margin: 0;
                padding: 10px;
                max-width: 300px;
                color: #000;
                background: #fff;
              }
              
              .receipt-header { 
                text-align: center; 
                border-bottom: 2px solid #000; 
                padding-bottom: 8px; 
                margin-bottom: 12px; 
              }
              
              .receipt-title { 
                font-size: 16px; 
                font-weight: bold; 
                margin-bottom: 5px;
                text-decoration: underline;
              }
              
              .order-info { 
                margin-bottom: 12px; 
                font-size: 11px;
              }
              
              .info-row { 
                display: flex; 
                justify-content: space-between; 
                margin: 2px 0; 
              }
              
              .items-section { f
                padding: 8px 0; 
                margin: 10px 0; 
              }
              
              .item-row { 
                display: flex; 
                justify-content: space-between; 
                margin: 3px 0;
                align-items: center;
              }
              
              .item-name { 
                flex: 1; 
                margin-right: 8px;
                word-wrap: break-word;
              }
              
              .item-qty { 
                font-weight: bolder; 
                font-size: 12px;
                min-width: 30px;
                text-align: right;
              }
              
              .item-price { 
                min-width: 60px; 
                text-align: right; 
                font-weight: bold;
                font-size:15px;
              }
              
              .total-section { 
                border-top: 2px solid #000; 
                padding-top: 8px; 
                margin-top: 10px;
                font-weight: bold;
              }
              
              .priority-notice { 
                background-color: #000; 
                color: #fff;
                padding: 6px; 
                text-align: center; 
                font-weight: bold; 
                margin: 8px 0;
                text-transform: uppercase;
              }
              
              .footer { 
                text-align: center; 
                margin-top: 15px; 
                font-size: 9px;
                border-top: 1px dashed #000;
                padding-top: 8px;
              }
              
              .customer-info {
                background: white;
                padding: 6px;
                margin: 8px 0;
                border-left: 3px solid #000;
              }
              
              .item-with-logo {
                display: flex;
                align-items: center;
                flex: 1;
                margin-right: 8px;
              }
              
              .menu-logo {
                width: 16px;
                height: 16px;
                margin-right: 6px;
                border-radius: 2px;
                object-fit: cover;
              }
              
              .instructions {
                background: white;
                border-left: 3px solid #000000ff;
                padding: 6px;
                margin: 8px 0;
                font-size: 12px;
              }
              
              .instructions-label {
                font-weight: bold;
                color: black;
                margin-bottom: 4px;
              }
              
              /* Table styles for customer receipts */
              .receipt-table {
                width: 100%;
                border-collapse: collapse;
                margin: 8px 0;
              }
              
              .receipt-table th {
                text-align: left;
                border-bottom: 1px solid #000;
                padding: 4px 2px;
                font-weight: bold;
              }

              .receipt-table tr {
                border-bottom: 1px dashed #000;
              }
              
              .receipt-table td {
                padding: 4px 2px;
                vertical-align: top;
              }
              
              .receipt-table .item-name-cell {
                width: 40%;
              }
              
              .receipt-table .qty-cell {
                width: 15%;
                text-align: center;
                font-weight:bold;
              }
              
              .receipt-table .unit-price-cell {
                width: 20%;
                font-weight:bold;
                text-align: right;
              }
              
              .receipt-table .price-cell {
                width: 25%;
                text-align: right;
                font-weight: bold;
              }
                .company-header {
                text-align: center;
                margin-bottom: 10px;
                padding-bottom: 8px;
              }
              
              .company-logo {
                max-width: 100px;
                max-height: 100px;
                margin: 0 auto 5px;
                display: block;
              }
              
             
              
              .receipt-table .item-options {
                font-size: 9px;
                color: #666;
                font-style: italic;
                padding-left: 8px;
              }
              
              .receipt-table .item-notes {
                font-size: 9px;
                color: #666;
                font-style: italic;
                padding-left: 8px;
              }
              
              .deal-row {
                border-top: 1px dashed #ccc;
                padding-top: 6px;
                margin-top: 6px;
              }
              
              .deal-name {
                font-weight: bold;
                color: #000000ff;
                font-size: 11px;
              }
            </style>
          </head>
          <body>
          <div class="company-header">
              <img src="${companyLogo}" class="company-logo"  Logo">
            </div>

            <div class="receipt-header">
              <div class="receipt-title">${receiptTitle}</div>
              <div>Order #${
                orderData._id
                  ? orderData._id.slice(-6).toUpperCase()
                  : orderData.orderId
                  ? orderData.orderId.slice(-6).toUpperCase()
                  : orderData.id
                  ? orderData.id.slice(-6).toUpperCase()
                  : Date.now().toString().slice(-6).toUpperCase()
              }</div>
              <div>${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}</div>
            </div>
            
            <div class="order-info">
              <div class="info-row">
                <span><strong>Order Type:</strong></span>
                <span><strong>${orderType || "DINE IN"}</strong></span>
              </div>
              <div class="info-row">
                <span><strong>Order NO:</strong></span>
                <span><strong>${orderData.orderNumber}</strong></span>
              </div>
              ${
                orderData.customerInfo &&
                (orderData.customerInfo.name ||
                  orderData.customerInfo.phone ||
                  orderData.customerInfo.address)
                  ? `
                <div class="customer-info">
                  ${
                    isKitchen
                      ? `${
                          orderData.customerInfo.name
                            ? `<div><strong>Customer:</strong> ${orderData.customerInfo.name}</div>`
                            : ""
                        }`
                      : `${
                          orderData.customerInfo.name
                            ? `<div><strong>Customer:</strong> ${orderData.customerInfo.name}</div>`
                            : ""
                        }
                     ${
                       orderData.customerInfo.phone
                         ? `<div><strong>Phone:</strong> ${orderData.customerInfo.phone}</div>`
                         : ""
                     }
                     ${
                       orderData.customerInfo.address
                         ? `<div><strong>Address:</strong> ${orderData.customerInfo.address}</div>`
                         : ""
                     }
                     ${
                       orderData.customerInfo.table
                         ? `<div><strong>Table:</strong> ${orderData.customerInfo.table}</div>`
                         : ""
                     }`
                  }
                </div>
              `
                  : ""
              }
            </div>
            ${
              isKitchen && orderData.instructions
                ? `
                <div class="instructions">
                  <div class="instructions-label">SPECIAL INSTRUCTIONS:</div>
                  <div>${orderData.instructions}</div>
                </div>
              `
                : ""
            }
            
            ${
              isKitchen && isNewlyAddedOnly
                ? '<div class="priority-notice" style="background-color: #ff6b35;">🆕 NEWLY ADDED ITEMS ONLY 🆕</div>'
                : ""
            }
            
            <div class="items-section">
              <div style="font-weight: bold; margin-bottom: 8px; text-align: center;font-size:15px;">
                ${isKitchen ? "ITEMS TO PREPARE" : ""}
              </div>
              
              ${
                isKitchen
                  ? // Kitchen receipt format (original format)
                    processedReceiptData.items &&
                    processedReceiptData.items.length > 0
                    ? processedReceiptData.items
                        .map((item, index) => {
                          const menuGroup =
                            processedReceiptData.menuGroups &&
                            processedReceiptData.menuGroups.find(
                              (menu) =>
                                menu.menuId === item.menuId ||
                                menu.menuName === item.menuName
                            );
                          const menuLogo = menuGroup
                            ? menuGroup.menuLogo
                            : null;

                          return `
                              <div class="item-row">
                                <div class="item-with-logo">
                                  ${
                                    menuLogo && !isKitchen
                                      ? `<img src="${menuLogo}" class="menu-logo" alt="${item.menuName} logo">`
                                      : ""
                                  }
                                  <div>
                                    <span class="item-name" style="font-size:16px; font-weight:bolder">
                                      ${item.name}
                                    </span>
                                    ${
                                      item.menuName &&
                                      item.menuName !== "General Items"
                                        ? `<span style="font-size: 9px; color: #666; font-style: italic; display: block;">(${item.menuName})</span>`
                                        : ""
                                    }
                                  </div>
                                </div>

                                <div style="display:flex;flex-direction:column">
                                  <span class="item-qty">x${
                                    item.quantity
                                  }</span>
                                </div>
                              </div>

                              ${
                                item.options && item.options.length > 0
                                  ? `
                                    <div style="margin-left:${
                                      menuLogo && !isKitchen ? "22px" : "10px"
                                    };">
                                      <div style="font-size: 13px; color: #000;">Options: ${item.options
                                        .filter((opt) => !opt.option)
                                        .map((opt) =>
                                          typeof opt === "string"
                                            ? opt
                                            : opt.name
                                        )
                                        .join(", ")}</div>
                                    </div>

                                    ${item.options
                                      .filter((opt) => opt.option === true)
                                      .map(
                                        (opt) => `
                                        <div class="item-row" style="margin-left:${
                                          menuLogo && !isKitchen
                                            ? "22px"
                                            : "0px"
                                        };">
                                          <div class="item-with-logo">
                                            ${
                                              menuLogo && !isKitchen
                                                ? `<img src="${menuLogo}" class="menu-logo" alt="${item.menuName} logo">`
                                                : ""
                                            }
                                            <div>
                                              <span class="item-name" style="font-size:16px; font-weight:bolder">
                                                ${opt.name}
                                              </span>
                                            </div>
                                          </div>
                                          <div style="display:flex;flex-direction:column">
                                            <span class="item-qty">x1</span>
                                          </div>
                                        </div>
                                      `
                                      )
                                      .join("")}
                                  `
                                  : ""
                              }

                              ${
                                item.notes
                                  ? `<div style="font-size: 9px; color: #666; margin-left:${
                                      menuLogo && !isKitchen ? "22px" : "10px"
                                    }; font-style: italic;">Note: ${
                                      item.notes
                                    }</div>`
                                  : ""
                              }
                            `;
                        })
                        .join("")
                    : ""
                  : // Customer receipt format (tabular format)
                    `
                    <table class="receipt-table">
                      <thead>
                        <tr>
                          <th class="item-name-cell">Item</th>
                          <th class="qty-cell">Qty</th>
                          <th class="unit-price-cell">Unit Price</th>
                          <th class="price-cell">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${
                          processedReceiptData.items &&
                          processedReceiptData.items.length > 0
                            ? processedReceiptData.items
                                .map((item) => {
                                  // Calculate unit price (base + options)
                                  let unitPrice =
                                    item.basePrice + item.optionsPrice;
                                  const optionTrueTotal = (item.options || [])
                                    .filter((opt) => opt.option === true)
                                    .reduce(
                                      (sum, opt) => sum + (opt.price || 0),
                                      0
                                    );

                                  const itemTotalPrice =
                                    item.price * item.quantity -
                                    optionTrueTotal;
                                  return `
                                    <tr>
                                      <td class="item-name-cell">
                                        <div style="font-weight: bold;">${
                                          item.name
                                        }</div>
                                        ${
                                          item.options &&
                                          item.options.length > 0
                                            ? `<div class="item-options">${item.options
                                                .filter((opt) => !opt.option)
                                                .map(
                                                  (opt) =>
                                                    `${opt.name}${
                                                      opt.price > 0
                                                        ? ` (+Rs${opt.price.toFixed(
                                                            2
                                                          )})`
                                                        : ""
                                                    }`
                                                )
                                                .join(", ")}</div>`
                                            : ""
                                        }
                                        ${
                                          item.notes
                                            ? `<div class="item-notes">Note: ${item.notes}</div>`
                                            : ""
                                        }
                                      </td>
                                      <td class="qty-cell">${item.quantity}</td>
                                      <td class="unit-price-cell">Rs${itemTotalPrice.toFixed(
                                        2
                                      )}</td>
                                      <td class="price-cell">Rs${itemTotalPrice.toFixed(
                                        2
                                      )}</td>
                                    </tr>
                                    ${
                                      item.options &&
                                      item.options.filter(
                                        (opt) => opt.option === true
                                      ).length > 0
                                        ? item.options
                                            .filter(
                                              (opt) => opt.option === true
                                            )
                                            .map(
                                              (opt) => `
                                              <tr>
                                                <td class="item-name-cell">
                                                  <div style="font-weight:bold;">${
                                                    opt.name
                                                  }</div>
                                                </td>
                                                <td class="qty-cell">1</td>
                                                <td class="unit-price-cell">Rs${opt.price.toFixed(
                                                  2
                                                )}</td>
                                                <td class="price-cell">Rs${opt.price.toFixed(
                                                  2
                                                )}</td>
                                              </tr>
                                            `
                                            )
                                            .join("")
                                        : ""
                                    }
                                  `;
                                })
                                .join("")
                            : ""
                        }
                        
                        ${
                          processedReceiptData.deals &&
                          processedReceiptData.deals.length > 0
                            ? processedReceiptData.deals
                                .map((deal) => {
                                  return `
                                    <tr class="deal-row">
                                      <td class="item-name-cell">
                                        <div class="deal-name">${
                                          deal.name
                                        }</div>
                                        ${
                                          deal.customization &&
                                          Object.keys(deal.customization)
                                            .length > 0
                                            ? `<div class="item-options">${Object.values(
                                                deal.customization
                                              )
                                                .flat()
                                                .map(
                                                  (item) =>
                                                    `${item.name}${
                                                      item.price > 0
                                                        ? ` (+Rs${item.price.toFixed(
                                                            2
                                                          )})`
                                                        : ""
                                                    }`
                                                )
                                                .join(", ")}</div>`
                                            : ""
                                        }
                                      </td>
                                      <td class="qty-cell">${deal.quantity}</td>
                                      <td class="unit-price-cell">Rs${(
                                        deal.dealPrice / deal.quantity
                                      ).toFixed(2)}</td>
                                      <td class="price-cell">Rs${deal.dealPrice.toFixed(
                                        2
                                      )}</td>
                                    </tr>
                                  `;
                                })
                                .join("")
                            : ""
                        }
                      </tbody>
                    </table>
                  `
              }
            </div>
             ${
               isKitchen &&
               processedReceiptData.deals &&
               processedReceiptData.deals.length > 0
                 ? `
              <div class="deals-section" style="margin-top: 12px;">
                <div style="font-weight: bold; margin-bottom: 8px; text-align: center; color: black; font-size:15px">
                   APPLIED DEALS
                </div>
                
                ${processedReceiptData.deals
                  .map((deal, index) => {
                    return `
                  <div class="deal-row" style="border: 1px dashed #000000ff; padding: 6px; margin: 4px 0; border-radius: 3px; background: white;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                      <span style="font-weight: bold; color: #000000ff;font-size: 15px;"> ${
                        deal.name
                      }</span>
                      <span style="font-weight: bold;">x${deal.quantity}</span>
                    </div>
                    
                   ${
                     isKitchen
                       ? `
      ${Object.entries(deal.customization)
        .map(
          ([key, values]) => `
            <div style="font-size: 15px; color: #444; margin: 2px 0;">
              ${values
                .map(
                  (item) => `
                    <div style="margin-left: 10px; color:black; font-weight:600">
                      - ${item.name}${
                    item.selectedSubOption
                      ? ` (${item.selectedSubOption.name})`
                      : ""
                  }
                    </div>
                  `
                )
                .join("")}
            </div>
          `
        )
        .join("")}
    `
                       : ""
                   }



                    ${
                      !isKitchen
                        ? `
                        ${Object.entries(deal.customization)
                          .map(
                            ([key, values]) => `
      <div style="font-size: 12px; color: #444; margin: 2px 0;">
        ${values
          .map(
            (item) => `
              <div style="margin-left: 10px; color:black; font-weight:600">
                - ${item.name}
                ${
                  item.price && item.price > 0
                    ? `<span style="color:black; font-weight:500"> (+Rs${item.price})</span>`
                    : ""
                }
              </div>
            `
          )
          .join("")}
      </div>
    `
                          )
                          .join("")}
                      <div style="font-size: 9px; color: #666; margin: 2px 0;">
  <div style="display: flex; justify-content: space-between; font-size:13px">
    <span >Deal Price:</span>
    <span style="font-weight: bold;">Rs${
      deal.dealPrice.toFixed(2) -
      (
        Object.values(deal.customization || {})
          .flat()
          .reduce((sum, item) => sum + (item.price || 0), 0) * deal.quantity
      ).toFixed(2)
    } each</span>
  </div>

  <div style="display: flex; justify-content: space-between; font-size:13px">
    <span>Addon Price:</span>
    <span style="font-weight: bold;">
      Rs${(
        Object.values(deal.customization || {})
          .flat()
          .reduce((sum, item) => sum + (item.price || 0), 0) * deal.quantity
      ).toFixed(2)}
    </span>
  </div>

  <div style="display: flex; justify-content: space-between; color: #000000ff; font-size:13px">
    <span>Total Price:</span>
    <span style="font-weight: bold;">
      Rs${deal.dealPrice.toFixed(2)}
    </span>
  </div>
</div>

                    `
                        : ""
                    }
                    
                    ${
                      deal.items && deal.items.length > 0
                        ? `
                      <div style="font-size: 8px; color: #666; margin-top: 4px; border-top: 1px dotted #ccc; padding-top: 3px;">
                        <strong>Includes:</strong> ${deal.items
                          .map((item) => {
                            // Handle multiple possible data structures
                            let itemName = "Unknown Item";
                            let itemQuantity = 1;
                            let selectedOptions = [];

                            if (typeof item === "string") {
                              itemName = item;
                            } else if (item && typeof item === "object") {
                              itemName =
                                item.name ||
                                item.itemName ||
                                (item.itemId &&
                                  (typeof item.itemId === "string"
                                    ? item.itemId
                                    : item.itemId.name)) ||
                                "Unknown Item";
                              itemQuantity = item.quantity || 1;
                              selectedOptions = item.selectedOptions || [];
                            }

                            let itemDisplay =
                              itemName + " (" + itemQuantity + "x)";

                            // Add selected options if they exist
                            if (selectedOptions && selectedOptions.length > 0) {
                              const optionsText = selectedOptions
                                .map((option) => {
                                  if (typeof option === "string") {
                                    return option;
                                  } else if (
                                    option &&
                                    typeof option === "object"
                                  ) {
                                    return (
                                      option.name +
                                      (option.price > 0
                                        ? " (+Rs" + (option.price || 0) + ")"
                                        : "")
                                    );
                                  }
                                  return "Option";
                                })
                                .join(", ");

                              if (isKitchen) {
                                // For kitchen receipt, show options clearly for preparation
                                itemDisplay +=
                                  " [Options: " + optionsText + "]";
                              } else {
                                // For customer receipt, show options with pricing
                                itemDisplay += " (with: " + optionsText + ")";
                              }
                            }

                            return itemDisplay;
                          })
                          .join(", ")}
                      </div>
                    `
                        : ""
                    }
                  </div>
                `;
                  })
                  .join("")}
              </div>
            `
                 : ""
             }
            
            ${
              !isKitchen
                ? `
                  <div class="total-section">
                    <div class="info-row">
                      <span>Subtotal:</span>
                      <span>Rs${(
                        processedReceiptData.subtotal +
                        processedReceiptData.dealAmount
                      ).toFixed(2)}</span>
                    </div>
                    ${
                      processedReceiptData.voucherDiscount > 0
                        ? `
                          <div class="info-row" style="color: #000000ff;">
                            <span>Voucher Discount:</span>
                            <span>-Rs${processedReceiptData.voucherDiscount.toFixed(
                              2
                            )}</span>
                          </div>
                        `
                        : ""
                    }
                    ${
                      processedReceiptData.totalTax > 0
                        ? `
                          <div class="info-row" style="color: #000000ff;">
                            <span>Tax (${
                              orderData.paymentMethod ||
                              receiptData.paymentMethod ||
                              "CASH"
                            }):</span>
                            <span>+Rs${processedReceiptData.totalTax.toFixed(
                              2
                            )}</span>
                          </div>
                        `
                        : ""
                    }
                    ${
                      processedReceiptData.totalDealSavings > 0
                        ? `
                          <div class="info-row" style="color: #8b5cf6;">
                            <span>Deal Savings:</span>
                            <span>-Rs${processedReceiptData.totalDealSavings.toFixed(
                              2
                            )}</span>
                          </div>
                        `
                        : ""
                    }
                    ${
                      deliveryFee > 0
                        ? `
                          <div class="info-row">
                            <span>Delivery Fee:</span>
                            <span>+Rs${deliveryFee.toFixed(2)}</span>
                          </div>
                        `
                        : ""
                    }
                    <div class="info-row" style="border-top: 1px solid #000; margin-top: 4px; padding-top: 4px; font-size: 14px;">
                      <span><strong>FINAL TOTAL:</strong></span>
                      <span><strong>Rs${processedReceiptData.totalAmount.toFixed(
                        2
                      )}</strong></span>
                    </div>
                    ${
                      orderData.paymentMethod
                        ? `
                          <div class="info-row" style="margin-top: 4px;">
                            <span>Payment Method:</span>
                            <span>${orderData.paymentMethod.toUpperCase()}</span>
                          </div>
                        `
                        : ""
                    }
                  </div>
                `
                : ""
            }
            
            <div class="footer">
                Powered By MiteMinds
            </div>
          </body>
          </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();

        // Wait a moment for content to load
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();

          // Handle print completion
          const checkPrintStatus = () => {
            if (printWindow.closed) {
              setPrintStatus((prev) => ({
                ...prev,
                [receiptType]: {
                  status: "completed",
                  message: "Printed successfully!",
                },
              }));
              resolve();
            } else {
              setTimeout(checkPrintStatus, 1000);
            }
          };

          setTimeout(checkPrintStatus, 2000);
        }, 1000);
      } catch (error) {
        console.error(`Error printing ${receiptType} receipt:`, error);
        setPrintStatus((prev) => ({
          ...prev,
          [receiptType]: { status: "error", message: error.message },
        }));
        reject(error);
      }
    });
  };

  // Rest of the component remains the same...
  const handlePrintAll = async () => {
    setIsLoading(true);
    setPrintingStage("printing");

    try {
      // Print kitchen receipt first (always needed)
      if (printStages.includes("kitchen")) {
        let kitchenData = orderData;

        // If we have specific kitchen receipts, merge them
        if (kitchenReceipts && kitchenReceipts.length > 0) {
          kitchenData = {
            ...orderData,
            ...kitchenReceipts[0],
            items:
              orderData.items && orderData.items.length > 0
                ? orderData.items
                : kitchenReceipts[0].items,
          };
        }

        await printReceipt(kitchenData, "kitchen");

        // Small delay between prints
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Print customer receipt for delivery/pickup orders or when customer receipts are available
      if (
        printStages.includes("customer") &&
        (orderType === "DELIVERY" ||
          orderType === "PICKUP" ||
          (customerReceipts && customerReceipts.length > 0))
      ) {
        let customerData = orderData;

        // If we have specific customer receipts, merge them
        if (customerReceipts && customerReceipts.length > 0) {
          customerData = {
            ...orderData,
            ...customerReceipts[0],
            items:
              orderData.items && orderData.items.length > 0
                ? orderData.items
                : customerReceipts[0].items,
          };
        }

        await printReceipt(customerData, "customer");
      }

      setPrintingStage("completed");
      enqueueSnackbar("All receipts printed successfully!", {
        variant: "success",
      });

      // Auto close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error("Error printing receipts:", error);
      setPrintingStage("error");
      enqueueSnackbar("Failed to print some receipts", { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintIndividual = async (receiptType) => {
    setIsLoading(true);

    try {
      let receiptData;

      if (receiptType === "kitchen") {
        // For kitchen receipts, prioritize orderData with complete item information
        receiptData = orderData;

        // If we have specific kitchen receipts, merge them
        if (kitchenReceipts && kitchenReceipts.length > 0) {
          length = kitchenReceipts.length - 1;
          receiptData = {
            ...orderData,
            ...kitchenReceipts[length],
          };
        }
      } else {
        // For customer receipts, also prioritize orderData
        receiptData = orderData;

        // If we have specific customer receipts, merge them
        if (customerReceipts && customerReceipts.length > 0) {
          receiptData = {
            ...orderData,
            ...customerReceipts[0],
            items:
              orderData.items && orderData.items.length > 0
                ? orderData.items
                : customerReceipts[0].items,
          };
        }
      }

      await printReceipt(receiptData, receiptType);
      enqueueSnackbar(
        `${
          receiptType === "kitchen" ? "Kitchen" : "Customer"
        } receipt printed!`,
        { variant: "success" }
      );
    } catch (error) {
      console.error(`Error printing ${receiptType} receipt:`, error);
      enqueueSnackbar(`Failed to print ${receiptType} receipt`, {
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetStatus = () => {
    setPrintStatus({
      kitchen: { status: "pending", message: "" },
      customer: { status: "pending", message: "" },
    });
    setPrintingStage("ready");
  };

  useEffect(() => {
    if (isOpen) {
      resetStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg max-w-md w-full overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isNewlyAddedOnly ? (
                  <FaUtensils className="text-2xl" />
                ) : (
                  <FaReceipt className="text-2xl" />
                )}
                <div>
                  <h2 className="text-xl font-bold">
                    {isNewlyAddedOnly
                      ? "Print New Kitchen Receipts"
                      : "Print Receipts"}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    Order #
                    {orderData._id?.slice(-6) ||
                      orderData.orderId?.slice(-6) ||
                      orderData.id?.slice(-6) ||
                      Date.now().toString().slice(-6).toUpperCase()}{" "}
                    - {orderType}
                    {isNewlyAddedOnly && " (Newly Added Items)"}
                  </p>
                  <p className="text-blue-100 text-sm">
                    Order No - {orderData.orderNumber}
                    {isNewlyAddedOnly && " (Newly Added Items)"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 text-2xl transition-colors"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Receipt Types */}
            <div className="space-y-4 mb-6">
              {/* Kitchen Receipt */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FaUtensils className="text-orange-500 text-xl" />
                  <div>
                    <h4 className="font-medium text-gray-800">
                      {isNewlyAddedOnly
                        ? "New Items Kitchen Receipt"
                        : "Kitchen Receipt"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {isNewlyAddedOnly
                        ? "For newly added items preparation"
                        : "For kitchen preparation"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {printStatus.kitchen.status === "printing" && (
                    <FaSpinner className="animate-spin text-blue-500" />
                  )}
                  {printStatus.kitchen.status === "completed" && (
                    <FaCheck className="text-green-500" />
                  )}
                  {printStatus.kitchen.status === "error" && (
                    <FaTimes className="text-red-500" />
                  )}
                  <button
                    onClick={() => handlePrintIndividual("kitchen")}
                    disabled={isLoading}
                    className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    Print
                  </button>
                </div>
              </div>

              {/* Customer Receipt - Only show if not newly added items mode */}
              {!isNewlyAddedOnly &&
                (orderType === "DELIVERY" ||
                  orderType === "PICKUP" ||
                  (customerReceipts && customerReceipts.length > 0)) && (
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FaReceipt className="text-green-500 text-xl" />
                      <div>
                        <h4 className="font-medium text-gray-800">
                          Customer Receipt
                        </h4>
                        <p className="text-sm text-gray-600">
                          For customer records
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {printStatus.customer.status === "printing" && (
                        <FaSpinner className="animate-spin text-blue-500" />
                      )}
                      {printStatus.customer.status === "completed" && (
                        <FaCheck className="text-green-500" />
                      )}
                      {printStatus.customer.status === "error" && (
                        <FaTimes className="text-red-500" />
                      )}
                      <button
                        onClick={() => handlePrintIndividual("customer")}
                        disabled={isLoading}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        Print
                      </button>
                    </div>
                  </div>
                )}

              {/* Info message for newly added items */}
              {isNewlyAddedOnly && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FaUtensils className="text-orange-500" />
                    <span className="text-sm text-orange-700 font-medium">
                      These are kitchen receipts for newly added items only
                    </span>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    Kitchen staff will receive these receipts to prepare the
                    additional items for this order.
                  </p>
                </div>
              )}
            </div>

            {/* Print Status Messages */}
            {(printStatus.kitchen.message || printStatus.customer.message) && (
              <div className="mb-4 space-y-2">
                {printStatus.kitchen.message && (
                  <div
                    className={`text-sm p-2 rounded ${
                      printStatus.kitchen.status === "error"
                        ? "bg-red-100 text-red-700"
                        : printStatus.kitchen.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    Kitchen: {printStatus.kitchen.message}
                  </div>
                )}
                {printStatus.customer.message && (
                  <div
                    className={`text-sm p-2 rounded ${
                      printStatus.customer.status === "error"
                        ? "bg-red-100 text-red-700"
                        : printStatus.customer.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    Customer: {printStatus.customer.message}
                  </div>
                )}
              </div>
            )}

            {/* Loading/Success State */}
            {printingStage === "printing" && (
              <div className="text-center py-4">
                <FaSpinner className="animate-spin text-3xl text-blue-500 mx-auto mb-2" />
                <p className="text-gray-600">Printing receipts...</p>
              </div>
            )}

            {printingStage === "completed" && (
              <div className="text-center py-4">
                <FaCheck className="text-3xl text-green-500 mx-auto mb-2" />
                <p className="text-green-600 font-medium">
                  All receipts printed successfully!
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  This window will close automatically...
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {printingStage === "ready" && (
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                {isNewlyAddedOnly ? "Close" : "Cancel"}
              </button>

              <div className="flex space-x-3">
                <button
                  onClick={resetStatus}
                  className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={handlePrintAll}
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoading && <FaSpinner className="animate-spin" />}
                  <FaPrint />
                  <span>
                    {isNewlyAddedOnly
                      ? "Print New Kitchen Receipt"
                      : "Print All Receipts"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PrintReceiptsModal;
