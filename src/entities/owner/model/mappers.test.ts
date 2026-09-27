import { buildUserDto, capturedUser } from '@/test/github';

import { toOwnerProfile } from './mappers';
import { ownerSchema } from '../api/owner.schema';

const parse = (value: unknown) => toOwnerProfile(ownerSchema.parse(value));

describe('ownerSchema + toOwnerProfile', () => {
  it('accepts a real GET /users/{login} response (contract)', () => {
    expect(parse(capturedUser)).toMatchObject({
      login: 'react',
      kind: 'organization',
      htmlUrl: 'https://github.com/react',
    });
  });

  it('maps a user profile, dropping blanks and non-https links', () => {
    expect(
      parse(
        buildUserDto('octo', {
          type: 'User',
          name: 'Octo Cat',
          bio: ' ',
          company: '@github',
          location: null,
          blog: 'http://octo.test',
          followers: 12,
          public_repos: 3,
        }),
      ),
    ).toMatchObject({
      login: 'octo',
      name: 'Octo Cat',
      kind: 'user',
      bio: undefined,
      company: '@github',
      location: undefined,
      blogUrl: undefined,
      followers: 12,
      publicRepos: 3,
    });
  });
});
