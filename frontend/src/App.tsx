import { useEffect, useRef } from "react";
import { annotate } from "rough-notation";
import rough from "roughjs";

const values = [10, 20, 30, 40];
const BOX = 70;

export default function App() {
  const svgRef = useRef<SVGSVGElement>(null);
  const zeroRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const svg = svgRef.current!;
    svg.replaceChildren();
    const rc = rough.svg(svg);
    values.forEach((_, i) => {
      svg.appendChild(
        rc.rectangle(10 + i * (BOX + 10), 10, BOX, BOX, {
          roughness: 1.6,
          stroke: "#1f2937",
          strokeWidth: 2,
          seed: i + 1,
        }),
      );
    });

    const circle = annotate(zeroRef.current!, {
      type: "circle",
      color: "#e11d48",
      padding: 8,
    });
    const t = setTimeout(() => circle.show(), 600);

    return () => {
      clearTimeout(t);
      circle.remove();
    };
  }, []);

  return (
    <main className="mx-auto max-w-3xl p-10 font-hand">
      <h1 className="mb-6 text-4xl">Array అంటే ఏమిటి?</h1>
      <div
        className="relative"
        style={{ width: values.length * (BOX + 10) + 20, height: 140 }}
      >
        <svg ref={svgRef} className="absolute inset-0 h-full w-full" />
        {values.map((v, i) => (
          <div
            key={v}
            className="absolute flex flex-col items-center text-2xl"
            style={{ left: 10 + i * (BOX + 10), top: 10, width: BOX }}
          >
            <span className="flex h-[70px] items-center">{v}</span>
            <span
              ref={i === 0 ? zeroRef : undefined}
              className="mt-2 text-lg text-rose-600"
            >
              index {i}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xl">
        ప్రతి box కి ఒక index ఉంటుంది — इसे index कहते हैं!
      </p>
    </main>
  );
}
