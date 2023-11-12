import { config } from 'dotenv';
config();
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { Payment, Transaction } from '../models/Payment';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const paymentFrequency = 30; // days
const monthlyPrice = 12000;

console.log(
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
);
console.log('process.env.GOOGLE_PRIVATE_KEY', process.env.GOOGLE_PRIVATE_KEY);

const jwtFromEnv = new JWT({
  //   email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  //   key: process.env.GOOGLE_PRIVATE_KEY,
  key: process.env.GOOGLE_PRIVATE_KEY!.split(String.raw`\n`).join('\n'),
  scopes: SCOPES,
});

const main = async () => {
  const doc = new GoogleSpreadsheet(
    process.env.GOOGLE_SPREADSHEET_ID as string,
    jwtFromEnv
  );
  await doc.loadInfo(); // loads document properties and worksheets
  console.log(doc.title);

  // const paymentsData = fetch('https://app.payku.cl/api',)
  // fetch from this url: https://app.payku.cl/api with this Bearer tkpubd0c5040ebacb24eb9b47d77ba0f
  console.log('fetching payments');

  let paymentsData: Transaction[] = [];
  let page = 1;
  let per_page = 100;
  let fetching = true;
  const paymentFrequency = 30;

  while (fetching) {
    const paymentsResponse = await fetch(
      `https://app.payku.cl/api/transaction?date_init=2023-01-01&date_end=2023-12-31&success=true&page=${page}&per_page=${per_page}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer tkpubd0c5040ebacb24eb9b47d77ba0f',
        },
        timeout: 60000,
      } as any
    );

    const data = await paymentsResponse.json();
    if (data.status === 'failed') {
      fetching = false;
      console.log('FETCHING PAYMENTS STOPED', data.message_error);
      break;
    }

    paymentsData = [...paymentsData, ...data.transaction];
    page++;
  }

  let clientsTestSheet = doc.sheetsByTitle['Test-Clientes'];
  console.log('FETCHING CLIENTS SHEET ');

  let testingSheet = doc.sheetsByTitle.testing;
  console.log('FETCHING TESTING SHEET ');

  let paymentsSheet = doc.sheetsByTitle['Test-Pagos'];

  if (!paymentsSheet) {
    console.log('CREATING PAYMENTS SHEET');
    paymentsSheet = await doc.addSheet({
      title: 'Test-Pagos',
      headerValues: [
        'email',
        'amount',
        'created_at',
        'status',
        'subject',
        'daysSinceLastPayment',
        'daysUntilNextPayment',
        'hasGap',
      ],
    });
  }

  if (!testingSheet) {
    console.log('CREATING TESTING SHEET');
    testingSheet = await doc.addSheet({
      title: 'testing',
      headerValues: [
        'email',
        'inscripcion',
        'totalAmountPaid',
        'monthsPaid',
        'monthsElapsed',
        'missingPaymentsInMonths',
        'daysSinceLastPayment',
        'daysUntilNextPayment',
        'status',
        'hasGap',
        'whatsappLink',
      ],
    });
  }

  const clientsTestData = await clientsTestSheet.getRows();

  const longTimeAgo = new Date(2000);
  const rowsByPayment = paymentsData.map((payment: Transaction) => {
    const row = {
      email: payment.email,
      amount: payment.amount,
      created_at: payment.created_at,
      status: payment.status,
      subject: payment.subject,
    };
    return row;
  });

  const rows = clientsTestData.map((client: any) => {
    let result: {
      paymentAmount: number;
      paymentDate: Date;
      paymentStatus: string;
      paymentSubject: string;
    } = {
      paymentAmount: 0,
      paymentDate: longTimeAgo,
      paymentStatus: '',
      paymentSubject: '',
    };

    // const clientPayment = paymentsData.find((payment: Transaction) => payment.email === client.get('Email Contacto'))
    const email = client.get('Email Contacto');
    const clientPayments = paymentsData.filter(
      (payment: Transaction) => payment.email === email
    );
    clientPayments.forEach((t, i) => {
      const createdAtTime = new Date(t.created_at).getTime();
      const lastPaymentTime = result.paymentDate.getTime();
      // if transaction time is more recent than last transaction time then overwrite result
      if (createdAtTime - lastPaymentTime > 0) {
        result = {
          ...result,
          paymentAmount: t.amount,
          paymentDate: new Date(createdAtTime),
          paymentStatus: t.status,
          paymentSubject: t.subject,
        };
      }
    });

    const inscripcion = client.get('Fecha Inscripcion').split('-');
    const inscripcionDateCL = client.get('Fecha Inscripcion');

    const payments = paymentsData.filter(
      (payment: any) => payment.email === email
    );
    const totalAmountPaid = payments.reduce(
      (total: number, payment: any) => total + payment.amount,
      0
    );
    const daysSinceInscripcion = Math.floor(
      (new Date().getTime() - new Date(inscripcionDateCL).getTime()) /
        1000 /
        60 /
        60 /
        24
    );
    const monthsPaid = Math.floor(totalAmountPaid / monthlyPrice);
    const monthsElapsed = Math.floor(daysSinceInscripcion / paymentFrequency);

    const lastPaymentTime = result.paymentDate.getTime();
    const expectedPaymentTime =
      lastPaymentTime + paymentFrequency * 24 * 60 * 60 * 1000;
    const actualPaymentTime = new Date().getTime();
    const daysSinceLastPayment = Math.floor(
      (actualPaymentTime - lastPaymentTime) / 1000 / 60 / 60 / 24
    );
    const daysUntilNextPayment = Math.floor(
      (expectedPaymentTime - actualPaymentTime) / 1000 / 60 / 60 / 24
    );

    const status =
      daysSinceLastPayment > paymentFrequency ? 'moroso' : 'al dia';

    //   client has gap if there are less payments than the amount of months elapsed + the number of days since last payment
    //   const hasGap = monthsPaid < new Date().getMonth() + 1;
    // if daysUntilNextPayment < 0 && monthsPaid < new Date().getMonth() + 1
    const hasGap =
      daysUntilNextPayment < 0 && monthsPaid < new Date().getMonth() + 1;
    //   if (new Date().getMonth() + 1 > monthsPaid )
    const missingPaymentsInMonths = new Date().getMonth() + 1 - monthsPaid;

    // const hasGap = totalAmountPaid %  !== 0;

    const row: any = {
      email,
      inscripcion: inscripcionDateCL,
      totalAmountPaid,
      monthsPaid,
      monthsElapsed,
      missingPaymentsInMonths,
      ...result,
      daysSinceLastPayment,
      daysUntilNextPayment,
      status,
      hasGap,
    };

    if (hasGap) {
      const message = `Hola, te escribo de Revive Hogar para recordarte que tienes ${missingPaymentsInMonths} pago(s) pendiente(s). Por favor, regulariza tu situación lo antes posible. Gracias.`;
      const phoneNumber = client.get('Telefono');
      const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
        message
      )}`;
      row.whatsappLink = whatsappLink;
    }

    return row;
  });

  try {
    await testingSheet.addRows(rows);
    await paymentsSheet.addRows(rowsByPayment);
  } catch (error) {
    console.log('error adding rows', error);
  }
};

main();
