/** Runs before paint so the first frame matches macOS / system appearance. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("orbit-theme");var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var n=t==="dark"||(t!=="light"&&d);document.documentElement.classList.toggle("dark",n);document.documentElement.style.colorScheme=n?"dark":"light"}catch(e){}})();`;
