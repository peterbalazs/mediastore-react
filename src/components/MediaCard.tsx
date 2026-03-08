import { Card, Badge, Button } from 'react-bootstrap';
import { EyeFill, TrashFill, PlayCircleFill, ImageFill } from 'react-bootstrap-icons';
import type { MediaFile } from '../types/media';

interface MediaCardProps {
  file: MediaFile;
  onView: (file: MediaFile) => void;
  onDelete: (file: MediaFile) => void;
}

export default function MediaCard({ file, onView, onDelete }: MediaCardProps) {
  const isVideo =
    file.category === 'video' ||
    (file.mimeType && file.mimeType.startsWith('video/'));

  const thumbnail = file.thumbnailUrl ?? file.url;

  return (
    <Card className="h-100 shadow-sm">
      <div
        className="position-relative bg-secondary"
        style={{ height: 180, overflow: 'hidden', cursor: 'pointer' }}
        onClick={() => onView(file)}
        role="button"
        aria-label={`View ${file.filename}`}
      >
        {isVideo ? (
          <div className="d-flex align-items-center justify-content-center h-100 text-white">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={file.filename}
                className="w-100 h-100"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <PlayCircleFill size={56} />
            )}
            <PlayCircleFill
              size={40}
              className="position-absolute text-white opacity-75"
            />
          </div>
        ) : (
          <div className="d-flex align-items-center justify-content-center h-100">
            <img
              src={thumbnail}
              alt={file.filename}
              className="w-100 h-100"
              style={{ objectFit: 'cover' }}
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('d-none');
              }}
            />
            <ImageFill
              size={56}
              className="d-none position-absolute text-white"
            />
          </div>
        )}
      </div>

      <Card.Body className="d-flex flex-column">
        <Card.Title
          className="fs-6 text-truncate mb-1"
          title={file.filename}
        >
          {file.filename}
        </Card.Title>

        {file.description && (
          <Card.Text
            className="text-muted small mb-2"
            style={{
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {file.description}
          </Card.Text>
        )}

        <div className="d-flex align-items-center gap-2 mb-2 mt-auto flex-wrap">
          <Badge bg={isVideo ? 'danger' : 'primary'} className="text-uppercase">
            {file.category}
          </Badge>
          <span className="text-muted small ms-auto">
            {(file.size / 1024).toFixed(1)} KB
          </span>
        </div>

        <p className="text-muted small mb-3">
          {new Date(file.uploadedAt).toLocaleDateString()}
        </p>

        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            size="sm"
            className="flex-grow-1"
            onClick={() => onView(file)}
          >
            <EyeFill className="me-1" /> View
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => onDelete(file)}
            aria-label={`Delete ${file.filename}`}
          >
            <TrashFill />
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
