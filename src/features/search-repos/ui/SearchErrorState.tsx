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

function errorContent(error: ApiError): ErrorContent {
  switch (error.kind) {
    case 'network':
      return {
        icon: 'cloud-offline',
        title: copy.networkTitle,
        message: copy.networkMessage,
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
        title: copy.serverTitle,
        message: copy.serverMessage,
        canRetry: true,
      };
    case 'unexpected':
      return {
        icon: 'alert',
        title: copy.unexpectedTitle,
        message: copy.unexpectedMessage,
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
        ? { action: { label: copy.tryAgain, onPress: onRetry } }
        : {})}
    />
  );
}
