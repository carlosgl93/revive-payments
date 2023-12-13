export async function fetchPayments(page: number, per_page: number) {
  const paymentsReq = await fetch(
    `https://app.payku.cl/api/transaction?date_init=2023-01-01&date_end=2023-12-31&success=true&page=${page}&per_page=${per_page}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: process.env.PAYKU_TOKEN as string,
      },
      timeout: 60000,
    } as any
  );

  return paymentsReq.json();
}
