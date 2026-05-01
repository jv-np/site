import type { MouseEvent, ReactNode, Ref } from 'react';

type ShowcaseFrameProps = {
  label: string;
  hint: string;
  children: ReactNode;
  className?: string;
  rootRef?: Ref<HTMLDivElement>;
  stopClickPropagation?: boolean;
};

export function ShowcaseFrame({
  label,
  hint,
  children,
  className,
  rootRef,
  stopClickPropagation = false,
}: ShowcaseFrameProps) {
  const handleClick = stopClickPropagation
    ? (event: MouseEvent<HTMLDivElement>) => event.stopPropagation()
    : undefined;

  return (
    <div ref={rootRef} className={className} onClick={handleClick}>
      <div className="sc-preview">
        <span className="sc-dot" />
        <span className="sc-label">{label}</span>
        <span className="sc-hint mono">{hint}</span>
      </div>
      <div className="sc-full">
        {children}
      </div>
    </div>
  );
}