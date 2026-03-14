import { useEffect, useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import styles from './GithubNavigator.module.css';

import { FaFile, FaGithub, FaJs } from 'react-icons/fa';
import { MdContentCopy, MdExitToApp } from 'react-icons/md';
import { RiSidebarUnfoldLine, RiMarkdownFill } from 'react-icons/ri';
import { VscVscode } from 'react-icons/vsc';

import {
  TbBrandPowershell,
  TbFileTypeCss,
  TbFileTypeHtml,
  TbFileTypeJs,
  TbFileTypeTxt,
  TbLicense,
} from 'react-icons/tb';
import { AiTwotoneFileMarkdown, AiFillSave } from 'react-icons/ai';
import { BsFiletypeJson } from 'react-icons/bs';
import { SiCsswizardry, SiHtml5, SiJson, SiToml, SiYaml } from 'react-icons/si';
import { IoTerminalSharp } from 'react-icons/io5';
import { ImFolder } from 'react-icons/im';

const MAX_CAT_LINES = 50;
const MAX_EDITOR_BYTES = 1024 * 1024;
const QUICK_COMMANDS = ['help', 'ls src', 'tree 2', 'find .js', 'code README.md'];
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const LANGUAGE_MAP = {
  js: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx',
  css: 'css', scss: 'scss', sass: 'scss', html: 'markup',
  json: 'json', jsonc: 'json', md: 'markdown', py: 'python',
  java: 'java', cpp: 'cpp', c: 'c', php: 'php', go: 'go',
  rs: 'rust', yml: 'yaml', yaml: 'yaml', xml: 'xml',
  sql: 'sql', sh: 'bash', bash: 'bash', toml: 'toml',
  dockerfile: 'docker', rb: 'ruby', swift: 'swift', kt: 'kotlin',
};
const HELP_GROUPS = [
  {
    title: 'navigation',
    commands: [
      ['ls [path]', 'List directory contents'],
      ['cd [dir]', 'Enter a directory'],
      ['pwd', 'Show current repo path'],
      ['tree [n]', 'Render directory tree'],
    ],
  },
  {
    title: 'files',
    commands: [
      ['cat [file]', 'Preview file contents'],
      ['code [file]', 'Open file buffer'],
      ['find [name]', 'Search files and folders'],
    ],
  },
  {
    title: 'session',
    commands: [
      ['help', 'Show command reference'],
      ['clear', 'Clear transcript'],
      ['exit', 'Close the navigator'],
    ],
  },
];
const EDITOR_SHORTCUTS = [
  ['Ctrl+S', 'Download buffer'],
  ['Ctrl+Q', 'Close buffer'],
];

const formatShellPath = (path) => `~/${path || 'root'}`;
const formatAbsolutePath = (path) => `/${path || 'root'}`;

const formatDate = (value, withTime = false) => {
  if (!value) { return 'unknown'; }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) { return 'unknown'; }

  return withTime ? parsed.toLocaleString() : parsed.toLocaleDateString();
};

const formatFileSize = (bytes = 0) => {
  if (!Number.isFinite(bytes) || bytes <= 0) { return '0 B'; }

  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const digits = value >= 10 || unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[unitIndex]}`;
};

const decodeBase64Content = (encodedContent = '') => {
  const binary = atob(encodedContent);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
};

const parseCommandLine = (commandLine) => {
  const args = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let index = 0; index < commandLine.length; index += 1) {
    const char = commandLine[index];

    if ((char === '"' || char === '\'') && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
      continue;
    }

    if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = '';
      continue;
    }

    if (char === ' ' && !inQuotes) {
      if (current) {
        args.push(current);
        current = '';
      }

      continue;
    }

    current += char;
  }

  if (current) {
    args.push(current);
  }

  return args;
};

const resolveRepoPath = (basePath, rawPath = '') => {
  const pathParts = basePath ? basePath.split('/').filter(Boolean) : [];
  const input = rawPath.replace(/^\/+/, '');
  const segments = input.split('/').filter(Boolean);

  if (rawPath.startsWith('/')) {
    pathParts.length = 0;
  }

  segments.forEach((segment) => {
    if (segment === '.') {
      return;
    }

    if (segment === '..') {
      pathParts.pop();
      return;
    }

    pathParts.push(segment);
  });

  return pathParts.join('/');
};

const downloadBuffer = (fileName, content) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
};

const TONE_CLASSES = {
  success: styles.entryToneSuccess,
  warning: styles.entryToneWarning,
  error: styles.entryToneError,
  muted: styles.entryToneMuted,
};

const getToneClass = (tone) => TONE_CLASSES[tone] ?? styles.entryToneInfo;

const BootEntry = ({ entry }) => (
  <header className={styles.bootHeader}>
    <section className={styles.bootSection}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>recent commits</span>
      </div>
      <div className={styles.contentList}>
        {entry.commits.map((commit) => (
          <article key={`${commit.message}-${commit.date}`} className={styles.commitRow}>
            <span className={styles.commitMessage}>{commit.message}</span>
            <span className={styles.commitDate}>{formatDate(commit.date, true)}</span>
          </article>
        ))}
      </div>
    </section>

    <section className={styles.bootSection}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>repository</span>
      </div>
      <div className={styles.bootIdentity}>
        <h2 className={styles.bootTitle}>{entry.repo.name}</h2>
        <p className={styles.bootDescription}>{entry.repo.description || 'No repository description available.'}</p>
        <div className={styles.bootMetaGrid}>
          <span className={styles.bootMetaLabel}>branch</span>
          <span className={styles.bootMetaValue}>{entry.repo.default_branch}</span>
          <span className={styles.bootMetaLabel}>created</span>
          <span className={styles.bootMetaValue}>{formatDate(entry.repo.created_at)}</span>
          <span className={styles.bootMetaLabel}>activity</span>
          <span className={styles.bootMetaValue}>{formatDate(entry.lastActivity, true)}</span>
        </div>
      </div>
    </section>

    <section className={styles.bootSection}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>statistics</span>
      </div>
      <div className={styles.bootStatList}>
        <div className={styles.bootStatItem}>
          <span className={styles.bootStatLabel}>stars</span>
          <span className={styles.bootStatValue}>{entry.repo.stargazers_count}</span>
        </div>
        <div className={styles.bootStatItem}>
          <span className={styles.bootStatLabel}>forks</span>
          <span className={styles.bootStatValue}>{entry.repo.forks_count}</span>
        </div>
        <div className={styles.bootStatItem}>
          <span className={styles.bootStatLabel}>size</span>
          <span className={styles.bootStatValue}>{formatFileSize(entry.repo.size * 1024)}</span>
        </div>
        <div className={styles.bootStatItem}>
          <span className={styles.bootStatLabel}>repos</span>
          <span className={styles.bootStatValue}>{entry.user.public_repos}</span>
        </div>
      </div>
    </section>

    <section className={styles.bootSection}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>languages</span>
      </div>
      <div className={styles.contentList}>
        {entry.languages.map((language) => (
          <div key={language.name} className={styles.languageRow}>
            <div className={styles.languageRowHeader}>
              <span className={styles.languageName}>{language.icon}{language.name}</span>
              <span className={styles.languagePercent}>{language.percentage}%</span>
            </div>
            <div className={styles.languageBarTrack}>
              <div className={styles.languageBarFill} style={{ width: `${language.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  </header>
);

const PromptEntry = ({ entry }) => (
  <div className={styles.promptEntry}>
    <span className={styles.promptEntryPath}>{entry.prompt}</span>
    <span className={styles.promptEntryCommand}>{entry.command || ' '}</span>
  </div>
);

const MessageEntry = ({ entry }) => (
  <section className={`${styles.entryPanel} ${getToneClass(entry.tone)}`}>
    {entry.title && (
      <header className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>{entry.title}</span>
        {entry.meta && <span className={styles.sectionMeta}>{entry.meta}</span>}
      </header>
    )}

    <div className={styles.contentList}>
      {entry.lines.map((line, index) => (
        <p key={`${entry.title || 'line'}-${index}`} className={styles.messageLine}>{line}</p>
      ))}
    </div>
  </section>
);

const DirectoryEntry = ({ entry }) => (
  <section className={styles.entryPanel}>
    <header className={styles.sectionHeader}>
      <span className={styles.sectionTitle}>{entry.title}</span>
      <span className={styles.sectionMeta}>{entry.meta}</span>
    </header>

    <div className={styles.directoryTable}>
      <div className={styles.directoryHead}>
        <span>name</span>
        <span>type</span>
        <span>size</span>
      </div>

      {entry.items.map((item) => (
        <button
          key={item.path}
          type="button"
          className={styles.directoryRow}
        >
          <span className={styles.directoryName}>
            <span className={styles.itemIcon}>{item.icon}</span>
            {item.name}
          </span>
          <span className={styles.directoryTag}>{item.type === 'dir' ? 'dir' : 'file'}</span>
          <span className={styles.directorySize}>{item.type === 'dir' ? '--' : formatFileSize(item.size)}</span>
        </button>
      ))}
    </div>
  </section>
);

const TreeEntry = ({ entry }) => (
  <section className={styles.entryPanel}>
    <header className={styles.sectionHeader}>
      <span className={styles.sectionTitle}>{entry.title}</span>
      <span className={styles.sectionMeta}>{entry.meta}</span>
    </header>

    <div className={styles.treeList}>
      {entry.nodes.map((node) => (
        <button
          key={`${node.path}-${node.depth}`}
          type="button"
          className={styles.treeRow}
        >
          <span
            className={styles.treeMain}
          >
            <span className={styles.treeConnector}>{node.connector}</span>
            <span className={styles.itemIcon}>{node.icon}</span>
            <span className={styles.treeItemName}>{node.name}</span>
          </span>
          <span className={styles.treeItemPath}>{node.path}</span>
        </button>
      ))}
    </div>
  </section>
);

const FileEntry = ({ entry }) => (
  <section className={styles.entryPanel}>
    <header className={styles.sectionHeader}>
      <span className={styles.sectionTitle}>{entry.fileName}</span>
      <span className={styles.sectionMeta}>
        {entry.displayedLines.length} line(s) shown{entry.truncated ? ` of ${entry.totalLines}` : ''}
      </span>
    </header>

    <div className={styles.filePreviewBlock}>
      {entry.displayedLines.map((line, index) => (
        <div key={`${entry.filePath}-${index + 1}`} className={styles.filePreviewRow}>
          <span className={styles.filePreviewNumber}>{index + 1}</span>
          <code className={styles.filePreviewText}>{line || ' '}</code>
        </div>
      ))}
    </div>

    {entry.truncated && (
      <div className={styles.panelFooter}>
        <span>Use `code {entry.fileName}` for the full buffer.</span>
      </div>
    )}
  </section>
);

const HelpEntry = () => (
  <section className={styles.entryPanel}>
    <header className={styles.sectionHeader}>
      <span className={styles.sectionTitle}>command reference</span>
      <span className={styles.sectionMeta}>terminal and editor shortcuts</span>
    </header>

    <div className={styles.helpGrid}>
      {HELP_GROUPS.map((group) => (
        <section key={group.title} className={styles.helpGroup}>
          <span className={styles.helpGroupTitle}>{group.title}</span>
          <div className={styles.contentList}>
            {group.commands.map(([command, description]) => (
              <div key={command} className={styles.helpCommandRow}>
                <code className={styles.helpCommand}>{command}</code>
                <span className={styles.helpDescription}>{description}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>

    <div className={styles.panelFooter}>
      {EDITOR_SHORTCUTS.map(([shortcut, description]) => (
        <span key={shortcut} className={styles.shortcutChip}>
          <strong>{shortcut}</strong> {description}
        </span>
      ))}
    </div>
  </section>
);

const EditorPanel = ({ editorState }) => {
  const lineCount = editorState.draft.split('\n').length;

  return (
    <div className={styles.editorShell}>
      <div className={styles.editorViewport}>
        <SyntaxHighlighter
          language={editorState.language}
          style={vscDarkPlus}
          showLineNumbers
          wrapLongLines={false}
          customStyle={{
            margin: 0,
            padding: '10px 0',
            background: 'transparent',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            lineHeight: '1.5rem',
            height: '100%',
            overflow: 'auto',
            boxSizing: 'border-box',
          }}
          lineNumberStyle={{
            minWidth: '52px',
            paddingRight: '12px',
            textAlign: 'right',
            fontSize: '0.72rem',
            lineHeight: '1.5rem',
            userSelect: 'none',
            color: '#666a71',
          }}
          codeTagProps={{ style: { fontFamily: 'var(--font-mono)', lineHeight: '1.5rem' } }}
        >
          {editorState.draft}
        </SyntaxHighlighter>
      </div>

      <div className={styles.editorFooter}>
        <span className={styles.editorFooterItem}>READ ONLY</span>
        <span className={styles.editorFooterItem}>{lineCount} LINE(S)</span>
        {editorState.statusMessage && (
          <span className={styles.editorFooterItem}>{editorState.statusMessage}</span>
        )}
        <div className={styles.editorFooterShortcuts}>
          {EDITOR_SHORTCUTS.map(([shortcut, description]) => (
            <span key={shortcut} className={styles.shortcutChip}>
              <strong>{shortcut}</strong> {description}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const TerminalEntry = ({ entry }) => {
  switch (entry.kind) {
    case 'boot':
      return <BootEntry entry={entry} />;
    case 'prompt':
      return <PromptEntry entry={entry} />;
    case 'message':
      return <MessageEntry entry={entry} />;
    case 'directory':
      return <DirectoryEntry entry={entry} />;
    case 'tree':
      return <TreeEntry entry={entry} />;
    case 'file':
      return <FileEntry entry={entry} />;
    case 'help':
      return <HelpEntry />;
    default:
      return (
        <section className={`${styles.entryPanel} ${styles.entryToneWarning}`}>
          <div className={styles.contentList}>
            <p className={styles.messageLine}>Unknown terminal entry type: {entry.kind}</p>
          </div>
        </section>
      );
  }
};

const GithubNavigator = ({ isOpen, onClose }) => {
  const ECHOPOINT = 'https://echopoint.ujjwalvivek.com';
  const REPO_NAME = 'portfolio';
  const GITHUB_REPO = `ujjwalvivek/${REPO_NAME}`;

  const [currentPath, setCurrentPath] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [inputValue, setInputValue] = useState('');
  const [copied, setCopied] = useState(false);
  const [terminalEntries, setTerminalEntries] = useState([]);
  const [editorState, setEditorState] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [spinnerFrame, setSpinnerFrame] = useState(0);

  const inputRef = useRef(null);
  const outputRef = useRef(null);
  const fileCache = useRef(new Map());
  const nextEntryIdRef = useRef(0);
  const copyTimeoutRef = useRef(null);
  const editorStatusTimeoutRef = useRef(null);
  const transcriptPromptRef = useRef(null);
  const spinnerIntervalRef = useRef(null);

  const currentGithubUrl = `https://github.com/${GITHUB_REPO}${currentPath ? `/${currentPath}` : ''}`;

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const icons = {
      js: <TbFileTypeJs />,
      css: <TbFileTypeCss />,
      html: <TbFileTypeHtml />,
      md: <AiTwotoneFileMarkdown />,
      json: <BsFiletypeJson />,
      yml: <SiYaml />,
      yaml: <SiYaml />,
      sh: <TbBrandPowershell />,
      toml: <SiToml />,
      license: <TbLicense />,
      txt: <TbFileTypeTxt />,
    };

    return icons[ext] || <FaFile />;
  };

  const getLanguageIcon = (language) => {
    const icons = {
      JavaScript: <FaJs />,
      HTML: <SiHtml5 />,
      CSS: <SiCsswizardry />,
      Shell: <IoTerminalSharp />,
      JSON: <SiJson />,
      YAML: <SiYaml />,
      Markdown: <RiMarkdownFill />,
      TOML: <SiToml />,
    };

    return icons[language] || <FaFile />;
  };

  const createEntry = (kind, payload = {}) => {
    const nextId = nextEntryIdRef.current;
    nextEntryIdRef.current += 1;
    return {
      id: `terminal-entry-${nextId}`,
      kind,
      ...payload,
    };
  };

  const pushEntries = (entries) => {
    const nextEntries = Array.isArray(entries) ? entries.filter(Boolean) : [entries].filter(Boolean);

    if (!nextEntries.length) {
      return;
    }

    setTerminalEntries((previousEntries) => [...previousEntries, ...nextEntries]);
  };

  const createMessageEntry = (tone, title, lines, meta = '') => (
    createEntry('message', { tone, title, lines, meta })
  );

  const setEditorStatus = (message) => {
    clearTimeout(editorStatusTimeoutRef.current);

    setEditorState((previousState) => {
      if (!previousState) {
        return previousState;
      }

      return {
        ...previousState,
        statusMessage: message,
      };
    });

    editorStatusTimeoutRef.current = setTimeout(() => {
      setEditorState((previousState) => {
        if (!previousState) {
          return previousState;
        }

        return {
          ...previousState,
          statusMessage: '',
        };
      });
    }, 1800);
  };

  const fetchStoreKey = async (key) => {
    const response = await fetch(`${ECHOPOINT}/v1/store/${encodeURIComponent(key)}`);

    if (!response.ok) {
      throw new Error(`Store request failed with ${response.status}`);
    }

    return response.json();
  };

  const fetchGitHubContent = async (path = '') => {
    if (fileCache.current.has(path)) {
      return fileCache.current.get(path);
    }

    const params = new URLSearchParams({ repo: REPO_NAME });

    if (path) {
      params.set('path', path);
    }

    const response = await fetch(`${ECHOPOINT}/v1/github/contents?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to load content (${response.status})`);
    }

    const data = await response.json();
    fileCache.current.set(path, data);
    return data;
  };

  const buildBootEntry = (repo, user, commits, languages) => {
    const totalBytes = Math.max(
      Object.values(languages || {}).reduce((total, value) => total + value, 0),
      1,
    );

    const topLanguages = Object.entries(languages || {})
      .sort(([, left], [, right]) => right - left)
      .slice(0, 4)
      .map(([name, bytes]) => ({
        name,
        icon: getLanguageIcon(name),
        percentage: Number(((bytes / totalBytes) * 100).toFixed(1)),
      }));

    const normalizedCommits = (commits || []).slice(0, 3).map((commit) => ({
      message: commit.message || commit.commit?.message || 'No commit message',
      date: commit.date || commit.commit?.author?.date,
    }));

    return createEntry('boot', {
      repo,
      user,
      commits: normalizedCommits,
      languages: topLanguages,
      lastActivity: normalizedCommits[0]?.date,
    });
  };

  const initializeTerminal = async () => {
    nextEntryIdRef.current = 0;
    fileCache.current.clear();
    setCurrentPath('');
    setInputValue('');
    setCommandHistory([]);
    setHistoryIndex(-1);
    setEditorState(null);
    setTerminalEntries([
      createMessageEntry('muted', 'boot', ['Connecting to repository proxy...', 'Hydrating terminal workspace...']),
    ]);

    try {
      const [repoData, userData, commitsData, languagesData] = await Promise.all([
        fetchStoreKey('github:portfolio:repo'),
        fetchStoreKey('github:portfolio:user'),
        fetchStoreKey('github:portfolio:commits'),
        fetchStoreKey('github:portfolio:langs'),
      ]);

      setTerminalEntries([buildBootEntry(repoData, userData, commitsData, languagesData)]);
    } catch (error) {
      setTerminalEntries([
        createMessageEntry(
          'warning',
          'limited mode',
          [
            `GitHub telemetry is unavailable: ${error.message}`,
            'Core commands still work against the repo proxy.',
            'Try help, ls, tree, find, cat, or code.',
          ],
          'proxy offline',
        ),
      ]);
    }
  };

  const openInlineEditor = async (filePath, fileName) => {
    try {
      const fileData = await fetchGitHubContent(filePath);

      if (fileData.type !== 'file') {
        pushEntries(createMessageEntry('error', 'editor', [`${fileName} is not a file.`]));
        return false;
      }

      let content = '';

      try {
        content = fileData.content ? decodeBase64Content(fileData.content) : '';
      } catch (decodeError) {
        content = `Unable to decode ${fileName}: ${decodeError.message}`;
      }

      if (fileData.size > MAX_EDITOR_BYTES) {
        content = [
          `File too large to display locally (${formatFileSize(fileData.size)}).`,
          '',
          'Use the VS Code.dev action for the full remote viewer.',
        ].join('\n');
      }

      const ext = fileName.split('.').pop().toLowerCase();
      const language = LANGUAGE_MAP[ext] || 'text';

      setEditorState({
        fileName,
        filePath,
        draft: content,
        language,
        statusMessage: '',
      });

      return true;
    } catch (error) {
      pushEntries(createMessageEntry('error', 'editor', [`Unable to open ${fileName}: ${error.message}`]));
      return false;
    }
  };

  const closeEditor = () => {
    setEditorState(null);
  };

  const commands = {
    ls: async (args) => {
      try {
        const targetPath = args[0] ? resolveRepoPath(currentPath, args[0]) : currentPath;
        const contents = await fetchGitHubContent(targetPath);

        if (!Array.isArray(contents)) {
          return createMessageEntry(
            'info',
            'file info',
            [`${contents.name} | ${formatFileSize(contents.size)} | file`],
            formatAbsolutePath(targetPath),
          );
        }

        return createEntry('directory', {
          title: targetPath ? `listing ${formatShellPath(targetPath)}` : 'listing ~/root',
          meta: `${contents.length} item(s)`,
          items: contents.map((item) => ({
            name: item.name,
            path: item.path,
            size: item.size,
            type: item.type,
            icon: item.type === 'dir' ? <ImFolder /> : getFileIcon(item.name),
          })),
        });
      } catch (error) {
        return createMessageEntry('error', 'ls', [error.message]);
      }
    },

    cd: async (args) => {
      if (!args[0]) {
        setCurrentPath('');
        return createMessageEntry('success', 'directory', ['Changed to ~/root']);
      }

      const nextPath = resolveRepoPath(currentPath, args[0]);

      try {
        const contents = await fetchGitHubContent(nextPath);

        if (!Array.isArray(contents)) {
          return createMessageEntry('error', 'directory', [`${args[0]} is not a directory.`]);
        }

        setCurrentPath(nextPath);
        return createMessageEntry('success', 'directory', [`Changed to ${formatShellPath(nextPath)}`]);
      } catch (error) {
        return createMessageEntry('error', 'directory', [`Unable to enter ${args[0]}: ${error.message}`]);
      }
    },

    cat: async (args) => {
      if (!args[0]) {
        return createMessageEntry('warning', 'cat', ['Usage: cat <filename>']);
      }

      const filePath = resolveRepoPath(currentPath, args[0]);

      try {
        const fileData = await fetchGitHubContent(filePath);

        if (fileData.type !== 'file') {
          return createMessageEntry('error', 'cat', [`${args[0]} is not a file.`]);
        }

        const content = fileData.content ? decodeBase64Content(fileData.content) : '';
        const lines = content.split('\n');

        return createEntry('file', {
          fileName: args[0],
          filePath,
          displayedLines: lines.slice(0, MAX_CAT_LINES),
          totalLines: lines.length,
          truncated: lines.length > MAX_CAT_LINES,
        });
      } catch (error) {
        return createMessageEntry('error', 'cat', [`Unable to read ${args[0]}: ${error.message}`]);
      }
    },

    code: async (args) => {
      if (!args[0]) {
        return createMessageEntry('warning', 'code', ['Usage: code <filename>']);
      }

      const filePath = resolveRepoPath(currentPath, args[0]);
      const opened = await openInlineEditor(filePath, args[0]);

      if (!opened) {
        return null;
      }

      return createMessageEntry('success', 'editor', [`Opened ${filePath}`], 'buffer');
    },

    pwd: async () => createMessageEntry('info', 'path', [formatAbsolutePath(currentPath)]),

    tree: async (args) => {
      const maxDepth = Number.parseInt(args[0], 10) || 3;
      const nodes = [];

      const visitTree = async (path = '', depth = 0, activeLevels = new Set()) => {
        if (depth >= maxDepth) {
          return;
        }

        const contents = await fetchGitHubContent(path);

        if (!Array.isArray(contents)) {
          return;
        }

        for (let index = 0; index < contents.length; index += 1) {
          const item = contents[index];
          const isLast = index === contents.length - 1;

          let prefix = '';
          for (let d = 0; d < depth; d += 1) {
            prefix += activeLevels.has(d) ? '│  ' : '   ';
          }
          const connector = prefix + (isLast ? '└─ ' : '├─ ');

          nodes.push({
            name: item.name,
            path: item.path,
            type: item.type,
            depth,
            connector,
            icon: item.type === 'dir' ? <ImFolder /> : getFileIcon(item.name),
          });

          if (item.type === 'dir') {
            const nextActive = new Set(activeLevels);
            if (!isLast) nextActive.add(depth);
            await visitTree(item.path, depth + 1, nextActive);
          }
        }
      };

      try {
        await visitTree(currentPath);

        return createEntry('tree', {
          title: `tree ${formatShellPath(currentPath)}`,
          meta: `max depth ${maxDepth}`,
          nodes,
        });
      } catch (error) {
        return createMessageEntry('error', 'tree', [error.message]);
      }
    },

    find: async (args) => {
      if (!args[0]) {
        return createMessageEntry('warning', 'find', ['Usage: find <filename>']);
      }

      const query = args[0].toLowerCase();
      const results = [];

      const visitDirectory = async (path = '') => {
        const contents = await fetchGitHubContent(path);

        if (!Array.isArray(contents) || results.length >= 40) {
          return;
        }

        for (const item of contents) {
          if (item.name.toLowerCase().includes(query)) {
            results.push({
              name: item.name,
              path: item.path,
              size: item.size,
              type: item.type,
              icon: item.type === 'dir' ? <ImFolder /> : getFileIcon(item.name),
            });
          }

          if (item.type === 'dir' && results.length < 40) {
            await visitDirectory(item.path);
          }
        }
      };

      try {
        await visitDirectory(currentPath);

        if (!results.length) {
          return createMessageEntry('warning', 'find', [`No files matching "${query}" found.`]);
        }

        return createEntry('directory', {
          title: `search results for "${query}"`,
          meta: `${results.length} match(es)`,
          items: results,
        });
      } catch (error) {
        return createMessageEntry('error', 'find', [error.message]);
      }
    },

    help: async () => createEntry('help'),

    clear: async () => {
      setTerminalEntries([]);
      return null;
    },

    exit: async () => {
      onClose();
      return null;
    },
  };

  const executeCommand = async (commandLine) => {
    const trimmed = commandLine.trim();
    pushEntries(createEntry('prompt', { prompt: `${formatShellPath(currentPath)} $`, command: commandLine }));

    if (!trimmed) {
      return;
    }

    const nextHistory = [...commandHistory, commandLine];
    setCommandHistory(nextHistory);
    setHistoryIndex(nextHistory.length);

    const args = parseCommandLine(trimmed);
    const [commandName, ...commandArgs] = args;
    const command = commands[commandName];

    if (!command) {
      pushEntries(createMessageEntry('error', 'command', [`Unknown command: ${commandName}`], 'Use help'));
      return;
    }

    setIsExecuting(true);
    try {
      const result = await command(commandArgs);

      if (result) {
        pushEntries(result);
      }
    } catch (error) {
      pushEntries(createMessageEntry('error', 'command', [error.message]));
    } finally {
      setIsExecuting(false);
    }
  };

  const copyCurrentUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentGithubUrl);
      setCopied(true);
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 900);
    } catch (error) {
      pushEntries(createMessageEntry('error', 'clipboard', [`Unable to copy URL: ${error.message}`]));
    }
  };

  const copyEditorBuffer = async () => {
    if (!editorState) {
      return;
    }

    try {
      await navigator.clipboard.writeText(editorState.draft);
      setEditorStatus('Buffer copied to clipboard');
    } catch (error) {
      setEditorStatus(`Copy failed: ${error.message}`);
    }
  };

  const downloadEditorContent = () => {
    if (!editorState) {
      return;
    }

    downloadBuffer(editorState.fileName, editorState.draft);
    setEditorStatus(`Downloaded ${editorState.fileName}`);
  };

  const handleTerminalInputKeyDown = (event) => {
    const isPrimaryModifier = event.ctrlKey || event.metaKey;

    if (isPrimaryModifier && event.key.toLowerCase() === 'l') {
      event.preventDefault();
      setTerminalEntries([]);
      return;
    }

    if (event.key === 'Enter') {
      const commandLine = inputValue;
      setInputValue('');
      executeCommand(commandLine);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();

      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInputValue(commandHistory[nextIndex]);
      }

      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();

      if (historyIndex < commandHistory.length - 1) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setInputValue(commandHistory[nextIndex]);
        return;
      }

      setHistoryIndex(commandHistory.length);
      setInputValue('');
    }
  };

  useEffect(() => {
    if (isOpen) {
      initializeTerminal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [terminalEntries]);

  useEffect(() => {
    if (!editorState && transcriptPromptRef.current) {
      transcriptPromptRef.current.scrollIntoView({ block: 'end' });
    }
  }, [currentPath, editorState, inputValue]);

  useEffect(() => {
    if (isOpen && !editorState) {
      inputRef.current?.focus();
    }
  }, [editorState, isOpen]);

  useEffect(() => {
    if (!isExecuting && !editorState) {
      inputRef.current?.focus();
    }
  }, [isExecuting, editorState]);

  useEffect(() => {
    if (!editorState) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      const isPrimaryModifier = event.ctrlKey || event.metaKey;
      if (!isPrimaryModifier) { return; }
      switch (event.key.toLowerCase()) {
        case 's':
          event.preventDefault();
          downloadEditorContent();
          break;
        case 'q':
          event.preventDefault();
          closeEditor();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorState]);

  useEffect(() => {
    if (isExecuting) {
      spinnerIntervalRef.current = setInterval(() => {
        setSpinnerFrame((f) => (f + 1) % SPINNER_FRAMES.length);
      }, 80);
    } else {
      clearInterval(spinnerIntervalRef.current);
      setSpinnerFrame(0);
    }
    return () => clearInterval(spinnerIntervalRef.current);
  }, [isExecuting]);

  useEffect(() => () => {
    clearTimeout(copyTimeoutRef.current);
    clearTimeout(editorStatusTimeoutRef.current);
    clearInterval(spinnerIntervalRef.current);
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={`${styles.octopus} ${styles.iconTag}`}><FaGithub /></span>
          <div className={styles.titleGroup}>
            <span className={styles.title}>Repository Navigator</span>
            <button
              type="button"
              className={styles.pathButton}
              onClick={copyCurrentUrl}
              title="Copy GitHub URL"
            >
              <span className={styles.pathValue}>
                {copied ? 'copied to clipboard' : currentGithubUrl.replace('https://', '')}
              </span>
              <span className={styles.pathLabel}>[remote]</span>
            </button>
          </div>
        </div>

        <div className={styles.headerRight}>
          <button
            type="button"
            className={`${styles.closeButton} ${styles.iconTag}`}
            onClick={onClose}
            title="Close terminal"
            aria-label="Close terminal"
          >
            <MdExitToApp />
          </button>
        </div>
      </div>

      <div className={styles.mainContainer}>
        <div className={styles.terminalSection}>
          <div className={styles.terminalTopbar}>
            <div className={styles.topbarTabs}>
              {editorState ? (
                <>
                  <span className={styles.terminalTab}>
                    <IoTerminalSharp />
                    Editor
                  </span>
                  <span className={styles.readOnlyBadge}>read only</span>
                  <span className={styles.terminalTab}>
                    {getFileIcon(editorState.fileName)}
                    {editorState.filePath}
                  </span>
                </>
              ) : (
                <span className={styles.terminalTab}>
                  <IoTerminalSharp />
                  Shell
                </span>
              )}
            </div>

            {editorState && (
              <div className={styles.editorActions}>
                <button type="button" className={styles.iconButton} onClick={downloadEditorContent} title="Download buffer">
                  <AiFillSave />
                </button>
                <button type="button" className={styles.iconButton} onClick={copyEditorBuffer} title="Copy buffer">
                  <MdContentCopy />
                </button>
                <button type="button" className={styles.iconButton} onClick={() => window.open(`https://vscode.dev/github/${GITHUB_REPO}/${editorState.filePath}`, '_blank', 'noopener,noreferrer')} title="Open in VS Code.dev">
                  <VscVscode />
                </button>
                <button type="button" className={styles.iconButton} onClick={closeEditor} title="Close buffer">
                  <RiSidebarUnfoldLine />
                </button>
              </div>
            )}
          </div>

          <div className={styles.workspace}>
            <div
              className={`${styles.outputPane} ${editorState ? styles.outputPaneMuted : ''}`}
              ref={outputRef}
              onClick={() => {
                if (!editorState) {
                  inputRef.current?.focus();
                }
              }}
            >
              <div className={styles.outputList}>
                {terminalEntries.length === 0 ? (
                  <section className={`${styles.entryPanel} ${styles.entryToneMuted}`}>
                    <div className={styles.contentList}>
                      <p className={styles.messageLine}>Transcript cleared. Type `help` to rebuild context.</p>
                    </div>
                  </section>
                ) : (
                  terminalEntries.map((entry) => (
                    <TerminalEntry
                      key={entry.id}
                      entry={entry}
                    />
                  ))
                )}

                <div
                  ref={transcriptPromptRef}
                  className={styles.livePromptRow}
                  onClick={() => {
                    if (!editorState) {
                      inputRef.current?.focus();
                    }
                  }}
                >
                  <span className={styles.prompt}>
                    <span className={styles.promptUser}>uv</span>
                    <span className={styles.promptSeparator}>@</span>
                    <span className={styles.promptHost}>portfolio</span>
                    <span className={styles.promptSeparator}>:</span>
                    <span className={styles.promptPath}>{formatShellPath(currentPath)}</span>
                    <span className={styles.promptSeparator}>$</span>
                  </span>
                  {isExecuting ? (
                    <span className={styles.spinnerCaret}>{SPINNER_FRAMES[spinnerFrame]}</span>
                  ) : (
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(event) => setInputValue(event.target.value)}
                      onKeyDown={handleTerminalInputKeyDown}
                      onFocus={() => {
                        if (outputRef.current) {
                          outputRef.current.scrollTop = outputRef.current.scrollHeight;
                        }
                      }}
                      className={styles.inlineInput}
                      placeholder={`cd $path | ${QUICK_COMMANDS.join(' | ')} | cat $filename | clear`}
                    />
                  )}
                </div>
              </div>
            </div>

            {editorState && (
              <div className={styles.editorOverlay}>
                <EditorPanel editorState={editorState} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GithubNavigator;
