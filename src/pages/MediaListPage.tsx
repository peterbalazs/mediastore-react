import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Button,
  Spinner,
  Alert,
  Modal,
} from 'react-bootstrap';
import { CloudUploadFill } from 'react-bootstrap-icons';
import MediaCard from '../components/MediaCard';
import MediaViewModal from '../components/MediaViewModal';
import UploadModal from '../components/UploadModal';
import {
  fetchMediaFiles,
  deleteMediaFile,
  uploadMediaFile,
} from '../services/api';
import type { MediaFile, UploadPayload } from '../types/media';

export default function MediaListPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewTarget, setViewTarget] = useState<MediaFile | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<MediaFile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMediaFiles();
      setFiles(data);
    } catch {
      setError('Failed to load media files. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMediaFile(deleteTarget.id);
      setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError('Failed to delete the file. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleUpload = async (payload: UploadPayload) => {
    const newFile = await uploadMediaFile(payload);
    setFiles((prev) => [newFile, ...prev]);
  };

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0">Media Library</h1>
        <Button variant="primary" onClick={() => setShowUpload(true)}>
          <CloudUploadFill className="me-2" />
          Upload
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading…</span>
          </Spinner>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && files.length === 0 && (
        <div className="text-center text-muted py-5">
          <p className="fs-5">No media files found.</p>
          <Button variant="outline-primary" onClick={() => setShowUpload(true)}>
            Upload your first file
          </Button>
        </div>
      )}

      {/* Media grid */}
      {!loading && files.length > 0 && (
        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {files.map((file) => (
            <Col key={file.id}>
              <MediaCard
                file={file}
                onView={setViewTarget}
                onDelete={setDeleteTarget}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* View modal */}
      <MediaViewModal
        file={viewTarget}
        onHide={() => setViewTarget(null)}
      />

      {/* Upload modal */}
      <UploadModal
        show={showUpload}
        onHide={() => setShowUpload(false)}
        onUpload={handleUpload}
      />

      {/* Delete confirmation modal */}
      <Modal
        show={!!deleteTarget}
        onHide={() => setDeleteTarget(null)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete{' '}
          <strong>{deleteTarget?.filename}</strong>? This action cannot be
          undone.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Deleting…
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
