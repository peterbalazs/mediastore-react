import { Modal, Button } from 'react-bootstrap';
import type { MediaFile } from '../types/media';
import { isVideoFile, formatFileSize } from '../utils/media';

interface MediaViewModalProps {
  file: MediaFile | null;
  onHide: () => void;
}

interface MetaRowProps {
  label: string;
  value: string | number | null | undefined;
}

function MetaRow({ label, value }: MetaRowProps) {
  if (value == null || value === '') return null;
  return (
    <div>
      <span className="text-muted small">{label}</span>
      <div className="fw-semibold small">{String(value)}</div>
    </div>
  );
}

export default function MediaViewModal({ file, onHide }: MediaViewModalProps) {
  if (!file) return null;

  const isVideo = isVideoFile(file);

  const dimensions = file.width && file.height ? `${file.width} × ${file.height}` : null;

  return (
    <Modal show={!!file} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className="text-truncate">{file.fileName}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center p-0 bg-black">
        {isVideo ? (
          <video
            src={file.imageUrl}
            controls
            className="w-100"
            style={{ maxHeight: '70vh' }}
          />
        ) : (
          <img
            src={file.imageUrl}
            alt={file.fileName}
            className="img-fluid"
            style={{ maxHeight: '70vh', objectFit: 'contain' }}
          />
        )}
      </Modal.Body>
      <Modal.Footer className="d-flex flex-column align-items-start gap-2 w-100">
        {file.description && (
          <p className="mb-1 w-100">
            <strong>Description:</strong> {file.description}
          </p>
        )}
        <div
          className="w-100"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem 1.5rem',
          }}
        >
          <MetaRow label="Category" value={file.category} />
          <MetaRow label="File Size" value={formatFileSize(file.originalFileSize)} />
          <MetaRow label="Upload Date" value={new Date(file.uploadDate).toLocaleString()} />
          <MetaRow label="Encoder" value={file.encoder} />
          <MetaRow label="Dimensions" value={dimensions} />
          <MetaRow label="Container" value={file.container} />
          <MetaRow label="Format Name" value={file.formatName} />
          <MetaRow label="Codec" value={file.codec} />
          <MetaRow label="Pixel Format" value={file.pixelFormat} />
          <MetaRow label="Bit Depth" value={file.bitDepth} />
          <MetaRow label="Location" value={file.location} />
          <MetaRow
            label="Creation Date"
            value={file.creationDate ? new Date(file.creationDate).toLocaleString() : null}
          />
        </div>
        <Button variant="secondary" className="ms-auto mt-1" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
