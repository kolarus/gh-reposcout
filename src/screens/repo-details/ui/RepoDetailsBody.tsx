import { RefreshControl, ScrollView, View } from 'react-native';

import { OwnerCard } from '@/entities/owner';
import {
  RepoDetailsSkeleton,
  RepoHero,
  RepoStats,
  type RepoRef,
} from '@/entities/repo';
import { RepoActions } from '@/features/repo-actions';
import { SaveToggle } from '@/features/save-repo';
import type { ApiError } from '@/shared/api';
import { strings } from '@/shared/i18n';
import {
  assertNever,
  formatMinutesUntil,
  formatRelativeTime,
  openExternalUrl,
  useNow,
} from '@/shared/lib';
import { useTheme } from '@/shared/theme';
import {
  Banner,
  ErrorBoundary,
  OfflineBanner,
  StateView,
  type IconName,
} from '@/shared/ui';

import { useStyles } from './RepoDetailsBody.styles';
import type { RepoDetailsView, RepoNotice } from '../model/repoDetailsView';
import { useRepoDetailsView } from '../useRepoDetailsView';

const copy = strings.repoDetails;

const openUrl = (url: string) => {
  void openExternalUrl(url);
};

function errorContent(error: ApiError): {
  icon: IconName;
  title: string;
  message: string;
} {
  switch (error.kind) {
    case 'network':
      return {
        icon: 'cloud-offline',
        title: strings.api.networkTitle,
        message: strings.api.networkMessage,
      };
    case 'http':
      return {
        icon: 'server',
        title: strings.api.serverTitle,
        message: strings.api.serverMessage,
      };
    case 'rate-limited':
    case 'not-found':
    case 'validation':
    case 'unexpected':
      return {
        icon: 'alert',
        title: strings.api.unexpectedTitle,
        message: strings.api.unexpectedMessage,
      };
    default:
      return assertNever(error);
  }
}

/** Details for a valid repo reference: every view state, one screen. */
export function RepoDetailsBody({ repoRef }: { repoRef: RepoRef }) {
  const theme = useTheme();
  const styles = useStyles();
  const now = useNow(60_000);
  const details = useRepoDetailsView(repoRef);

  const renderNotice = (notice: RepoNotice | undefined) => {
    if (notice === undefined) return null;
    switch (notice.kind) {
      case 'rate-limited':
        return (
          <Banner
            tone="warning"
            icon="clock"
            message={copy.rateLimitedNotice(
              formatMinutesUntil(notice.resetAt, now),
            )}
          />
        );
      case 'refresh-failed':
        return (
          <Banner
            tone="warning"
            icon="alert"
            message={copy.refreshFailed}
            action={{ label: strings.api.tryAgain, onPress: details.retry }}
          />
        );
      case 'saved-copy':
        return (
          <Banner
            tone="info"
            icon="bookmark-filled"
            message={copy.savedCopy(
              formatRelativeTime(notice.refreshedAt, new Date(now)),
            )}
          />
        );
      case 'gone':
        return <Banner tone="warning" icon="alert" message={copy.gone} />;
      default:
        return assertNever(notice);
    }
  };

  const renderView = (view: RepoDetailsView) => {
    switch (view.kind) {
      case 'loading':
        return (
          <View accessibilityLabel={copy.loading}>
            <RepoDetailsSkeleton />
          </View>
        );
      case 'not-found':
        return (
          <StateView
            icon="repo"
            title={copy.notFoundTitle}
            message={copy.notFoundMessage}
          />
        );
      case 'offline':
        return (
          <StateView
            icon="cloud-offline"
            title={copy.offlineTitle}
            message={copy.offlineMessage}
          />
        );
      case 'rate-limited':
        return (
          <StateView
            icon="clock"
            title={copy.rateLimitedTitle}
            message={copy.rateLimitedMessage(
              formatMinutesUntil(view.resetAt, now),
            )}
          />
        );
      case 'error': {
        const { icon, title, message } = errorContent(view.error);
        return (
          <StateView
            icon={icon}
            title={title}
            message={message}
            action={{ label: strings.api.tryAgain, onPress: details.retry }}
          />
        );
      }
      case 'repo': {
        const { repo } = view;
        return (
          <>
            {renderNotice(view.notice)}
            <ScrollView
              contentContainerStyle={styles.content}
              refreshControl={
                <RefreshControl
                  refreshing={details.isRefreshing}
                  onRefresh={() => {
                    void details.refresh();
                  }}
                  tintColor={theme.colors.accent}
                  colors={[theme.colors.accent]}
                  progressBackgroundColor={theme.colors.surface}
                />
              }
            >
              <RepoHero
                repo={repo}
                onOpenUrl={openUrl}
                avatarUri={details.savedAvatarUri}
              />
              <View style={styles.actions}>
                <View style={styles.mainActions}>
                  <RepoActions repo={repo} />
                </View>
                <View style={styles.saveBox}>
                  <SaveToggle repo={repo} />
                </View>
              </View>
              <RepoStats repo={repo} now={now} />
              {/* A per-section boundary (ADR-0018): if the owner card itself
                  breaks, the rest of Details stays up. */}
              <ErrorBoundary
                fallback={reset => (
                  <Banner
                    tone="danger"
                    icon="alert"
                    message={strings.owner.errorMessage}
                    action={{ label: strings.owner.retry, onPress: reset }}
                  />
                )}
              >
                <OwnerCard
                  login={repo.owner.login}
                  avatarUrl={repo.owner.avatarUrl}
                  savedAvatarUri={details.savedAvatarUri}
                  kind={repo.owner.kind}
                  section={details.ownerSection}
                  onLoadNow={details.loadOwner}
                  onRetry={details.retryOwner}
                  onOpenUrl={openUrl}
                />
              </ErrorBoundary>
            </ScrollView>
          </>
        );
      }
      default:
        return assertNever(view);
    }
  };

  return (
    <View style={styles.screen}>
      <OfflineBanner />
      {renderView(details.view)}
    </View>
  );
}
