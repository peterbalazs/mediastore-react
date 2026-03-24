import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  ListGroup,
  Spinner,
  Alert,
  Form,
  Badge,
} from 'react-bootstrap';
import { MusicNoteBeamed, PlayFill, StopFill } from 'react-bootstrap-icons';
import { fetchMusicFiles } from '../services/api';
import type { MusicFile } from '../types/music';

export default function MusicPage() {
  const [files, setFiles] = useState<MusicFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [autoPlayNext, setAutoPlayNext] = useState(false);
  const [autoPlayMode, setAutoPlayMode] = useState<'next' | 'random'>('next');
  const [loopPlaylist, setLoopPlaylist] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadFiles = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMusicFiles(signal);
      if (!signal?.aborted) {
        setFiles(data);
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

  const playIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= files.length) return;
      setCurrentIndex(index);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = files[index].streamUrl;
        audioRef.current.play().catch(() => {
          setIsPlaying(false);
        });
      }
    },
    [files],
  );

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
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
    if (!autoPlayNext || files.length === 0) return;

    if (autoPlayMode === 'random') {
      const randomIndex = Math.floor(Math.random() * files.length);
      playIndex(randomIndex);
    } else {
      const nextIndex = currentIndex !== null ? currentIndex + 1 : 0;
      if (nextIndex < files.length) {
        playIndex(nextIndex);
      } else if (loopPlaylist) {
        playIndex(0);
      }
    }
  }, [autoPlayNext, autoPlayMode, currentIndex, files.length, loopPlaylist, playIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [handleEnded]);

  const shortId = (uuid: string) =>
    uuid.length > 12 ? `${uuid.slice(0, 8)}…${uuid.slice(-4)}` : uuid;

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

          {/* Audio element */}
          <audio ref={audioRef} className="w-100 mb-3" controls />

          {/* File list */}
          <ListGroup>
            {files.map((file, index) => {
              const active = currentIndex === index;
              return (
                <ListGroup.Item
                  key={file.uuid}
                  action
                  active={active && isPlaying}
                  className="d-flex justify-content-between align-items-center"
                  onClick={() => handleItemClick(index)}
                  style={{ cursor: 'pointer' }}
                  aria-label={`Music file ${file.uuid}${active && isPlaying ? ', currently playing' : ''}`}
                >
                  <span>
                    {active && isPlaying ? (
                      <StopFill className="me-2" />
                    ) : (
                      <PlayFill className="me-2" />
                    )}
                    {shortId(file.uuid)}
                  </span>
                  {active && (
                    <Badge bg={isPlaying ? 'success' : 'secondary'}>
                      {isPlaying ? 'Playing' : 'Paused'}
                    </Badge>
                  )}
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </>
      )}
    </Container>
  );
}
