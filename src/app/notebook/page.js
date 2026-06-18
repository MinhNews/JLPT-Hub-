'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle,
  Clock3,
  FilePlus2,
  Filter,
  Link as LinkIcon,
  Loader2,
  Pin,
  Save,
  Search,
  Sparkles,
  Star,
  Tag,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');

const typeOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'general', label: 'Ghi chú' },
  { value: 'vocab', label: 'Từ vựng' },
  { value: 'grammar', label: 'Ngữ pháp' },
  { value: 'reading', label: 'Đọc hiểu' },
  { value: 'listening', label: 'Nghe hiểu' },
  { value: 'kanji', label: 'Kanji' },
  { value: 'mistake', label: 'Lỗi sai' },
  { value: 'plan', label: 'Kế hoạch' },
];

const levelOptions = ['N5', 'N4', 'N3', 'N2', 'N1', 'ALL'];

const statusOptions = [
  { value: 'new', label: 'Mới ghi' },
  { value: 'review', label: 'Cần ôn' },
  { value: 'mastered', label: 'Đã thuộc' },
];

const templates = [
  {
    id: 'blank',
    label: 'Ghi chú trống',
    type: 'general',
    tags: [],
    content: '',
  },
  {
    id: 'vocab',
    label: 'Từ vựng dễ nhầm',
    type: 'vocab',
    tags: ['dễ nhầm', 'cần ôn'],
    content: `Từ / Kanji:
Cách đọc:
Hán Việt:
Nghĩa:

Ví dụ:
-

Dễ nhầm với:
-

Ghi nhớ:`,
  },
  {
    id: 'grammar',
    label: 'Mẫu ngữ pháp',
    type: 'grammar',
    tags: ['ngữ pháp', 'cần ôn'],
    content: `Mẫu:
Nghĩa:
Cách dùng:

Ví dụ:
-

Dễ nhầm với:
-

Ghi nhớ:`,
  },
  {
    id: 'reading',
    label: 'Câu đọc hiểu khó',
    type: 'reading',
    tags: ['đọc hiểu', 'câu khó'],
    content: `Câu tiếng Nhật:

Bản dịch:

Từ khóa / cấu trúc cần chú ý:
-

Vì sao câu này quan trọng:`,
  },
  {
    id: 'mistake',
    label: 'Lỗi sai của tôi',
    type: 'mistake',
    tags: ['lỗi sai', 'cần ôn'],
    content: `Câu hỏi:
Đáp án mình chọn:
Đáp án đúng:

Vì sao mình sai:

Cách tránh sai lại:
- `,
  },
  {
    id: 'plan',
    label: 'Kế hoạch ôn thi',
    type: 'plan',
    tags: ['kế hoạch'],
    content: `Mục tiêu:
Thời hạn:

Việc cần làm:
- [ ]
- [ ]
- [ ]

Ghi chú:`,
  },
];

const typeLabel = (value) => typeOptions.find((item) => item.value === value)?.label || 'Ghi chú';
const statusLabel = (value) => statusOptions.find((item) => item.value === value)?.label || 'Mới ghi';
const formatTime = (value) => value ? new Date(value).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '';
const escapeHtml = (value = '') => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const toEditorHtml = (value = '') => /<\/?[a-z][\s\S]*>/i.test(value) ? value : escapeHtml(value).replace(/\n/g, '<br>');
const stripHtml = (value = '') => String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const makeLocalNote = (template = templates[0]) => ({
  id: `local_${Date.now()}`,
  title: template.label,
  content: template.content,
  type: template.type,
  level: 'N3',
  tags: template.tags,
  status: 'new',
  pinned: false,
  template: template.id,
  source: {},
});

export default function NotebookPage() {
  const { user } = useAuth();
  const editorRef = useRef(null);
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const notify = (message, type = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 2800);
  };

  const loadNotes = async () => {
    setLoading(true);
    setError('');
    try {
      if (!user) {
        const local = JSON.parse(localStorage.getItem('jlpt_study_notebook') || '[]');
        const legacy = localStorage.getItem('jlpt_n3_notebook');
        const merged = local.length ? local : legacy ? [{ ...makeLocalNote(), title: 'Ghi chú cũ', content: legacy, type: 'general' }] : [];
        setNotes(merged);
        if (merged[0]) {
          setSelectedId(merged[0].id);
          setDraft(merged[0]);
        }
        return;
      }

      const res = await fetch(`${API_BASE_URL}/notebook`, { credentials: 'include' });
      if (!res.ok) throw new Error('Không tải được sổ tay');
      const data = await res.json();
      setNotes(data);
      if (data[0]) {
        setSelectedId(data[0].id);
        setDraft(data[0]);
      } else {
        setSelectedId('');
        setDraft(null);
      }
    } catch (err) {
      setError(err.message || 'Không tải được sổ tay');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [user]);

  const stats = useMemo(() => ({
    total: notes.length,
    review: notes.filter((note) => note.status === 'review').length,
    mistakes: notes.filter((note) => note.type === 'mistake').length,
    pinned: notes.filter((note) => note.pinned).length,
  }), [notes]);

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((note) => {
      if (typeFilter !== 'all' && note.type !== typeFilter) return false;
      if (statusFilter !== 'all' && note.status !== statusFilter) return false;
      if (levelFilter !== 'all' && note.level !== levelFilter) return false;
      if (!q) return true;
      return [
        note.title,
        note.content,
        note.note,
        note.type,
        note.level,
        note.source?.label,
        note.source?.lessonTitle,
        ...(note.tags || []),
      ].some((value) => String(value || '').toLowerCase().includes(q));
    });
  }, [notes, query, typeFilter, statusFilter, levelFilter]);

  useEffect(() => {
    if (!draft || loading) return;
    setSaving(true);
    const timer = setTimeout(async () => {
      try {
        if (!user) {
          const next = notes.map((note) => note.id === draft.id ? draft : note);
          setNotes(next);
          localStorage.setItem('jlpt_study_notebook', JSON.stringify(next));
          setLastSaved('Đã lưu trên trình duyệt');
          setSaving(false);
          return;
        }

        const res = await fetch(`${API_BASE_URL}/notebook/${draft.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(draft),
        });
        if (!res.ok) throw new Error('Không lưu được ghi chú');
        const data = await res.json();
        const saved = data.entry;
        setNotes((prev) => prev.map((note) => note.id === saved.id ? saved : note));
        setDraft(saved);
        setLastSaved(`Đã lưu ${new Date().toLocaleTimeString('vi-VN')}`);
      } catch (err) {
        setLastSaved('Lỗi lưu tự động');
      } finally {
        setSaving(false);
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [draft?.title, draft?.content, draft?.type, draft?.level, draft?.status, draft?.pinned, JSON.stringify(draft?.tags || []), loading]);

  const selectNote = (note) => {
    setSelectedId(note.id);
    setDraft(note);
  };

  useEffect(() => {
    if (!editorRef.current || !draft) return;
    const nextHtml = toEditorHtml(draft.content || '');
    if (editorRef.current.innerHTML !== nextHtml) {
      editorRef.current.innerHTML = nextHtml;
    }
  }, [draft?.id]);

  const updateEditorContent = () => {
    updateDraft({ content: editorRef.current?.innerHTML || '' });
  };

  const runEditorCommand = (command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    updateEditorContent();
  };

  const setBlock = (tag) => runEditorCommand('formatBlock', tag);

  const getSourceHref = (source = {}) => {
    if (!source.path) return '';
    if (String(source.path).includes('?')) return source.path;
    if (source.module === 'reading' && source.lessonId) {
      const params = new URLSearchParams({ lesson: source.lessonId });
      if (source.itemId) params.set('sentence', String(source.itemId).replace('sentence_', ''));
      if (source.questionId) params.set('question', source.questionId);
      return `${source.path}?${params.toString()}`;
    }
    return source.path;
  };

  const createNote = async (templateId = 'blank') => {
    const template = templates.find((item) => item.id === templateId) || templates[0];
    const payload = {
      title: template.label,
      content: template.content,
      type: template.type,
      level: 'N3',
      tags: template.tags,
      status: template.type === 'mistake' ? 'review' : 'new',
      pinned: false,
      template: template.id,
      source: {},
    };

    if (!user) {
      const localNote = makeLocalNote(template);
      const next = [localNote, ...notes];
      setNotes(next);
      setSelectedId(localNote.id);
      setDraft(localNote);
      localStorage.setItem('jlpt_study_notebook', JSON.stringify(next));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/notebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Không tạo được ghi chú');
      const data = await res.json();
      const created = data.entry;
      setNotes((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setDraft(created);
      notify('Đã tạo ghi chú mới.');
    } catch (err) {
      notify(err.message || 'Không tạo được ghi chú', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async () => {
    if (!draft) return;

    if (!user) {
      const next = notes.filter((note) => note.id !== draft.id);
      setNotes(next);
      localStorage.setItem('jlpt_study_notebook', JSON.stringify(next));
      setDraft(next[0] || null);
      setSelectedId(next[0]?.id || '');
      setConfirmDelete(false);
      notify('Đã xóa ghi chú.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/notebook/${draft.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Không xóa được ghi chú');
      const next = notes.filter((note) => note.id !== draft.id);
      setNotes(next);
      setDraft(next[0] || null);
      setSelectedId(next[0]?.id || '');
      setConfirmDelete(false);
      notify('Đã xóa ghi chú.');
    } catch (err) {
      notify(err.message || 'Không xóa được ghi chú', 'error');
    }
  };

  const updateDraft = (patch) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setNotes((prev) => prev.map((note) => note.id === selectedId ? { ...note, ...patch } : note));
  };

  if (loading) {
    return (
      <div className="notebook-loading">
        <Loader2 className="animate-spin" size={36} />
        <p>Đang mở JLPT Study Notebook...</p>
      </div>
    );
  }

  return (
    <div className="study-notebook-page">
      <div className="notebook-hero">
        <div>
          <h1>JLPT Study Notebook</h1>
          <p>Ghi chú học tập, lỗi sai, câu khó và kế hoạch ôn thi được đồng bộ theo tài khoản JLPT Hub.</p>
        </div>
        <div className="notebook-actions">
          <button className="secondary-note-btn" onClick={() => setFiltersOpen((open) => !open)}>
            <Filter size={17} /> {filtersOpen ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
          </button>
          <button className="primary-note-btn" onClick={() => createNote('blank')}>
            <FilePlus2 size={18} /> Ghi chú mới
          </button>
        </div>
      </div>

      {error && <div className="notebook-error">{error}</div>}

      <div className="notebook-stats">
        <Stat icon={<BookOpen size={18} />} label="Tổng ghi chú" value={stats.total} />
        <Stat icon={<Clock3 size={18} />} label="Cần ôn" value={stats.review} />
        <Stat icon={<Sparkles size={18} />} label="Lỗi sai" value={stats.mistakes} />
        <Stat icon={<Pin size={18} />} label="Đã ghim" value={stats.pinned} />
      </div>

      <div className={`notebook-shell ${filtersOpen ? '' : 'filters-collapsed'}`}>
        {filtersOpen && <aside className="note-sidebar">
          <div className="search-box">
            <Search size={17} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm ghi chú, tag, bài học..." />
          </div>

          <div className="filter-label">Loại ghi chú / trạng thái</div>
          <div className="filter-row">
            <Filter size={15} />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              {typeOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.value === 'all' ? 'Mọi loại ghi chú' : item.label}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Mọi trạng thái</option>
              {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>

          <div className="filter-label">Cấp độ JLPT</div>
          <div className="level-filter">
            {['all', ...levelOptions].map((level) => (
              <button key={level} className={levelFilter === level ? 'active' : ''} onClick={() => setLevelFilter(level)}>
                {level === 'all' ? 'Mọi cấp' : level === 'ALL' ? 'Tổng hợp' : level}
              </button>
            ))}
          </div>

          <div className="filter-label">Lối tắt</div>
          <div className="quick-groups">
            <button onClick={() => { setTypeFilter('all'); setStatusFilter('all'); setLevelFilter('all'); }}>Reset lọc</button>
            <button onClick={() => { setTypeFilter('all'); setStatusFilter('review'); }}>Cần ôn</button>
            <button onClick={() => { setTypeFilter('mistake'); setStatusFilter('all'); }}>Lỗi sai</button>
            <button onClick={() => { setTypeFilter('vocab'); setStatusFilter('all'); }}>Từ vựng</button>
            <button onClick={() => { setTypeFilter('grammar'); setStatusFilter('all'); }}>Ngữ pháp</button>
          </div>

          <div className="note-list">
            {filteredNotes.length === 0 ? (
              <div className="empty-note-list">Chưa có ghi chú phù hợp.</div>
            ) : filteredNotes.map((note) => (
              <button key={note.id} className={`note-card ${selectedId === note.id ? 'active' : ''}`} onClick={() => selectNote(note)}>
                <span className="note-card-top">
                  <strong>{note.title || 'Ghi chú mới'}</strong>
                  {note.pinned && <Pin size={14} />}
                </span>
                <span className="note-preview">{(stripHtml(note.content || note.note) || 'Chưa có nội dung').slice(0, 110)}</span>
                <span className="note-meta">
                  <em>{typeLabel(note.type)}</em>
                  <em>{note.level}</em>
                  <em>{statusLabel(note.status)}</em>
                </span>
              </button>
            ))}
          </div>
        </aside>}

        <main className="note-editor">
          {!draft ? (
            <div className="empty-editor">
              <Sparkles size={42} />
              <h2>Tạo ghi chú đầu tiên</h2>
              <p>Chọn template bên dưới để bắt đầu hệ thống hóa kiến thức JLPT của bạn.</p>
              <TemplatePicker onPick={createNote} />
            </div>
          ) : (
            <>
              <div className="editor-toolbar">
                <div className="save-state">
                  <Save size={16} />
                  {saving ? 'Đang lưu...' : lastSaved || 'Sẵn sàng'}
                </div>
                <div className="toolbar-actions">
                  <button className={draft.pinned ? 'active' : ''} onClick={() => updateDraft({ pinned: !draft.pinned })}>
                    <Pin size={16} /> {draft.pinned ? 'Đã ghim' : 'Ghim'}
                  </button>
                  <button className="danger" onClick={() => setConfirmDelete(true)}>
                    <Trash2 size={16} /> Xóa
                  </button>
                </div>
              </div>

              <input
                className="note-title-input"
                value={draft.title || ''}
                onChange={(e) => updateDraft({ title: e.target.value })}
                placeholder="Tiêu đề ghi chú"
              />

              <div className="metadata-grid">
                <label>
                  Loại ghi chú
                  <select value={draft.type || 'general'} onChange={(e) => updateDraft({ type: e.target.value })}>
                    {typeOptions.filter((item) => item.value !== 'all').map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>
                <label>
                  Cấp độ
                  <select value={draft.level || 'N3'} onChange={(e) => updateDraft({ level: e.target.value })}>
                    {levelOptions.map((level) => <option key={level} value={level}>{level}</option>)}
                  </select>
                </label>
                <label>
                  Trạng thái
                  <select value={draft.status || 'new'} onChange={(e) => updateDraft({ status: e.target.value })}>
                    {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>
                <label>
                  Tags
                  <input
                    value={(draft.tags || []).join(', ')}
                    onChange={(e) => updateDraft({ tags: e.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })}
                    placeholder="dễ nhầm, cần ôn, thi thử"
                  />
                </label>
              </div>

              {draft.source?.label || draft.source?.lessonTitle ? (
                <div className="source-box">
                  <LinkIcon size={16} />
                  <div>
                    <strong>{draft.source.label || draft.source.lessonTitle}</strong>
                    {getSourceHref(draft.source) ? <a href={getSourceHref(draft.source)}>Mở đúng bài học gốc</a> : null}
                  </div>
                </div>
              ) : null}

              <div className="format-toolbar">
                <button type="button" onClick={() => setBlock('h1')}>H1</button>
                <button type="button" onClick={() => setBlock('h2')}>H2</button>
                <button type="button" onClick={() => setBlock('p')}>P</button>
                <button type="button" onClick={() => runEditorCommand('bold')}><strong>B</strong></button>
                <button type="button" onClick={() => runEditorCommand('italic')}><em>I</em></button>
                <button type="button" onClick={() => runEditorCommand('underline')}><u>U</u></button>
                <button type="button" onClick={() => runEditorCommand('insertUnorderedList')}>• List</button>
                <button type="button" onClick={() => runEditorCommand('insertHTML', '<blockquote>Trích dẫn...</blockquote>')}>Quote</button>
                <select defaultValue="" onChange={(e) => { if (e.target.value) runEditorCommand('fontName', e.target.value); e.target.value = ''; }}>
                  <option value="">Font</option>
                  <option value="Arial">Arial</option>
                  <option value="Georgia">Georgia</option>
                  <option value="'Times New Roman'">Times</option>
                  <option value="'Courier New'">Mono</option>
                </select>
                <select defaultValue="" onChange={(e) => { if (e.target.value) runEditorCommand('fontSize', e.target.value); e.target.value = ''; }}>
                  <option value="">Cỡ chữ</option>
                  <option value="2">Nhỏ</option>
                  <option value="3">Vừa</option>
                  <option value="5">Lớn</option>
                  <option value="7">Rất lớn</option>
                </select>
                <label className="color-tool">
                  Màu
                  <input type="color" defaultValue="#4f46e5" onChange={(e) => runEditorCommand('foreColor', e.target.value)} />
                </label>
              </div>

              <TemplatePicker onPick={(templateId) => {
                const template = templates.find((item) => item.id === templateId);
                if (!template) return;
                const nextContent = draft.content ? `${draft.content}<br><br>${toEditorHtml(template.content)}` : toEditorHtml(template.content);
                updateDraft({
                  type: template.type,
                  template: template.id,
                  tags: [...new Set([...(draft.tags || []), ...template.tags])],
                  content: nextContent,
                });
                if (editorRef.current) editorRef.current.innerHTML = nextContent;
              }} compact />

              <div
                ref={editorRef}
                className="note-content-input"
                contentEditable
                suppressContentEditableWarning
                onInput={updateEditorContent}
                data-placeholder="Viết ghi chú học tập tại đây..."
              />

              <div className="tag-strip">
                {(draft.tags || []).map((tag) => (
                  <span key={tag}><Tag size={13} /> {tag}</span>
                ))}
                <span><CheckCircle size={13} /> {statusLabel(draft.status)}</span>
                <span>Cập nhật {formatTime(draft.updatedAt)}</span>
              </div>
            </>
          )}
        </main>
      </div>

      {toast && (
        <div className={`notebook-toast ${toast.type}`}>
          {toast.type === 'error' ? <Trash2 size={17} /> : <CheckCircle size={17} />}
          <span>{toast.message}</span>
        </div>
      )}

      {confirmDelete && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-card">
            <div className="confirm-icon"><Trash2 size={22} /></div>
            <h3>Xóa ghi chú này?</h3>
            <p>Ghi chú sẽ bị xóa khỏi sổ tay của bạn. Thao tác này không thể hoàn tác.</p>
            <div className="confirm-actions">
              <button className="ghost-confirm-btn" onClick={() => setConfirmDelete(false)}>Hủy</button>
              <button className="danger-confirm-btn" onClick={deleteNote}>Xóa ghi chú</button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .study-notebook-page { padding-bottom: 32px; }
        .notebook-loading { min-height: 50vh; display: grid; place-items: center; color: var(--text-secondary); gap: 10px; }
        .notebook-hero { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; margin-bottom: 18px; }
        .notebook-hero h1 { font-size: clamp(32px, 4vw, 46px); margin: 0 0 8px; color: var(--text-primary); letter-spacing: 0; }
        .notebook-hero p { color: var(--text-secondary); margin: 0; max-width: 820px; line-height: 1.6; }
        .notebook-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; }
        .primary-note-btn, .secondary-note-btn, .toolbar-actions button, .quick-groups button, .template-btn, .level-filter button, .format-toolbar button, .format-toolbar select, .color-tool {
          border: 1px solid var(--border-color);
          background: linear-gradient(180deg, var(--card-bg), var(--card-bg-hover));
          color: var(--text-primary);
          border-radius: 12px;
          cursor: pointer;
          font-weight: 800;
          transition: var(--transition);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
        }
        .primary-note-btn:hover, .secondary-note-btn:hover, .toolbar-actions button:hover, .quick-groups button:hover, .template-btn:hover, .level-filter button:hover, .format-toolbar button:hover, .format-toolbar select:hover, .color-tool:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 26px rgba(99, 102, 241, 0.14);
        }
        .primary-note-btn { min-height: 46px; padding: 0 18px; display: inline-flex; align-items: center; gap: 8px; background: var(--primary-gradient); color: #fff; border: none; box-shadow: var(--shadow-md); }
        .secondary-note-btn { min-height: 46px; padding: 0 15px; display: inline-flex; align-items: center; gap: 8px; }
        .primary-note-btn:hover { filter: brightness(1.04); }
        .notebook-error { padding: 12px 14px; border: 1px solid var(--danger); color: var(--danger); background: rgba(239,68,68,.08); border-radius: var(--radius-md); margin-bottom: 14px; }
        .notebook-stats { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 12px; margin-bottom: 18px; }
        .stat-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 14px; display: flex; align-items: center; gap: 12px; box-shadow: var(--shadow-sm); }
        .stat-icon { color: var(--primary); width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; background: var(--primary-glow); }
        .stat-card strong { display: block; color: var(--text-primary); font-size: 20px; }
        .stat-card span { color: var(--text-secondary); font-size: 12px; font-weight: 700; }
        .notebook-shell { display: grid; grid-template-columns: 360px minmax(0,1fr); gap: 18px; align-items: start; }
        .notebook-shell.filters-collapsed { grid-template-columns: minmax(0, 1fr); }
        .note-sidebar, .note-editor { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); }
        .note-sidebar { padding: 14px; position: sticky; top: 16px; max-height: calc(100vh - 40px); overflow: auto; }
        .search-box { height: 46px; display: flex; align-items: center; gap: 10px; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0 12px; background: var(--input-bg); margin-bottom: 10px; }
        .search-box input, .metadata-grid input, .metadata-grid select { border: none; background: transparent; color: var(--text-primary); outline: none; width: 100%; font: inherit; }
        .filter-row { display: grid; grid-template-columns: auto 1fr 1fr; gap: 8px; align-items: center; margin-bottom: 10px; }
        .filter-row select { min-width: 0; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-primary); border-radius: var(--radius-sm); padding: 9px; font-weight: 700; }
        .filter-label { margin: 10px 0 7px; color: var(--text-muted); font-size: 11px; font-weight: 900; letter-spacing: .02em; text-transform: uppercase; }
        .level-filter { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 12px; }
        .level-filter button { min-height: 34px; padding: 0 12px; font-size: 12px; }
        .level-filter button.active, .quick-groups button:hover, .template-btn:hover, .toolbar-actions button.active { border-color: var(--primary); background: var(--primary-glow); color: var(--primary); }
        .quick-groups { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 12px; }
        .quick-groups button { padding: 8px 10px; font-size: 12px; }
        .note-list { display: flex; flex-direction: column; gap: 10px; }
        .note-card { text-align: left; border: 1px solid var(--border-color); background: var(--card-bg-hover); color: var(--text-primary); border-radius: var(--radius-md); padding: 12px; cursor: pointer; transition: var(--transition); }
        .note-card.active { border-color: var(--primary); box-shadow: inset 3px 0 0 var(--primary); background: var(--primary-glow); }
        .note-card-top { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
        .note-card-top strong { line-height: 1.35; }
        .note-preview { display: block; color: var(--text-secondary); font-size: 13px; line-height: 1.5; min-height: 38px; }
        .note-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
        .note-meta em { font-style: normal; padding: 4px 7px; border-radius: 999px; background: var(--card-bg); color: var(--text-secondary); font-size: 11px; font-weight: 800; }
        .empty-note-list, .empty-editor { color: var(--text-muted); text-align: center; padding: 28px 12px; }
        .note-editor { min-height: 720px; padding: 18px; }
        .editor-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; }
        .save-state { color: var(--text-secondary); display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; }
        .toolbar-actions { display: flex; gap: 8px; }
        .toolbar-actions button { padding: 9px 12px; display: inline-flex; align-items: center; gap: 7px; }
        .toolbar-actions .danger { color: var(--danger); border-color: rgba(239, 68, 68, 0.22); background: rgba(239, 68, 68, 0.06); }
        .note-title-input { width: 100%; border: none; outline: none; background: transparent; color: var(--text-primary); font-size: clamp(30px, 4vw, 48px); font-weight: 900; letter-spacing: 0; margin-bottom: 14px; }
        .metadata-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
        .metadata-grid label { display: flex; flex-direction: column; gap: 7px; color: var(--text-secondary); font-size: 12px; font-weight: 900; text-transform: uppercase; }
        .metadata-grid input, .metadata-grid select { min-height: 42px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0 10px; text-transform: none; font-weight: 700; }
        .source-box { display: flex; gap: 10px; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--card-bg-hover); color: var(--text-secondary); margin-bottom: 14px; }
        .source-box strong { display: block; color: var(--text-primary); }
        .source-box a { color: var(--primary); font-weight: 800; font-size: 13px; }
        .template-list { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-bottom: 14px; }
        .template-btn { padding: 9px 12px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; }
        .note-editor > .template-list { justify-content: flex-start; }
        .format-toolbar { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px; border: 1px solid var(--border-color); border-radius: 16px; background: var(--card-bg-hover); margin-bottom: 12px; }
        .format-toolbar button, .format-toolbar select, .color-tool { min-height: 34px; padding: 0 10px; display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 900; }
        .format-toolbar select { outline: none; }
        .color-tool input { width: 22px; height: 22px; border: 0; padding: 0; background: transparent; cursor: pointer; }
        .note-content-input { width: 100%; min-height: 430px; resize: vertical; overflow: auto; border: 1px solid var(--border-color); border-radius: var(--radius-lg); background: var(--input-bg); color: var(--text-primary); padding: 18px; line-height: 1.8; font-size: 16px; outline: none; }
        .note-content-input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-glow); }
        .note-content-input:empty:before { content: attr(data-placeholder); color: var(--text-muted); }
        .note-content-input h1 { font-size: 32px; line-height: 1.25; margin: 10px 0; }
        .note-content-input h2 { font-size: 24px; line-height: 1.35; margin: 10px 0; }
        .note-content-input blockquote { margin: 12px 0; padding: 10px 14px; border-left: 4px solid var(--primary); background: var(--primary-glow); border-radius: 10px; }
        .note-content-input ul { padding-left: 24px; }
        .tag-strip { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; color: var(--text-secondary); }
        .tag-strip span { display: inline-flex; align-items: center; gap: 5px; padding: 6px 9px; border-radius: 999px; background: var(--card-bg-hover); font-size: 12px; font-weight: 800; }
        .notebook-toast { position: fixed; right: 22px; bottom: 22px; z-index: 80; min-height: 46px; display: inline-flex; align-items: center; gap: 10px; padding: 12px 15px; border-radius: 14px; background: var(--card-bg); border: 1px solid var(--border-color); color: var(--text-primary); box-shadow: 0 18px 50px rgba(15, 23, 42, 0.18); font-weight: 800; }
        .notebook-toast.success { border-color: rgba(16, 185, 129, 0.28); }
        .notebook-toast.success svg { color: var(--success); }
        .notebook-toast.error { border-color: rgba(239, 68, 68, 0.32); }
        .notebook-toast.error svg { color: var(--danger); }
        .confirm-overlay { position: fixed; inset: 0; z-index: 70; display: grid; place-items: center; padding: 24px; background: rgba(15, 23, 42, 0.42); backdrop-filter: blur(5px); }
        .confirm-card { width: min(420px, 100%); background: var(--card-bg); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 18px; padding: 22px; box-shadow: 0 24px 70px rgba(15, 23, 42, 0.26); }
        .confirm-icon { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; color: var(--danger); background: rgba(239, 68, 68, 0.1); margin-bottom: 12px; }
        .confirm-card h3 { margin: 0 0 8px; font-size: 22px; color: var(--text-primary); }
        .confirm-card p { margin: 0; color: var(--text-secondary); line-height: 1.6; }
        .confirm-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
        .ghost-confirm-btn, .danger-confirm-btn { min-height: 42px; padding: 0 15px; border-radius: 12px; border: 1px solid var(--border-color); cursor: pointer; font-weight: 900; }
        .ghost-confirm-btn { background: var(--card-bg-hover); color: var(--text-primary); }
        .danger-confirm-btn { background: var(--danger); color: #fff; border-color: var(--danger); box-shadow: 0 12px 24px rgba(239, 68, 68, 0.22); }
        @media (max-width: 1100px) { .notebook-shell { grid-template-columns: 1fr; } .note-sidebar { position: static; max-height: none; } .metadata-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 760px) { .notebook-hero { flex-direction: column; align-items: stretch; } .notebook-stats { grid-template-columns: repeat(2, 1fr); } .metadata-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function TemplatePicker({ onPick, compact = false }) {
  const list = compact ? templates.filter((item) => item.id !== 'blank') : templates;
  return (
    <div className="template-list">
      {list.map((template) => (
        <button key={template.id} className="template-btn" onClick={() => onPick(template.id)}>
          {template.id === 'mistake' ? <Star size={14} /> : <FilePlus2 size={14} />}
          {template.label}
        </button>
      ))}
    </div>
  );
}
