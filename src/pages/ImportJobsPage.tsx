import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Button,
  Spinner,
  Alert,
  Modal,
  Table,
  Badge,
  Form,
} from 'react-bootstrap';
import type { ImportJob, ImportJobStatistics, DuplicateAction } from '../types/importJob';
import {
  fetchImportJobs,
  createImportJob,
  runImportJob,
  fetchImportJobStatistics,
  acknowledgeImportJob,
} from '../services/api';

function statusVariant(
  status: ImportJob['jobStatus'],
): string {
  switch (status) {
    case 'NEW':
      return 'primary';
    case 'IN_PROGRESS':
      return 'warning';
    case 'COMPLETED':
      return 'success';
    case 'FAILED':
      return 'danger';
    case 'ACKNOWLEDGED':
      return 'secondary';
  }
}

const DUPLICATE_ACTION_OPTIONS: DuplicateAction[] = [
  'KEEP_BOTH',
  'KEEP_ORIGINAL',
  'KEEP_NEW',
];

const DEFAULT_FORM = {
  sourceFolder: '',
  category: '',
  duplicateAction: 'KEEP_BOTH' as DuplicateAction,
  includeSubFolders: false,
};

export default function ImportJobsPage() {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [form, setForm] = useState(DEFAULT_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Per-job action state
  const [runningId, setRunningId] = useState<string | null>(null);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Statistics modal state
  const [statsJob, setStatsJob] = useState<ImportJob | null>(null);
  const [stats, setStats] = useState<ImportJobStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchImportJobs();
      setJobs(data);
    } catch {
      setError('Failed to load import jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await createImportJob(form);
      setForm(DEFAULT_FORM);
      await loadJobs();
    } catch {
      setCreateError('Failed to create import job. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleRun = async (job: ImportJob) => {
    setRunningId(job.id);
    setActionError(null);
    try {
      await runImportJob(job.id);
      await loadJobs();
    } catch {
      setActionError(`Failed to run job "${job.sourceFolder}". Please try again.`);
    } finally {
      setRunningId(null);
    }
  };

  const handleAcknowledge = async (job: ImportJob) => {
    setAcknowledgingId(job.id);
    setActionError(null);
    try {
      await acknowledgeImportJob(job.id);
      await loadJobs();
    } catch {
      setActionError(`Failed to acknowledge job "${job.sourceFolder}". Please try again.`);
    } finally {
      setAcknowledgingId(null);
    }
  };

  const handleShowStats = async (job: ImportJob) => {
    setStatsJob(job);
    setStats(null);
    setStatsError(null);
    setStatsLoading(true);
    try {
      const data = await fetchImportJobStatistics(job.id);
      setStats(data);
    } catch {
      setStatsError('Failed to load statistics. Please try again.');
    } finally {
      setStatsLoading(false);
    }
  };

  const handleCloseStats = () => {
    setStatsJob(null);
    setStats(null);
    setStatsError(null);
  };

  return (
    <Container className="py-4">
      {/* Header */}
      <h1 className="h3 mb-4">Import Jobs</h1>

      {/* Create Job Form */}
      <div className="border rounded p-3 mb-4 bg-light">
        <h2 className="h5 mb-3">Create New Import Job</h2>
        {createError && (
          <Alert variant="danger" dismissible onClose={() => setCreateError(null)}>
            {createError}
          </Alert>
        )}
        <Form onSubmit={handleCreate}>
          <div className="row g-3">
            <div className="col-md-4">
              <Form.Group controlId="sourceFolder">
                <Form.Label>Source Folder</Form.Label>
                <Form.Control
                  type="text"
                  required
                  value={form.sourceFolder}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, sourceFolder: e.target.value }))
                  }
                  placeholder="/path/to/folder"
                />
              </Form.Group>
            </div>
            <div className="col-md-3">
              <Form.Group controlId="category">
                <Form.Label>Category</Form.Label>
                <Form.Control
                  type="text"
                  required
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                  placeholder="e.g. vacation"
                />
              </Form.Group>
            </div>
            <div className="col-md-3">
              <Form.Group controlId="duplicateAction">
                <Form.Label>Duplicate Action</Form.Label>
                <Form.Select
                  value={form.duplicateAction}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      duplicateAction: e.target.value as DuplicateAction,
                    }))
                  }
                >
                  {DUPLICATE_ACTION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.replace(/_/g, ' ')}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <Form.Group controlId="includeSubFolders" className="mb-1">
                <Form.Check
                  type="checkbox"
                  label="Include Sub Folders"
                  checked={form.includeSubFolders}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      includeSubFolders: e.target.checked,
                    }))
                  }
                />
              </Form.Group>
            </div>
          </div>
          <div className="mt-3">
            <Button type="submit" variant="primary" disabled={creating}>
              {creating ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Creating…
                </>
              ) : (
                'Create Job'
              )}
            </Button>
          </div>
        </Form>
      </div>

      {/* Action error */}
      {actionError && (
        <Alert variant="danger" dismissible onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {/* Load error */}
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
      {!loading && !error && jobs.length === 0 && (
        <div className="text-center text-muted py-5">
          <p className="fs-5">No import jobs found.</p>
        </div>
      )}

      {/* Jobs table */}
      {!loading && jobs.length > 0 && (
        <Table responsive bordered hover>
          <thead className="table-light">
            <tr>
              <th>Status</th>
              <th>Source Folder</th>
              <th>Category</th>
              <th>Duplicate Action</th>
              <th>Sub Folders</th>
              <th>Created</th>
              <th>Error</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>
                  <Badge bg={statusVariant(job.jobStatus)}>{job.jobStatus}</Badge>
                </td>
                <td>{job.sourceFolder}</td>
                <td>{job.category}</td>
                <td>{job.duplicateAction.replace(/_/g, ' ')}</td>
                <td>{job.includeSubFolders ? 'Yes' : 'No'}</td>
                <td>
                  {new Date(job.creationDate).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </td>
                <td>
                  {job.errorMessage ? (
                    <span className="text-danger small">{job.errorMessage}</span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="text-nowrap">
                  {(job.jobStatus === 'NEW' || job.jobStatus === 'FAILED') && (
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="me-1"
                      disabled={runningId === job.id}
                      onClick={() => handleRun(job)}
                    >
                      {runningId === job.id ? (
                        <>
                          <Spinner size="sm" animation="border" className="me-1" />
                          Running…
                        </>
                      ) : (
                        'Run'
                      )}
                    </Button>
                  )}
                  {job.jobStatus === 'COMPLETED' && (
                    <Button
                      size="sm"
                      variant="outline-success"
                      className="me-1"
                      disabled={acknowledgingId === job.id}
                      onClick={() => handleAcknowledge(job)}
                    >
                      {acknowledgingId === job.id ? (
                        <>
                          <Spinner size="sm" animation="border" className="me-1" />
                          Acknowledging…
                        </>
                      ) : (
                        'Acknowledge'
                      )}
                    </Button>
                  )}
                  {(job.jobStatus === 'COMPLETED' ||
                    job.jobStatus === 'ACKNOWLEDGED') && (
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={() => handleShowStats(job)}
                    >
                      Statistics
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Statistics modal */}
      <Modal show={!!statsJob} onHide={handleCloseStats} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Job Statistics
            {statsJob && (
              <small className="text-muted ms-2 fs-6">{statsJob.sourceFolder}</small>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {statsLoading && (
            <div className="text-center py-3">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading…</span>
              </Spinner>
            </div>
          )}
          {statsError && (
            <Alert variant="danger">{statsError}</Alert>
          )}
          {stats && !statsLoading && (
            <Table bordered className="mb-0">
              <tbody>
                <tr>
                  <th>Total Images Found</th>
                  <td>{stats.totalImagesFound}</td>
                </tr>
                <tr>
                  <th>Total Images Imported</th>
                  <td>{stats.totalImagesImported}</td>
                </tr>
                <tr>
                  <th>Total Images Failed</th>
                  <td>{stats.totalImagesFailed}</td>
                </tr>
                <tr>
                  <th>Duplicates Found</th>
                  <td>{stats.duplicatesFound}</td>
                </tr>
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseStats}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
