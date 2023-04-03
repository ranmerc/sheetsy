import { NextApiRequest, NextApiResponse } from "next";

export const errorMessageObject = (message = "Internal Server Error") => {
  return {
    data: [],
    error: message,
  };
};

export async function keyParam(req: NextApiRequest, res: NextApiResponse) {
  let { key } = req.query;

  if (!key) {
    res.status(403).json(errorMessageObject("API key required"));
    return "";
  }

  if (Array.isArray(key)) {
    key = key.join("");
  }

  return key;
}

export async function getURLPattern(req: NextApiRequest, res: NextApiResponse) {
  const slug = req.query.slug!;

  if (slug && slug.length !== 3) {
    res
      .status(400)
      .json(
        errorMessageObject(
          "Invalid API call. Should be /<username>/<project>/<table>"
        )
      );
    return [];
  }

  return slug;
}
