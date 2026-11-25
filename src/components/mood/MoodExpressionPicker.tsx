"use client";

import { MOOD_DEFINITIONS, type CatMood } from "@/lib/mock-mood";

/** Ilustrasi ekspresi wajah kucing (SVG) untuk masing-masing dari 4 suasana hati. */
export function MoodFaceIcon({ mood, size = 44 }: { mood: CatMood; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-label={`Ekspresi ${mood}`}
      className="shrink-0"
    >
      {/* Telinga: tegak saat senang/lapar, agak turun saat bosan/ngantuk/badmood */}
      {mood === "bosan" || mood === "ngantuk" || mood === "badmood" ? (
        <>
          <polygon points="8,24 22,14 20,30" fill="#f4b673" stroke="#b45309" strokeWidth="2" strokeLinejoin="round" />
          <polygon points="56,24 42,14 44,30" fill="#f4b673" stroke="#b45309" strokeWidth="2" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <polygon points="12,10 25,18 15,28" fill="#f4b673" stroke="#b45309" strokeWidth="2" strokeLinejoin="round" />
          <polygon points="52,10 39,18 49,28" fill="#f4b673" stroke="#b45309" strokeWidth="2" strokeLinejoin="round" />
        </>
      )}

      {/* Kepala bulat */}
      <circle cx="32" cy="36" r="20" fill="#f4b673" stroke="#b45309" strokeWidth="2" />

      {/* Pipi merona saat senang */}
      {mood === "senang" && (
        <>
          <ellipse cx="19" cy="39" rx="3.5" ry="2" fill="#fb7185" opacity="0.65" />
          <ellipse cx="45" cy="39" rx="3.5" ry="2" fill="#fb7185" opacity="0.65" />
        </>
      )}

      {/* Mata sesuai suasana hati */}
      {mood === "senang" && (
        <>
          <path d="M21 34 Q24 29 27 34" stroke="#292524" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M37 34 Q40 29 43 34" stroke="#292524" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      )}
      {mood === "lapar" && (
        <>
          <circle cx="24" cy="33" r="3.6" fill="#292524" />
          <circle cx="25.2" cy="31.8" r="1.2" fill="#ffffff" />
          <circle cx="40" cy="33" r="3.6" fill="#292524" />
          <circle cx="41.2" cy="31.8" r="1.2" fill="#ffffff" />
        </>
      )}
      {mood === "bosan" && (
        <>
          <line x1="20" y1="32" x2="28" y2="33" stroke="#292524" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="24" cy="35" r="2.2" fill="#292524" />
          <line x1="36" y1="33" x2="44" y2="32" stroke="#292524" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="40" cy="35" r="2.2" fill="#292524" />
        </>
      )}
      {mood === "ngantuk" && (
        <>
          <path d="M20 34 Q24 37 28 34" stroke="#292524" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M36 34 Q40 37 44 34" stroke="#292524" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <text x="47" y="18" fontSize="9" fontWeight="bold" fill="#6366f1">
            Zzz
          </text>
        </>
      )}
      {mood === "badmood" && (
        <>
          <line x1="19" y1="29" x2="28" y2="33" stroke="#7f1d1d" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="24" cy="35" r="2.4" fill="#292524" />
          <line x1="45" y1="29" x2="36" y2="33" stroke="#7f1d1d" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="40" cy="35" r="2.4" fill="#292524" />
          <text x="46" y="21" fontSize="10" fontWeight="bold" fill="#e11d48">
            💢
          </text>
        </>
      )}

      {/* Hidung & mulut */}
      <polygon points="30,38 34,38 32,40.5" fill="#e88a9a" />
      {mood === "lapar" ? (
        <>
          <path d="M28 43 Q32 46 36 43" stroke="#292524" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M34 44 Q37 47 38 43" fill="#fb7185" />
        </>
      ) : mood === "bosan" || mood === "badmood" ? (
        <path d="M27 45 Q32 40.5 37 45" stroke="#292524" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M27 42 Q29.5 45 32 42 Q34.5 45 37 42" stroke="#292524" strokeWidth="2" strokeLinecap="round" fill="none" />
      )}
    </svg>
  );
}

/** Komponen kartu & pemilih ekspresi empat suasana hati (senang, lapar, bosan, ngantuk). */
export default function MoodExpressionPicker({
  activeMood,
  moodOverride,
  onSelectMood,
}: {
  activeMood: CatMood;
  moodOverride: CatMood | null;
  onSelectMood: (mood: CatMood | null) => void;
}) {
  const currentDef = MOOD_DEFINITIONS[activeMood];

  return (
    <div className="space-y-2.5">
      {/* Kartu detail ekspresi aktif */}
      <div className="flex items-center gap-3 rounded-2xl bg-amber-50/90 p-3 text-xs text-stone-700">
        <MoodFaceIcon mood={activeMood} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-amber-950">{currentDef.label}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${currentDef.badgeColor}`}>
              {activeMood.toUpperCase()}
            </span>
          </div>
          <p className="mt-1 text-stone-600">• Ekspresi: {currentDef.expression}</p>
          <p className="text-stone-600">• Suara: &ldquo;{currentDef.sound}&rdquo;</p>
        </div>
      </div>

      {/* Grid 5 suasana hati */}
      <div>
        <div className="flex items-center justify-between text-xs text-stone-500">
          <span>Lima ekspresi suasana hati:</span>
          {moodOverride && (
            <button
              type="button"
              onClick={() => onSelectMood(null)}
              className="font-medium text-amber-700 underline"
            >
              Otomatis
            </button>
          )}
        </div>
        <div className="mt-1.5 grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Pilih suasana hati">
          {(Object.keys(MOOD_DEFINITIONS) as CatMood[]).map((m) => {
            const isSelected = activeMood === m;
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelectMood(moodOverride === m ? null : m)}
                className={`flex flex-col items-center gap-1 rounded-2xl border p-2 text-xs font-medium transition ${
                  isSelected
                    ? "border-amber-400 bg-amber-100/80 text-amber-950 shadow-sm"
                    : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                }`}
              >
                <MoodFaceIcon mood={m} size={34} />
                <span className="capitalize">{m}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
