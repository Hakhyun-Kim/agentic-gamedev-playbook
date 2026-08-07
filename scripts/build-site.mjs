#!/usr/bin/env node
/* =====================================================
 * 웹 앱 데이터 및 정적 번들 생성기 (`npm run build:site`)
 *
 * references/en/*.md, references/ko/*.md, posts/en/*.md, posts/ko/*.md를
 * 읽어 dist/data.json으로 직렬화하고, site/ 정적 리소스를 dist/로 복사합니다.
 * ===================================================== */
import { writeFileSync, readFileSync, readdirSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, CHAPTERS, readChapter } from './playbook-source.mjs';

const DIST_DIR = join(ROOT, 'dist');
const SITE_DIR = join(ROOT, 'site');
const POSTS_DIR = join(ROOT, 'posts');

if (!existsSync(DIST_DIR)) {
  mkdirSync(DIST_DIR, { recursive: true });
}


function parseFrontmatter(raw) {
  const norm = raw.replace(/\r\n/g, '\n');
  if (!norm.startsWith('---')) {
    return { metadata: {}, content: norm };
  }
  const parts = norm.split('---');
  if (parts.length < 3) {
    return { metadata: {}, content: norm };
  }
  const yamlText = parts[1].trim();
  const content = parts.slice(2).join('---').trim();
  const metadata = {};
  for (const line of yamlText.split('\n')) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
        val = val.slice(1, -1);
      }
      metadata[key] = val;
    }
  }
  return { metadata, content };
}

function loadChapters(lang) {
  return CHAPTERS.map((filename, index) => {
    const raw = readChapter(filename, lang);
    const firstLine = raw.split('\n')[0] || '';
    const titleMatch = firstLine.match(/^#+\s+(.+)/);
    const title = titleMatch ? titleMatch[1].trim() : filename;
    return {
      id: filename.replace('.md', ''),
      filename,
      index,
      title,
      content: raw,
    };
  });
}

function loadPosts(lang) {
  const langDir = join(POSTS_DIR, lang);
  if (!existsSync(langDir)) return [];
  const files = readdirSync(langDir).filter((f) => f.endsWith('.md')).sort().reverse();
  return files.map((filename) => {
    const raw = readFileSync(join(langDir, filename), 'utf8');
    const { metadata, content } = parseFrontmatter(raw);
    return {
      id: filename.replace('.md', ''),
      filename,
      title: metadata.title || filename,
      date: metadata.date || '2026-08-07',
      category: metadata.category || 'General',
      author: metadata.author || 'Author',
      summary: metadata.summary || '',
      content,
    };
  });
}

const pkgVer = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;

const siteData = {
  version: pkgVer,
  generatedAt: new Date().toISOString(),
  chapters: {
    en: loadChapters('en'),
    ko: loadChapters('ko'),
  },
  posts: {
    en: loadPosts('en'),
    ko: loadPosts('ko'),
  },
};

// 1. data.json 저장
writeFileSync(join(DIST_DIR, 'data.json'), JSON.stringify(siteData, null, 2), 'utf8');
console.log(`✅ dist/data.json 생성 완료 (${siteData.chapters.en.length}개 EN 장, ${siteData.chapters.ko.length}개 KO 장, ${siteData.posts.en.length}개 EN 블로그글, ${siteData.posts.ko.length}개 KO 블로그글)`);

// 2. site/ 파일들을 dist/로 복사
const siteFiles = ['index.html', 'styles.css', 'app.js'];
for (const f of siteFiles) {
  const src = join(SITE_DIR, f);
  if (existsSync(src)) {
    copyFileSync(src, join(DIST_DIR, f));
    console.log(`✅ dist/${f} 복사 완료`);
  }
}
