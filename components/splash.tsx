import { ChromeSparkle, Logo } from "@/components/art/art";

const SPLASH_ID = "splash";
const SEEN_KEY = "rf-splash-seen";

/**
 * Start-up screen: the logo pops in with a gloss sweep, then the whole thing fades away
 * (about 1 second, all CSS, see .splash in globals.css). Once per app launch: the script
 * hides it before first paint if it already played in this session, so moving between
 * pages or reloading never shows it again. It never blocks taps (pointer-events: none).
 */
export function Splash() {
  return (
    <>
      <div id={SPLASH_ID} aria-hidden className="splash" suppressHydrationWarning>
        <div className="splash-logo">
          <Logo size={128} />
          <ChromeSparkle size={22} className="splash-sparkle absolute -top-2 -right-3" />
          <ChromeSparkle size={14} className="splash-sparkle absolute -bottom-1 -left-3 [animation-delay:380ms]" />
        </div>
        <p className="wordmark splash-word text-[34px]">reydiantfinds</p>
      </div>
      <script
        dangerouslySetInnerHTML={{
          // Hides with an attribute rather than removing the node, so React hydration still matches.
          __html: `(function(){try{var s=document.getElementById(${JSON.stringify(SPLASH_ID)});if(!s)return;var k=${JSON.stringify(SEEN_KEY)};if(sessionStorage.getItem(k)){s.dataset.done="";return}sessionStorage.setItem(k,"1");setTimeout(function(){s.dataset.done=""},1400)}catch(e){}})();`,
        }}
      />
    </>
  );
}
