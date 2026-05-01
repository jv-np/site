
import { useEffect, useRef } from 'react';
import videoUrl from '../assets/sourcity-on-sourcity.mp4';

export default function Sourcity() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // pause playback whenever the parent card collapses, so audio/video
  // doesn't keep running inside a hidden element.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const card = root.closest<HTMLElement>('.card');
    if (!card) return;

    const stop = () => {
      const v = videoRef.current;
      if (v && !v.paused) v.pause();
    };

    const obs = new MutationObserver(() => {
      if (!card.classList.contains('card-expanded')) stop();
    });
    obs.observe(card, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="sc" onClick={(e) => e.stopPropagation()}>
      {/* compact preview shown when card is collapsed */}
      <div className="sc-preview">
        <span className="sc-dot" />
        <span className="sc-label">sourcity-on-sourcity.mp4</span>
        <span className="sc-hint mono">▶ expand to play</span>
      </div>

      {/* full player shown only when card is expanded.
          preload="none" → zero network until the user actually hits play. */}
      <div className="sc-full">
        <video
          ref={videoRef}
          className="sc-video"
          src={videoUrl}
          controls
          preload="none"
          playsInline
          onClick={(e) => e.stopPropagation()}
        />
        <div className="sc-cap mono">
          <span className="sc-ps1">$</span>
          <span># rendered from sourcity using OBS</span>
        </div>
      </div>
    </div>
  );
}
