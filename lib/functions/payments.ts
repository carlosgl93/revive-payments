import { google } from 'googleapis';
// import  SecretManagerClient  from '@google-cloud/secret-manager';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
// import { Handler } from 'aws-lambda';
import { LambdaEdgeEventType } from 'aws-cdk-lib/aws-cloudfront';

interface PaymentTransaction {
  id: string;
  status: string;
  created_at: string;
  email: string;
  full_name: string | null;
  amount: number;
  order: string;
  subject: string;
  payment: {
    start: string;
    end: string;
    media: string;
    transaction_id: string;
    payment_key: string;
    transaction_key: string | null;
    deposit_date: string;
    verification_key: string;
    authorization_code: string;
    last_4_digits: string;
    installments: number;
    card_type: string;
    additional_parameters: {
      direccion: string;
      departamento: string | null;
      comentarios: string | null;
      comuna: string | null;
      captador: string | null;
      detalle: string | null;
      region: string | null;
      rut: string | null;
      ciudad: string | null;
      pais: string | null;
      fechanacimiento: string | null;
    };
    currency: string;
  };
  subscriptions: {
    id: string;
    status: string;
  };
  gateway_response: {
    status: string;
    message: string;
  };
}

export const handler = async (event: LambdaEdgeEventType, context: any) => {
    const secretManagerClient = new SecretManagerServiceClient();
    // TODO : add google sheets api key secret name
    const apiKeySecretName = process.env.GOOGLE_SHEETS_API_KEY_SECRET_NAME!;
    // TODO : add google sheets spreadsheet id
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;
    // TODO: Create secret in the console GOOGLE_SHEETS_API_KEY_SECRET_NAME
  const [version] = await secretManagerClient.accessSecretVersion({ name: apiKeySecretName });
  const apiKey = version.payload?.data?.toString()!

const auth = new google.auth.GoogleAuth({
    credentials: {
    //   todo: create a google private key
        private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    //   todo: create a google client email
        
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  projectId: process.env.GOOGLE_PROJECT_ID,
  clientOptions: {
    // Set the API key directly on the client options
    // apiKey: 'AIzaSyCiUtI1Ss-U7G8Xorhplklg6wRGDhP7Bls',
  },
});
  const sheets = google.sheets({ version: 'v4', auth });

  // TODO: Get payment transactions from payment platform
  const paymentTransactions: PaymentTransaction[] = [];

  // Map payment transactions to rows in the spreadsheet
  const rows = paymentTransactions.map((transaction) => [
    transaction.id,
    transaction.created_at,
    transaction.payment.additional_parameters?.direccion,
    transaction.amount,
    transaction.order,
    transaction.status,
    null, // Organico
    transaction.payment.media,
    transaction.payment.deposit_date,
    null, // Número Guia2
    transaction.full_name,
    null, // Telefono
    null, // Telefono 2
    transaction.email,
    transaction.payment.additional_parameters?.comentarios,
    transaction.payment.additional_parameters?.region,
    null, // Sector
    null, // Latitud
    null, // Longitud
    transaction.subject,
    null, // Cobro 11/09
  ]);

  // Update the spreadsheet with the rows
  const range = 'Sheet1!A2:V';
  const valueInputOption = 'USER_ENTERED';
  const requestBody = {
    range,
    valueInputOption,
    resource: {
      values: rows,
    },
  };
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption,
    requestBody,
  });
};