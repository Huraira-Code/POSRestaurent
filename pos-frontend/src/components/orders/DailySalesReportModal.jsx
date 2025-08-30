import React, { useState } from "react";
import ReceiptPrintModal from "./DailySalePrint";

const DailySalesReportModal = ({ isOpen, onClose, reportData }) => {
  console.log("report data", reportData);
  if (!isOpen) return null;
  const [showReceipt, setShowReceipt] = useState(false);

  const formatPrice = (amount) => {
    return amount ? `Rs${amount.toFixed(2)}` : "Rs0.00";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 font-inter">
      <div className="bg-[#1a1a1a] rounded-lg shadow-xl overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#1f1f1f] p-4 flex justify-between items-center border-b border-[#2a2a2a]">
          <h2 className="text-xl font-semibold text-[#f5f5f5]">
            Daily Sales Report
          </h2>
          <button
            onClick={onClose}
            className="text-[#606060] hover:text-[#f5f5f5] transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        {/* Modal Body - Report Content */}
        <div className="p-6 text-[#f5f5f5] overflow-y-auto flex-grow custom-scrollbar">
          {reportData ? (
            <div className="space-y-4">
              <p>
                <strong className="text-[#f6b100]">Report Date:</strong>{" "}
                {new Date(reportData.reportGeneratedDate).toLocaleDateString()}
              </p>
              <p>
                <strong className="text-[#f6b100]">Closed At:</strong>{" "}
                {new Date(reportData.reportGeneratedAt).toLocaleTimeString()}
              </p>
              <p>
                <strong className="text-[#f6b100]">Total Orders Closed:</strong>{" "}
                {reportData.totalOrdersClosed}
              </p>
              <p>
                <strong className="text-[#f6b100]">Total Sales Amount:</strong>{" "}
                {formatPrice(reportData.totalSalesAmount)}
              </p>
              <p>
                <strong className="text-[#f6b100]">Total Tax Collected:</strong>{" "}
                {formatPrice(reportData.totalTaxCollected)}
              </p>
              <p>
                <strong className="text-[#f6b100]">Total Savings Given:</strong>{" "}
                {formatPrice(reportData.totalSavingsGiven)}
              </p>
              <p>
                <strong className="text-[#f6b100]">
                  Total Voucher Discount:
                </strong>{" "}
                {formatPrice(reportData.totalVoucherDiscount)}
              </p>
              <p>
                <strong className="text-[#f6b100]">
                  Last Order Number in Report:
                </strong>{" "}
                {reportData.lastOrderNumberInThisReport}
              </p>

              {/* Payment Method Summary */}
              {/* Payment Method Summary */}
              {reportData.paymentMethodSummary && (
                <div className="border-t border-[#2a2a2a] pt-4 mt-4">
                  <h3 className="text-lg font-semibold text-[#f6b100] mb-2">
                    Payment Breakdown:
                  </h3>

                  {/* Loop PAID and UNPAID */}
                  {Object.entries(reportData.paymentMethodSummary).map(
                    ([status, methods]) => (
                      <div key={status} className="mb-3">
                        <h4 className="font-medium text-[#f5f5f5] mb-1">
                          {status}
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-[#a0a0a0]">
                          {Object.entries(methods).map(([method, amount]) => (
                            <li key={method}>
                              {method}:{" "}
                              <strong className="text-[#f5f5f5]">
                                {formatPrice(amount)}
                              </strong>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Items Sold Summary */}
              {reportData.itemsSoldSummary &&
                reportData.itemsSoldSummary.length > 0 && (
                  <div className="border-t border-[#2a2a2a] pt-4 mt-4">
                    <h3 className="text-lg font-semibold text-[#f6b100] mb-2">
                      Items Sold:
                    </h3>
                    <div className="space-y-2 text-sm">
                      {/* Updated to display each item individually */}
                      {reportData.itemsSoldSummary.map((item, index) => (
                        <div
                          key={index}
                          className="bg-[#262626] p-3 rounded-md"
                        >
                          <p className="font-medium text-[#f5f5f5]">
                            {item.name}
                          </p>
                          <p className="text-[#f5f5f5]">
                            Price: {formatPrice(item.price)}
                          </p>
                          <p className="text-[#a0a0a0]">
                            Tax: {formatPrice(item.totalTax)}
                          </p>
                          <p className="text-[#a0a0a0]">
                            Discount: {formatPrice(item.totalDiscount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Deals Sold Summary */}
              {reportData.dealsSoldSummary &&
                reportData.dealsSoldSummary.length > 0 && (
                  <div className="border-t border-[#2a2a2a] pt-4 mt-4">
                    <h3 className="text-lg font-semibold text-[#f6b100] mb-2">
                      Deals Sold:
                    </h3>
                    <div className="space-y-2 text-sm">
                      {/* Updated to display each deal individually */}
                      {reportData.dealsSoldSummary.map((deal, index) => (
                        <div
                          key={index}
                          className="bg-[#262626] p-3 rounded-md"
                        >
                          <p className="font-medium text-[#f5f5f5]">
                            {deal.name}
                          </p>
                          <p className="text-[#a0a0a0]">
                            Price: {formatPrice(deal.dealPrice)}
                          </p>
                          <p className="text-[#a0a0a0]">
                            Tax: {formatPrice(deal.totalTax)}
                          </p>
                          <p className="text-[#a0a0a0]">
                            Savings: {formatPrice(deal.totalSavings)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <p className="text-center text-[#a0a0a0]">
              No report data available.
            </p>
          )}
        </div>

        {/* Modal Footer (optional, e.g., print button) */}
        <div className="bg-[#1f1f1f] p-4 border-t border-[#2a2a2a] flex justify-end space-x-2">
          <button
            onClick={() => setShowReceipt(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-md font-medium hover:bg-[#e8a600] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
      <ReceiptPrintModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        reportData={reportData}
      />
    </div>
  );
};

export default DailySalesReportModal;
