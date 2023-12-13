import { JWT } from 'google-auth-library';

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

export const monthlyPrice = 12000;

export const jwtFromEnv = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY!.split(String.raw`\n`).join('\n'),
  scopes: SCOPES,
});

export const paymentFrequency = 30;
export const paymentsSheetTitle = 'Test-Pagos';
export const paymentsSheetHeaders = [
  'full_name',
  'email',
  'amount',
  'created_at',
  'status',
  'subject',
  'daysSinceLastPayment',
  'daysUntilNextPayment',
  'hasGap',
];
export const testingSheetTitle = 'testing';
export const testingSheetHeaders = [
  'full_name',
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
  'updatedAt',
];
