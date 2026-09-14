import { Suspense, lazy, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import {
  ArticleCategorySchema,
  ArticleCreateSchema,
  ArticleUpdateSchema,
  ModeratorArticleDetailSchema,
  formatListedAt,
  imageFallbackSrc,
  imageSrcSet,
  type ArticleCategory,
  type ModeratorArticleRow,
} from '@rieltor/shared';
import { CATEGORY_LABEL } from '@/entities/journal';
import { useSession } from '@/entities/session';
import { apiPatch, apiPost, apiUpload } from '@/shared/api/client';
import { journalDetailQuery, journalListQuery, MODERATION_JOURNAL_KEY } from '../api';

// Lazy via the MODULE path (not the `@/shared/ui/markdown` barrel): react-markdown + its
// micromark tree land in their own async chunk, kept out of the entry bundle (R6). router.tsx
// imports every page statically, so a barrel import here would leak react-markdown into entry.
const Markdown = lazy(() => import('@/shared/ui/markdown/markdown'));

interface FormFields {
  title: string;
  excerpt: string;
  body: string;
  category: ArticleCategory;
}

const EMPTY_FIELDS: FormFields = { title: '', excerpt: '', body: '', category: 'BOZOR' };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-dvh max-w-content bg-surface px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold text-ink">Jurnal</h1>
        <div className="flex items-center gap-3">
          <Link
            to="/moderation/realtors"
            className="text-[13px] font-bold text-accent hover:underline"
          >
            Rieltorlar →
          </Link>
          <Link
            to="/moderation/developers"
            className="text-[13px] font-bold text-accent hover:underline"
          >
            Quruvchilar →
          </Link>
          <Link
            to="/moderation/reviews"
            className="text-[13px] font-bold text-accent hover:underline"
          >
            Sharhlar →
          </Link>
          <Link
            to="/moderation/conversion"
            className="text-[13px] font-bold text-accent hover:underline"
          >
            Konversiya →
          </Link>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </main>
  );
}

/** The create/edit form — title, excerpt, category, body + a live Markdown preview, and
 *  (edit-mode only) a cover upload. Create posts a DRAFT; the cover needs an existing id. */
function ArticleForm({
  editingId,
  onSaved,
  onCancel,
}: {
  editingId: string | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  const [fields, setFields] = useState<FormFields>(EMPTY_FIELDS);

  // In edit mode, load the full article and fill the form once it arrives.
  const detail = useQuery({ ...journalDetailQuery(editingId ?? ''), enabled: editingId !== null });

  useEffect(() => {
    if (editingId === null) {
      setFields(EMPTY_FIELDS);
      return;
    }
    if (detail.data) {
      setFields({
        title: detail.data.title,
        excerpt: detail.data.excerpt,
        body: detail.data.body,
        category: detail.data.category,
      });
    }
  }, [editingId, detail.data]);

  const saveMutation = useMutation({
    // ArticleCreateSchema.parse enforces the field bounds client-side before the request;
    // create returns a fresh DRAFT, edit patches title/excerpt/body/category in place.
    mutationFn: (input: FormFields) =>
      editingId === null
        ? apiPost('/api/moderation/journal', undefined, ArticleCreateSchema.parse(input))
        : apiPatch(
            `/api/moderation/journal/${editingId}`,
            undefined,
            ArticleUpdateSchema.parse(input),
          ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MODERATION_JOURNAL_KEY });
      onSaved();
    },
  });

  const coverMutation = useMutation({
    // Multipart cover upload — the API field is `file` (FileInterceptor('file')). Invalidates
    // both this article's detail (so the preview updates) and the list.
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiUpload(
        `/api/moderation/journal/${editingId}/cover`,
        formData,
        ModeratorArticleDetailSchema,
      );
    },
    onSuccess: () => {
      if (editingId !== null) {
        queryClient.invalidateQueries({ queryKey: [...MODERATION_JOURNAL_KEY, editingId] });
      }
      queryClient.invalidateQueries({ queryKey: MODERATION_JOURNAL_KEY });
    },
  });

  const canSubmit =
    fields.title.trim().length >= 3 &&
    fields.excerpt.trim().length >= 10 &&
    fields.body.trim().length >= 20;

  return (
    <form
      className="rounded-card border border-line/60 bg-card p-4 shadow-card"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) saveMutation.mutate(fields);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-extrabold text-ink">
          {editingId === null ? 'Yangi maqola' : 'Maqolani tahrirlash'}
        </h2>
        {editingId !== null && (
          <button
            type="button"
            onClick={onCancel}
            className="text-[13px] font-bold text-ink-2 hover:underline"
          >
            Yangi maqola
          </button>
        )}
      </div>

      <div className="mt-3 space-y-3">
        <label className="block">
          <span className="text-[12.5px] font-bold text-ink-2">Sarlavha</span>
          <input
            type="text"
            value={fields.title}
            onChange={(e) => setFields((f) => ({ ...f, title: e.target.value }))}
            placeholder="Maqola sarlavhasi"
            className="mt-1 w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-[14px] font-medium text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="text-[12.5px] font-bold text-ink-2">Qisqacha</span>
          <textarea
            value={fields.excerpt}
            onChange={(e) => setFields((f) => ({ ...f, excerpt: e.target.value }))}
            placeholder="Ro'yxatda va qidiruvda ko'rinadigan qisqa tavsif"
            rows={2}
            className="mt-1 w-full resize-y rounded-[10px] border border-line bg-surface px-3 py-2 text-[14px] font-medium text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="text-[12.5px] font-bold text-ink-2">Turkum</span>
          <select
            value={fields.category}
            onChange={(e) =>
              setFields((f) => ({ ...f, category: e.target.value as ArticleCategory }))
            }
            className="mt-1 w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-[14px] font-medium text-ink outline-none focus:border-accent"
          >
            {ArticleCategorySchema.options.map((value) => (
              <option key={value} value={value}>
                {CATEGORY_LABEL[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[12.5px] font-bold text-ink-2">Matn (Markdown)</span>
          <textarea
            value={fields.body}
            onChange={(e) => setFields((f) => ({ ...f, body: e.target.value }))}
            placeholder="Maqola matni — Markdown qo'llab-quvvatlanadi"
            rows={10}
            className="mt-1 w-full resize-y rounded-[10px] border border-line bg-surface px-3 py-2 font-mono text-[13px] text-ink outline-none focus:border-accent"
          />
        </label>

        <div>
          <span className="text-[12.5px] font-bold text-ink-2">Ko&apos;rinishi</span>
          <div className="mt-1 rounded-[10px] border border-line bg-surface px-3 py-3">
            {fields.body.trim() ? (
              <Suspense
                fallback={<p className="text-[13px] font-medium text-ink-3">Yuklanmoqda...</p>}
              >
                <Markdown>{fields.body}</Markdown>
              </Suspense>
            ) : (
              <p className="text-[13px] font-medium text-ink-3">Matn kiritilmagan</p>
            )}
          </div>
        </div>

        {editingId !== null && (
          <div>
            <span className="text-[12.5px] font-bold text-ink-2">Muqova</span>
            {detail.data?.cover && (
              <img
                srcSet={imageSrcSet(detail.data.cover.base)}
                src={imageFallbackSrc(detail.data.cover.base)}
                width={detail.data.cover.width}
                height={detail.data.cover.height}
                alt=""
                className="mt-1 aspect-[16/9] w-full max-w-sm rounded-card object-cover"
              />
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={coverMutation.isPending}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) coverMutation.mutate(file);
                e.target.value = '';
              }}
              className="mt-2 block w-full text-[13px] font-medium text-ink-2 file:mr-3 file:rounded-[10px] file:border-0 file:bg-accent-soft file:px-3 file:py-2 file:text-[13px] file:font-extrabold file:text-accent"
            />
            {coverMutation.isPending && (
              <p className="mt-1 text-[12.5px] font-medium text-ink-3">Yuklanmoqda...</p>
            )}
            {coverMutation.isError && (
              <p className="mt-1 text-[12.5px] font-medium text-brand-rose">
                Muqovani yuklab bo&apos;lmadi.
              </p>
            )}
          </div>
        )}

        {saveMutation.isError && (
          <p className="text-[12.5px] font-medium text-brand-rose">
            Saqlab bo&apos;lmadi. Maydonlarni tekshiring.
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit || saveMutation.isPending}
          className="rounded-[10px] bg-brand-green px-4 py-2 text-[13px] font-extrabold text-white disabled:opacity-50"
        >
          {saveMutation.isPending ? 'Saqlanmoqda...' : editingId === null ? 'Yaratish' : 'Saqlash'}
        </button>
      </div>
    </form>
  );
}

/** The article queue — one row per article, with edit + publish/unpublish. */
function ArticleList({
  editingId,
  onEdit,
}: {
  editingId: string | null;
  onEdit: (id: string) => void;
}) {
  const { data, isPending, error } = useQuery(journalListQuery);
  const queryClient = useQueryClient();

  const publishMutation = useMutation({
    // POST /api/moderation/journal/:id/(publish|unpublish); on success the list is
    // invalidated so each row's status badge reflects the new state.
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) =>
      apiPost(`/api/moderation/journal/${id}/${publish ? 'publish' : 'unpublish'}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MODERATION_JOURNAL_KEY }),
  });

  if (isPending) {
    return <p className="py-10 text-center text-[14px] font-medium text-ink-2">Yuklanmoqda...</p>;
  }

  if (error) {
    return (
      <p className="py-10 text-center text-[14px] font-medium text-ink-2">
        Ro&apos;yxatni yuklab bo&apos;lmadi.
      </p>
    );
  }

  if (data.length === 0) {
    return (
      <p className="rounded-card border border-line/60 bg-card px-4 py-10 text-center text-[14px] font-medium text-ink-2">
        Maqolalar yo&apos;q
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {data.map((article) => (
        <ArticleItem
          key={article.id}
          article={article}
          isActive={article.id === editingId}
          isUpdating={publishMutation.isPending && publishMutation.variables?.id === article.id}
          onEdit={() => onEdit(article.id)}
          onTogglePublish={() =>
            publishMutation.mutate({ id: article.id, publish: article.status !== 'PUBLISHED' })
          }
        />
      ))}
    </ul>
  );
}

function ArticleItem({
  article,
  isActive,
  isUpdating,
  onEdit,
  onTogglePublish,
}: {
  article: ModeratorArticleRow;
  isActive: boolean;
  isUpdating: boolean;
  onEdit: () => void;
  onTogglePublish: () => void;
}) {
  const isPublished = article.status === 'PUBLISHED';
  return (
    <li
      className={
        isActive
          ? 'flex items-center gap-3 rounded-card border border-accent bg-card p-3.5 shadow-card'
          : 'flex items-center gap-3 rounded-card border border-line/60 bg-card p-3.5 shadow-card'
      }
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-extrabold text-ink">{article.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="rounded-lg bg-accent-soft px-2 py-0.5 text-[11px] font-bold text-accent">
            {CATEGORY_LABEL[article.category]}
          </span>
          <span
            className={
              isPublished
                ? 'rounded-full bg-brand-green/10 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-brand-green'
                : 'rounded-full bg-line/70 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-ink-3'
            }
          >
            {isPublished ? 'Chop etilgan' : 'Qoralama'}
          </span>
          <span className="text-[12px] font-medium text-ink-3">
            {formatListedAt(article.updatedAt.slice(0, 10))}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 rounded-[10px] border border-line bg-card px-3 py-2 text-[13px] font-extrabold text-ink-2"
      >
        Tahrirlash
      </button>
      <button
        type="button"
        onClick={onTogglePublish}
        disabled={isUpdating}
        className={
          isPublished
            ? 'shrink-0 rounded-[10px] border border-line bg-card px-3 py-2 text-[13px] font-extrabold text-ink-2 disabled:opacity-50'
            : 'shrink-0 rounded-[10px] bg-brand-green px-3 py-2 text-[13px] font-extrabold text-white disabled:opacity-50'
        }
      >
        {isPublished ? 'Yashirish' : 'Chop etish'}
      </button>
    </li>
  );
}

/**
 * Moderator-only journal authoring screen. Rendered outside the tab layout (a full-screen
 * admin surface, same as the developer/realtor/review/conversion screens). The route is not
 * hidden — the gate here is the real client-side protection, backed by the API's RolesGuard.
 */
export function ModerationJournalPage() {
  const { user, isPending } = useSession();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (isPending) {
    return (
      <Shell>
        <p className="py-10 text-center text-[14px] font-medium text-ink-2">Yuklanmoqda...</p>
      </Shell>
    );
  }

  const isModerator = user?.role === 'MODERATOR' || user?.role === 'ADMIN';
  if (!isModerator) {
    return (
      <Shell>
        <div className="rounded-card border border-line/60 bg-card px-4 py-10 text-center">
          <p className="text-[15px] font-extrabold text-ink">Ruxsat yo&apos;q</p>
          <p className="mt-1 text-[13.5px] font-medium text-ink-2">
            Bu sahifa faqat moderatorlar uchun.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="grid gap-4 lg:grid-cols-2">
        <ArticleList editingId={editingId} onEdit={setEditingId} />
        <ArticleForm
          editingId={editingId}
          onSaved={() => setEditingId(null)}
          onCancel={() => setEditingId(null)}
        />
      </div>
    </Shell>
  );
}
