const { GoogleSpreadsheet } = require("google-spreadsheet");

const googleDoc = async (sheetId: string) => {
  const doc = new GoogleSpreadsheet(sheetId);

  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  });

  return doc;
};

const getTable = async (sheetId: string, tableName: string) => {
  // assuming sheet and table exists
  const document = await googleDoc(sheetId);

  await document.loadInfo();

  const table = document.sheetsByTitle[tableName];

  return table;
};

const dataFilter = (
  row: any,
  attributeNames: string[],
  filterObject: Record<string, string>
) => {
  return attributeNames.every((attribute) => {
    if (filterObject[attribute] && row[attribute]) {
      if (filterObject[attribute] !== row[attribute]) {
        return false;
      }
    }

    return true;
  });
};

export const ifTableExists = async (sheetId: string, tableName: string) => {
  const doc = await googleDoc(sheetId);

  await doc.loadInfo();

  const tableTitleArray = Array.from(Object.keys(doc.sheetsByTitle));

  return tableTitleArray.some((title) => title === tableName);
};

export const getTableData = async (
  sheetId: string,
  tableName: string,
  filterObject: Record<string, string>
) => {
  const table = await getTable(sheetId, tableName);

  let rows: any[] = [];

  // table.getRows throws error if header row is not present
  // also if header rows are duplicate
  try {
    rows = await table.getRows();
  } catch (e) {
    rows = [];
  }

  if (rows.length) {
    const attributeNames: string[] = table.headerValues;

    return rows
      .map((row: any) => {
        let obj: Record<string, string> = {};

        attributeNames.forEach((attribute: string) => {
          obj[attribute] = row[attribute];
        });

        return obj;
      })
      .filter((row) => dataFilter(row, attributeNames, filterObject));
  } else {
    return [];
  }
};

export const addTableData = async (
  sheetId: string,
  tableName: string,
  data: any[]
) => {
  const table = await getTable(sheetId, tableName);

  try {
    await table.loadHeaderRow();
  } catch (e) {
    return false;
  }

  const attributes = table.headerValues;

  // Normalize the insertion object
  // Only take values of having the header key
  // Ignore all others
  let insertionObject = data.map((d) => {
    let obj: Record<string, string> = {};

    Object.keys(d).forEach((key) => {
      if (attributes.includes(key)) {
        obj[key] = d[key];
      }
    });

    return obj;
  });

  for (let i = 0; i < insertionObject.length; i++) {
    await table.addRow(insertionObject[i]);
  }

  return true;
};

export const updateTableData = async (
  sheetId: string,
  tableName: string,
  filterObject: Record<string, string>,
  updateObject: Record<string, string>
) => {
  const table = await getTable(sheetId, tableName);

  let rows = [];

  // table.getRows throws error if header row is not present
  // also if header rows are duplicate
  try {
    rows = await table.getRows();
  } catch (e) {
    rows = [];
  }

  if (rows.length) {
    const attributeNames: string[] = table.headerValues;

    const rowsToUpdate = rows.filter((row: any) =>
      dataFilter(row, attributeNames, filterObject)
    );

    const count = rowsToUpdate.length;

    for (const row of rowsToUpdate) {
      for (const attribute of attributeNames) {
        if (row[attribute] && updateObject[attribute]) {
          row[attribute] = updateObject[attribute];
          await row.save();
        }
      }
    }

    return count;
  } else {
    return 0;
  }
};

export const deleteTableData = async (
  sheetId: string,
  tableName: string,
  filterObject: Record<string, string>
) => {
  const table = await getTable(sheetId, tableName);

  let rows = [];

  // table.getRows throws error if header row is not present
  // also if header rows are duplicate
  try {
    rows = await table.getRows();
  } catch (e) {
    rows = [];
  }

  if (rows.length) {
    const attributeNames: string[] = table.headerValues;

    const rowsToDelete = rows.filter((row: any) =>
      dataFilter(row, attributeNames, filterObject)
    );

    const count = rowsToDelete.length;

    // Go in reverse because array size changes in loop
    for (let i = rowsToDelete.length - 1; i >= 0; i--) {
      await rowsToDelete[i].delete();
    }

    return count;
  } else {
    return 0;
  }
};
