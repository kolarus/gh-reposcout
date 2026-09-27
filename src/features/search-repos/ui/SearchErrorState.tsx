import type { ApiError } from '@/shared/api';
import { strings } from '@/shared/i18n';
import { assertNever } from '@/shared/lib';
import { StateView, type IconName } from '@/shared/ui';

interface ErrorContent {
  icon: IconName;
  title: string;
  message: string;
  /** Rate limits resume on their own and invalid queries fail again: no retry. */
  canRetry: boolean;
}

const copy = strings.search.errors;
const api = strings.api;

function errorContent(error: ApiError): ErrorContent {
  switch (error.kind) {
    case 'network':
      return {
        icon: 'cloud-offline',
        title: api.networkTitle,
        message: api.networkMessage,
        canRetry: true,
      };
    case 'rate-limited':
      return {
        icon: 'clock',
        title: copy.rateLimitedTitle,
        message: copy.rateLimitedMessage,
        canRetry: false,
      };
    case 'validation':
      return {
        icon: 'alert',
        title: copy.invalidTitle,
        message: copy.invalidMessage,
        canRetry: false,
      };
    case 'not-found':
    case 'http':
      return {
        icon: 'server',
        title: api.serverTitle,
        message: api.serverMessage,
        canRetry: true,
      };
    case 'unexpected':
      return {
        icon: 'alert',
        title: api.unexpectedTitle,
        message: api.unexpectedMessage,
        canRetry: true,
      };
    default:
      return assertNever(error);
  }
}

/** The first page failed: a message specific to the error kind (ADR-0018). */
export function SearchErrorState({
  error,
  onRetry,
}: {
  error: ApiError;
  onRetry: () => void;
}) {
  const { icon, title, message, canRetry } = errorContent(error);
  return (
    <StateView
      icon={icon}
      title={title}
      message={message}
      {...(canRetry
        ? { action: { label: api.tryAgain, onPress: onRetry } }
        : {})}
    />
  );
}
