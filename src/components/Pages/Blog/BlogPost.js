import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import matter from 'gray-matter';
import 'katex/dist/katex.min.css';
import styles from './BlogPost.module.css';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import rehypeSlug from 'rehype-slug';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';
import { ThemeContext } from '../../Utils/ThemeSwitcher/ThemeContext';
import { MdTipsAndUpdates } from "react-icons/md";
import { IoIosWarning } from "react-icons/io";
import { BsFillInfoSquareFill } from "react-icons/bs";
import { GrTooltip } from "react-icons/gr";
import { MdDangerous } from "react-icons/md";
import { AiTwotoneStar } from "react-icons/ai";
import { PiHashStraightFill } from "react-icons/pi";
import DinoGame from '../../Modules/DinoGame/DinoGame';
import { FaSquareCaretRight } from "react-icons/fa6";
import { GiHollowCat } from "react-icons/gi";
import RecentLogs from '../../Modules/RecentLogs/RecentLogs';

const IframeEmbed = ({ src, title, width, height, style, caption, ...rest }) => {
  const isExternal = src && (src.startsWith('http://') || src.startsWith('https://'));
  const [active, setActive] = React.useState(!isExternal);

  const parsedStyle = typeof style === 'string'
    ? Object.fromEntries(style.split(';').filter(Boolean).map(s => {
      const [k, ...v] = s.split(':');
      return [k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v.join(':').trim()];
    }))
    : (style || {});

  if (!isExternal) {
    return (
      <figure className={styles.iframeEmbedFigure}>
        <iframe src={src} title={title} width={width} style={parsedStyle} loading="lazy" {...rest} />
        {caption && <figcaption className={styles.iframeCaption}>{caption}</figcaption>}
      </figure>
    );
  }

  return (
    <figure className={styles.iframeEmbedFigure}>
      <div className={styles.iframeEmbedWrapper} style={{ aspectRatio: parsedStyle.aspectRatio }}>
        <iframe
          src={active ? src : undefined}
          title={title}
          width="100%"
          style={{ display: 'block', width: '100%', height: '100%' }}
          loading="lazy"
          {...rest}
        />
        {!active && (
          <div
            onClick={() => setActive(true)}
            style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              color: '#fff', fontFamily: 'var(--font-neon)',
              cursor: 'pointer', aspectRatio: parsedStyle.aspectRatio,
            }}
          >
            <img src="https://cdn.ujjwalvivek.com/posts/media/engine_load.webp" alt="Click to load" />
          </div>
        )}
      </div>
      {caption && <figcaption className={styles.iframeCaption}>{caption}</figcaption>}
    </figure>
  );
};

//? Simple reading time calculation function
const calculateReadingTime = (text) => {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
};

const CodeBlock = ({ node, inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\\n$/, '');
  const { darkMode } = React.useContext(ThemeContext);
  const theme = darkMode ? 'dark' : 'light';

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return !inline && match ? (
    <div className={styles.codeBlock}>
      <button className={styles.copyButton} onClick={handleCopy}>
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <SyntaxHighlighter
        style={theme === 'dark' ? atomDark : oneLight}
        language={match[1]}
        PreTag="div"
        {...props}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  ) : (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

const Admonition = ({ node, children }) => {
  const type = node.properties.className[1]; //* note, warning, tip, danger
  let title = type.charAt(0).toUpperCase() + type.slice(1); //? Default title
  let content = children;

  //? Check for custom title in node attributes first
  if (node.attributes && node.attributes.title) {
    title = node.attributes.title;
  }
  //? Check if first paragraph contains the title
  else if (
    Array.isArray(children) &&
    children[0] &&
    children[0].props &&
    children[0].props.children
  ) {
    const firstChild = children[0].props.children;

    //? Handle different content structures
    let firstText = '';
    if (typeof firstChild === 'string') {
      firstText = firstChild;
    } else if (Array.isArray(firstChild) && typeof firstChild[0] === 'string') {
      firstText = firstChild[0];
    }

    //? If first text looks like a title (short line, followed by more content)
    if (
      firstText &&
      firstText.length > 0 &&
      firstText.length < 60 && //? Reasonable title length
      !firstText.includes('\n') && //? Single line
      children.length > 1 //? Has content after title
    ) {
      title = firstText.trim();
      content = children.slice(1);
    }
  }

  return (
    <div className={`${styles.admonition} ${styles[type]}`}>
      <div className={styles.admonitionTitle}>
        <span className={styles.admonitionIcon}>
          {getAdmonitionIcon(type)}
        </span>
        <span>{title}</span>
      </div>
      <div className={styles.admonitionContent}>
        {content}
      </div>
    </div>
  );
};

const getAdmonitionIcon = (type) => {
  const icons = {
    note: <MdTipsAndUpdates />,
    warning: <IoIosWarning />,
    tip: <GrTooltip />,
    danger: <MdDangerous />,
    info: <BsFillInfoSquareFill />
  };
  return icons[type] || <AiTwotoneStar />;
};

const BlogPost = () => {
  const { filename } = useParams();
  const [post, setPost] = useState({ content: '', data: {}, readingTime: '' });
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const blogPostRef = useRef(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        const allPostsRes = await fetch('/posts/meta.json');
        const allPosts = await allPostsRes.json();

        const currentPostMeta = allPosts.find(p => p.filename === filename);

        if (currentPostMeta) {
          const response = await fetch(`/posts/${filename}`);
          const text = await response.text();
          const { content, data } = matter(text);
          const readingTimeText = calculateReadingTime(content);

          setPost({ content, data, readingTime: readingTimeText });

          //? Find related posts (by tags), always excluding the current post
          const tagRelated = allPosts.filter(p =>
            p.id !== currentPostMeta.id &&
            p.tags.some(tag => currentPostMeta.tags.includes(tag))
          ).slice(0, 3);

          //? Fall back to recent posts (excl. current) if no tag matches
          const related = tagRelated.length > 0
            ? tagRelated
            : allPosts.filter(p => p.id !== currentPostMeta.id).slice(0, 3);
          setRelatedPosts(related);
        }
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [filename]);

  if (isLoading) {
    return (
      <div className={styles.blogContainer}>
        <div className={styles.loadingState}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  //? Don't render anything if no post data
  if (!post.data.title) {
    return (
      <div className={styles.blogContainer}>
        <div className={styles.blogPost}>
          <p>Post not found.</p>
        </div>
      </div>
    );
  }

  //? Safe date formatting
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return '';
    }
  };

  const TableOfContents = ({ containerRef }) => {
    const [items, setItems] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
      if (!containerRef.current) return;
      const heads = Array.from(
        containerRef.current.querySelectorAll('h2,h3,h4')
      );

      const buildTree = (headings) => {
        const root = { children: [] };
        const stack = [{ node: root, level: 1 }];

        headings.forEach((h) => {
          const level = parseInt(h.tagName[1], 10);
          const node = { id: h.id, text: h.textContent, level, children: [] };

          while (stack.length > 1 && stack[stack.length - 1].level >= level) {
            stack.pop();
          }

          stack[stack.length - 1].node.children.push(node);
          stack.push({ node, level });
        });

        return root.children;
      };

      setItems(buildTree(heads));
    }, [containerRef]);

    const renderItems = (nodes) => {
      return (
        <ul className={styles.tocListNested}>
          {nodes.map(it => (
            <li key={it.id} className={styles.tocItemNested}>
              <div className={styles.tocLinkWrapper}>
                <a href={`#${it.id}`} className={styles[`tocLinkLevel${it.level}`]} data-label={`h${it.level - 1}`}>
                  {it.text}
                </a>
              </div>
              {it.children && it.children.length > 0 && renderItems(it.children)}
            </li>
          ))}
        </ul>
      );
    };

    if (items.length === 0) return null;

    return (
      <nav className={`${styles.tableOfContents} ${isCollapsed ? styles.tocCollapsed : styles.tocExpanded}`}>
        <button
          className={styles.tocToggle}
          onClick={() => setIsCollapsed(prev => !prev)}
          aria-expanded={!isCollapsed}
        >
          <span className={styles.tocToggleIcon}><GiHollowCat /></span>
          <span>Table of Contents</span>
        </button>
        <div className={styles.tocListContainer}>
          {renderItems(items)}
        </div>
      </nav>
    );
  };

  const components = {
    code: CodeBlock,
    iframe: (props) => <IframeEmbed {...props} />,
    img: ({ src, alt }) => (
      <img
        src={src}
        alt={alt}
        onClick={() => setLightboxImage(src)}
        style={{ cursor: 'pointer' }}
      />
    ),
    div: (props) => {
      if (props.node.properties.className?.includes('dino-game')) {
        return (
          <>
            <div style={{
              position: 'relative',
              width: '100%',
              height: '128px',
              overflow: 'hidden',
              border: '2px solid var(--dynamic-dominant-color)',
              borderRadius: '2px',
              marginTop: '1rem',
              marginBottom: '1rem',
            }}>
              <DinoGame embedded />
            </div>
            <figcaption className={styles.iframeCaption} style={{ marginBottom: '1rem' }}>
              The OG, ~800 lines of code, no frameworks, just good old HTML5 Canvas and JavaScript.
            </figcaption>
          </>
        );
      }
      if (props.node.properties.className?.includes('remark-directive-container')) {
        return <Admonition {...props} />;
      }
      return <div {...props} />;
    },
    h2: ({ node, children, ...props }) => (
      <h2 className={styles.headingWithIcon} {...props}>
        <PiHashStraightFill className={styles.headingIcon} aria-hidden="true" focusable="false" />
        <span className={styles.headingText}>{children}</span>
      </h2>
    ),
    h3: ({ node, children, ...props }) => (
      <h3 className={styles.headingWithIcon} {...props}>
        <span className={styles.headingIcons}>
          <PiHashStraightFill className={styles.headingIcon} aria-hidden="true" />
          <PiHashStraightFill className={styles.headingIcon} aria-hidden="true" />
        </span>
        <span className={styles.headingText}>{children}</span>
      </h3>
    ),
    h4: ({ node, children, ...props }) => (
      <h4 className={styles.headingWithIcon} {...props}>
        <span className={styles.headingIcons}>
          <PiHashStraightFill className={styles.headingIcon} aria-hidden="true" />
          <PiHashStraightFill className={styles.headingIcon} aria-hidden="true" />
          <PiHashStraightFill className={styles.headingIcon} aria-hidden="true" />
        </span>
        <span className={styles.headingText}>{children}</span>
      </h4>
    ),
    h5: ({ node, children, ...props }) => (
      <h5 className={styles.headingWithIcon} {...props}>
        <span className={styles.headingIcons}>
          <FaSquareCaretRight className={styles.headingIcon} aria-hidden="true" />
        </span>
        <span className={styles.headingText}>{children}</span>
      </h5>
    ),
    tableofcontents: (props) => <TableOfContents containerRef={blogPostRef} {...props} />
  };

  const remarkPlugins = [
    remarkGfm,
    remarkMath,
    remarkDirective,
    () => (tree) => {
      visit(tree, (node) => {
        if (node.type === 'containerDirective') {
          const data = node.data || (node.data = {});
          data.hName = 'div';
          data.hProperties = { className: ['remark-directive-container', node.name] };
        }
        if (node.name === 'toc') {
          const data = node.data || (node.data = {});
          data.hName = 'TableOfContents';
        }
      });
    },
  ];

  return (
    <>
      <div className={styles.blogPostContainer}>
        <div className={styles.postHeader}>
          <div className={styles.headerButtons}>
            <div className={styles.closeButton}></div>
            <div className={styles.minimizeButton}></div>
            <div className={styles.maximizeButton}></div>
          </div>
          <div className={styles.postTitle}>
            {post.data.title}
          </div>
          <div className={styles.postStatus}>
            <span className={styles.postDate}>{formatDate(post.data.date)}</span>
            <span className={styles.readingTime}>{post.readingTime}</span>
          </div>
        </div>

        <div className={styles.blogPost} ref={blogPostRef}>
          <div className={styles.markdown}>
            <ReactMarkdown
              remarkPlugins={remarkPlugins}
              rehypePlugins={[rehypeRaw, rehypeSlug, rehypeKatex]}
              components={components}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </div>

        <div className={styles.blogFooter}>
          <div className={styles.authorSignature}>
            <p>
              <strong>By Vivek</strong>
              <br />crafting systems, one line at a time.
            </p>
          </div>
          <div className={styles.relatedPostsSection}>
            <RecentLogs posts={relatedPosts} />
          </div>
        </div>
      </div>

      {lightboxImage &&
        createPortal(
          <div className={styles.lightbox} onClick={() => setLightboxImage(null)}>
            <img src={lightboxImage} alt="Lightbox" />
          </div>,
          document.body
        )}

    </>
  );
};

export default BlogPost;
