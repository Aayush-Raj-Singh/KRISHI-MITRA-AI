import type { ApiEnvelope } from "../contracts/common";
import type { HttpClient } from "../client/createKrishiMitraApi";

export interface FeatureApiContext {
  api: HttpClient;
  unwrap: <T>(payload: ApiEnvelope<T>) => T;
}
