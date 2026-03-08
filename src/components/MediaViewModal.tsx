import { Modal, Button } from 'react-bootstrap';
import type { MediaFile } from '../types/media';

interface MediaViewModalProps {
  file: MediaFile | null;
  onHide: () => void;
}

export default function MediaViewModal({ file, onHide }: MediaViewModalProps) {
  if (!file) return null;

  const isVideo =
    file.category === 'video' ||
    (file.mimeType && file.mimeType.startsWith('video/'));

  return (
    <Modal show={!!file} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className="text-truncate">{file.filename}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center p-0 bg-black">
        {isVideo ? (
          <video
            src={file.url}
            controls
            className="w-100"
            style={{ maxHeight: '70vh' }}
          />
        ) : (
          <img
            src={file.url}
            alt={file.filename}
            className="img-fluid"
            style={{ maxHeight: '70vh', objectFit: 'contain' }}
          />
        )}
      </Modal.Body>
      <Modal.Footer className="d-flex flex-column align-items-start gap-1">
        {file.description && (
          <p className="mb-1">
            <strong>Description:</strong> {file.description}
          </p>
        )}
        <p className="mb-1">
          <strong>Category:</strong> {file.category}
        </p>
        <p className="mb-1">
          <strong>Size:</strong> {(file.size / 1024).toFixed(1)} KB
        </p>
        <p className="mb-1">
          <strong>Uploaded:</strong>{' '}
          {new Date(file.uploadedAt).toLocaleString()}
        </p>
        <Button variant="secondary" className="ms-auto" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
