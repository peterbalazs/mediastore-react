import { useState, useRef } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import type { UploadPayload } from '../types/media';

interface UploadModalProps {
  show: boolean;
  onHide: () => void;
  onUpload: (payload: UploadPayload) => Promise<void>;
}

export default function UploadModal({ show, onHide, onUpload }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    if (loading) return;
    setFile(null);
    setDescription('');
    setCategory('');
    setError(null);
    onHide();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onUpload({ file, fileName: file.name, description, category });
      handleClose();
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Upload Media File</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form.Group className="mb-3" controlId="uploadFile">
            <Form.Label>File</Form.Label>
            <Form.Control
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*"
              required
              onChange={(e) => {
                const input = e.target as HTMLInputElement;
                setFile(input.files?.[0] ?? null);
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="uploadDescription">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Optional description…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="uploadCategory">
            <Form.Label>Category</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. nature, travel, portrait…"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Uploading…
              </>
            ) : (
              'Upload'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
