import type { NextApiRequest, NextApiResponse } from "next";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/typings/supabase";
import {
  addTableData,
  deleteTableData,
  updateTableData,
  getTableData,
  ifTableExists,
} from "@/lib/googleSheets";
import { errorMessageObject, getURLPattern, keyParam } from "@/lib/utils";

async function getHandler(
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

async function postHandler(
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

async function patchHandler(
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

async function deleteHandler(
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // TODO: add proper database types
  const supabaseClient = createServerSupabaseClient(
    { req, res },
    {
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    }
  );

  // key parameter required
  const key = await keyParam(req, res);

  if (!key) {
    return;
  }

  // should be /[]/[]/[]/
  const pattern = await getURLPattern(req, res);

  if (!pattern.length) {
    return;
  }

  let username = pattern[0];
  let projectName = pattern[1];
  let tableName = pattern[2];

  // Check if specified project and user exists
  const { data: userProjectCheck, error: userProjectCheckError } =
    await supabaseClient.rpc("user_project_check", {
      uname: username,
      pname: projectName,
    });

  if (!userProjectCheck && !userProjectCheckError) {
    res.status(404).json(errorMessageObject("User or project does not exists"));
    return;
  }

  if (userProjectCheckError) {
    res.status(500).json(errorMessageObject());
    return;
  }

  // Verify if user key combination is correct
  const { data: verifyUserKey, error: verifyUserKeyError } =
    await supabaseClient.rpc("verify_user_key", {
      uname: username,
      key: key,
    });

  if (!verifyUserKey && !verifyUserKeyError) {
    res.status(401).json(errorMessageObject("Invalid Key"));
    return;
  }

  if (verifyUserKeyError) {
    res.status(500).json(errorMessageObject());
    return;
  }

  // Get SheetId for the project
  let { data: sheetId, error: sheetIdError } = await supabaseClient.rpc(
    "get_user_project_id",
    {
      pname: projectName,
      uname: username,
    }
  );

  if (!sheetId && !sheetIdError) {
    res
      .status(404)
      .json(
        errorMessageObject(`No sheet_id specified for project ${projectName}`)
      );
    return;
  }

  if (sheetIdError) {
    res.status(500).json(errorMessageObject());
    return;
  }

  // Sheet exists in document
  const tableExists = await ifTableExists(sheetId, tableName);

  if (!tableExists) {
    res
      .status(404)
      .json(
        errorMessageObject(
          `Sheet '${tableName}' does not exists in document '${projectName}'`
        )
      );
    return;
  }

  // Filters recognition
  let filters = req.query.filter;

  if (!filters) {
    filters = [];
  }

  if (!Array.isArray(filters)) {
    filters = [filters];
  }

  // Single object that defines the filtering
  // Ideally should have same attributes as headers
  const filterObject = filters.reduce(
    (accumulator: Record<string, string>, current: string) => {
      // [key]value
      const attributeArray = current.match(/\[(.+)\](.+)/);

      if (attributeArray) {
        const attributeName = attributeArray[1];
        const attributeValue = attributeArray[2];

        accumulator[attributeName] = attributeValue;
      }

      return accumulator;
    },
    {}
  );

  // C - insert(POST) R - read(GET) -> with filter U - update(PATCH) D - delete(DELETE)
  if (req.method === "GET") {
    return await getHandler(req, res, sheetId, tableName, filterObject);
  } else if (req.method === "POST") {
    return await postHandler(req, res, sheetId, tableName);
  } else if (req.method === "DELETE") {
    return await deleteHandler(req, res, sheetId, tableName, filterObject);
  } else if (req.method === "PATCH") {
    return await patchHandler(req, res, sheetId, tableName, filterObject);
  }
}
