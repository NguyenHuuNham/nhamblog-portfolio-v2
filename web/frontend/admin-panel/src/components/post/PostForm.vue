<template>
  <form class="post-form admin-card" @submit.prevent="handleSubmit">
    <div class="form-group">
      <label class="form-label">Title *</label>
      <input v-model="form.title" type="text" class="form-input" placeholder="Post title" required minlength="5" />
    </div>

    <div class="form-row">
      <div class="form-group" style="flex:1">
        <label class="form-label">Category *</label>
        <select v-model="form.categoryId" class="form-input" required>
          <option value="">Select category...</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
      </div>
      <div class="form-group" style="flex:1">
        <label class="form-label">Status</label>
        <select v-model="form.status" class="form-input">
          <option value="Draft">Draft</option>
          <option value="Published">Published</option>
          <option value="Archived">Archived</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Excerpt</label>
      <textarea v-model="form.excerpt" class="form-input" rows="2" placeholder="Short description..."></textarea>
    </div>

    <div class="form-group">
      <label class="form-label">Thumbnail URL</label>
      <input v-model="form.thumbnailUrl" type="url" class="form-input" placeholder="https://..." />
    </div>

    <div class="form-group">
      <label class="form-label">Content *</label>
      <div class="editor-wrap">
        <div class="editor-toolbar" v-if="editor">
          <button type="button" @click="editor.chain().focus().toggleBold().run()" :class="{ active: editor.isActive('bold') }">B</button>
          <button type="button" @click="editor.chain().focus().toggleItalic().run()" :class="{ active: editor.isActive('italic') }"><em>I</em></button>
          <button type="button" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ active: editor.isActive('heading', { level: 2 }) }">H2</button>
          <button type="button" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="{ active: editor.isActive('heading', { level: 3 }) }">H3</button>
          <button type="button" @click="editor.chain().focus().toggleBulletList().run()" :class="{ active: editor.isActive('bulletList') }">• List</button>
          <button type="button" @click="editor.chain().focus().toggleOrderedList().run()" :class="{ active: editor.isActive('orderedList') }">1. List</button>
          <button type="button" @click="editor.chain().focus().toggleCodeBlock().run()" :class="{ active: editor.isActive('codeBlock') }">&lt;/&gt;</button>
          <button type="button" @click="editor.chain().focus().toggleBlockquote().run()" :class="{ active: editor.isActive('blockquote') }">❝</button>
        </div>
        <EditorContent class="editor-content" :editor="editor" />
      </div>
    </div>

    <div class="form-actions">
      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ loading ? 'Saving...' : (initial ? 'Update Post' : 'Create Post') }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

const props = defineProps<{
  categories: any[]
  initial?: any
  loading?: boolean
}>()

const emit = defineEmits<{ submit: [data: any] }>()

const form = ref({
  title: props.initial?.title ?? '',
  excerpt: props.initial?.excerpt ?? '',
  thumbnailUrl: props.initial?.thumbnailUrl ?? '',
  status: props.initial?.status ?? 'Draft',
  categoryId: props.initial?.categoryId ?? '',
})

const editor = useEditor({
  content: props.initial?.content ?? '',
  extensions: [StarterKit],
})

onBeforeUnmount(() => editor.value?.destroy())

function handleSubmit() {
  emit('submit', {
    ...form.value,
    content: editor.value?.getHTML() ?? '',
    categoryId: Number(form.value.categoryId),
  })
}
</script>

<style scoped>
.post-form { display: flex; flex-direction: column; }
.form-row { display: flex; gap: 1rem; }
.editor-wrap {
  border: 1px solid var(--admin-border); border-radius: var(--radius-md);
  overflow: hidden;
  transition: border-color var(--transition);
}
.editor-wrap:focus-within { border-color: var(--admin-accent); box-shadow: 0 0 0 3px var(--admin-accent-glow); }
.editor-toolbar {
  display: flex; flex-wrap: wrap; gap: 0.25rem;
  padding: 0.5rem; background: var(--admin-surface-2);
  border-bottom: 1px solid var(--admin-border);
}
.editor-toolbar button {
  padding: 0.3rem 0.6rem; border-radius: var(--radius-sm);
  background: none; border: 1px solid transparent;
  color: var(--admin-text-secondary); font-size: 0.8rem; font-weight: 600;
  cursor: pointer; transition: all var(--transition);
}
.editor-toolbar button:hover { background: var(--admin-border); color: var(--admin-text); }
.editor-toolbar button.active { background: rgba(124,111,247,0.2); color: var(--admin-accent); border-color: rgba(124,111,247,0.3); }

.form-actions { display: flex; justify-content: flex-end; margin-top: 0.5rem; }
</style>

<style>
/* Tiptap global styles */
.editor-content .ProseMirror {
  padding: 1rem; min-height: 320px;
  outline: none; color: var(--admin-text);
  font-size: 0.95rem; line-height: 1.7;
}
.editor-content .ProseMirror p { margin-bottom: 0.75rem; }
.editor-content .ProseMirror h2 { font-size: 1.4rem; margin: 1.25rem 0 0.5rem; }
.editor-content .ProseMirror h3 { font-size: 1.15rem; margin: 1rem 0 0.4rem; }
.editor-content .ProseMirror ul, .editor-content .ProseMirror ol { padding-left: 1.5rem; margin-bottom: 0.75rem; }
.editor-content .ProseMirror code { background: var(--admin-surface-2); padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.875em; }
.editor-content .ProseMirror pre { background: var(--admin-surface-2); padding: 1rem; border-radius: 8px; overflow-x: auto; }
.editor-content .ProseMirror blockquote { border-left: 3px solid var(--admin-accent); padding-left: 1rem; color: var(--admin-text-secondary); font-style: italic; }
.editor-content .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: var(--admin-text-muted); pointer-events: none; float: left; height: 0; }
</style>
