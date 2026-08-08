<template>
  <div>
    <!-- Navbar -->
    <nav class="navbar">
      <div class="container navbar-inner">
        <span class="navbar-brand">📝 Notes</span>
        <div style="display:flex;align-items:center;gap:1rem">
          <span style="font-size:.9rem;color:#6b7280">{{ (user as any)?.username }}</span>
          <button class="btn btn-ghost btn-sm" @click="logout">Sign out</button>
        </div>
      </div>
    </nav>

    <div class="container">
      <!-- Header -->
      <div class="notes-header">
        <h1>My Notes</h1>
        <button class="btn btn-primary" @click="openCreate">+ New note</button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="spinner">Loading…</div>

      <!-- Empty -->
      <div v-else-if="!notes.length" class="empty-state">
        <p>You don't have any notes yet.</p>
        <button class="btn btn-primary" @click="openCreate">Create your first note</button>
      </div>

      <!-- Grid -->
      <div v-else class="notes-grid">
        <div v-for="note in notes" :key="note.id" class="note-card">
          <div v-if="note.title" class="note-title">{{ note.title }}</div>
          <div class="note-content">{{ note.content }}</div>
          <div class="note-date">{{ fmtDate(note.updated_at) }}</div>
          <div class="note-actions">
            <button class="btn btn-ghost btn-sm" @click="openEdit(note)">Edit</button>
            <button class="btn btn-danger btn-sm" @click="confirmDelete(note.id)">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create / Edit modal -->
    <div v-if="modal" class="modal-backdrop" @click.self="modal = false">
      <div class="modal-box">
        <h2 class="modal-title">{{ editId ? 'Edit note' : 'New note' }}</h2>
        <div v-if="modalError" class="alert alert-error">{{ modalError }}</div>
        <form @submit.prevent="saveNote">
          <div class="form-group">
            <label>Title (optional)</label>
            <input v-model="form.title" type="text" placeholder="Untitled" />
          </div>
          <div class="form-group">
            <label>Content *</label>
            <textarea v-model="form.content" placeholder="Write your note…" required></textarea>
          </div>
          <div style="display:flex;gap:.75rem;justify-content:flex-end">
            <button type="button" class="btn btn-ghost" @click="modal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Note } from '~/composables/useNotes'

definePageMeta({ middleware: 'auth' })

const { user, logout } = useAuth()
const { notes, loading, fetchNotes, createNote, updateNote, deleteNote } = useNotes()

await fetchNotes()

// Modal state
const modal = ref(false)
const editId = ref<number | null>(null)
const form = reactive({ title: '', content: '' })
const modalError = ref('')
const saving = ref(false)

const openCreate = () => {
  editId.value = null
  form.title = ''
  form.content = ''
  modalError.value = ''
  modal.value = true
}

const openEdit = (note: Note) => {
  editId.value = note.id
  form.title = note.title || ''
  form.content = note.content
  modalError.value = ''
  modal.value = true
}

const saveNote = async () => {
  modalError.value = ''
  saving.value = true
  try {
    if (editId.value) {
      await updateNote(editId.value, form.title, form.content)
    } else {
      await createNote(form.title, form.content)
    }
    modal.value = false
  } catch (e: unknown) {
    modalError.value = (e as Error).message
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (id: number) => {
  if (!confirm('Delete this note?')) return
  await deleteNote(id)
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
</script>
