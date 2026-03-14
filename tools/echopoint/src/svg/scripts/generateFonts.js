const https = require('https');
const fs = require('fs');

const fonts = [
  { url: 'https://cdn.ujjwalvivek.com/fonts/JetBrainsMono/Regular.woff2', id: 'JB_REG' },
  { url: 'https://cdn.ujjwalvivek.com/fonts/JetBrainsMono/Bold.woff2', id: 'JB_BOLD' },
  { url: 'https://cdn.ujjwalvivek.com/fonts/Monaspace/Neon/Var.woff2', id: 'MN_VAR' },
  { url: 'https://cdn.ujjwalvivek.com/fonts/Monaspace/Krypton/Var.woff2', id: 'MK_VAR' }
];

async function fetchBase64(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data).toString('base64')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function run() {
  let jsContent = 'export const FONTS = {\n';
  for (const font of fonts) {
    console.log(`Downloading and encoding: ${font.id}`);
    const b64 = await fetchBase64(font.url);
    jsContent += `  ${font.id}: '${b64}',\n`;
  }
  jsContent += '};\n';
  fs.writeFileSync('src/svg/fonts.js', jsContent);
  console.log('Successfully wrote src/svg/fonts.js');
}

run();
