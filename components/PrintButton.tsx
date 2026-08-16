"use client";
export default function PrintButton({ label = "Print / Save as PDF" }: { label?: string }) {
  return (
    <button className="btn" onClick={() => window.print()} type="button">
      {label}
    </button>
  );
}
