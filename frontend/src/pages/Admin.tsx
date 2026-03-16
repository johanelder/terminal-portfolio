import { useState, useEffect, useCallback } from 'react'
import {
  fetchAllPosts,
  createPost,
  updatePost,
  deletePost,
  type Post,
  type PostInput,
} from '../services/posts'
import styles from './Admin.module.css'

type View = 'list' | 'create' | 'edit'

const EMPTY_FORM: PostInput = {
  title: '',
  description: '',
  external_url: '',
  tags: '',
  status: 'draft',
}

export default function Admin() {
  const [view, setView] = useState<View>('list')
  const [posts, setPosts] = useState<Post[]>([])
  const [editTarget, setEditTarget] = useState<Post | null>(null)
  const [form, setForm] = useState<PostInput>(EMPTY_FORM)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const loadPosts = useCallback(() => {
    fetchAllPosts().then(setPosts).catch(() => setPosts([]))
  }, [])

  useEffect(() => { loadPosts() }, [loadPosts])

  function openCreate() {
    setForm(EMPTY_FORM)
    setError('')
    setView('create')
  }

  function openEdit(post: Post) {
    setEditTarget(post)
    setForm({
      title: post.title,
      description: post.description ?? '',
      external_url: post.external_url ?? '',
      tags: post.tags ?? '',
      status: post.status,
    })
    setError('')
    setView('edit')
  }

  function cancelForm() {
    setEditTarget(null)
    setError('')
    setView('list')
  }

  function field(key: keyof PostInput, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('title is required'); return }
    setError('')
    setBusy(true)
    try {
      if (view === 'create') {
        await createPost(form)
      } else if (view === 'edit' && editTarget) {
        await updatePost(editTarget.id, form)
      }
      loadPosts()
      setView('list')
      setEditTarget(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'save failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id: number) {
    if (confirmDelete !== id) { setConfirmDelete(id); return }
    setConfirmDelete(null)
    setBusy(true)
    try {
      await deletePost(id)
      loadPosts()
    } catch {
      // silently reload; stale entry will persist until next refresh
      loadPosts()
    } finally {
      setBusy(false)
    }
  }

  if (view === 'create' || view === 'edit') {
    return (
      <div className={styles.page}>
        <div className={styles.title}>
          #_ [root@terminal] — {view === 'create' ? 'new post' : 'edit post'}
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>&gt; title:</span>
            <input
              className={styles.fieldInput}
              value={form.title}
              onChange={e => field('title', e.target.value)}
              placeholder="_"
              disabled={busy}
            />
          </div>

          <div className={styles.field} style={{ alignItems: 'flex-start' }}>
            <span className={styles.fieldLabel} style={{ paddingTop: 2 }}>&gt; description:</span>
            <textarea
              className={styles.fieldTextarea}
              value={form.description}
              onChange={e => field('description', e.target.value)}
              placeholder="_"
              disabled={busy}
              rows={3}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>&gt; url:</span>
            <input
              className={styles.fieldInput}
              type="url"
              value={form.external_url}
              onChange={e => field('external_url', e.target.value)}
              placeholder="_"
              disabled={busy}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>&gt; tags:</span>
            <input
              className={styles.fieldInput}
              value={form.tags}
              onChange={e => field('tags', e.target.value)}
              placeholder="react, typescript, gcp"
              disabled={busy}
            />
          </div>

          <div className={styles.field} style={{ border: 'none', paddingBottom: 0 }}>
            <span className={styles.fieldLabel}>&gt; status:</span>
            <div className={styles.statusToggle}>
              {(['draft', 'published'] as const).map(s => (
                <label
                  key={s}
                  className={`${styles.statusOption} ${form.status === s ? styles.active : ''}`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={form.status === s}
                    onChange={() => field('status', s)}
                    disabled={busy}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.error}>{error}</div>

          <div className={styles.formActions}>
            <button className={styles.submitBtn} type="submit" disabled={busy}>
              {busy ? '> saving...' : '> save post'}
            </button>
            <button className={styles.cancelBtn} type="button" onClick={cancelForm} disabled={busy}>
              [cancel]
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.title}>#_ [root@terminal] — Admin Dashboard</div>

      <button className={styles.newPostBtn} onClick={openCreate}>
        &gt; + new post
      </button>

      <div className={styles.postList}>
        {posts.length === 0 && (
          <div className={styles.empty}>&gt; no posts yet</div>
        )}

        {posts.map(post => (
          <div key={post.id} className={styles.postRow}>
            <div className={styles.postMeta}>
              <div className={styles.postTitle}>
                {post.external_url
                  ? <a href={post.external_url} target="_blank" rel="noreferrer">{post.title}</a>
                  : post.title
                }
              </div>
              {post.description && (
                <div className={styles.postDetail}>{post.description}</div>
              )}
              {post.tags && (
                <div className={styles.postDetail}>tags: {post.tags}</div>
              )}
            </div>

            <div className={styles.postActions}>
              <span className={`${styles.badge} ${post.status === 'published' ? styles.published : ''}`}>
                {post.status}
              </span>
              <button className={styles.btn} onClick={() => openEdit(post)} disabled={busy}>
                [edit]
              </button>
              <button
                className={styles.btnDanger}
                onClick={() => handleDelete(post.id)}
                disabled={busy}
              >
                {confirmDelete === post.id ? '[confirm?]' : '[delete]'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
