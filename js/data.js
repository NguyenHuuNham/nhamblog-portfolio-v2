// =============================================
// data.js — Default data definitions
// Actual data loaded async from Firebase/localStorage by db.js
// =============================================

// Default fallback data (used when DB is empty or offline)
const _DEFAULT_POSTS = [
  { id: 1, slug: 'flutter-bloc-vs-riverpod', title: 'Flutter BLoC vs Riverpod: Chọn gì cho dự án 2026?', summary: 'So sánh chi tiết hai state management phổ biến nhất trong Flutter ecosystem. Khi nào dùng BLoC, khi nào dùng Riverpod?', date: '2026-04-08', tags: ['flutter', 'dart'], readTime: '8 phút', likes: 0, ratings: { totalScore: 0, count: 0 }, comments: [] },
  { id: 2, slug: 'react-native-new-architecture', title: 'React Native New Architecture — Tất cả những gì bạn cần biết', summary: 'Kiến trúc mới của React Native (JSI, Fabric, TurboModules) đã thay đổi hoàn toàn cách hoạt động của framework.', date: '2026-03-25', tags: ['react-native'], readTime: '12 phút', likes: 0, ratings: { totalScore: 0, count: 0 }, comments: [] },
  { id: 3, slug: 'flutter-animation-tips', title: '10 Animation tips trong Flutter để app trông "xịn" hơn', summary: 'Những kỹ thuật animation đơn giản nhưng hiệu quả để cải thiện UX của ứng dụng Flutter.', date: '2026-03-10', tags: ['flutter', 'tips'], readTime: '6 phút', likes: 0, ratings: { totalScore: 0, count: 0 }, comments: [] },
  { id: 4, slug: 'kotlin-flow-vs-livedata', title: 'Kotlin Flow vs LiveData — Bao giờ dùng cái nào?', summary: 'Hướng dẫn thực tế về sự khác nhau giữa Kotlin Flow và LiveData trong Android development.', date: '2026-02-20', tags: ['kotlin'], readTime: '10 phút', likes: 0, ratings: { totalScore: 0, count: 0 }, comments: [] },
  { id: 5, slug: 'mobile-app-ci-cd', title: 'CI/CD cho Mobile App với GitHub Actions — Hướng dẫn từ A-Z', summary: 'Tự động hóa việc build, test và deploy ứng dụng Flutter/React Native bằng GitHub Actions.', date: '2026-02-05', tags: ['tips', 'flutter', 'react-native'], readTime: '15 phút', likes: 0, ratings: { totalScore: 0, count: 0 }, comments: [] },
  { id: 6, slug: 'flutter-deep-links', title: 'Deep Links trong Flutter — Firebase Dynamic Links hay App Links?', summary: 'Hướng dẫn triển khai deep linking trong Flutter app từ cơ bản đến nâng cao.', date: '2026-01-18', tags: ['flutter'], readTime: '9 phút', likes: 0, ratings: { totalScore: 0, count: 0 }, comments: [] },
];

const _DEFAULT_PROJECTS = [
  { id: 1, icon: '🛍️', title: 'ShopeeClone Mobile', description: 'Clone đầy đủ giao diện Shopee bằng Flutter. Tích hợp REST API, giỏ hàng, thanh toán giả lập và tìm kiếm sản phẩm real-time.', tech: ['flutter', 'dart'], techLabels: ['Flutter', 'Dart', 'BLoC', 'REST API'], status: 'completed', github: 'https://github.com/NguyenHuuNham/shopee-clone', demo: null, featured: true },
  { id: 2, icon: '💘', title: 'TinderClone', description: 'Ứng dụng hẹn hò với swipe gesture, real-time chat bằng Firebase, push notifications và màn hình match animation.', tech: ['flutter', 'dart'], techLabels: ['Flutter', 'Firebase', 'Riverpod', 'Firestore'], status: 'completed', github: 'https://github.com/NguyenHuuNham/tinder-clone', demo: null, featured: true },
  { id: 3, icon: '🎮', title: 'Flappy Bird (Dart)', description: 'Remake trò chơi Flappy Bird bằng thuần Dart + Flutter Canvas, sử dụng game loop tùy chỉnh và vật lý đơn giản.', tech: ['flutter', 'dart'], techLabels: ['Flutter', 'Dart', 'Canvas API'], status: 'completed', github: 'https://github.com/NguyenHuuNham/flappy-bird-flutter', demo: null, featured: true },
  { id: 5, icon: '📝', title: 'Task Manager (React Native)', description: 'Ứng dụng quản lý công việc đa nền tảng với drag & drop, reminders, và đồng bộ cloud qua AsyncStorage.', tech: ['react-native'], techLabels: ['React Native', 'Redux', 'AsyncStorage'], status: 'completed', github: 'https://github.com/NguyenHuuNham/task-manager-rn', demo: null, featured: false },
  { id: 6, icon: '🤖', title: 'Chat AI App (Android Native)', description: 'Ứng dụng Android native tích hợp Gemini API, hỗ trợ voice-to-text và chat history persistence với Room DB.', tech: ['kotlin'], techLabels: ['Kotlin', 'Jetpack Compose', 'Gemini API', 'Room'], status: 'inprogress', github: 'https://github.com/NguyenHuuNham/ai-chat-android', demo: null, featured: false },
];

const _DEFAULT_PROFILE = {
  name: 'Nguyễn Hữu Nhâm', title: 'Mobile App Developer',
  email: 'nham@email.com', phone: '0987.654.321',
  location: 'Hà Nội, Việt Nam', github: 'https://github.com/NguyenHuuNham',
  hero: 'Sinh viên IT năm 3 · Mobile App Developer',
  bio: 'Xin chào! Tôi là Nguyễn Hữu Nhâm, sinh viên IT năm 3 với đam mê cháy bỏng về phát triển ứng dụng mobile.',
  status: 'Đang tìm kiếm cơ hội thực tập',
  avatar: null, avatarUrl: null, cvUrl: null, cvName: null,
};

// Global state — populated async by loadPublicData()
let POSTS    = [];
let PROJECTS = [];
let PROFILE  = { ..._DEFAULT_PROFILE };
let SETTINGS = { maintenance: false };

// =============================================
// Async loader — called once on DOMContentLoaded
// =============================================
async function loadPublicData() {
  try {
    // Load profile & settings first (fast)
    const [prof, sett] = await Promise.all([
      dbGetDoc('profile'),
      dbGetDoc('settings'),
    ]);
    PROFILE  = prof  ? { ..._DEFAULT_PROFILE, ...prof  } : { ..._DEFAULT_PROFILE };
    SETTINGS = sett  ? { maintenance: false, ...sett   } : { maintenance: false };

    // Load collections
    const [postsArr, projectsArr] = await Promise.all([
      dbGetAll('posts'),
      dbGetAll('projects'),
    ]);

    POSTS    = postsArr.length    ? postsArr    : _DEFAULT_POSTS.slice();
    PROJECTS = projectsArr.length ? projectsArr : _DEFAULT_PROJECTS.slice();

    // Sort
    POSTS.sort((a, b) => new Date(b.date) - new Date(a.date));
    PROJECTS.sort((a, b) => (a.id || 0) - (b.id || 0));
  } catch (e) {
    console.warn('loadPublicData error, using defaults:', e);
    POSTS    = _DEFAULT_POSTS.slice();
    PROJECTS = _DEFAULT_PROJECTS.slice();
    PROFILE  = { ..._DEFAULT_PROFILE };
  }
}

// =============================================
// Shared utils (used by all pages)
// =============================================
function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return dateStr || ''; }
}
