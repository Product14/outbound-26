import WavesurferPlayer, { useWavesurfer } from '@wavesurfer/react';

import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { IoMdPause, IoMdPlay } from 'react-icons/io';
import { MdVolumeDownAlt, MdVolumeOff, MdVolumeUp } from 'react-icons/md';
import { RiForward5Line, RiReplay5Line } from 'react-icons/ri';

interface AudioPlayerProps {
  audioUrl: string;
  showWaveform?: boolean;
  autoPlay?: boolean;
  onTimeUpdate?: (time: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onDurationChange?: (duration: number) => void;
  onEnded?: () => void; // New prop for when audio finishes playing
  hideControls?: boolean; // New prop to hide internal controls
  hideSeekButtons?: boolean; // Hide the ±5s seek buttons
  onError?: (message: string) => void; // Notify parent of playback errors
}

export interface AudioPlayerRef {
  seek: (time: number) => void;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  isPlaying: () => boolean;
  isReady: () => boolean;
}

const formatTime = (time: number) => {
  if (!time || isNaN(time) || !isFinite(time) || time < 0) {
    return '0:00';
  }

  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const AudioPlayerButton = ({
  icon,
  onClick,
}: {
  icon: React.ReactNode;
  onClick: () => void;
}) => {
  return (
    <div
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full p-2"
      onClick={onClick}
    >
      {icon}
    </div>
  );
};

const AudioPlayer = React.forwardRef<AudioPlayerRef, AudioPlayerProps>(
  ({ audioUrl, showWaveform = false, autoPlay = false, onTimeUpdate, onPlay, onPause, onDurationChange, onEnded, hideControls = false, hideSeekButtons = false, onError }, ref) => {
    const audioPlayerRef = useRef<HTMLAudioElement>(null);
    const htmlAudioRef = useRef<HTMLAudioElement>(null);
    const wavesurferContainerRef = useRef<HTMLDivElement>(null);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(100);
    const [wavesurferDuration, setWavesurferDuration] = useState(0);
    const [isWavesurferReady, setIsWavesurferReady] = useState(false);
    const progressRef = useRef<HTMLDivElement>(null);
    const lastKnownTimeRef = useRef<number>(0);
    const [htmlAudioPlaying, setHtmlAudioPlaying] = useState(false);
    const manualPauseRef = useRef(false);

    // Ensure the plain <audio> instance exists and is wired up
    const initializeAudioIfNeeded = React.useCallback(() => {
      if (showWaveform) return;
      if (!htmlAudioRef.current || !audioUrl) return;

      // Use a real DOM <audio> element to avoid transient pause events
      const audio = htmlAudioRef.current;
      try { (audio as any).crossOrigin = 'anonymous'; } catch {}
      audio.controls = false;
      audio.preload = 'metadata';
      try { (audio as any).playsInline = true } catch {}
      audio.loop = false;
      if (audio.src !== audioUrl) {
        audio.src = audioUrl;
      }
      audioPlayerRef.current = audio;

      const handleMetadata = () => {
        setDuration(audio.duration);
        onDurationChange?.(audio.duration);

        // Disable media session to prevent browser popups
        try {
          if ('mediaSession' in navigator) {
            // @ts-ignore
            navigator.mediaSession.metadata = null;
            // @ts-ignore
            navigator.mediaSession.setActionHandler?.('play', null);
            // @ts-ignore
            navigator.mediaSession.setActionHandler?.('pause', null);
            // @ts-ignore
            navigator.mediaSession.setActionHandler?.('stop', null);
          }
        } catch {}

        if (autoPlay) {
          setTimeout(() => {
            audio.play().catch(() => {});
          }, 200);
        }
      };

      const handleTimeUpdate = () => {
        setProgress(audio.currentTime);
      };

      const handleEnded = () => {
        onEnded?.();
      };

      const handleError = () => {
        const mediaError = (audio as any).error as MediaError | undefined
        const code = mediaError?.code
        const message = code === 1 ? 'Playback aborted' :
                        code === 2 ? 'Network error while fetching audio' :
                        code === 3 ? 'Decoding error' :
                        code === 4 ? 'Audio source not supported' : 'Unknown audio error'
        onError?.(message)
      }

      audio.addEventListener('loadedmetadata', handleMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('canplay', () => {
        // Helpful log so we can confirm the element is created
      });
      audio.addEventListener('error', handleError);
      audio.addEventListener('play', () => {
        setHtmlAudioPlaying(true);
        onPlay?.();
      });
      audio.addEventListener('pause', () => {
        setHtmlAudioPlaying(false);
        onPause?.();
        // If pause was not user-initiated and not at end, try to auto-resume once
        if (!manualPauseRef.current && !audio.ended) {
          setTimeout(() => {
            if (!audio.paused && !audio.ended) return;
            audio.play().catch(() => {});
          }, 50);
        }
        // Reset the flag after handling
        manualPauseRef.current = false;
      });
    }, [audioUrl, showWaveform, autoPlay, onDurationChange, onEnded]);

    const wavesurferOptions = React.useMemo(() => ({
      container: wavesurferContainerRef,
      url: audioUrl,
      waveColor: '#e5e5e5',
      progressColor: '#4600F2',
      cursorColor: '#4600F2',
      height: 45,
      barHeight: 2,
      barWidth: 2,
      barGap: 1.5,
      barRadius: 5,
      fillParent: true,
      mediaControls: false, // Disable browser media controls
      normalize: false,
      hideScrollbar: true,
    }), [audioUrl]);

    const {
      wavesurfer,
      isPlaying: wavesurferIsPlaying,
      currentTime: wavesurferCurrentTime,
    } = useWavesurfer(wavesurferOptions);



    // Track playing state and notify parent (wavesurfer path handled via effect below)
    const isPlaying = showWaveform ? wavesurferIsPlaying : htmlAudioPlaying;

    useEffect(() => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.volume = volume / 100;
      }
    }, [volume]);

    useEffect(() => {
      if (showWaveform) return;
      initializeAudioIfNeeded();

      const audio = htmlAudioRef.current;
      if (!audio) return () => {};

      const handleCleanup = () => {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch {}
      };
      return handleCleanup;
    }, [audioUrl, showWaveform, initializeAudioIfNeeded]);

    useEffect(() => {
      if (showWaveform && wavesurfer) {
        const getDuration = async () => {
          try {
            const duration = wavesurfer.getDuration();
            setWavesurferDuration(duration);
            onDurationChange?.(duration);
          } catch (error) {
          }
        };

        getDuration();

        const handleReady = () => {

          setIsWavesurferReady(true);
          getDuration();
          
          // Disable media session to prevent browser popups
          if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = null;
            navigator.mediaSession.setActionHandler('play', null);
            navigator.mediaSession.setActionHandler('pause', null);
            navigator.mediaSession.setActionHandler('stop', null);
            navigator.mediaSession.setActionHandler('seekbackward', null);
            navigator.mediaSession.setActionHandler('seekforward', null);
          }
          
          // Auto-play when waveform is ready if autoPlay is enabled
          if (autoPlay) {

            setTimeout(() => {
              wavesurfer.play().catch(() => {});
            }, 200); // Small delay to ensure everything is ready
          }
        };

        const handleFinish = () => {
          onEnded?.();
        };

        wavesurfer.on('ready', handleReady);
        wavesurfer.on('finish', handleFinish);

        return () => {
          wavesurfer.un('ready', handleReady);
          wavesurfer.un('finish', handleFinish);
        };
      }
    }, [showWaveform, wavesurfer, autoPlay, onEnded]);

    // Mirror wavesurfer play/pause to callbacks
    useEffect(() => {
      if (!showWaveform) return;
      if (wavesurferIsPlaying) onPlay?.(); else onPause?.();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showWaveform, wavesurferIsPlaying]);

    useEffect(() => {
      const currentTime = showWaveform ? Math.round(wavesurferCurrentTime) : Math.round(progress);

      onTimeUpdate?.(currentTime);
    }, [showWaveform, Math.round(wavesurferCurrentTime), Math.round(progress), isPlaying]);

    const handleSeek = (time: number) => {
      if (showWaveform) {
        wavesurfer?.setTime(time);
        return;
      }
      if (audioPlayerRef.current && time >= 0 && time <= duration) {
        audioPlayerRef.current.currentTime = time;
      }
    };

    useImperativeHandle(ref, () => ({
      seek(time: number) {
        handleSeek(time);
      },
      play() {
        if (showWaveform) {
          if (wavesurfer && isWavesurferReady) {

            // If we have a saved time and current time is 0, restore the saved time
            if (lastKnownTimeRef.current > 0 && Math.round(wavesurferCurrentTime) === 0) {
              wavesurfer.setTime(lastKnownTimeRef.current);
            }
            wavesurfer.play().catch(() => {});
          } else {
            
          }
        } else if (audioPlayerRef.current) {
          const audio = audioPlayerRef.current;
          try {
            if (audio.readyState < 2) audio.load();
          } catch {}
          audio.play()
            .then(() => {
              try { audio.volume = volume / 100 } catch {}
              setHtmlAudioPlaying(true)
            })
            .catch((err) => {
              console.warn('HTMLAudioElement play() failed', err)
              // Try re-initializing and retry once
              initializeAudioIfNeeded();
              setTimeout(() => {
                audio.play().catch((e) => {
                  console.warn('Retry play() failed', e)
                  onError?.('play failed: ' + (e?.message || String(e)))
                })
              }, 80)
            });
        } else {
          // Lazily initialize and attempt playback
          initializeAudioIfNeeded();
          setTimeout(() => {
            const a = audioPlayerRef.current
            a?.play().catch((e) => {
              console.warn('Deferred play() failed', e)
              onError?.('play failed: ' + (e?.message || String(e)))
            })
          }, 60);
        }
      },
      pause() {
        manualPauseRef.current = true;
        pause();
      },
      togglePlayPause() {
        togglePlayPause();
      },
      isPlaying() {
        return Boolean(isPlaying);
      },
      isReady() {
        return showWaveform ? isWavesurferReady : true;
      },
    }));

    const pause = () => {
      if (showWaveform) {
        lastKnownTimeRef.current = wavesurferCurrentTime;
        wavesurfer?.pause();
        return;
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };

    const stop = () => {
      if (showWaveform) {
        wavesurfer?.stop();
        return;
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      }
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || !audioPlayerRef.current || duration === 0)
        return;

      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const clickPercentage = clickX / width;
      const seekTime = clickPercentage * duration;

      handleSeek(seekTime);
    };

    const togglePlayPause = () => {
      if (showWaveform) {
        wavesurfer?.playPause();
        return;
      }
      if (!audioPlayerRef.current) return;
      if (audioPlayerRef.current.paused) {
        const a = audioPlayerRef.current
        try { if (a.readyState < 2) a.load() } catch {}
        a.play().catch((e) => console.warn('toggle play() failed', e));
        return;
      }
      manualPauseRef.current = true;
      audioPlayerRef.current.pause();
    };

    const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;

    // If hideControls is true and showWaveform is true, only show the waveform
    if (hideControls && showWaveform) {
      return (
        <div className="flex w-full items-center justify-center">
          <div ref={wavesurferContainerRef} className="w-full"></div>
        </div>
      );
    }

    return (
      <div className="flex w-full items-center gap-3 rounded-[6px] px-[14px] py-2" style={{ backgroundColor: '#f9fafb', border: '1px solid rgba(0,0,0,0.1)' }}>
        <div className="flex items-center gap-3">
          {!hideSeekButtons && (
            <AudioPlayerButton
              icon={<RiReplay5Line className="text-black-80 h-4 w-4" />}
              onClick={() =>
                handleSeek(
                  showWaveform
                    ? wavesurferCurrentTime - 5
                    : (audioPlayerRef?.current?.currentTime || 0) - 5
                )
              }
            />
          )}
          <div
            className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-full bg-[#4600F2]"
            onClick={togglePlayPause}
          >
            {(showWaveform && wavesurferIsPlaying) ||
            (!showWaveform &&
              audioPlayerRef.current &&
              !audioPlayerRef.current.paused) ? (
              <IoMdPause className="h-4 w-4 text-white" />
            ) : (
              <IoMdPlay className="h-4 w-4 text-white" />
            )}
          </div>
          {!hideSeekButtons && (
            <AudioPlayerButton
              icon={<RiForward5Line className="text-black-80 h-4 w-4" />}
              onClick={() =>
                handleSeek(
                  showWaveform
                    ? wavesurferCurrentTime + 5
                    : (audioPlayerRef?.current?.currentTime || 0) + 5
                )
              }
            />
          )}
        </div>
        <div className="text-sm font-normal tabular-nums text-black">
          <span>
            {formatTime(showWaveform ? wavesurferCurrentTime : progress)}
          </span>{' '}
          /{' '}
          <span>
            {formatTime(showWaveform ? wavesurferDuration : duration)}
          </span>
        </div>
        {showWaveform ? (
          <div 
            ref={wavesurferContainerRef} 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
          ></div>
        ) : (
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="relative h-1 flex-1 cursor-pointer overflow-hidden rounded-[200px] bg-black/10"
          >
            <div
              className="transition-width absolute left-0 top-0 h-full rounded-[200px] bg-[#4600F2] duration-100"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        )}
        {!showWaveform && (
          <audio ref={htmlAudioRef} style={{ display: 'none' }} />
        )}
        {!showWaveform && (
          <button
            className="relative flex cursor-pointer items-center justify-center"
            onClick={() => {
              if (showWaveform) {
                wavesurfer?.setVolume(volume === 0 ? 1 : 0);
                return;
              }
              setVolume(volume === 0 ? 100 : 0);
            }}
          >
            {volume === 0 ? (
              <MdVolumeOff className="h-[22px] w-[22px]" />
            ) : (
              <MdVolumeUp className="h-[22px] w-[22px]" />
            )}
          </button>
        )}
      </div>
    );
  }
);

AudioPlayer.displayName = 'AudioPlayer';

export default AudioPlayer;
