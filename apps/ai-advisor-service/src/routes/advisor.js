import { Router } from "express";

import env from "../config/env.js";
import { resolveLanguage } from "../lib/languages.js";
import assertSafeAdvisorQuery from "../lib/safety.js";
import validateAdvisorRequest from "../lib/validation.js";

export const createAdvisorRouter = ({ advisorService }) => {
  const router = Router();

  router.post("/advisor", async (req, res, next) => {
    try {
      const payload = validateAdvisorRequest(req.body);
      assertSafeAdvisorQuery(payload.query);

      const language = resolveLanguage({
        bodyLanguage: payload.language,
        headerLanguage: req.get("x-language"),
        acceptLanguage: req.get("accept-language"),
        fallback: env.defaultLanguage,
      });

      const result = await advisorService.getAdvisorResponse({
        location: payload.location,
        crop: payload.crop,
        query: payload.query,
        language,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
};

export default createAdvisorRouter;
