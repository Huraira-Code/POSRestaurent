import React, { useRef } from "react";

const ReceiptPrintModal = ({ isOpen, onClose, reportData }) => {
  const printRef = useRef();

  if (!isOpen) return null;

  const formatPrice = (amount) => {
    return amount ? `Rs ${amount.toFixed(2)}` : "Rs 0.00";
  };

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const printWindow = window.open("", "", "height=600,width=400");
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: monospace; padding: 10px; font-size: 12px; }
            h2, h3 { text-align: center; margin: 4px 0; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }
            .item { display: flex; justify-content: space-between; }
            .total { font-weight: bold; margin-top: 4px; }
            .section-title { font-weight: bold; margin: 6px 0; text-align: center; }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // helper to calculate totals by payment status
  const getTotalByStatus = (status) => {
    if (!reportData?.paymentMethodSummary?.[status]) return 0;
    return Object.values(reportData.paymentMethodSummary[status]).reduce(
      (sum, val) => sum + val,
      0
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 font-inter">
      <div className="bg-white text-gray-800 rounded-xl shadow-2xl w-full max-w-sm max-h-[90vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold tracking-wide">Receipt Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          ref={printRef}
          className="p-4 overflow-y-auto flex-grow text-sm leading-relaxed"
        >
          {reportData ? (
            <div>
              {/* Title */}
              <h2 className="text-center text-base font-bold mb-1">
                Daily Sales Receipt
              </h2>
              <p className="text-center text-xs text-gray-500 mb-2">
                Date:{" "}
                {new Date(reportData.reportGeneratedDate).toLocaleDateString()}{" "}
                | Closed At:{" "}
                {new Date(reportData.reportGeneratedAt).toLocaleTimeString()}
              </p>

              <div className="line border-t border-dashed border-gray-400 my-2"></div>

              {/* Items Section */}
              {reportData.itemsSoldSummary?.length > 0 && (
                <div>
                  <h3 className="section-title">Items</h3>
                  {reportData.itemsSoldSummary.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between py-1 text-sm"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>{item.name}</span>
                      <span>{formatPrice(item.price)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Deals Section */}
              {reportData.dealsSoldSummary?.length > 0 && (
                <div className="mt-2">
                  <h3 className="section-title">Deals</h3>
                  {reportData.dealsSoldSummary.map((deal, index) => (
                    <div
                      key={index}
                      className="flex justify-between py-1 text-sm"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>{deal.name}</span>
                      <span>{formatPrice(deal.dealPrice)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Payment Breakdown */}
              {reportData.paymentMethodSummary && (
                <div className="mt-3">
                  <div className="line border-t border-dashed border-gray-400"></div>
                  <h3 className="section-title">Payment Breakdown</h3>
                  {Object.entries(reportData.paymentMethodSummary).map(
                    ([status, methods], idx) => (
                      <div key={idx} className="mb-2">
                        <h4 className="text-center font-medium text-gray-600">
                          {status}
                        </h4>
                        {Object.entries(methods).map(([method, amount], i) => (
                          <div
                            key={i}
                            className="flex justify-between py-0.5 text-sm"
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>{method}</span>
                            <span>{formatPrice(amount)}</span>
                          </div>
                        ))}
                        <div
                          className="flex justify-between font-semibold mt-1"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>Total {status}</span>
                          <span>{formatPrice(getTotalByStatus(status))}</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              <div className="line border-t border-dashed border-gray-400"></div>

              {/* Totals */}
              <div className="text-sm">
                <p
                  className="flex justify-between font-semibold"
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>Total Paid</span>
                  <span>{formatPrice(getTotalByStatus("PAID"))}</span>
                </p>
                <p
                  className="flex justify-between font-semibold"
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>Total Unpaid</span>
                  <span>{formatPrice(getTotalByStatus("UNPAID"))}</span>
                </p>
                <p
                  className="flex justify-between font-bold text-gray-900"
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>Grand Sales</span>
                  <span>{formatPrice(reportData.totalSalesAmount)}</span>
                </p>
                <p
                  className="flex justify-between text-gray-600"
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>Tax</span>
                  <span>{formatPrice(reportData.totalTaxCollected)}</span>
                </p>
                <p
                  className="flex justify-between text-gray-600"
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>Discount</span>
                  <span>{formatPrice(reportData.totalVoucherDiscount)}</span>
                </p>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">No data available.</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 flex justify-end space-x-2 bg-gray-50">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Print
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPrintModal;
