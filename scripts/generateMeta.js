const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '../public/posts');
const META_FILE = path.join(POSTS_DIR, 'meta.json');

function calculateReadingTime(text) {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));
  return `${minutes} min read`;
}

function extractFirstImage(content) {
  const match = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
  return match ? match[1] : null;
}

// Read existing meta.json if it exists
let metaArr = [];
if (fs.existsSync(META_FILE)) {
  metaArr = JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
}

// Create a map for quick lookup (only for entries with filename)
const metaMap = {};
metaArr.forEach(post => {
  if (post.filename) metaMap[post.filename] = post;
});

// Update readingTime and thumbnail for posts with .md files
fs.readdirSync(POSTS_DIR).forEach(filename => {
  if (!filename.endsWith('.md')) return;
  const filePath = path.join(POSTS_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  const readingTime = calculateReadingTime(content);
  const thumbnail = extractFirstImage(content);

  if (metaMap[filename]) {
    metaMap[filename].readingTime = readingTime;
    metaMap[filename].thumbnail = metaMap[filename].thumbnail || thumbnail;
  } else {
    // Optionally, return
    return;
  }
});

// Now, merge back: keep all original entries, but update those with filename
const updatedMeta = metaArr.map(post => {
  if (post.filename && metaMap[post.filename]) {
    // Return the updated post
    return metaMap[post.filename];
  }
  // Return untouched post (no filename or not matched)
  return post;
});

// Also, add any new .md files not already in metaArr
Object.values(metaMap).forEach(post => {
  if (!updatedMeta.find(p => p.filename === post.filename)) {
    updatedMeta.push(post);
  }
});

fs.writeFileSync(META_FILE, JSON.stringify(updatedMeta, null, 2));
console.log(`Updated ${META_FILE} with ${updatedMeta.length} posts.`);