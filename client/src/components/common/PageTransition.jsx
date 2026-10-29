import { usePageTransition } from '../../context/PageTransitionContext';

export default function PageTransition() {
  const { transitionClass, pageTitle } = usePageTransition();

  return (
    <div
      className={`page-transition-overlay ${transitionClass}`}
      aria-hidden="true"
    >
      <div className="transition-content">
        <img src="/images/logo_bg_remove.png" alt="CIW Logo" />
        <h2 className="transition-title">{pageTitle}</h2>
      </div>
    </div>
  );
}
