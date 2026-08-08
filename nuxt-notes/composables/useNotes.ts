// Composable: useNotes
// CRUD operations for notes
export interface Note {
  id: number
  title: string | null
  content: string
  created_at: string
  updated_at: string
}

export const useNotes = () => {
  const { apiFetch } = useAuth()
  const notes = useState<Note[]>('notes_list', () => [])
  const loading = useState('notes_loading', () => false)

  const fetchNotes = async () => {
    loading.value = true
    try {
      const json = await apiFetch('/api/notes?per_page=100')
      notes.value = json.data.notes
    } finally {
      loading.value = false
    }
  }

  const createNote = async (title: string, content: string): Promise<Note> => {
    const json = await apiFetch('/api/notes', {
      method: 'POST',
      body: JSON.stringify({ title: title || undefined, content }),
    })
    notes.value.unshift(json.data)
    return json.data
  }

  const updateNote = async (id: number, title: string, content: string): Promise<Note> => {
    const json = await apiFetch(`/api/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: title || null, content }),
    })
    const idx = notes.value.findIndex(n => n.id === id)
    if (idx !== -1) notes.value[idx] = json.data
    return json.data
  }

  const deleteNote = async (id: number) => {
    await apiFetch(`/api/notes/${id}`, { method: 'DELETE' })
    notes.value = notes.value.filter(n => n.id !== id)
  }

  return { notes, loading, fetchNotes, createNote, updateNote, deleteNote }
}
