import { useState, useEffect, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { duotoneForest } from 'react-syntax-highlighter/dist/esm/styles/prism';
import styles from './GithubNavigator.module.css';
import { FaGithub } from "react-icons/fa";
import { MdExitToApp, MdContentCopy } from "react-icons/md";
import { RiSidebarUnfoldLine } from "react-icons/ri";
import { VscVscode } from "react-icons/vsc";

const GithubNavigator = ({ isOpen, onClose }) => {
  // GitHub API configuration
  const GITHUB_REPO = 'ujjwalvivek/portfolio';
  const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/contents`;

  // State management
  const [currentPath, setCurrentPath] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [output, setOutput] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isVSCodeOpen, setIsVSCodeOpen] = useState(false);
  const [vsCodeContent, setVsCodeContent] = useState(null);
  const [copied, setCopied] = useState(false);


  // Refs
  const inputRef = useRef(null);
  const outputRef = useRef(null);
  const fileCache = useRef(new Map());
  //const vsCodeRootRef = useRef(null);

  // File icons mapping
  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const icons = {
      js: '📄', jsx: '⚛️', ts: '🔷', tsx: '⚛️',
      css: '🎨', scss: '🎨', html: '🌐',
      md: '📝', json: '📋', yml: '⚙️', yaml: '⚙️',
      png: '🖼️', jpg: '🖼️', gif: '🖼️',
      pdf: '📕', txt: '📄'
    };
    return icons[ext] || '📄';
  };

  // GitHub API functions
  const fetchGitHubContent = async (path = '') => {
    try {
      const url = path ? `${GITHUB_API}/${path}` : GITHUB_API;
      const response = await fetch(url, {
  headers: {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'ujjwalvivek-portfolio',
    'X-GitHub-Api-Version': '2022-11-28'
  }
});

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      fileCache.current.set(path, data);
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch: ${error.message}`);
    }
  };

  // Initialize with GitHub neofetch display
useEffect(() => {
  if (isOpen) {
    generateGitHubFetch();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isOpen]);

// Add this new function before your existing functions
const generateGitHubFetch = async () => {
  setOutput('Loading GitHub stats...\n');
  
  try {
    // Fetch repository info
    const repoResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
  headers: {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'ujjwalvivek-portfolio',
    'X-GitHub-Api-Version': '2022-11-28'
  }
});
    const repoData = await repoResponse.json();
    
    // Fetch user info
    const userResponse = await fetch(`https://api.github.com/users/${repoData.owner.login}`, {
  headers: {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'ujjwalvivek-portfolio',
    'X-GitHub-Api-Version': '2022-11-28'
  }
});
    const userData = await userResponse.json();
    
    // Fetch recent commits
    const commitsResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=5`, {
  headers: {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'ujjwalvivek-portfolio',
    'X-GitHub-Api-Version': '2022-11-28'
  }
});
    const commitsData = await commitsResponse.json();
    
    // Fetch languages
    const languagesResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/languages`, {
  headers: {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'ujjwalvivek-portfolio',
    'X-GitHub-Api-Version': '2022-11-28'
  }
});
    const languagesData = await languagesResponse.json();
    
    const githubFetch = generateGitHubFetchDisplay(repoData, userData, commitsData, languagesData);
    setOutput(githubFetch);
  } catch (error) {

    const fallbackDisplay = `
🚧 GitHub API Unavailable - ${error.message} - Showing Basic Info

▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█▌ GITHUB TERMINAL v1.0 ▐█ ujjwalvivek@github.com ████████████████
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀

▌▌▌ PORTFOLIO.main ███████████████████████████████████████████████
▌▌▌ Repository: ujjwalvivek/portfolio
▌▌▌ Status: GitHub API temporarily unavailable

◄◄◄ LIMITED MODE ► help | ls | tree | find | cat ►►►►►►►►►►►►►►

`;
    setOutput(fallbackDisplay);
  }
};

const generateGitHubFetchDisplay = (repo, user, commits, languages) => {
  // Calculate language percentages
  const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0);
  const topLanguages = Object.entries(languages)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([lang, bytes]) => ({
      name: lang,
      percentage: ((bytes / totalBytes) * 100).toFixed(1)
    }));

  // Cyberpunk Style Design
  const asciiStats = `
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█▌ GITHUB TERMINAL v1.0 ▐█ ${user.login}@github.com ████████████████
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀

▌▌▌ ${repo.name.toUpperCase()}.${repo.default_branch} ███████████████████████████████████████████████
▌▌▌ ${(repo.description || 'No description').substring(0, 60)}
▌▌▌ Stars:${repo.stargazers_count.toString().padEnd(4)} Forks:${repo.forks_count.toString().padEnd(4)} Issues:${repo.open_issues_count.toString().padEnd(4)} Size:${((repo.size/1024).toFixed(1)+'MB').padEnd(8)}
▌▌▌ Created: ${new Date(repo.created_at).toLocaleDateString().padEnd(12)}

▸▸▸ USER DATA ◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂
▸▸▸ Repositories: ${user.public_repos} • Followers: ${user.followers} • Following: ${user.following}

▸▸▸ COMMIT LOG ◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂
▸▸▸ ${commits.slice(0, 5).map(commit => `● ${commit.commit.message.split('\n')[0]}`).join('\n▸▸▸ ')}
▸▸▸ ◦ Latest by ${commits[0]?.commit?.author?.name} on ${new Date(commits[0]?.commit?.author?.date).toLocaleDateString()}

▸▸▸ STACK ANALYSIS ◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂◂
${topLanguages.map(lang => `▸▸▸ [${lang.percentage.padStart(5)}%] ${getLanguageIcon(lang.name)} ${lang.name}`).join('\n')}

◄◄◄ READY FOR INPUT ► help | ls | tree | find | cat <file> ►►►►►►►►►►►►►►
  `;

  return asciiStats;
};

// Helper function for language icons
const getLanguageIcon = (language) => {
  const icons = {
    'JavaScript': '🟨',
    'TypeScript': '🔷',
    'Python': '🐍',
    'Java': '☕',
    'C++': '⚙️',
    'C': '🔧',
    'HTML': '🌐',
    'CSS': '🎨',
    'PHP': '🐘',
    'Ruby': '💎',
    'Go': '🐹',
    'Rust': '🦀',
    'Swift': '🍎',
    'Kotlin': '🎯',
    'Dart': '🎯',
    'Shell': '🐚',
    'Dockerfile': '🐳',
    'JSON': '📋',
    'YAML': '📄',
    'Markdown': '📝'
  };
  return icons[language] || '📄';
};


  // VS Code content component
  const VSCodeViewer = ({ fileName, filePath, content, language, lineCount, onClose }) => (
    <div className={styles.vsCodeViewer}>
      <div className={styles.vsCodeHeader}>
        <div className={styles.vsCodeActions}>
          <button className={styles.vsCodeCloseBtn} onClick={onClose}>
            <RiSidebarUnfoldLine />
          </button>
          <a 
            href={`https://vscode.dev/github/${GITHUB_REPO}/${filePath}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.vsCodeEditBtn}
          >
            <VscVscode />
          </a>
          <button 
            className={styles.vsCodeCopyBtn}
            onClick={() => navigator.clipboard.writeText(content)}
          >
            <MdContentCopy />
          </button>
        </div>
        <div className={styles.vsCodeHeaderLeft}>
          <span className={styles.vsCodeFileInfo}>
            <span className={styles.vsCodeFileName}>{'<'}{fileName}{'/>'}</span> • {language.toUpperCase()} • {lineCount} lines • Read-Only
          </span>
        </div>
      </div>
      <div className={styles.vsCodeContent}>
        <SyntaxHighlighter
          language={language}
          style={duotoneForest}
          showLineNumbers={true}
          customStyle={{
            margin: 0,
            background: 'rgba(var(--background-color-rgb), 0)',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-mono)'
          }}
          lineNumberStyle={{
            color: '#7d8590',
            paddingRight: '16px',
            marginRight: '16px',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'var(--font-mono)',
              lineHeight: '2',
              fontSize: '0.9rem',
            }
          }}
        >
          {content}
        </SyntaxHighlighter>
      </div>
    </div>
  );

  // Open file in VS Code viewer
  const openInlineEditor = (filePath, fileName, content) => {
    if (!content) {
      content = 'Error: Unable to load file content';
    }

    const extension = fileName.split('.').pop().toLowerCase();
    const languageMap = {
      'js': 'javascript', 'jsx': 'jsx', 'ts': 'typescript', 'tsx': 'tsx',
      'css': 'css', 'scss': 'scss', 'html': 'markup', 'json': 'json',
      'md': 'markdown', 'py': 'python', 'java': 'java', 'cpp': 'cpp',
      'c': 'c', 'php': 'php', 'go': 'go', 'rs': 'rust', 'yml': 'yaml',
      'yaml': 'yaml', 'xml': 'xml', 'sql': 'sql', 'sh': 'bash',
      'dockerfile': 'docker'
    };

    const language = languageMap[extension] || 'javascript';
    const lineCount = (content && typeof content === 'string') ? content.split('\n').length : 0;

    setVsCodeContent({
      fileName,
      filePath,
      content,
      language,
      lineCount
    });
    setIsVSCodeOpen(true);
  };

  // Close VS Code viewer
  const closeVSCode = () => {
    setIsVSCodeOpen(false);
    setVsCodeContent(null);
  };

  // Add output to terminal
  const addOutput = (text) => {
    setOutput(prev => prev + text + '\n');
  };

  // Commands implementation
  const commands = {
    ls: async (args) => {
      try {
        const path = args[0] ? (currentPath ? `${currentPath}/${args[0]}` : args[0]) : currentPath;
        const contents = await fetchGitHubContent(path);

        if (Array.isArray(contents)) {
          return contents.map(item => {
            const icon = item.type === 'dir' ? '📁' : getFileIcon(item.name);
            const color = item.type === 'dir' ? '#79c0ff' : '#f0f6fc';
            return `${icon} <span style="color: ${color}">${item.name}</span>`;
          }).join('\n');
        } else {
          return `📄 ${contents.name} (${contents.size} bytes)`;
        }
      } catch (error) {
        return `❌ Error: ${error.message}`;
      }
    },

    cd: async (args) => {
      if (!args[0]) {
        setCurrentPath('');
        return '📁 Changed to root directory';
      }

      if (args[0] === '..') {
        if (currentPath) {
          const parts = currentPath.split('/');
          parts.pop();
          setCurrentPath(parts.join('/'));
          return `📁 Changed to /${parts.join('/') || 'root'}`;
        }
        return '📁 Already at root directory';
      }

      try {
        const newPath = currentPath ? `${currentPath}/${args[0]}` : args[0];
        const contents = await fetchGitHubContent(newPath);

        if (Array.isArray(contents)) {
          setCurrentPath(newPath);
          return `📁 Changed to /${newPath}`;
        } else {
          return `❌ '${args[0]}' is not a directory`;
        }
      } catch (error) {
        return `❌ Directory not found: ${args[0]}`;
      }
    },

    cat: async (args) => {
      if (!args[0]) return '❌ Usage: cat <filename>';

      try {
        const filePath = currentPath ? `${currentPath}/${args[0]}` : args[0];
        const fileData = await fetchGitHubContent(filePath);

        if (fileData.type === 'file') {
          const content = atob(fileData.content);
          const lines = content.split('\n');

          if (lines.length > 50) {
            return `📄 ${args[0]} (${lines.length} lines - showing first 50):\n\n${lines.slice(0, 50).join('\n')}\n\n... (use 'code ${args[0]}' to view full file in VS Code)`;
          }

          return `📄 ${args[0]}:\n\n${content}`;
        }

        return `❌ '${args[0]}' is not a file`;
      } catch (error) {
        return `❌ Error reading file: ${error.message}`;
      }
    },

    code: async (args) => {
      if (!args[0]) return '❌ Usage: code <filename>';

      try {
        const filePath = currentPath ? `${currentPath}/${args[0]}` : args[0];
        const fileData = await fetchGitHubContent(filePath);

        if (fileData.type === 'file') {
          let content;

          try {
            if (fileData.content) {
              content = atob(fileData.content);
            } else {
              content = 'Error: File content is empty or unavailable';
            }
          } catch (decodeError) {
            console.error('Base64 decode error:', decodeError);
            content = 'Error: Unable to decode file content (possibly binary file)';
          }

          if (fileData.size > 1024 * 1024) { // 1MB limit
            content = `File too large to display (${(fileData.size / 1024 / 1024).toFixed(2)}MB)\n\nUse the "Edit in VS Code.dev" button to view this file.`;
          }

          openInlineEditor(filePath, args[0], content);
          return `📝 Viewing ${args[0]}`;
        }

        return `❌ '${args[0]}' is not a file`;
      } catch (error) {
        console.error('Code command error:', error);
        return `❌ Error: ${error.message}`;
      }
    },

    pwd: () => `/${currentPath || 'root'}`,

    tree: async (args) => {
      const maxDepth = parseInt(args[0]) || 3;

      const buildTree = async (path = '', depth = 0, prefix = '') => {
        if (depth >= maxDepth) return '';

        try {
          const contents = await fetchGitHubContent(path);
          if (!Array.isArray(contents)) return '';

          let result = '';
          for (let i = 0; i < contents.length; i++) {
            const item = contents[i];
            const isLast = i === contents.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            const icon = item.type === 'dir' ? '📁' : getFileIcon(item.name);

            result += `${prefix}${connector}${icon} ${item.name}\n`;

            if (item.type === 'dir' && depth < maxDepth - 1) {
              const nextPrefix = prefix + (isLast ? '    ' : '│   ');
              const subTree = await buildTree(item.path, depth + 1, nextPrefix);
              result += subTree;
            }
          }
          return result;
        } catch (error) {
          return `${prefix}❌ Error loading directory\n`;
        }
      };

      const tree = await buildTree(currentPath);
      return `🌳 Repository structure (max depth: ${maxDepth}):\n\n${tree}`;
    },

    find: async (args) => {
      if (!args[0]) return '❌ Usage: find <filename>';

      const searchTerm = args[0].toLowerCase();
      const results = [];

      const searchRecursive = async (path = '') => {
        try {
          const contents = await fetchGitHubContent(path);
          if (!Array.isArray(contents)) return;

          for (const item of contents) {
            if (item.name.toLowerCase().includes(searchTerm)) {
              const icon = item.type === 'dir' ? '📁' : getFileIcon(item.name);
              results.push(`${icon} ${item.path}`);
            }

            if (item.type === 'dir' && results.length < 20) {
              await searchRecursive(item.path);
            }
          }
        } catch (error) {
          // Skip errors for inaccessible directories
        }
      };

      await searchRecursive(currentPath);

      if (results.length === 0) {
        return `❌ No files matching '${searchTerm}' found`;
      }

      return `🔍 Found ${results.length} matches:\n\n${results.join('\n')}`;
    },

    help: () => `
+------------------------------------------------+
|           GitHub Terminal Helper               |
|------------------------------------------------|
| NAVIGATION                                     |
|   ls [path]    List directory contents         |
|   cd [dir]     Change directory                |
|   cd ..        Go up one directory             |
|   pwd          Show current path               |
|   tree [n]     Show directory tree             |
|                                                |
| FILE OPERATIONS                                |
|   cat [file]   Display file contents           |
|   code [file]  Open file in VS Code.dev        |
|   find [name]  Search for files                |
|                                                |
| INFORMATION                                    |
|   help        Show this help                   |
|   clear       Clear terminal                   |
|   exit        Close terminal                   |
|                                                |
| EXAMPLES                                       |
|   ls src         List src directory            |
|   code README.md  Edit README in VS Code       |
|   find .js        Find all .js files           |
|                                                |
| NOTE: Use double quotes for names with spaces. |
|   e.g. cat "My File.md"                        |
+------------------------------------------------+
`,

    clear: () => {
      setOutput('');
      return '';
    },

    exit: () => {
      onClose();
      return '';
    }
  };

  // Execute command
  const executeCommand = async (cmdLine) => {
    const newHistory = [...commandHistory, cmdLine];
    setCommandHistory(newHistory);
    setHistoryIndex(newHistory.length);

    const parseCommand = (cmdLine) => {
      const args = [];
      let current = '';
      let inQuotes = false;
      let quoteChar = '';

      for (let i = 0; i < cmdLine.length; i++) {
        const char = cmdLine[i];

        if ((char === '"' || char === "'") && !inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar && inQuotes) {
          inQuotes = false;
          quoteChar = '';
        } else if (char === ' ' && !inQuotes) {
          if (current) {
            args.push(current);
            current = '';
          }
        } else {
          current += char;
        }
      }

      if (current) args.push(current);
      return args;
    };

    const args = parseCommand(cmdLine.trim());
    const [cmd, ...commandArgs] = args;
    const command = commands[cmd];

    if (command) {
      try {
        const result = await command(commandArgs);
        if (result) {
          addOutput(result);
        }
      } catch (error) {
        addOutput(`❌ Command failed: ${error.message}`);
      }
    } else if (cmd) {
      addOutput(`❌ Command not found: ${cmd}\nType 'help' for available commands.`);
    }
  };

  // Handle keyboard input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const cmdLine = inputValue;
      addOutput(`${getPrompt()} ${cmdLine}`);
      setInputValue('');
      executeCommand(cmdLine);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[newIndex]);
      } else {
        setHistoryIndex(commandHistory.length);
        setInputValue('');
      }
    }
  };

  // Get prompt string
  const getPrompt = () => {
    const pathDisplay = currentPath || 'root';
    return `github@portfolio:~/${pathDisplay}$`;
  };

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

//   // Initialize with welcome message
//   useEffect(() => {
//     if (isOpen) {
//       setOutput(`🐙 GitHub Terminal Explorer v1.0
// Connected to: ${GITHUB_REPO}
// Repository loaded successfully!

// Type 'help' for available commands or 'ls' to explore.

// `);
//     }
//   }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.octopus}><FaGithub /></span>
          <span className={styles.title}>Repository Navigator</span>
          <span
            className={styles.path}
            onClick={() => {
              navigator.clipboard.writeText(`https://github.com/${GITHUB_REPO}/${currentPath}`);
              setCopied(true);
              setTimeout(() => setCopied(false), 800);
            }}
          >
            <span style={{ opacity: copied ? 0 : 1, position: 'absolute' }}>
              {`https://github.com/${GITHUB_REPO}/${currentPath}`}
            </span>
            <span style={{ opacity: copied ? 1 : 0, position: 'absolute' }}>
              Copied to clipboard!
            </span>
            <span style={{ visibility: 'hidden' }}>
              {`https://github.com/${GITHUB_REPO}/${currentPath}`}
            </span>
          </span>
        </div>
        <div className={styles.closeButton} onClick={onClose} title="Close Terminal">
          <MdExitToApp />
        </div>
      </div>

      <div className={styles.mainContainer}>
        <div
          className={styles.terminalSection}
          style={{ width: isVSCodeOpen ? '50%' : '100%' }}
        >
          <div
            className={styles.output}
            ref={outputRef}
            dangerouslySetInnerHTML={{ __html: output }}
          />
          
          <div className={styles.inputContainer}>
            <span className={styles.prompt}>
              <span className={styles.promptUser}>github</span>
              <span className={styles.promptSeparator}>@</span>
              <span className={styles.promptHost}>portfolio</span>
              <span className={styles.promptColon}>:</span>
              <span className={styles.promptPath}>~/{currentPath || 'root'}</span>
              <span className={styles.promptDollar}>$</span>
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className={styles.input}
              placeholder="Enter command..."
            />
          </div>
        <span className={styles.status}>CONNECTED</span>
        </div>


        {isVSCodeOpen && vsCodeContent && (
          <VSCodeViewer
            {...vsCodeContent}
            onClose={closeVSCode}
          />
        )}
      </div>
    </div>
  );
};

export default GithubNavigator;
