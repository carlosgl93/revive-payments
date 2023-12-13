import {
  GoogleSpreadsheet,
  GoogleSpreadsheetWorksheet,
} from 'google-spreadsheet';

export async function sheetReseter(
  doc: GoogleSpreadsheet,
  sheet: GoogleSpreadsheetWorksheet,
  sheetTitle: string,
  sheetHeaders: string[]
) {
  console.log(`clearing ${sheetTitle}`);
  await sheet.delete();
  console.log(`CREATING ${sheetTitle}`);
  sheet = await doc.addSheet({
    title: sheetTitle,
    headerValues: sheetHeaders,
  });
  return sheet;
}
