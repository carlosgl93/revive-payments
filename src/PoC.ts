import { config } from 'dotenv';
config();

import { Transaction } from '../models/Payment';
import {
  monthlyPrice,
  paymentFrequency,
  paymentsSheetHeaders,
  paymentsSheetTitle,
  testingSheetHeaders,
  testingSheetTitle,
} from './consts';
import { connectToSpreadsheet } from './connectToSpreadsheet';
import { fetchPaymentsData } from './paymentsFetcher';
import { sheetReseter } from './sheetReseter';
import { paymentsDataExtractor } from './paymentsDataExtractor';

export const main = async () => {
  // connecting to G Sheet
  const doc = connectToSpreadsheet();
  await doc.loadInfo();
  console.log(doc.title);
  console.log('fetching payments');
  console.log('IS THE CODE UPDATING?!?!!?!');

  // getting payku transactions from the whole year
  const paymentsData = await fetchPaymentsData();

  console.log('FETCHING CLIENTS SHEET ');
  let clientsTestSheet = doc.sheetsByTitle['Test-Clientes'];

  console.log('FETCHING TESTING SHEET ');
  let testingSheet = doc.sheetsByTitle.testing;

  let paymentsSheet = doc.sheetsByTitle['Test-Pagos'];

  // if paymentsSheet already exists, delete all content
  if (paymentsSheet) {
    paymentsSheet = await sheetReseter(
      doc,
      paymentsSheet,
      paymentsSheetTitle,
      paymentsSheetHeaders
    );
  }

  // if testingSheet already exists, delete all content
  if (testingSheet) {
    testingSheet = await sheetReseter(
      doc,
      testingSheet,
      testingSheetTitle,
      testingSheetHeaders
    );
  }

  const clientsTestData = await clientsTestSheet.getRows();

  const longTimeAgo = new Date(2000);
  const rowsByPayment = paymentsDataExtractor(paymentsData);

  // preping for the testing sheet
  const rows = clientsTestData.map((client: any) => {
    let result: {
      fullName: string;
      paymentAmount: number;
      paymentDate: Date;
      paymentStatus: string;
      paymentSubject: string;
    } = {
      fullName: '',
      paymentAmount: 0,
      paymentDate: longTimeAgo,
      paymentStatus: '',
      paymentSubject: '',
    };
    console.log('IS THE CODE UPDATING?!?!!?!');

    // const clientPayment = paymentsData.find((payment: Transaction) => payment.email === client.get('Email Contacto'))
    const email = client.get('Email Contacto');
    const full_name = client.get('Nombre Contacto');
    // CRITICAL LOGIC VULNERABILITY: IF CLIENT PAYS WITH DIFFERENT EMAIL THAN
    // THE ONE IN THE CLIENTS SHEET THEY WILL NOT HAVE THE PAYMENTS RECOGNIZED
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
          fullName: full_name,
          paymentAmount: t.amount,
          paymentDate: new Date(createdAtTime),
          paymentStatus: t.status,
          paymentSubject: t.subject,
        };
      }
    });

    // const inscripcion = client.get('Fecha Inscripcion').split('-');
    const inscripcionDateCL = client.get('Fecha Inscripcion');

    const payments = paymentsData.filter(
      (payment: any) => payment.email === email
    );

    console.log('IS THE CODE UPDATING?!?!!?!');

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

    console.log('IS THE CODE UPDATING?!?!!?!');

    const row: any = {
      full_name,
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
      const businessNumber = '56939167950';
      const whatsappLink = `https://wa.me/${businessNumber}?phone=${phoneNumber}&text=${encodeURIComponent(
        message
      )}`;
      row.whatsappLink = whatsappLink;
    }

    return row;
  });

  try {
    await testingSheet.addRows(rows);
    await paymentsSheet.addRows(rowsByPayment);
    // add new Date.now() to testing sheet on the column updatedAt
    await testingSheet.loadCells('M2');
    let dateCell = testingSheet.getCellByA1('M2');
    dateCell.value = new Date().toLocaleString('es-CL', {
      timeZone: 'America/Santiago',
    });
    dateCell.textFormat = {
      bold: true,
    };
    await testingSheet.saveUpdatedCells();
  } catch (error) {
    console.log('error adding rows', error);
  }
};

main();
