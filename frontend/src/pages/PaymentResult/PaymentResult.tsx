import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import axiosInstance from "../../services/axios.instance";
import "./PaymentResult.css";

interface PaymentResultData {
  success: boolean;
  message: string;
  order_id?: number;
  amount?: number;
  transaction_no?: string;
}

const PaymentResult: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PaymentResultData | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const params = new URLSearchParams(searchParams);

        const response = await axiosInstance.get(
          `/api/payments/vnpay/return/?${params.toString()}`
        );

        setResult({
          success: true,
          message: response.data.message || "Payment successful",
          order_id: response.data.order_id,
          amount: response.data.amount,
          transaction_no: response.data.transaction_no,
        });

        localStorage.removeItem("activeGroupOrderId");

        toast.success("Payment completed successfully!");
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Payment verification failed";

        setResult({
          success: false,
          message: errorMessage,
        });

        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleViewOrders = () => {
    navigate("/orders");
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="payment-result-container">
          <div className="loading-container">
            <div className="loading-spinner-wrapper">
              <div className="loading-spinner-base"></div>
              <div className="loading-spinner-top"></div>
            </div>
            <p className="loading-text-primary">Verifying your payment...</p>
            <p className="loading-text-secondary">Please wait a moment</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="payment-result-container">
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

        <div className="payment-result-card">
          {result?.success ? (
            <>
              {/* ---------------- SUCCESS CARD ---------------- */}
              <div className="result-card">
                {/* Header */}
                <div className="success-header">
                  <div className="header-icon-wrapper">
                    <div className="header-icon-container">
                      <div className="header-icon-ping"></div>
                      <div className="header-icon-bg">
                        <svg
                          className="success-icon"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <h2 className="header-title">Payment Successful!</h2>
                  <p className="header-message">{result.message}</p>
                </div>

                {/* Content */}
                <div className="result-content">
                  {result.order_id && (
                    <div className="order-details-card">
                      <h3 className="order-details-title">Order Details</h3>

                      <div className="order-details-content">
                        <div className="order-detail-row">
                          <span className="order-detail-label">Order ID</span>
                          <span className="order-detail-value">
                            #{result.order_id}
                          </span>
                        </div>

                        {result.amount && (
                          <div className="order-detail-row with-border">
                            <span className="order-detail-label">
                              Total Amount
                            </span>
                            <span className="order-detail-amount">
                              {result.amount.toLocaleString("vi-VN")} ₫
                            </span>
                          </div>
                        )}

                        {result.transaction_no && (
                          <div className="order-detail-row with-border">
                            <span className="order-detail-label">
                              Transaction
                            </span>
                            <span className="order-detail-transaction">
                              {result.transaction_no}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Success message */}
                  <div className="message-box success">
                    <div className="message-box-content">
                      <svg
                        className="message-icon success"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="message-text success">
                        Your order has been placed successfully and payment
                        confirmed. You can track your order in the Orders page.
                      </p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="button-container">
                    <button
                      onClick={handleViewOrders}
                      className="btn btn-primary"
                    >
                      <svg
                        className="btn-icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      View My Orders
                    </button>

                    <button
                      onClick={handleBackToHome}
                      className="btn btn-secondary"
                    >
                      <svg
                        className="btn-icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                      Back to Home
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* ---------------- ERROR CARD ---------------- */}
              <div className="result-card">
                <div className="error-header">
                  <div className="header-icon-wrapper">
                    <div className="header-icon-container">
                      <div className="header-icon-ping"></div>
                      <div className="header-icon-bg">
                        <svg
                          className="error-icon"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <h2 className="header-title">Payment Failed</h2>
                  <p className="header-message">
                    We couldn't process your payment
                  </p>
                </div>

                <div className="result-content">
                  <div className="message-box error">
                    <div className="message-box-content">
                      <svg
                        className="message-icon error"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>

                      <div>
                        <p className="error-message-title">Error Message</p>
                        <p className="message-text error">{result?.message}</p>
                      </div>
                    </div>
                  </div>

                  <div className="help-section">
                    <p className="help-title">
                      <strong>What to do next:</strong>
                    </p>
                    <ul className="help-list">
                      <li>Check your card details and try again</li>
                      <li>Ensure you have sufficient funds</li>
                      <li>Try a different payment method</li>
                      <li>Contact your bank if the problem persists</li>
                    </ul>
                  </div>

                  <div className="button-container">
                    <button
                      onClick={() => navigate("/checkout")}
                      className="btn btn-primary"
                    >
                      <svg
                        className="btn-icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Try Again
                    </button>

                    <button
                      onClick={handleBackToHome}
                      className="btn btn-secondary"
                    >
                      <svg
                        className="btn-icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                      Back to Home
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default PaymentResult;
