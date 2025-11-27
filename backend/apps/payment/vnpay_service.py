import hashlib
import hmac
import urllib.parse
from datetime import datetime
import requests
from django.conf import settings


class VNPayService:
    """
    Service for integrating with VNPAY payment gateway
    Documentation: https://sandbox.vnpayment.vn/apis/docs/
    """

    def __init__(self):
        self.tmn_code = getattr(settings, "VNPAY_TMN_CODE", "")
        self.hash_secret = getattr(settings, "VNPAY_HASH_SECRET", "")
        self.payment_url = getattr(
            settings,
            "VNPAY_PAYMENT_URL",
            "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
        )
        self.return_url = getattr(
            settings, "VNPAY_RETURN_URL", "http://localhost:3000/payment/result"
        )
        self.api_url = getattr(
            settings,
            "VNPAY_API_URL",
            "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
        )
        self.version = "2.1.0"
        self.command = "pay"
        self.currency_code = "VND"
        self.locale = "vn"

    def create_payment(
        self, order_id, amount, order_info, ip_address, payment_method="CARD"
    ):
        """
        Create VNPAY payment request

        Args:
            order_id: Order ID (unique)
            amount: Payment amount (integer, VND, must be >= 5000)
            order_info: Payment description
            ip_address: Customer IP address
            payment_method: Payment method (CARD/WALLET/THIRD_PARTY)

        Returns:
            dict: Contains payment_url for user to complete payment
        """
        # Generate unique transaction reference
        import time

        txn_ref = f"{order_id}_{int(time.time())}"
        create_date = datetime.now().strftime("%Y%m%d%H%M%S")

        # Map payment methods to VNPAY bank codes
        bank_code = self._map_payment_method(payment_method)

        # Build request parameters
        params = {
            "vnp_Version": self.version,
            "vnp_Command": self.command,
            "vnp_TmnCode": self.tmn_code,
            "vnp_Amount": int(amount) * 100,  # VNPAY requires amount * 100 as integer
            "vnp_CurrCode": self.currency_code,
            "vnp_TxnRef": txn_ref,
            "vnp_OrderInfo": order_info,
            "vnp_OrderType": "other",
            "vnp_Locale": self.locale,
            "vnp_ReturnUrl": self.return_url,
            "vnp_IpAddr": ip_address,
            "vnp_CreateDate": create_date,
        }

        # Add bank code if specified
        if bank_code:
            params["vnp_BankCode"] = bank_code

        # Generate secure hash
        secure_hash = self._generate_signature(params)
        params["vnp_SecureHash"] = secure_hash

        # Build payment URL
        query_string = urllib.parse.urlencode(params)
        payment_url = f"{self.payment_url}?{query_string}"

        return {
            "success": True,
            "payment_url": payment_url,
            "txn_ref": txn_ref,
            "amount": amount,
        }

    def _map_payment_method(self, method):
        """
        Map internal payment method to VNPAY bank code

        CARD -> Leave empty (show all domestic cards/ATM)
        WALLET -> Currently not enabled, fallback to CARD
        THIRD_PARTY -> Currently not enabled, fallback to CARD

        Note: VNPAYQR and INTCARD are not enabled in this sandbox account
        """
        mapping = {
            "CARD": "",  # Domestic cards - show all options (WORKING)
            "WALLET": "",  # Fallback to domestic cards (VNPAYQR not enabled)
            "THIRD_PARTY": "",  # Fallback to domestic cards (INTCARD not enabled)
        }
        return mapping.get(method, "")

    def _generate_signature(self, params):
        """
        Generate VNPAY secure hash signature

        VNPAY requires:
        1. Sort parameters alphabetically by key
        2. Build query string WITH URL encoding (use urllib.parse.quote)
        3. Hash with HMAC SHA512
        """
        # Sort parameters by key
        sorted_params = sorted(params.items())

        # Build hash data string with URL-encoded values
        hash_data = []
        for key, value in sorted_params:
            if value != "" and value is not None:
                # URL encode using quote_plus() to match urlencode() behavior (space as +)
                encoded_value = urllib.parse.quote_plus(str(value))
                hash_data.append(f"{key}={encoded_value}")

        hash_string = "&".join(hash_data)

        # Generate HMAC SHA512 hash - VNPAY requires uppercase
        signature = (
            hmac.new(
                self.hash_secret.encode("utf-8"),
                hash_string.encode("utf-8"),
                hashlib.sha512,
            )
            .hexdigest()
            .upper()
        )

        return signature

    def verify_return_url(self, params):
        """
        Verify return URL parameters from VNPAY

        Args:
            params: Dictionary of parameters from VNPAY return URL

        Returns:
            dict: Validation result and payment data
        """
        # Extract secure hash
        vnp_secure_hash = params.get("vnp_SecureHash")
        if not vnp_secure_hash:
            return {"valid": False, "message": "Missing secure hash"}

        # Remove hash from params for validation
        params_to_verify = {k: v for k, v in params.items() if k != "vnp_SecureHash"}

        # Generate signature for verification
        calculated_hash = self._generate_signature(params_to_verify)

        # Verify signature (case-insensitive comparison)
        if vnp_secure_hash.upper() != calculated_hash.upper():
            return {"valid": False, "message": "Invalid signature"}

        # Check response code
        response_code = params.get("vnp_ResponseCode")
        txn_ref = params.get("vnp_TxnRef")
        amount = params.get("vnp_Amount")

        if response_code == "00":
            return {
                "valid": True,
                "success": True,
                "txn_ref": txn_ref,
                "amount": (
                    int(amount) // 100 if amount else 0
                ),  # Convert back from VNPAY format
                "transaction_no": params.get("vnp_TransactionNo"),
                "bank_code": params.get("vnp_BankCode"),
                "response_code": response_code,
            }
        else:
            return {
                "valid": True,
                "success": False,
                "txn_ref": txn_ref,
                "response_code": response_code,
                "message": self._get_response_message(response_code),
            }

    def _get_response_message(self, code):
        """Get human-readable message for VNPAY response code"""
        messages = {
            "00": "Giao dịch thành công",
            "07": "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).",
            "09": "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.",
            "10": "Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
            "11": "Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.",
            "12": "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.",
            "13": "Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).",
            "24": "Giao dịch không thành công do: Khách hàng hủy giao dịch",
            "51": "Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.",
            "65": "Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.",
            "75": "Ngân hàng thanh toán đang bảo trì.",
            "79": "Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định.",
            "99": "Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)",
        }
        return messages.get(code, "Lỗi không xác định")

    def query_transaction(self, txn_ref, txn_date):
        """
        Query transaction status from VNPAY

        Args:
            txn_ref: Transaction reference
            txn_date: Transaction date (YYYYMMDDHHMMSS)

        Returns:
            dict: Transaction status
        """
        request_id = datetime.now().strftime("%Y%m%d%H%M%S")

        params = {
            "vnp_RequestId": request_id,
            "vnp_Version": self.version,
            "vnp_Command": "querydr",
            "vnp_TmnCode": self.tmn_code,
            "vnp_TxnRef": txn_ref,
            "vnp_OrderInfo": f"Query transaction {txn_ref}",
            "vnp_TransactionDate": txn_date,
            "vnp_CreateDate": request_id,
            "vnp_IpAddr": "127.0.0.1",
        }

        # Generate secure hash
        secure_hash = self._generate_signature(params)
        params["vnp_SecureHash"] = secure_hash

        try:
            response = requests.post(self.api_url, json=params, timeout=30)
            return response.json()
        except Exception as e:
            return {
                "success": False,
                "message": f"Error querying transaction: {str(e)}",
            }
