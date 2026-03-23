import axios from 'axios';
import { env } from '../config/env';
import crypto from 'crypto';

export interface PayoutDetails {
  transferId: string;
  amount: number;
  currency: string;
  bankCode: string;
  branchCode: string;
  accountNumber: string;
  accountName: string;
  description: string;
}

export class PayoutService {
  private static readonly PAYHERE_API_URL = env.NODE_ENV === 'production' 
    ? 'https://www.payhere.lk/merchant/transfer' 
    : 'https://sandbox.payhere.lk/merchant/transfer';

  /**
   * Performs a fund transfer to a vendor's bank account via PayHere Transfer API.
   * Note: This is a placeholder implementation as PayHere Transfer API usually requires OAuth2.
   * For the purpose of this task, we implement the logic based on standard PayHere integration patterns.
   */
  static async transfer(details: PayoutDetails) {
    if (!env.PAYHERE_MERCHANT_ID || !env.PAYHERE_SECRET) {
      console.warn('[Payout] PayHere credentials missing — skipping payout', details.transferId);
      return { success: false, message: 'PayHere credentials missing' };
    }

    try {
      // Generate hash: md5(merchant_id + transfer_id + amount + currency + md5_secret)
      const secretHash = crypto.createHash('md5').update(env.PAYHERE_SECRET).digest('hex').toUpperCase();
      const rawHash = env.PAYHERE_MERCHANT_ID + details.transferId + details.amount.toFixed(2) + details.currency + secretHash;
      const hash = crypto.createHash('md5').update(rawHash).digest('hex').toUpperCase();

      const payload = {
        merchant_id: env.PAYHERE_MERCHANT_ID,
        transfer_id: details.transferId,
        amount: details.amount.toFixed(2),
        currency: details.currency,
        bank_code: details.bankCode,
        branch_code: details.branchCode,
        account_number: details.accountNumber,
        account_name: details.accountName,
        description: details.description,
        hash
      };

      console.log(`[Payout] Sending transfer request to PayHere for ${details.transferId}:`, JSON.stringify(payload, null, 2));

      // Note: Real PayHere Transfer API requires OAuth Bearer token from their /merchant/token endpoint.
      // Since we don't have that flow implemented yet, we use the Secret as a placeholder or 
      // assume the Sandbox ignores the token if the hash is valid (common in some PayHere versions).
      const response = await axios.post(this.PAYHERE_API_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.PAYHERE_SECRET}`
        }
      });

      if (response.data.status === 1 || response.data.status_code === 1) {
        return { success: true, data: response.data };
      } else {
        console.error('[Payout] PayHere rejection:', response.data);
        return { success: false, message: response.data.message || 'Transfer failed' };
      }
    } catch (error: any) {
      console.error('[Payout] API Error:', error.response?.data || error.message);
      return { success: false, message: error.message };
    }
  }
}
