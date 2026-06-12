// =============================================
// data/seed.js — Seed default data on first run
// Uses /tmp on Vercel, __dirname locally
// =============================================

const fs   = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { DATA_DIR, POSTGRES_ENABLED, SUPABASE_ENABLED } = require('../config/paths');

if (POSTGRES_ENABLED || SUPABASE_ENABLED) {
  console.log('📂 Database ready! Supabase mode');
  return;
}

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const FILES = {
  posts:    path.join(DATA_DIR, 'posts.json'),
  projects: path.join(DATA_DIR, 'projects.json'),
  profile:  path.join(DATA_DIR, 'profile.json'),
  settings: path.join(DATA_DIR, 'settings.json'),
  admin:    path.join(DATA_DIR, 'admin.json'),
};

function seedIfMissing(file, data) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Seeded: ${path.basename(file)}`);
  }
}

// ---- Admin credentials ----
const passwordHash = bcrypt.hashSync('nhamblog2026', 10);
seedIfMissing(FILES.admin, {
  username: 'admin',
  passwordHash,
  name: 'Nguyễn Hữu Nhâm',
});

// ---- Profile ----
seedIfMissing(FILES.profile, {
  name:      'Nguyễn Hữu Nhâm',
  title:     'Mobile App Developer',
  email:     'nham@email.com',
  phone:     '0987.654.321',
  location:  'Hà Nội, Việt Nam',
  github:    'https://github.com/NguyenHuuNham',
  hero:      'Sinh viên IT năm 3 · Mobile App Developer',
  bio:       'Xin chào! Tôi là Nguyễn Hữu Nhâm, sinh viên IT năm 3 với đam mê cháy bỏng về phát triển ứng dụng mobile.',
  status:    'Đang tìm kiếm cơ hội thực tập',
  avatarUrl: null,
  cvUrl:     null,
  cvName:    null,
});

// ---- Settings ----
seedIfMissing(FILES.settings, {
  maintenance: false,
  musicUrl:    null,
  siteName:    'Nhâm Mobile Dev',
});

// ---- Posts ----
seedIfMissing(FILES.posts, [
  {
    id: 1, slug: 'flutter-bloc-vs-riverpod',
    title:    'Flutter BLoC vs Riverpod: Chọn gì cho dự án 2026?',
    summary:  'So sánh chi tiết hai state management phổ biến nhất trong Flutter ecosystem. Khi nào dùng BLoC, khi nào dùng Riverpod?',
    content:  '## Giới thiệu\n\nKhi phát triển ứng dụng Flutter, việc chọn state management phù hợp là rất quan trọng...\n\n## BLoC Pattern\n\nBLoC (Business Logic Component) là một pattern được Google giới thiệu...\n\n## Riverpod\n\nRiverpod là phiên bản cải tiến của Provider, được tạo ra bởi Remi Rousselet...\n\n## Kết luận\n\n- Dùng **BLoC** khi: team lớn, cần strict structure\n- Dùng **Riverpod** khi: linh hoạt, ít boilerplate hơn',
    date:     '2026-04-08',
    tags:     ['flutter', 'dart'],
    readTime: '8 phút',
    likes:    0,
    comments: [],
    imageUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2, slug: 'react-native-new-architecture',
    title:    'React Native New Architecture — Tất cả những gì bạn cần biết',
    summary:  'Kiến trúc mới của React Native (JSI, Fabric, TurboModules) đã thay đổi hoàn toàn cách hoạt động của framework.',
    content:  '## New Architecture là gì?\n\nReact Native New Architecture là một bộ cải tiến lớn bao gồm JSI, Fabric Renderer, và TurboModules...\n\n## JSI (JavaScript Interface)\n\nJSI thay thế bridge cũ bằng giao tiếp trực tiếp...',
    date:     '2026-03-25',
    tags:     ['react-native'],
    readTime: '12 phút',
    likes:    0,
    comments: [],
    imageUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3, slug: 'flutter-animation-tips',
    title:    '10 Animation tips trong Flutter để app trông "xịn" hơn',
    summary:  'Những kỹ thuật animation đơn giản nhưng hiệu quả để cải thiện UX của ứng dụng Flutter.',
    content:  '## 1. AnimatedContainer\n\nSử dụng AnimatedContainer để tự động animate...\n\n## 2. Hero Animation\n\nHero animation tạo ra hiệu ứng chuyển tiếp mượt mà giữa hai màn hình...',
    date:     '2026-03-10',
    tags:     ['flutter', 'tips'],
    readTime: '6 phút',
    likes:    0,
    comments: [],
    imageUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 4, slug: 'kotlin-flow-vs-livedata',
    title:    'Kotlin Flow vs LiveData — Bao giờ dùng cái nào?',
    summary:  'Hướng dẫn thực tế về sự khác nhau giữa Kotlin Flow và LiveData trong Android development.',
    content:  '## LiveData\n\nLiveData là một observable data holder class...\n\n## Kotlin Flow\n\nFlow là một cold observable stream trong Kotlin Coroutines...',
    date:     '2026-02-20',
    tags:     ['kotlin'],
    readTime: '10 phút',
    likes:    0,
    comments: [],
    imageUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 5, slug: 'mobile-app-ci-cd',
    title:    'CI/CD cho Mobile App với GitHub Actions — Hướng dẫn từ A-Z',
    summary:  'Tự động hóa việc build, test và deploy ứng dụng Flutter/React Native bằng GitHub Actions.',
    content:  '## Tại sao cần CI/CD?\n\n...\n\n## Setup GitHub Actions\n\n...',
    date:     '2026-02-05',
    tags:     ['tips', 'flutter', 'react-native'],
    readTime: '15 phút',
    likes:    0,
    comments: [],
    imageUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 6, slug: 'flutter-deep-links',
    title:    'Deep Links trong Flutter — Firebase Dynamic Links hay App Links?',
    summary:  'Hướng dẫn triển khai deep linking trong Flutter app từ cơ bản đến nâng cao.',
    content:  '## Deep Linking là gì?\n\n...\n\n## Firebase Dynamic Links\n\n...',
    date:     '2026-01-18',
    tags:     ['flutter'],
    readTime: '9 phút',
    likes:    0,
    comments: [],
    imageUrl: null,
    createdAt: new Date().toISOString(),
  },
]);

// ---- Projects ----
seedIfMissing(FILES.projects, [
  {
    id: 1, icon: '🛍️', title: 'ShopeeClone Mobile',
    description: 'Clone đầy đủ giao diện Shopee bằng Flutter. Tích hợp REST API, giỏ hàng, thanh toán giả lập và tìm kiếm sản phẩm real-time.',
    tech: ['flutter', 'dart'], techLabels: ['Flutter', 'Dart', 'BLoC', 'REST API'],
    status: 'completed', github: 'https://github.com/NguyenHuuNham/shopee-clone',
    demo: null, featured: true, imageUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2, icon: '💘', title: 'TinderClone',
    description: 'Ứng dụng hẹn hò với swipe gesture, real-time chat bằng Firebase, push notifications và màn hình match animation.',
    tech: ['flutter', 'dart'], techLabels: ['Flutter', 'Firebase', 'Riverpod', 'Firestore'],
    status: 'completed', github: 'https://github.com/NguyenHuuNham/tinder-clone',
    demo: null, featured: true, imageUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3, icon: '🎮', title: 'Flappy Bird (Dart)',
    description: 'Remake trò chơi Flappy Bird bằng thuần Dart + Flutter Canvas, sử dụng game loop tùy chỉnh và vật lý đơn giản.',
    tech: ['flutter', 'dart'], techLabels: ['Flutter', 'Dart', 'Canvas API'],
    status: 'completed', github: 'https://github.com/NguyenHuuNham/flappy-bird-flutter',
    demo: null, featured: true, imageUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 4, icon: '📝', title: 'Task Manager (React Native)',
    description: 'Ứng dụng quản lý công việc đa nền tảng với drag & drop, reminders, và đồng bộ cloud qua AsyncStorage.',
    tech: ['react-native'], techLabels: ['React Native', 'Redux', 'AsyncStorage'],
    status: 'completed', github: 'https://github.com/NguyenHuuNham/task-manager-rn',
    demo: null, featured: false, imageUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 5, icon: '🤖', title: 'Chat AI App (Android Native)',
    description: 'Ứng dụng Android native tích hợp Gemini API, hỗ trợ voice-to-text và chat history persistence với Room DB.',
    tech: ['kotlin'], techLabels: ['Kotlin', 'Jetpack Compose', 'Gemini API', 'Room'],
    status: 'inprogress', github: 'https://github.com/NguyenHuuNham/ai-chat-android',
    demo: null, featured: false, imageUrl: null,
    createdAt: new Date().toISOString(),
  },
]);

console.log('📂 Database ready!');
