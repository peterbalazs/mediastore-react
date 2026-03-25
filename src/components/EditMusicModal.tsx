import { useState, useEffect } from 'react';
import { Modal, Form, Button, Spinner, Alert } from 'react-bootstrap';
import type { MusicFile, UpdateMusicPayload } from '../types/music';
import { updateMusicFile, deleteMusicFile } from '../services/api';

interface Props {
  file: MusicFile | null;
  onClose: () => void;
  onSaved: (updated: MusicFile) => void;
  onDeleted: (id: string) => void;
}

export default function EditMusicModal({ file, onClose, onSaved, onDeleted }: Props) {
  const [fileName, setFileName] = useState('');
  const [title, setTitle] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [album, setAlbum] = useState('');
  const [artists, setArtists] = useState('');
  const [genres, setGenres] = useState('');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      setFileName(file.fileName ?? '');
      setTitle(file.title ?? '');
      setReleaseYear(file.releaseYear != null ? String(file.releaseYear) : '');
      setAlbum(file.album ?? '');
      setArtists(file.artists?.join(', ') ?? '');
      setGenres(file.genres?.join(', ') ?? '');
      setError(null);
      setConfirmingDelete(false);
    }
  }, [file]);

  const parseList = (value: string): string[] =>
    value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const handleSubmit = async () => {
    if (!file) return;
    setSaving(true);
    setError(null);

    const payload: UpdateMusicPayload = {
      fileName: fileName.trim() || undefined,
      title: title.trim() || undefined,
      releaseYear: releaseYear.trim() ? Number(releaseYear.trim()) : null,
      album: album.trim() || undefined,
      artists: parseList(artists),
      genres: parseList(genres),
    };

    try {
      const updated = await updateMusicFile(file.id ? file.id : file.fileUuid, payload);
      onSaved(updated);
    } catch {
      setError('Failed to update music file. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!file) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await deleteMusicFile(file.id ? file.id : file.fileUuid);
      onDeleted(file.id ? file.id : file.fileUuid);
    } catch {
      setError('Failed to delete music file. Please try again.');
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <Modal show={file !== null} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Music Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <Form.Group className="mb-3" controlId="edit-fileName">
            <Form.Label>File Name</Form.Label>
            <Form.Control
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              disabled={saving}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="edit-title">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="edit-artists">
            <Form.Label>Artists</Form.Label>
            <Form.Control
              type="text"
              value={artists}
              onChange={(e) => setArtists(e.target.value)}
              placeholder="Comma-separated"
              disabled={saving}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="edit-album">
            <Form.Label>Album</Form.Label>
            <Form.Control
              type="text"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              disabled={saving}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="edit-releaseYear">
            <Form.Label>Release Year</Form.Label>
            <Form.Control
              type="number"
              value={releaseYear}
              onChange={(e) => setReleaseYear(e.target.value)}
              disabled={saving}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="edit-genres">
            <Form.Label>Genres</Form.Label>
            <Form.Control
              type="text"
              value={genres}
              onChange={(e) => setGenres(e.target.value)}
              placeholder="Comma-separated"
              disabled={saving}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <div>
          <Button
            variant={confirmingDelete ? 'danger' : 'outline-danger'}
            onClick={handleDelete}
            disabled={saving || deleting}
          >
            {deleting ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Deleting…
              </>
            ) : confirmingDelete ? (
              'Confirm Delete'
            ) : (
              'Delete'
            )}
          </Button>
          {confirmingDelete && !deleting && (
            <Button
              variant="link"
              size="sm"
              className="ms-2 text-secondary"
              onClick={() => setConfirmingDelete(false)}
            >
              Cancel
            </Button>
          )}
        </div>
        <div className="d-flex gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving || deleting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving || deleting}>
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Saving…
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

