import { NextApiRequest, NextApiResponse } from "next";
import {
  addTableData,
  deleteTableData,
  getTableData,
  updateTableData,
} from "./googleSheets";
import { errorMessageObject } from "./utils";

export async function getHandler(
  req: NextApiRequest,
  res: NextApiResponse,
  sheetId: string,
  tableName: string,
  filterObject: Record<string, string>
) {
  const tableData = await getTableData(sheetId, tableName, filterObject);

  res.status(200).json({
    data: tableData,
    error: "",
  });
  return;
}

export async function postHandler(
  req: NextApiRequest,
  res: NextApiResponse,
  sheetId: string,
  tableName: string
) {
  const body = req.body;

  if (body === null || Object.keys(body).length === 0) {
    res.status(403).json(errorMessageObject("Body missing"));
    return;
  }

  if (!Array.isArray(body)) {
    res.status(403).json(errorMessageObject("Array body expected"));
    return;
  }

  const success = await addTableData(sheetId, tableName, body);

  if (success) {
    res.status(200).json({
      data: ["Data added successfully"],
      error: "",
    });
    return;
  } else {
    res.status(500).json(errorMessageObject("Unable to add data"));
  }
}

export async function patchHandler(
  req: NextApiRequest,
  res: NextApiResponse,
  sheetId: string,
  tableName: string,
  filterObject: Record<string, string>
) {
  if (!filterObject || Object.keys(filterObject).length === 0) {
    res
      .status(403)
      .json(errorMessageObject("At least 1 filter required for patch"));
    return;
  }

  const body = req.body;

  if (body === null || Object.keys(body).length === 0) {
    res.status(403).json(errorMessageObject("Body missing"));
    return;
  }

  if (Array.isArray(body)) {
    res.status(403).json(errorMessageObject("Singular update object expected"));
    return;
  }

  const rowsUpdated = await updateTableData(
    sheetId,
    tableName,
    filterObject,
    body
  );

  res.status(200).json({
    message: `Updated ${rowsUpdated} rows`,
  });
}

export async function deleteHandler(
  req: NextApiRequest,
  res: NextApiResponse,
  sheetId: string,
  tableName: string,
  filterObject: Record<string, string>
) {
  const rowsDeleted = await deleteTableData(sheetId, tableName, filterObject);

  res.status(200).json({
    message: `Deleted ${rowsDeleted} rows`,
  });
}
