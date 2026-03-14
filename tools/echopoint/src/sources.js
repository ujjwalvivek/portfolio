const gh = (path) => `https://api.github.com${path}`;

function githubRepoSources(owner, repo) {
    const prefix = `github:${repo}`;
    const base = `/repos/${owner}/${repo}`;

    return [
        { key: `${prefix}:repo`, url: gh(base), auth: 'github' },
        { key: `${prefix}:release`, url: gh(`${base}/releases/latest`), auth: 'github' },
        { key: `${prefix}:releases`, url: gh(`${base}/releases?per_page=5`), auth: 'github' },
        {
            key: `${prefix}:commits`, url: gh(`${base}/commits?per_page=5`), auth: 'github',
            transform: enrichCommits
        },
        { key: `${prefix}:contributors`, url: gh(`${base}/contributors?per_page=10`), auth: 'github' },
        { key: `${prefix}:tags`, url: gh(`${base}/tags?per_page=5`), auth: 'github' },
        { key: `${prefix}:deployments`, url: gh(`${base}/deployments?per_page=5`), auth: 'github' },
        { key: `${prefix}:langs`, url: gh(`${base}/languages`), auth: 'github' },
        { key: `${prefix}:user`, url: gh(`/users/${owner}`), auth: 'github' },
    ];
}

async function enrichCommits(commits, env) {
    if (!Array.isArray(commits)) return commits;

    const enriched = await Promise.all(
        commits.slice(0, 5).map(async (commit) => {
            try {
                const res = await fetch(commit.url, {
                    headers: githubHeaders(env),
                });
                const detail = await res.json();
                return {
                    sha: commit.sha,
                    message: commit.commit.message.split('\n')[0],
                    url: commit.html_url,
                    author: commit.commit.author?.name,
                    date: commit.commit.author?.date,
                    additions: detail.stats?.additions || 0,
                    deletions: detail.stats?.deletions || 0,
                };
            } catch {
                return {
                    sha: commit.sha,
                    message: commit.commit.message.split('\n')[0],
                    url: commit.html_url,
                    author: commit.commit.author?.name,
                    date: commit.commit.author?.date,
                    additions: 0,
                    deletions: 0,
                };
            }
        })
    );
    return enriched;
}

export function githubHeaders(env) {
    const headers = {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'echopoint-collector',
        'X-GitHub-Api-Version': '2022-11-28',
    };
    if (env.GITHUB_TOKEN) {
        headers['Authorization'] = `Bearer ${env.GITHUB_TOKEN}`;
    }
    return headers;
}

export const SOURCES = [
    //? repos
    ...githubRepoSources('ujjwalvivek', 'journey'),
    ...githubRepoSources('ujjwalvivek', 'synclippy'),
    ...githubRepoSources('ujjwalvivek', 'portfolio'),

    //? npm
    {
        key: 'npm:journey-engine',
        url: 'https://registry.npmjs.org/@ujjwalvivek/journey-engine/latest',
    },
    {
        key: 'npm:dino-blink',
        url: 'https://registry.npmjs.org/@ujjwalvivek/dino-blink/latest',
    },

    //? crates.io
    {
        key: 'crates:journey-engine',
        url: 'https://crates.io/api/v1/crates/journey-engine',
    },

    //? Docker Hub
    {
        key: 'docker:synclippy:tags',
        url: 'https://hub.docker.com/v2/namespaces/ujjwalvivek/repositories/synclippy/tags?page_size=10',
    },

    //? GitHub GraphQL for User Stats
    {
        key: 'github:ujjwalvivek:summary',
        url: 'https://api.github.com/graphql',
        method: 'POST',
        auth: 'github',
        body: (env) => {
            const currentYear = new Date().getFullYear();
            const startYear = 2016;
            const yearAliases = [];
            for (let y = startYear; y <= currentYear; y++) {
                yearAliases.push(`y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${y}-12-31T23:59:59Z") { contributionCalendar { totalContributions } restrictedContributionsCount }`);
            }
            return JSON.stringify({
                query: `
query userInfo($login: String!) {
  user(login: $login) {
    name
    login
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalRepositoriesWithContributedIssues
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
            color
          }
        }
      }
    }
    ${yearAliases.join('\n    ')}
  }
}
            `,
                variables: { login: 'ujjwalvivek' }
            });
        }
    }
];
