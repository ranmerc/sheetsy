import type { NextApiRequest, NextApiResponse } from "next";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/typings/supabase";
import { ifTableExists } from "@/lib/googleSheets";
import { errorMessageObject, getURLPattern, keyParam } from "@/lib/utils";
import {
  deleteHandler,
  getHandler,
  patchHandler,
  postHandler,
} from "@/lib/requestHandlers";

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

  if (req.method === "GET") {
    return await getHandler(req, res, sheetId, tableName, filterObject);
  }

  if (req.method === "POST") {
    return await postHandler(req, res, sheetId, tableName);
  }

  if (req.method === "DELETE") {
    return await deleteHandler(req, res, sheetId, tableName, filterObject);
  }

  if (req.method === "PATCH") {
    return await patchHandler(req, res, sheetId, tableName, filterObject);
  }

  res
    .status(405)
    .json(
      errorMessageObject("Method Not Allowed. Try GET, POST, DELETE, PATCH")
    );
}
