import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Container,
  ListGroup,
  Spinner,
  Alert,
  Form,
  Badge,
  Button,
} from 'react-bootstrap';
import { MusicNoteBeamed, PlayFill, StopFill, SkipStartFill, SkipEndFill, PencilSquare } from 'react-bootstrap-icons';
import { fetchMusicFiles, downloadMusic, fetchTopArtists, fetchTopGenres } from '../services/api';
import type { MusicFile, TopItem } from '../types/music';
import EditMusicModal from '../components/EditMusicModal';

export default function MusicPage() {
  const [files, setFiles] = useState<MusicFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [topArtists, setTopArtists] = useState<TopItem[]>([]);
  const [topGenres, setTopGenres] = useState<TopItem[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(new Set());
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());

  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [autoPlayNext, setAutoPlayNext] = useState(false);
  const [autoPlayMode, setAutoPlayMode] = useState<'next' | 'random'>('next');
  const [loopPlaylist, setLoopPlaylist] = useState(false);

  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [editingFile, setEditingFile] = useState<MusicFile | null>(null);

  const loadFiles = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [data, artists, genres] = await Promise.all([
        fetchMusicFiles(signal),
        fetchTopArtists(signal),
        fetchTopGenres(signal),
      ]);
      if (!signal?.aborted) {
        setFiles(data);
        setTopArtists(artists);
        setTopGenres(genres);
      }
    } catch {
      if (signal?.aborted) return;
      setError('Failed to load music files. Please try again.');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadFiles(controller.signal);
    return () => controller.abort();
  }, [loadFiles]);

  const filteredFiles = useMemo(() => {
    if (selectedArtists.size === 0 && selectedGenres.size === 0) return files;
    return files.filter((f) => {
      const artistMatch =
        selectedArtists.size === 0 ||
        (f.artists ?? []).some((a) => selectedArtists.has(a));
      const genreMatch =
        selectedGenres.size === 0 ||
        (f.genres ?? []).some((g) => selectedGenres.has(g));
      return artistMatch && genreMatch;
    });
  }, [files, selectedArtists, selectedGenres]);

  const playIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= filteredFiles.length) return;
      setCurrentIndex(index);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = filteredFiles[index].streamUrl;
        audioRef.current.play().catch(() => {
          setIsPlaying(false);
        });
      }
    },
    [filteredFiles],
  );

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const handlePrevious = () => {
    if (currentIndex === null || filteredFiles.length === 0) return;
    if (currentIndex === 0) {
      if (loopPlaylist) playIndex(filteredFiles.length - 1);
    } else {
      playIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex === null || filteredFiles.length === 0) return;
    if (autoPlayMode === 'random') {
      const randomIndex = Math.floor(Math.random() * filteredFiles.length);
      playIndex(randomIndex);
    } else if (currentIndex === filteredFiles.length - 1) {
      if (loopPlaylist) playIndex(0);
    } else {
      playIndex(currentIndex + 1);
    }
  };

  const handleDownload = async () => {
    if (!downloadUrl.trim()) return;
    setDownloading(true);
    setError(null);
    setDownloadSuccess(null);
    try {
      const newFile = await downloadMusic(downloadUrl.trim());
      setFiles((prev) => [newFile, ...prev]);
      // Clear filters if the new file wouldn't match the current filter selection
      const artistMatch =
        selectedArtists.size === 0 ||
        (newFile.artists ?? []).some((a) => selectedArtists.has(a));
      const genreMatch =
        selectedGenres.size === 0 ||
        (newFile.genres ?? []).some((g) => selectedGenres.has(g));
      if (!artistMatch || !genreMatch) {
        setSelectedArtists(new Set());
        setSelectedGenres(new Set());
      }
      // Re-fetch top items since rankings may have changed
      Promise.all([fetchTopArtists(), fetchTopGenres()]).then(([artists, genres]) => {
        setTopArtists(artists);
        setTopGenres(genres);
      }).catch((err) => { console.error('Failed to refresh top items after download:', err); });
      setDownloadUrl('');
      setDownloadSuccess('Download complete.');
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch {
      setError('Failed to download music. Please check the URL and try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleDownload();
  };

  const handleItemClick = (index: number) => {
    if (currentIndex === index && isPlaying) {
      handleStop();
    } else {
      playIndex(index);
    }
  };

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    if (!autoPlayNext || filteredFiles.length === 0) return;

    if (autoPlayMode === 'random') {
      const randomIndex = Math.floor(Math.random() * filteredFiles.length);
      playIndex(randomIndex);
    } else {
      const nextIndex = currentIndex !== null ? currentIndex + 1 : 0;
      if (nextIndex < filteredFiles.length) {
        playIndex(nextIndex);
      } else if (loopPlaylist) {
        playIndex(0);
      }
    }
  }, [autoPlayNext, autoPlayMode, currentIndex, filteredFiles.length, loopPlaylist, playIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [handleEnded]);

  const handleEditSaved = (updated: MusicFile) => {
    setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    setEditingFile(null);
  };

  const handleEditDeleted = (id: string) => {
    setFiles((prev) => {
      const newFiles = prev.filter((f) => (f.id || f.fileUuid) !== id);
      // If the deleted file was playing, stop playback
      if (currentIndex !== null) {
        const deletedFilteredIndex = filteredFiles.findIndex((f) => (f.id || f.fileUuid) === id);
        if (deletedFilteredIndex === currentIndex) {
          handleStop();
          setCurrentIndex(null);
        } else if (deletedFilteredIndex !== -1 && deletedFilteredIndex < currentIndex) {
          setCurrentIndex(currentIndex - 1);
        }
      }
      return newFiles;
    });
    setEditingFile(null);
  };

  const displayTitle = (f: MusicFile) => f.title || 'Unknown';
  const displayArtists = (f: MusicFile) =>
    f.artists && f.artists.length > 0 ? f.artists.join(', ') : 'Unknown';
  const displayYearGenres = (f: MusicFile) => {
    const year = f.releaseYear != null ? String(f.releaseYear) : 'Unknown';
    const genres =
      f.genres && f.genres.length > 0 ? f.genres.join(', ') : 'Unknown';
    return `${year} — ${genres}`;
  };

  return (
    <Container className="py-4">
      <h1 className="h3 mb-4">
        <MusicNoteBeamed className="me-2" />
        Music Player
      </h1>

      {/* Error */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Download success */}
      {downloadSuccess && (
        <Alert variant="success" dismissible onClose={() => setDownloadSuccess(null)}>
          {downloadSuccess}
        </Alert>
      )}

      {/* Download input */}
      {!loading && (
        <div className="d-flex gap-2 mb-3">
          <Form.Control
            type="text"
            placeholder="YouTube URL or video ID"
            value={downloadUrl}
            onChange={(e) => setDownloadUrl(e.target.value)}
            disabled={downloading}
            style={{ flexGrow: 1 }}
            onKeyDown={handleDownloadKeyDown}
          />
          <Button
            variant="outline-secondary"
            onClick={handleDownload}
            disabled={downloading || !downloadUrl.trim()}
          >
            {downloading ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Downloading…
              </>
            ) : (
              'Download'
            )}
          </Button>
        </div>
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
          <p className="fs-5">No music files found.</p>
        </div>
      )}

      {/* Playback options */}
      {!loading && files.length > 0 && (
        <>
          {/* Filter chips */}
          {topArtists.length > 0 && (
            <div className="mb-2">
              <span className="me-2 fw-semibold" style={{ fontSize: '0.9em' }}>Top Artists:</span>
              {topArtists.map((item) => {
                const selected = selectedArtists.has(item.name);
                return (
                  <Badge
                    key={item.name}
                    bg={selected ? 'primary' : 'light'}
                    text={selected ? undefined : 'dark'}
                    className="me-1"
                    style={{ cursor: 'pointer', border: selected ? undefined : '1px solid #ccc' }}
                    onClick={() => {
                      setSelectedArtists((prev) => {
                        const next = new Set(prev);
                        if (next.has(item.name)) next.delete(item.name);
                        else next.add(item.name);
                        return next;
                      });
                    }}
                  >
                    {item.name}
                  </Badge>
                );
              })}
            </div>
          )}
          {topGenres.length > 0 && (
            <div className="mb-3">
              <span className="me-2 fw-semibold" style={{ fontSize: '0.9em' }}>Top Genres:</span>
              {topGenres.map((item) => {
                const selected = selectedGenres.has(item.name);
                return (
                  <Badge
                    key={item.name}
                    bg={selected ? 'primary' : 'light'}
                    text={selected ? undefined : 'dark'}
                    className="me-1"
                    style={{ cursor: 'pointer', border: selected ? undefined : '1px solid #ccc' }}
                    onClick={() => {
                      setSelectedGenres((prev) => {
                        const next = new Set(prev);
                        if (next.has(item.name)) next.delete(item.name);
                        else next.add(item.name);
                        return next;
                      });
                    }}
                  >
                    {item.name}
                  </Badge>
                );
              })}
            </div>
          )}

          <div className="mb-3 d-flex flex-wrap gap-3 align-items-center">
            <Form.Check
              type="checkbox"
              id="auto-play-next"
              label="Auto-play next"
              checked={autoPlayNext}
              onChange={(e) => setAutoPlayNext(e.target.checked)}
            />
            {autoPlayNext && (
              <>
                <Form.Check
                  type="radio"
                  id="mode-next"
                  name="autoPlayMode"
                  label="Next in list"
                  checked={autoPlayMode === 'next'}
                  onChange={() => setAutoPlayMode('next')}
                />
                <Form.Check
                  type="radio"
                  id="mode-random"
                  name="autoPlayMode"
                  label="Random"
                  checked={autoPlayMode === 'random'}
                  onChange={() => setAutoPlayMode('random')}
                />
                {autoPlayMode === 'next' && (
                  <Form.Check
                    type="checkbox"
                    id="loop-playlist"
                    label="Loop playlist"
                    checked={loopPlaylist}
                    onChange={(e) => setLoopPlaylist(e.target.checked)}
                  />
                )}
              </>
            )}
          </div>

          {/* Audio element with prev/next controls */}
          <div className="d-flex align-items-center gap-2 mb-3">
            <Button
              variant="outline-secondary"
              onClick={handlePrevious}
              disabled={
                currentIndex === null ||
                filteredFiles.length === 0 ||
                (!loopPlaylist && currentIndex === 0)
              }
              aria-label="Previous track"
            >
              <SkipStartFill />
            </Button>
            <audio ref={audioRef} className="flex-grow-1" controls />
            <Button
              variant="outline-secondary"
              onClick={handleNext}
              disabled={
                currentIndex === null ||
                filteredFiles.length === 0 ||
                (!loopPlaylist && currentIndex === filteredFiles.length - 1)
              }
              aria-label="Next track"
            >
              <SkipEndFill />
            </Button>
          </div>

          {/* File list */}
          <ListGroup>
            {filteredFiles.map((file, index) => {
              const active = currentIndex === index;
              return (
                <ListGroup.Item
                  key={file.uuid}
                  action
                  active={active && isPlaying}
                  className="d-flex justify-content-between align-items-start music-row"
                  onClick={() => handleItemClick(index)}
                  style={{ cursor: 'pointer' }}
                  aria-label={`${displayTitle(file)}${active && isPlaying ? ', currently playing' : ''}`}
                >
                  <div className="d-flex align-items-start">
                    <span className="me-2 mt-1">
                      {active && isPlaying ? <StopFill /> : <PlayFill />}
                    </span>
                    <div style={{ lineHeight: 1.3 }}>
                      <div style={{ fontWeight: 500 }}>{displayTitle(file)}</div>
                      <div style={{ fontSize: '0.85em', opacity: 0.8 }}>
                        {displayArtists(file)}
                      </div>
                      <div style={{ fontSize: '0.75em', opacity: 0.6 }}>
                        {displayYearGenres(file)}
                      </div>
                    </div>
                  </div>
                  <div className="d-flex flex-column align-items-end ms-3">
                    <span style={{ fontSize: '0.8em', opacity: 0.55, whiteSpace: 'nowrap' }}>
                      {file.fileName || ''}
                    </span>
                    {active && (
                      <Badge bg={isPlaying ? 'success' : 'secondary'} className="mt-1">
                        {isPlaying ? 'Playing' : 'Paused'}
                      </Badge>
                    )}
                    <Button
                      variant="link"
                      size="sm"
                      className="music-edit-btn p-0 mt-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingFile(file);
                      }}
                      aria-label="Edit music details"
                    >
                      <PencilSquare />
                    </Button>
                  </div>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </>
      )}

      <EditMusicModal
        file={editingFile}
        onClose={() => setEditingFile(null)}
        onSaved={handleEditSaved}
        onDeleted={handleEditDeleted}
      />
    </Container>
  );
}
