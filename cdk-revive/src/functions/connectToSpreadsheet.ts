import { GoogleSpreadsheet } from 'google-spreadsheet';
import { jwtFromEnv } from '../utils/consts';

export function connectToSpreadsheet() {
  return new GoogleSpreadsheet(
    process.env.GOOGLE_SPREADSHEET_ID as string,
    jwtFromEnv
  );
}
