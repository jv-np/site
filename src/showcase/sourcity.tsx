import { useEffect, useRef } from 'react';
import videoUrl from '../assets/sourcity-on-sourcity.mp4';
import { ShowcaseFrame } from './ShowcaseFrame';

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
    <ShowcaseFrame
      rootRef={rootRef}
      className="sc"
      label="sourcity-on-sourcity.mp4"
      hint="▶ expand to play"
      stopClickPropagation
    >
      <video
        ref={videoRef}
        className="sc-video"
        src={videoUrl}
        controls
        preload="none"
        playsInline
        onClick={(event) => event.stopPropagation()}
      />
      <div className="sc-cap mono">
        <span className="sc-ps1">$</span>
        <span># rendered from sourcity using OBS</span>
      </div>
    </ShowcaseFrame>
  );
}
