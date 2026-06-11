import { loadEnvironment } from "@coritech/config/environment";
import { createEmailProvider } from "@coritech/domain/notifications/email-provider.mjs";
import { createNotificationOrchestrationService } from "@coritech/domain/notifications/notification-orchestration.mjs";
import type { NotificationOrchestrationService } from "@coritech/domain/notifications/notification-orchestration.d.ts";

import { createPrismaNotificationLogRepository } from "./prisma-notification-log-repository";
import { createPrismaNotificationRecipientResolver } from "./prisma-notification-recipient-resolver";

export function createNotificationService(
  source: Record<string, string | undefined> | NodeJS.ProcessEnv = process.env,
): NotificationOrchestrationService {
  const config = loadEnvironment(source);
  const provider = createEmailProvider({
    provider: config.EMAIL_PROVIDER,
    endpoint: config.EMAIL_PROVIDER_ENDPOINT,
    apiKey: config.EMAIL_PROVIDER_API_KEY,
    fromAddress: config.EMAIL_FROM_ADDRESS,
    fromName: config.EMAIL_FROM_NAME,
  });

  return createNotificationOrchestrationService({
    provider,
    logRepository: createPrismaNotificationLogRepository(),
    recipientResolver: createPrismaNotificationRecipientResolver(),
  });
}
