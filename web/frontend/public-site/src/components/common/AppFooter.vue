<template>
  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <span class="logo-icon">✦</span>
        <span class="logo-text">NhamBlog</span>
        <p class="footer-tagline">Thoughts, ideas, and code.</p>
      </div>
      <div class="footer-copy">
        © {{ new Date().getFullYear() }} NhamBlog. Built with Vue 3 + ASP.NET Core.
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--color-border);
  padding: 2.5rem 0;
  margin-top: 4rem;
}
.footer-inner {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 1rem;
}
.footer-brand {
  display: flex; align-items: center; gap: 0.75rem;
}
.logo-icon { color: var(--color-accent); font-size: 1.2rem; }
.logo-text {
  font-weight: 700;
  background: var(--color-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.footer-tagline { color: var(--color-text-muted); font-size: 0.8rem; }
.footer-copy { color: var(--color-text-muted); font-size: 0.8rem; }
</style>
