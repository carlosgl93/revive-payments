import { Transaction } from '../models/Payment';

export function paymentsDataExtractor(paymentsData: Transaction[]) {
  const data = paymentsData.map((payment) => {
    const row = {
      full_name: payment.full_name,
      email: payment.email,
      amount: payment.amount,
      created_at: payment.created_at,
      status: payment.status,
      subject: payment.subject,
    };
    // TODO: Sort payments rowsByPayment by created_at
    return row;
  });
  return data;
}
