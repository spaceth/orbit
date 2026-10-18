export function SpaceTHLogo() {
  return (
    <div className="fixed top-0 left-1/2 z-30 flex h-14 w-40 -translate-x-1/2 items-start justify-center pt-5">
      <a
        href="https://spaceth.co"
        target="_blank"
        rel="noopener noreferrer"
        className="transition-opacity duration-300"
      >
        <img src="/spaceth-dark.svg" alt="SpaceTH" className="h-[14.4px] w-auto sm:h-[18px]" />
      </a>
    </div>
  );
}
