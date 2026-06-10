import { loadEnvironment } from "@coritech/config/environment";
import {
  createObjectStorageConfig,
  createObjectStorageProvider,
  createS3CompatibleFetchClient,
} from "@coritech/domain/storage/object-storage.mjs";
import type { ObjectStorageProvider } from "@coritech/domain/storage/object-storage.d.ts";

export function getDocumentObjectStorageProvider(
  source: Record<string, string | undefined> | NodeJS.ProcessEnv = process.env,
): ObjectStorageProvider {
  const environment = loadEnvironment(source);
  const config = createObjectStorageConfig(environment);
  const client = createS3CompatibleFetchClient({
    config,
    accessKey: environment.OBJECT_STORAGE_ACCESS_KEY,
    secretKey: environment.OBJECT_STORAGE_SECRET_KEY,
  });

  return createObjectStorageProvider({
    config,
    client,
  });
}
