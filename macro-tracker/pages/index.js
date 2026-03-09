import { useState, useEffect } from "react";

const STORAGE_KEY = "macro-tracker-data";

const PRESET_FOODS = [
  { name: "Chicken Breast (100g)", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: "Brown Rice (100g)", calories: 216, protein: 5, carbs: 45, fat: 1.8 },
  { name: "Egg (large)", calories: 78, protein: 6, carbs: 0.6, fat: 5 },
  { name: "Banana (medium)", calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { name: "Greek Yogurt (100g)", calories: 59, protein: 10, carbs: 3.6, fat: 0.4 },
  { name: "Oats (100g)", calories: 389, protein: 17, carbs: 66, fat: 7 },
  { name: "Salmon (100g)", calories: 208, protein: 20, carbs: 0, fat: 13 },
  { name: "Avocado (100g)", calories: 160, protein: 2, carbs: 9, fat: 15 },
  { name: "Sweet Potato (100g)", calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  { name: "Almonds (30g)", calories: 173, protein: 6, carbs: 6, fat: 15 },
  { name: "Flank Steak (100g)", calories: 192, protein: 27, carbs: 0, fat: 9 },
];

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];
const todayKey = () => new Date().toISOString().split("T")[0];
const emptyGoals = { calories: 2000, protein: 150, carbs: 200, fat: 65 };

const inputStyle = {
  width: "100%",
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: 10,
  padding: "10px 12px",
  color: "#e0e0e0",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const MacroBar = ({ label, value, goal, color }) => {
  const pct = Math.min((value / goal) * 100, 100);
  const over = value > goal;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#888" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: over ? "#ff6b6b" : "#e0e0e0" }}>
          {Math.round(value)}<span style={{ color: "#555", fontWeight: 400 }}>/{goal}{label === "Calories" ? "" : "g"}</span>
        </span>
      </div>
      <div style={{ height: 8, background: "#1e1e1e", borderRadius: 999, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 999,
          background: over ? "#ff6b6b" : color,
          transition: "width 0.5s cubic-bezier(.4,0,.2,1)",
          boxShadow: over ? "0 0 8px #ff6b6b88" : `0 0 8px ${color}66`,
        }} />
      </div>
    </div>
  );
};

export default function MacroTracker() {
  const [tab, setTab] = useState("log");
  const [goals, setGoals] = useState(emptyGoals);
  const [entries, setEntries] = useState({});
  const [form, setForm] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "", meal: "Breakfast", qty: 1 });
  const [searchQuery, setSearchQuery] = useState("");
  const [showPresets, setShowPresets] = useState(false);
  const [editGoals, setEditGoals] = useState(false);
  const [goalDraft, setGoalDraft] = useState(emptyGoals);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [toast, setToast] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const d = JSON.parse(stored);
        if (d.goals) setGoals(d.goals);
        if (d.entries) setEntries(d.entries);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ goals, entries }));
    } catch {}
  }, [goals, entries, mounted]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const dayEntries = entries[selectedDate] || [];
  const totals = dayEntries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories * e.qty,
      protein: acc.protein + e.protein * e.qty,
      carbs: acc.carbs + e.carbs * e.qty,
      fat: acc.fat + e.fat * e.qty,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const addEntry = () => {
    if (!form.name || !form.calories) return;
    const entry = {
      id: Date.now(),
      name: form.name,
      calories: parseFloat(form.calories) || 0,
      protein: parseFloat(form.protein) || 0,
      carbs: parseFloat(form.carbs) || 0,
      fat: parseFloat(form.fat) || 0,
      meal: form.meal,
      qty: parseFloat(form.qty) || 1,
    };
    setEntries((prev) => ({ ...prev, [selectedDate]: [...(prev[selectedDate] || []), entry] }));
    setForm({ name: "", calories: "", protein: "", carbs: "", fat: "", meal: form.meal, qty: 1 });
    setSearchQuery("");
    showToast(`✓ Added ${entry.name}`);
  };

  const removeEntry = (id) => {
    setEntries((prev) => ({ ...prev, [selectedDate]: (prev[selectedDate] || []).filter((e) => e.id !== id) }));
  };

  const selectPreset = (p) => {
    setForm((f) => ({ ...f, name: p.name, calories: p.calories, protein: p.protein, carbs: p.carbs, fat: p.fat }));
    setShowPresets(false);
    setSearchQuery("");
  };

  const saveGoals = () => {
    setGoals(goalDraft);
    setEditGoals(false);
    showToast("Goals updated!");
  };

  const mealGroups = MEAL_TYPES.map((m) => ({
    meal: m,
    items: dayEntries.filter((e) => e.meal === m),
  })).filter((g) => g.items.length > 0);

  const filtered = PRESET_FOODS.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const caloriesLeft = goals.calories - totals.calories;
  const ringPct = Math.min((totals.calories / goals.calories) * 100, 100);

  if (!mounted) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: "#e0e0e0", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto", position: "relative" }}>
      {toast && (
        <div style={{ position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)", background: "#1a2e1a", color: "#7cfc7c", border: "1px solid #2a4a2a", padding: "10px 22px", borderRadius: 99, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: "nowrap", boxShadow: "0 4px 24px #0008" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: "28px 24px 0", borderBottom: "1px solid #1e1e1e" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#555", marginBottom: 2 }}>Daily Tracker</div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, color: "#fff" }}>Macros</div>
          </div>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#aaa", borderRadius: 10, padding: "7px 12px", fontSize: 13, cursor: "pointer" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "22px 0 20px" }}>
          <div style={{ position: "relative", width: 90, height: 90, flexShrink: 0 }}>
            <svg width={90} height={90} viewBox="0 0 90 90">
              <circle cx={45} cy={45} r={38} fill="none" stroke="#1e1e1e" strokeWidth={8} />
              <circle cx={45} cy={45} r={38} fill="none" stroke={totals.calories > goals.calories ? "#ff6b6b" : "#a8ff78"} strokeWidth={8} strokeDasharray={`${(ringPct / 100) * 2 * Math.PI * 38} ${2 * Math.PI * 38}`} strokeDashoffset={2 * Math.PI * 38 * 0.25} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.6s cubic-bezier(.4,0,.2,1)", filter: "drop-shadow(0 0 6px #a8ff7888)" }} />
            </svg>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{Math.round(totals.calories)}</div>
              <div style={{ fontSize: 9, color: "#555", letterSpacing: 1 }}>kcal</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <MacroBar label="Calories" value={totals.calories} goal={goals.calories} color="#a8ff78" />
            <MacroBar label="Protein" value={totals.protein} goal={goals.protein} color="#60c8ff" />
            <MacroBar label="Carbs" value={totals.carbs} goal={goals.carbs} color="#ffcc60" />
            <MacroBar label="Fat" value={totals.fat} goal={goals.fat} color="#ff8c60" />
          </div>
        </div>

        <div style={{ display: "flex", gap: 2, marginBottom: -1 }}>
          {["log", "add", "goals"].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "9px 18px", background: "none", border: "none", borderBottom: tab === t ? "2px solid #a8ff78" : "2px solid transparent", color: tab === t ? "#a8ff78" : "#555", fontWeight: 700, fontSize: 13, textTransform: "capitalize", cursor: "pointer", letterSpacing: 0.5 }}>
              {t === "log" ? "Today's Log" : t === "add" ? "+ Add Food" : "⚙ Goals"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "20px 20px 100px", overflowY: "auto" }}>

        {/* LOG TAB */}
        {tab === "log" && (
          <div>
            {dayEntries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#444" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🥗</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>No meals logged yet</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Tap &quot;+ Add Food&quot; to get started</div>
              </div>
            ) : (
              <>
                {mealGroups.map(({ meal, items }) => (
                  <div key={meal} style={{ marginBottom: 22 }}>
                    <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: 10, fontWeight: 700 }}>{meal}</div>
                    {items.map((e) => (
                      <div key={e.id} style={{ background: "#161616", border: "1px solid #222", borderRadius: 14, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", marginBottom: 3 }}>
                            {e.name} {e.qty !== 1 && <span style={{ color: "#555", fontWeight: 400 }}>×{e.qty}</span>}
                          </div>
                          <div style={{ display: "flex", gap: 10, fontSize: 12 }}>
                            <span style={{ color: "#a8ff78" }}>{Math.round(e.calories * e.qty)} cal</span>
                            <span style={{ color: "#60c8ff" }}>P {Math.round(e.protein * e.qty)}g</span>
                            <span style={{ color: "#ffcc60" }}>C {Math.round(e.carbs * e.qty)}g</span>
                            <span style={{ color: "#ff8c60" }}>F {Math.round(e.fat * e.qty)}g</span>
                          </div>
                        </div>
                        <button onClick={() => removeEntry(e.id)} style={{ background: "none", border: "none", color: "#333", fontSize: 18, cursor: "pointer", padding: "4px 8px", borderRadius: 8 }}
                          onMouseOver={(ev) => (ev.target.style.color = "#ff6b6b")}
                          onMouseOut={(ev) => (ev.target.style.color = "#333")}>×</button>
                      </div>
                    ))}
                  </div>
                ))}
                <div style={{ background: "#161616", border: "1px solid #2a2a2a", borderRadius: 16, padding: 16, marginTop: 8 }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: 12, fontWeight: 700 }}>Daily Total</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                    {[
                      { label: "Calories", val: totals.calories, color: "#a8ff78", unit: "" },
                      { label: "Protein", val: totals.protein, color: "#60c8ff", unit: "g" },
                      { label: "Carbs", val: totals.carbs, color: "#ffcc60", unit: "g" },
                      { label: "Fat", val: totals.fat, color: "#ff8c60", unit: "g" },
                    ].map((m) => (
                      <div key={m.label} style={{ textAlign: "center", background: "#1a1a1a", borderRadius: 12, padding: "10px 4px" }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{Math.round(m.val)}{m.unit}</div>
                        <div style={{ fontSize: 10, color: "#555", marginTop: 2, letterSpacing: 1 }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, fontSize: 13, color: caloriesLeft >= 0 ? "#7cfc7c" : "#ff6b6b", fontWeight: 600, textAlign: "center" }}>
                    {caloriesLeft >= 0 ? `${Math.round(caloriesLeft)} calories remaining` : `${Math.round(Math.abs(caloriesLeft))} calories over goal`}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ADD TAB */}
        {tab === "add" && (
          <div>
            <div style={{ marginBottom: 16, position: "relative" }}>
              <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: 8, fontWeight: 700 }}>Quick Add from Library</div>
              <input placeholder="Search foods..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setShowPresets(true); }} onFocus={() => setShowPresets(true)} style={{ width: "100%", background: "#161616", border: "1px solid #2a2a2a", borderRadius: 12, padding: "11px 14px", color: "#e0e0e0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              {showPresets && searchQuery && filtered.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, boxShadow: "0 8px 32px #000a", overflow: "hidden", marginTop: 4 }}>
                  {filtered.slice(0, 6).map((p) => (
                    <button key={p.name} onClick={() => selectPreset(p)} style={{ display: "block", width: "100%", background: "none", border: "none", padding: "11px 14px", textAlign: "left", cursor: "pointer", color: "#e0e0e0", borderBottom: "1px solid #222" }}
                      onMouseOver={(e) => (e.currentTarget.style.background = "#222")}
                      onMouseOut={(e) => (e.currentTarget.style.background = "none")}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{p.calories} cal · P {p.protein}g · C {p.carbs}g · F {p.fat}g</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: "#161616", border: "1px solid #222", borderRadius: 16, padding: 18 }}>
              <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: 14, fontWeight: 700 }}>Manual Entry</div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: "#555", display: "block", marginBottom: 5, letterSpacing: 1, textTransform: "uppercase" }}>Food Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Grilled Chicken" style={inputStyle} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                {[{ key: "calories", label: "Calories *", placeholder: "e.g. 200" }, { key: "qty", label: "Servings", placeholder: "1" }].map((f) => (
                  <div key={f.key}>
                    <label style={{ fontSize: 11, color: "#555", display: "block", marginBottom: 5, letterSpacing: 1, textTransform: "uppercase" }}>{f.label}</label>
                    <input type="number" min="0" placeholder={f.placeholder} value={form[f.key]} onChange={(e) => setForm((fv) => ({ ...fv, [f.key]: e.target.value }))} style={inputStyle} />
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                {[{ key: "protein", label: "Protein (g)", color: "#60c8ff" }, { key: "carbs", label: "Carbs (g)", color: "#ffcc60" }, { key: "fat", label: "Fat (g)", color: "#ff8c60" }].map((f) => (
                  <div key={f.key}>
                    <label style={{ fontSize: 11, color: f.color, display: "block", marginBottom: 5, letterSpacing: 1, textTransform: "uppercase" }}>{f.label}</label>
                    <input type="number" min="0" placeholder="0" value={form[f.key]} onChange={(e) => setForm((fv) => ({ ...fv, [f.key]: e.target.value }))} style={inputStyle} />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: "#555", display: "block", marginBottom: 5, letterSpacing: 1, textTransform: "uppercase" }}>Meal</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                  {MEAL_TYPES.map((m) => (
                    <button key={m} onClick={() => setForm((f) => ({ ...f, meal: m }))} style={{ padding: "8px 4px", borderRadius: 10, fontSize: 11, fontWeight: 700, border: form.meal === m ? "2px solid #a8ff78" : "2px solid #2a2a2a", background: form.meal === m ? "#1a2e1a" : "#1a1a1a", color: form.meal === m ? "#a8ff78" : "#555", cursor: "pointer" }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {form.calories && (
                <div style={{ background: "#1a1a1a", borderRadius: 10, padding: 10, marginBottom: 14, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "#a8ff78" }}>{Math.round(parseFloat(form.calories || 0) * parseFloat(form.qty || 1))} cal</span>
                  <span style={{ fontSize: 12, color: "#60c8ff" }}>P {Math.round(parseFloat(form.protein || 0) * parseFloat(form.qty || 1))}g</span>
                  <span style={{ fontSize: 12, color: "#ffcc60" }}>C {Math.round(parseFloat(form.carbs || 0) * parseFloat(form.qty || 1))}g</span>
                  <span style={{ fontSize: 12, color: "#ff8c60" }}>F {Math.round(parseFloat(form.fat || 0) * parseFloat(form.qty || 1))}g</span>
                </div>
              )}

              <button onClick={addEntry} disabled={!form.name || !form.calories} style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: form.name && form.calories ? "#a8ff78" : "#1e1e1e", color: form.name && form.calories ? "#111" : "#333", fontWeight: 800, fontSize: 15, cursor: form.name && form.calories ? "pointer" : "default" }}>
                Add to {form.meal}
              </button>
            </div>
          </div>
        )}

        {/* GOALS TAB */}
        {tab === "goals" && (
          <div>
            {!editGoals ? (
              <>
                <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: 14, fontWeight: 700 }}>Your Daily Goals</div>
                {[
                  { label: "Calories", key: "calories", color: "#a8ff78", unit: "kcal" },
                  { label: "Protein", key: "protein", color: "#60c8ff", unit: "g" },
                  { label: "Carbs", key: "carbs", color: "#ffcc60", unit: "g" },
                  { label: "Fat", key: "fat", color: "#ff8c60", unit: "g" },
                ].map((g) => (
                  <div key={g.key} style={{ background: "#161616", border: "1px solid #222", borderRadius: 14, padding: "14px 18px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 12, color: "#555", letterSpacing: 1, textTransform: "uppercase" }}>{g.label}</div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: g.color }}>{goals[g.key]}<span style={{ fontSize: 14, fontWeight: 400, color: "#444" }}> {g.unit}</span></div>
                    </div>
                    <div style={{ fontSize: 13, textAlign: "right" }}>
                      <div style={{ color: totals[g.key] > goals[g.key] ? "#ff6b6b" : "#555" }}>{Math.round(totals[g.key])} used</div>
                      <div style={{ color: goals[g.key] - totals[g.key] >= 0 ? "#7cfc7c" : "#ff6b6b", fontWeight: 600 }}>{Math.round(goals[g.key] - totals[g.key])} left</div>
                    </div>
                  </div>
                ))}
                <button onClick={() => { setGoalDraft({ ...goals }); setEditGoals(true); }} style={{ width: "100%", marginTop: 8, padding: "13px", borderRadius: 12, border: "1px solid #2a2a2a", background: "#161616", color: "#e0e0e0", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Edit Goals
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: 14, fontWeight: 700 }}>Set Daily Goals</div>
                {[
                  { label: "Daily Calories", key: "calories", color: "#a8ff78", unit: "kcal" },
                  { label: "Protein", key: "protein", color: "#60c8ff", unit: "g" },
                  { label: "Carbohydrates", key: "carbs", color: "#ffcc60", unit: "g" },
                  { label: "Fat", key: "fat", color: "#ff8c60", unit: "g" },
                ].map((g) => (
                  <div key={g.key} style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, color: g.color, display: "block", marginBottom: 5, letterSpacing: 1, textTransform: "uppercase" }}>{g.label} ({g.unit})</label>
                    <input type="number" min="0" value={goalDraft[g.key]} onChange={(e) => setGoalDraft((d) => ({ ...d, [g.key]: parseFloat(e.target.value) || 0 }))} style={{ ...inputStyle, borderColor: g.color + "44" }} />
                  </div>
                ))}
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button onClick={() => setEditGoals(false)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid #2a2a2a", background: "#161616", color: "#777", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                  <button onClick={saveGoals} style={{ flex: 2, padding: "12px", borderRadius: 12, border: "none", background: "#a8ff78", color: "#111", fontWeight: 800, cursor: "pointer" }}>Save Goals</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
