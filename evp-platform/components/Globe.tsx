export default function Globe() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="26" cy="35" r="18" stroke="currentColor" strokeWidth="2" />
      <ellipse cx="26" cy="35" rx="7.4" ry="18" stroke="currentColor" strokeWidth="1.15" />
      <path d="M9 29h34M9 41h34M26 17v36" stroke="currentColor" strokeWidth="1.15" />
      <path d="M39 23l6-5" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 2.5" />
      <g transform="translate(43 5) rotate(35) scale(0.78)" fill="currentColor" stroke="none">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
      </g>
    </svg>
  );
}
