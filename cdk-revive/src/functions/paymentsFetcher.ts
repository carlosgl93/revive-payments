// paymentFetcher.ts
import { Transaction } from '../models/Payment';
import { fetchPayments } from './fetchPayments';

export async function fetchPaymentsData() {
  let fetching = true;
  let page = 1;
  const per_page = 10;
  let paymentsData: Transaction[] = [];

  while (fetching) {
    const data = await fetchPayments(page, per_page);

    if (data.status === 'failed') {
      fetching = false;
      console.log('FETCHING PAYMENTS STOPPED', data.message_error);
      break;
    }

    paymentsData = [...paymentsData, ...data.transaction];
    page++;
  }

  return paymentsData;
}
