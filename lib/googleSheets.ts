const { GoogleSpreadsheet } = require("google-spreadsheet");

const googleDoc = async (sheet_id: string) => {
  const doc = new GoogleSpreadsheet(sheet_id);

  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  });

  return doc;
};

const getTable = async (sheet_id: string, tableName: string) => {
  // assuming sheet and table exists
  const document = await googleDoc(sheet_id);

  await document.loadInfo();

  const table = document.sheetsByTitle[tableName];

  return table;
};

export const ifTableExists = async (sheet_id: string, tableName: string) => {
  const doc = await googleDoc(sheet_id);

  await doc.loadInfo();

  const tableTitleArray = Array.from(Object.keys(doc.sheetsByTitle));

  return tableTitleArray.some((title) => title === tableName);
};

export const getTableData = async (sheet_id: string, tableName: string) => {
  const table = await getTable(sheet_id, tableName);

  let rows: any[] = [];

  // table.getRows throws error if header row is not present
  // also if header rows are duplicate
  try {
    rows = await table.getRows();
  } catch (e) {
    rows = [];
  }

  if (rows.length) {
    const attributeNames = table.headerValues;

    return rows.map((row: any) => {
      let obj: Record<string, string> = {};

      attributeNames.forEach((attribute: string) => {
        obj[attribute] = row[attribute];
      });

      return obj;
    });
  } else {
    return [];
  }
};
