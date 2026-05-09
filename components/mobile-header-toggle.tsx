type MobileHeaderToggleProps = {
  isOpen: boolean;
};

export default function MobileHeaderToggle({ isOpen }: MobileHeaderToggleProps) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" aria-hidden="true">
      {isOpen ? (
        <path d="m6 6 12 12M18 6 6 18" strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        <>
          <path d="M4 7h16" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M4 12h16" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M10 17h10" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
