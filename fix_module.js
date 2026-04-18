const fs = require('fs');
const path = require('path');

const dir = __dirname;
const htmlFiles = [
  'index.html', 'about.html', 'projects.html', 'blog.html', 'post.html', 'flappy.html',
  'admin/index.html', 'admin/login.html'
];
const jsFiles = [
  'data.js', 'main.js', 'blog.js', 'post.js', 'projects.js', 'admin.js', 'flappy.js'
];

// Fix JS files
for (const file of jsFiles) {
  const p = path.join(dir, 'js', file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf-8');
    
    // Remove imports
    content = content.replace(/import\s+{[^}]*}\s+from\s+['"][^'"]+['"];?/g, '');
    
    // Special case for admin.js import { POSTS as DEFAULT_POSTS, PROJECTS as DEFAULT_PROJECTS, formatDate } from './data.js';
    if (file === 'admin.js') {
      content = content.replace(/import\s+{[^}]*}\s+from\s+['"][^'"]+['"];?/g, '');
      // Add manual assignments
      const prepend = `const DEFAULT_POSTS = POSTS;
const DEFAULT_PROJECTS = PROJECTS;
`;
      content = prepend + content;
    }

    // Remove exports
    content = content.replace(/export\s+const\s+/g, 'const ');
    content = content.replace(/export\s+function\s+/g, 'function ');

    fs.writeFileSync(p, content);
  }
}

// Fix HTML files
for (const file of htmlFiles) {
  const p = path.join(dir, file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf-8');
    const isRoot = !file.startsWith('admin/');
    const prefix = isRoot ? '.' : '..';

    // Replace type="module"
    content = content.replace(/type="module"\s+/g, '');

    // Make paths relative for css and js
    content = content.replace(/href="\/css\//g, `href="${prefix}/css/`);
    content = content.replace(/src="\/js\//g, `src="${prefix}/js/`);
    content = content.replace(/href="\/admin\//g, `href="${prefix}/admin/`);

    // Make internal links relative
    content = content.replace(/href="\/"/g, `href="${prefix}/index.html"`);
    content = content.replace(/href="\/blog\.html"/g, `href="${prefix}/blog.html"`);
    content = content.replace(/href="\/projects\.html"/g, `href="${prefix}/projects.html"`);
    content = content.replace(/href="\/about\.html"/g, `href="${prefix}/about.html"`);
    
    // Insert data.js script tag before main.js or other js if it's not data.js itself
    // But actually, we just need to make sure data.js is loaded first.
    // Let's replace the script tags manually based on the file:
    const dataJsTag = `<script src="${prefix}/js/data.js"></script>`;
    const mainJsTag = `<script src="${prefix}/js/main.js"></script>`;
    
    if (file === 'index.html' || file === 'about.html') {
      content = content.replace(/<script src="[^"]*js\/main\.js"><\/script>/, `${dataJsTag}\n  ${mainJsTag}`);
    } else if (file === 'blog.html') {
      content = content.replace(/<script src="[^"]*js\/blog\.js"><\/script>/, `${dataJsTag}\n  ${mainJsTag}\n  <script src="${prefix}/js/blog.js"></script>`);
    } else if (file === 'post.html') {
      content = content.replace(/<script src="[^"]*js\/post\.js"><\/script>/, `${dataJsTag}\n  ${mainJsTag}\n  <script src="${prefix}/js/post.js"></script>`);
    } else if (file === 'projects.html') {
      // Actually projects.html already has data.js and projects.js
      content = content.replace(/<script src="[^"]*js\/data\.js"><\/script>/, `${mainJsTag}\n  <script src="${prefix}/js/data.js"></script>`);
      // Wait, main.js needs data.js, and projects.js needs main.js and data.js.
      // projects.html currently has: data.js and projects.js. Needs main.js.
      content = content.replace(/<script src="[^"]*js\/projects\.js"><\/script>/, `<script src="${prefix}/js/projects.js"></script>`);
    } else if (file === 'admin/index.html' || file === 'admin/login.html') {
      if (!content.includes('data.js')) {
        content = content.replace(/(<script src="[^"]*js\/admin(?:_login)?\.js"><\/script>)/, `${dataJsTag}\n  $1`);
      }
    }

    // projects.html is a special case:
    if (file === 'projects.html') {
      if (!content.includes('main.js')) {
        content = content.replace(`<script src="${prefix}/js/data.js"></script>`, `<script src="${prefix}/js/data.js"></script>\n  <script src="${prefix}/js/main.js"></script>`);
      }
    }
    
    fs.writeFileSync(p, content);
  }
}

console.log("Migration complete!");
