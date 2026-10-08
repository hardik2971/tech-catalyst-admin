"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FolderPlus, ImagePlus, Images, Link2, Loader2, Pencil, PlayCircle, Trash2, Upload, Video, X } from "lucide-react";
import { toast } from "sonner";
import { api, apiError, assetUrl, cn, isVideo, uploadFiles, youtubeId } from "@/lib/client";
import { ResourcePage } from "./resource-page";
import { Button, Card, CardHeader, ConfirmDialog, EmptyState, Field, Input, Modal, Spinner, Textarea } from "./ui";

type Album = { id: string; eventId: string; label: string; media: string[]; sortOrder: number };

export function GalleryManager({ eventId, onChanged }: { eventId: string; onChanged?: () => void }) {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader title="Recap videos" subtitle="YouTube links shown in the gallery video carousel" icon={<Video className="h-4 w-4" />} />
        <div className="p-4">
          <ResourcePage
            embedded
            resource="gallery-videos"
            title="Videos"
            fixedFilters={{ eventId }}
            defaults={{ sortOrder: 0 }}
            createLabel="Add video"
            pageSize={50}
            onChanged={onChanged}
            fields={[
              { name: "title", label: "Title", type: "text", required: true, span: 2 },
              { name: "url", label: "YouTube URL", type: "url", required: true, placeholder: "https://youtu.be/…", span: 2 },
              { name: "sortOrder", label: "Sort order", type: "number" },
            ]}
            columns={[
              { key: "title", header: "Title", sortable: true },
              { key: "url", header: "URL", render: (r) => <span className="text-xs text-muted">{r.url}</span> },
              { key: "sortOrder", header: "Order", sortable: true },
            ]}
            card={(r, a) => {
              const id = youtubeId(r.url);
              return (
                <div className="group overflow-hidden rounded-2xl border border-line bg-surface">
                  <a href={r.url} target="_blank" rel="noreferrer" className="relative block aspect-video bg-surface-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {id && <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" />}
                    <span className="absolute inset-0 grid place-items-center bg-black/20 opacity-0 transition group-hover:opacity-100">
                      <PlayCircle className="h-12 w-12 text-white drop-shadow" />
                    </span>
                  </a>
                  <div className="flex items-center gap-2 p-3">
                    <div className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{r.title}</div>
                    <Button variant="ghost" size="icon" onClick={a.edit} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="hover:!text-danger" onClick={a.remove} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              );
            }}
          />
        </div>
      </Card>

      <AlbumManager eventId={eventId} onChanged={onChanged} />
    </div>
  );
}

function AlbumManager({ eventId, onChanged }: { eventId: string; onChanged?: () => void }) {
  const [albums, setAlbums] = useState<Album[] | null>(null);
  const [active, setActive] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [albumModal, setAlbumModal] = useState<{ mode: "create" | "rename"; label: string } | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [confirm, setConfirm] = useState<{ type: "album" } | { type: "item"; url: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<{ data: Album[] }>("/r/gallery-albums", { params: { eventId, pageSize: "all", sort: "sortOrder", order: "ASC" } });
      setAlbums(data.data.map((a) => ({ ...a, media: Array.isArray(a.media) ? a.media : [] })));
      setActive((cur) => (data.data.some((a) => a.id === cur) ? cur : data.data[0]?.id ?? ""));
    } catch (e) {
      toast.error(apiError(e, "Failed to load albums"));
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const album = albums?.find((a) => a.id === active);

  async function saveMedia(media: string[], msg: string) {
    if (!album) return;
    setBusy(true);
    try {
      await api.put(`/r/gallery-albums/${album.id}`, { media });
      setAlbums((as) => as!.map((a) => (a.id === album.id ? { ...a, media } : a)));
      toast.success(msg);
      onChanged?.();
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function onUpload(files: FileList | null) {
    if (!files?.length || !album) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      const list = Array.from(files);
      for (let i = 0; i < list.length; i += 8) urls.push(...(await uploadFiles(list.slice(i, i + 8), "gallery")));
      await saveMedia([...album.media, ...urls], `${urls.length} file(s) added`);
    } catch (e) {
      toast.error(apiError(e, "Upload failed"));
      setBusy(false);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submitAlbum() {
    if (!albumModal?.label.trim()) return;
    try {
      if (albumModal.mode === "create") {
        const { data } = await api.post<Album>("/r/gallery-albums", { eventId, label: albumModal.label.trim(), media: [], sortOrder: albums?.length ?? 0 });
        setActive(data.id);
        toast.success("Album created");
      } else if (album) {
        await api.put(`/r/gallery-albums/${album.id}`, { label: albumModal.label.trim() });
        toast.success("Album renamed");
      }
      setAlbumModal(null);
      load();
      onChanged?.();
    } catch (e) {
      toast.error(apiError(e));
    }
  }

  async function onConfirm() {
    if (!confirm || !album) return;
    if (confirm.type === "album") {
      try {
        await api.delete(`/r/gallery-albums/${album.id}`);
        toast.success("Album deleted");
        setConfirm(null);
        load();
        onChanged?.();
      } catch (e) {
        toast.error(apiError(e));
      }
    } else {
      await saveMedia(album.media.filter((m) => m !== confirm.url), "Removed from album");
      setConfirm(null);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Photo & video albums"
        subtitle="Each album is a tab on the website gallery page"
        icon={<Images className="h-4 w-4" />}
        action={<Button size="sm" variant="secondary" icon={<FolderPlus className="h-3.5 w-3.5" />} onClick={() => setAlbumModal({ mode: "create", label: "" })}>New album</Button>}
      />
      {!albums ? (
        <div className="grid place-items-center py-16"><Spinner /></div>
      ) : albums.length === 0 ? (
        <EmptyState icon={<Images className="h-6 w-6" />} title="No albums yet" text="Create albums like “Booth Photos” or “Photographers”." action={<Button icon={<FolderPlus className="h-4 w-4" />} onClick={() => setAlbumModal({ mode: "create", label: "" })}>Create album</Button>} />
      ) : (
        <div>
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
            {albums.map((a) => (
              <button
                key={a.id}
                onClick={() => setActive(a.id)}
                className={cn(
                  "cursor-pointer rounded-xl px-3.5 py-2 text-[13px] font-semibold transition",
                  a.id === active ? "bg-brand-gradient text-white shadow" : "bg-surface-2 text-muted hover:text-ink",
                )}
              >
                {a.label} <span className="ml-1 opacity-75">{a.media.length}</span>
              </button>
            ))}
          </div>
          {album && (
            <div className="p-5">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Button size="sm" icon={busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} disabled={busy} onClick={() => fileRef.current?.click()}>
                  Upload photos / videos
                </Button>
                <Button size="sm" variant="outline" icon={<Link2 className="h-3.5 w-3.5" />} onClick={() => { setPasteText(""); setPasteOpen(true); }}>Add by URL</Button>
                <Button size="sm" variant="ghost" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setAlbumModal({ mode: "rename", label: album.label })}>Rename</Button>
                <Button size="sm" variant="ghost" className="hover:!text-danger" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setConfirm({ type: "album" })}>Delete album</Button>
                <span className="ml-auto text-xs text-muted">{album.media.length} items</span>
                <input ref={fileRef} type="file" multiple accept="image/*,video/*" hidden onChange={(e) => onUpload(e.target.files)} />
              </div>
              {album.media.length === 0 ? (
                <button onClick={() => fileRef.current?.click()} className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line py-14 text-muted hover:border-brand hover:text-brand">
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-sm font-semibold">Drop in the first photos</span>
                </button>
              ) : (
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
                  {album.media.map((m) => (
                    <div key={m} className="group relative aspect-square overflow-hidden rounded-xl bg-surface-2 ring-1 ring-line">
                      <button className="h-full w-full cursor-zoom-in" onClick={() => setPreview(m)}>
                        {isVideo(m) ? (
                          <span className="grid h-full place-items-center bg-[#06173f] text-white"><PlayCircle className="h-7 w-7 opacity-80" /></span>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={assetUrl(m)} alt="" loading="lazy" className="h-full w-full object-cover" />
                        )}
                      </button>
                      <button
                        onClick={() => setConfirm({ type: "item", url: m })}
                        className="absolute top-1.5 right-1.5 grid h-7 w-7 cursor-pointer place-items-center rounded-lg bg-black/60 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 hover:bg-danger"
                        aria-label="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Modal
        open={!!albumModal}
        onClose={() => setAlbumModal(null)}
        size="sm"
        title={albumModal?.mode === "create" ? "New album" : "Rename album"}
        footer={<><Button variant="outline" onClick={() => setAlbumModal(null)}>Cancel</Button><Button onClick={submitAlbum}>Save</Button></>}
      >
        <Field label="Album name">
          <Input autoFocus value={albumModal?.label ?? ""} placeholder="Booth Photos" onChange={(e) => setAlbumModal((m) => m && { ...m, label: e.target.value })} onKeyDown={(e) => e.key === "Enter" && submitAlbum()} />
        </Field>
      </Modal>

      <Modal
        open={pasteOpen}
        onClose={() => setPasteOpen(false)}
        title="Add media by URL"
        subtitle="One URL per line — website paths like /event/photo.jpg or full https:// links"
        footer={
          <>
            <Button variant="outline" onClick={() => setPasteOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                const urls = pasteText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).filter((u) => !album?.media.includes(u));
                if (!urls.length || !album) return setPasteOpen(false);
                await saveMedia([...album.media, ...urls], `${urls.length} item(s) added`);
                setPasteOpen(false);
              }}
            >
              Add to album
            </Button>
          </>
        }
      >
        <Textarea rows={10} className="font-mono text-xs" value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder={"/event/photo-01.jpg\n/event/photo-02.jpg"} />
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={onConfirm}
        loading={busy}
        title={confirm?.type === "album" ? `Delete “${album?.label}”?` : "Remove from album?"}
        confirmLabel={confirm?.type === "album" ? "Delete album" : "Remove"}
        text={confirm?.type === "album" ? "The album and its media list are removed. Files on disk are not deleted." : "The file stays on disk; it just won't appear in this album."}
      />

      {preview && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/85 p-6 backdrop-blur" onClick={() => setPreview(null)}>
          {isVideo(preview) ? (
            <video src={assetUrl(preview)} controls autoPlay className="max-h-[88vh] max-w-[92vw] rounded-xl" onClick={(e) => e.stopPropagation()} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={assetUrl(preview)} alt="" className="max-h-[88vh] max-w-[92vw] rounded-xl" />
          )}
          <div className="absolute bottom-6 rounded-lg bg-black/60 px-3 py-1.5 font-mono text-xs text-white/80">{preview}</div>
        </div>
      )}
    </Card>
  );
}
