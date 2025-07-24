import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import matter from 'gray-matter';
import 'katex/dist/katex.min.css';
import styles from './Blog.module.css';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import rehypeSlug from 'rehype-slug';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';
import RelatedPosts from '../../RelatedPosts/RelatedPosts';
import { ThemeContext } from '../../ThemeSwitcher/ThemeContext';
import { MdTipsAndUpdates } from "react-icons/md";
import { IoIosWarning } from "react-icons/io";
import { BsFillPencilFill, BsFillInfoSquareFill } from "react-icons/bs";
import { MdDangerous } from "react-icons/md";
import { AiTwotoneStar } from "react-icons/ai";

// Simple reading time calculation function
const calculateReadingTime = (text) => {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
};

// Custom code block component with copy functionality
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

// Enhanced admonition component with custom title support
const Admonition = ({ node, children }) => {
  const type = node.properties.className[1]; // note, warning, tip, danger
  let title = type.charAt(0).toUpperCase() + type.slice(1); // Default title
  let content = children;
    
  // Check for custom title in node attributes first
  if (node.attributes && node.attributes.title) {
    title = node.attributes.title;
  }
  // Check if first paragraph contains the title
  else if (
    Array.isArray(children) &&
    children[0] &&
    children[0].props &&
    children[0].props.children
  ) {
    const firstChild = children[0].props.children;
    
    // Handle different content structures
    let firstText = '';
    if (typeof firstChild === 'string') {
      firstText = firstChild;
    } else if (Array.isArray(firstChild) && typeof firstChild[0] === 'string') {
      firstText = firstChild[0];
    }
        
    // If first text looks like a title (short line, followed by more content)
    if (
      firstText &&
      firstText.length > 0 && 
      firstText.length < 60 && // Reasonable title length
      !firstText.includes('\n') && // Single line
      children.length > 1 // Has content after title
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


// Helper function for icons
const getAdmonitionIcon = (type) => {
  const icons = {
    note: <MdTipsAndUpdates />,
    warning: <IoIosWarning />,
    tip: <BsFillPencilFill />,
    danger: <MdDangerous />,
    info: <BsFillInfoSquareFill />
  };
  return icons[type] || <AiTwotoneStar />;
};

// BlogPost component to render individual blog posts
const BlogPost = () => {
  const { filename } = useParams();
  const [post, setPost] = useState({ content: '', data: {}, readingTime: '' });
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const blogPostRef = useRef(null);

  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        // Fetch all posts metadata
        const allPostsRes = await fetch('/posts/meta.json');
        const allPosts = await allPostsRes.json();
        
        const currentPostMeta = allPosts.find(p => p.filename === filename);

        if (currentPostMeta) {
          const response = await fetch(`/posts/${filename}`);
          const text = await response.text();
          const { content, data } = matter(text);
          const readingTimeText = calculateReadingTime(content);

          setPost({ content, data, readingTime: readingTimeText });

          // Find related posts (by tags)
          const related = allPosts.filter(p => 
            p.id !== currentPostMeta.id && 
            p.tags.some(tag => currentPostMeta.tags.includes(tag))
          ).slice(0, 3); // Get top 3 related posts
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

  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.blogContainer}>
        <div className={styles.loadingState}>
            <p>Loading...</p>
          </div>
      </div>
    );
  }

  // Don't render anything if no post data
  if (!post.data.title) {
    return (
      <div className={styles.blogContainer}>
        <div className={styles.blogPost}>
          <p>Post not found.</p>
        </div>
      </div>
    );
  }

  // Safe date formatting
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return '';
    }
  };

  const components = {
    code: CodeBlock,
    img: ({ src, alt }) => (
      <img 
        src={src} 
        alt={alt} 
        onClick={() => setLightboxImage(src)} 
        style={{cursor: 'pointer'}}
      />
    ),
    div: (props) => {
      if (props.node.properties.className?.includes('remark-directive-container')) {
        return <Admonition {...props} />;
      }
      return <div {...props} />;
    },
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
      });
    },
  ];

  return (
    <>
      <div className={styles.blogContainer}>
        <div className={styles.blogPost} ref={blogPostRef}>
          <h1>{post.data.title}</h1>
          <div className={styles.postMeta}>
            <span className={styles.postDate}>{formatDate(post.data.date)}</span>
            <span className={styles.readingTime}>{post.readingTime}</span>
          </div>
          <div className={styles.markdown}>
            <ReactMarkdown 
              remarkPlugins={remarkPlugins} 
              rehypePlugins={[rehypeRaw, rehypeSlug, rehypeKatex]}
              components={components}
            >
              {post.content}
            </ReactMarkdown>
          </div>
          <div className={styles.authorSignature}>
            <p>
    <strong>Vivek</strong> crafting systems,
    <br />
    one line at a time.
  </p>
          </div>
          <br />
          <RelatedPosts posts={relatedPosts} />
        </div>
        {lightboxImage && (
          <div className={styles.lightbox} onClick={() => setLightboxImage(null)}>
            <img src={lightboxImage} alt="Lightbox" />
          </div>
        )}
      </div>
    </>
  );
};

export default BlogPost;
