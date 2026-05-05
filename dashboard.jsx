/* global React */
// Dungeon Tracker — generic fantasy combat dashboard
// Released as a non-commercial fan-made physical-game companion.
// Munchkin is a trademark of Steve Jackson Games. This tool is unofficial.
// Themeable via the `theme` prop: 'comic' | 'parchment' | 'flat'
// Renders inside a fixed artboard (width/height supplied by parent).

const { useState, useEffect, useRef, useMemo } = React;

// ────────────────────────────────────────────────────────────
// Game data
// ────────────────────────────────────────────────────────────
const RACES = [
  { id: 'human',    name: 'Human',    glyph: '👤', blurb: '+1 to Run Away. Boring but reliable.' },
  { id: 'elf',      name: 'Elf',      glyph: '🏹', blurb: '+1 level for helping. Smug about it.' },
  { id: 'dwarf',    name: 'Dwarf',    glyph: '⛏️', blurb: 'Carry any number of Big items.' },
  { id: 'halfling', name: 'Halfling', glyph: '🍞', blurb: 'Sell one item for double price.' },
];

const CLASSES = [
  { id: 'warrior', name: 'Warrior', glyph: '⚔️', blurb: '+1 in combat. Win ties. Unsubtle.' },
  { id: 'wizard',  name: 'Wizard',  glyph: '🔮', blurb: 'Charm Monster. Discard hand to flee.' },
  { id: 'cleric',  name: 'Cleric',  glyph: '✝️', blurb: 'Turn Undead. Resurrect the discard pile.' },
  { id: 'thief',   name: 'Thief',   glyph: '🗡️', blurb: 'Steal a small item. Backstab for −2.' },
];

// User-built recent monster history (in-session). The card is the source of truth
// for monster names + abilities — we don't ship a library to avoid copying.
const PRESET_MONSTERS = [];

const GEAR_SLOTS = [
  { id: 'hand',     name: 'Hand',     icons: ['⚔️', '🗡️', '🏹', '🪄', '🔫', '🔨'] },
  { id: 'headgear', name: 'Headgear', icons: ['🪖', '👑', '🎩', '🧢'] },
  { id: 'armor',    name: 'Armor',    icons: ['🛡️', '🧥', '👕'] },
  { id: 'foot',     name: 'Foot',     icons: ['🥾', '👢'] },
  { id: 'other',    name: 'Other',    icons: ['🎒', '🧪', '💍', '🧑‍🌾', '📜', '✨'] },
];

const SNARK = [
  'Backstab somebody. They deserve it.',
  'Curse them. CURSE THEM.',
  'Trade now, regret never.',
  'Yes, Wizards count as a class.',
  'If you’re losing, accuse a friend of cheating.',
  'A door is a door. Kick it in.',
];

// ────────────────────────────────────────────────────────────
// Theme tokens — each theme defines its own palette + type
// ────────────────────────────────────────────────────────────
const THEMES = {
  comic: {
    name: 'Comic Crawl',
    bg: '#FFE96B',
    panel: '#FFFFFF',
    panelAlt: '#FFF5C2',
    ink: '#1A1A1A',
    inkSoft: '#3A3A3A',
    accent: '#E63946',
    accent2: '#3A86FF',
    accent3: '#06A77D',
    danger: '#E63946',
    border: '#1A1A1A',
    shadow: '6px 6px 0 #1A1A1A',
    shadowSm: '3px 3px 0 #1A1A1A',
    radius: '6px',
    fontDisplay: '"Bangers", "Bowlby One", system-ui, sans-serif',
    fontUI: '"Inter Tight", system-ui, sans-serif',
    fontMono: '"JetBrains Mono", monospace',
    pattern: 'comic',
  },
  parchment: {
    name: 'Vellum & Vermin',
    bg: '#1F1813',
    panel: '#F1E2C0',
    panelAlt: '#E5D2A8',
    ink: '#2A1810',
    inkSoft: '#5C4530',
    accent: '#8B0000',
    accent2: '#3A5A40',
    accent3: '#B8860B',
    danger: '#7A0F1A',
    border: '#3A2818',
    shadow: '0 8px 30px rgba(0,0,0,0.55), 0 0 0 1px #3A2818',
    shadowSm: '0 2px 6px rgba(0,0,0,0.4)',
    radius: '2px',
    fontDisplay: '"UnifrakturCook", "IM Fell English SC", serif',
    fontUI: '"IM Fell English", "EB Garamond", serif',
    fontMono: '"IM Fell English", serif',
    pattern: 'parchment',
  },
  flat: {
    name: 'Flat Pack',
    bg: '#F5F2EC',
    panel: '#FFFFFF',
    panelAlt: '#EDEAE3',
    ink: '#1B1B1F',
    inkSoft: '#5A5A66',
    accent: '#FF5A36',
    accent2: '#3D5AFE',
    accent3: '#00B894',
    danger: '#FF5A36',
    border: '#1B1B1F',
    shadow: '0 1px 0 rgba(27,27,31,0.06), 0 12px 28px -12px rgba(27,27,31,0.18)',
    shadowSm: '0 1px 0 rgba(27,27,31,0.06), 0 4px 10px -4px rgba(27,27,31,0.18)',
    radius: '14px',
    fontDisplay: '"Familjen Grotesk", "Space Grotesk", system-ui, sans-serif',
    fontUI: '"Inter Tight", system-ui, sans-serif',
    fontMono: '"JetBrains Mono", monospace',
    pattern: 'flat',
  },
};

// ────────────────────────────────────────────────────────────
// Hooks
// ────────────────────────────────────────────────────────────
function useTimer(running) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setT(x => x + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  return [t, () => setT(0)];
}

const fmtTime = (s) => {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
};

// ────────────────────────────────────────────────────────────
// Pattern backgrounds (decorative)
// ────────────────────────────────────────────────────────────
function ThemeBackdrop({ theme }) {
  if (theme.pattern === 'comic') {
    return (
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `radial-gradient(${theme.ink} 1.2px, transparent 1.6px)`,
        backgroundSize: '14px 14px',
        opacity: 0.08,
      }} />
    );
  }
  if (theme.pattern === 'parchment') {
    return (
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.45) 100%)',
        }} />
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.06 }}>
          <filter id="noise"><feTurbulence baseFrequency="0.9" /></filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      </div>
    );
  }
  return null;
}

// ────────────────────────────────────────────────────────────
// Reusable bits
// ────────────────────────────────────────────────────────────
function Panel({ theme, children, style, accent, title, right }) {
  return (
    <div style={{
      background: accent || theme.panel,
      border: `2px solid ${theme.border}`,
      borderRadius: theme.radius,
      boxShadow: theme.shadow,
      ...style,
    }}>
      {title && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 10,
          padding: '10px 16px',
          borderBottom: `2px solid ${theme.border}`,
          fontFamily: theme.fontDisplay,
          letterSpacing: theme.pattern === 'comic' ? '0.04em' : '0.06em',
          textTransform: theme.pattern === 'flat' ? 'none' : 'uppercase',
          fontSize: theme.pattern === 'comic' ? 22 : 16,
          color: theme.ink,
        }}>
          <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap' }}>{title}</span>
          {right && <span style={{ flexShrink: 0 }}>{right}</span>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

function IconBtn({ theme, children, onClick, danger, primary, style }) {
  const [hover, setHover] = useState(false);
  const bg = danger ? theme.danger : primary ? theme.accent2 : theme.panel;
  const fg = (danger || primary) ? '#fff' : theme.ink;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: bg,
        color: fg,
        border: `2px solid ${theme.border}`,
        borderRadius: theme.radius,
        padding: '6px 12px',
        fontFamily: theme.fontUI,
        fontWeight: 600,
        fontSize: 13,
        cursor: 'pointer',
        boxShadow: hover ? theme.shadowSm : 'none',
        transform: hover ? 'translate(-1px,-1px)' : 'none',
        transition: 'transform 0.08s, box-shadow 0.08s',
        ...style,
      }}
    >{children}</button>
  );
}

// ────────────────────────────────────────────────────────────
// Player Card
// ────────────────────────────────────────────────────────────
function PlayerCard({ theme, player, isActive, onChange, onRemove, onSetActive, density }) {
  const [editingName, setEditingName] = useState(false);
  const [showPicker, setShowPicker] = useState(null); // 'race' | 'class' | null
  const [customInput, setCustomInput] = useState('');
  const [showGearForm, setShowGearForm] = useState(false);

  const totalGear = player.gear.reduce((a, g) => a + g.bonus, 0);
  const total = player.level + totalGear;
  const won = player.level >= 10;

  const allRaces = [{ id: 'none', name: 'No Race', glyph: '—', blurb: 'Humans are basically no race.' }, ...RACES, ...(player.customRaces || [])];
  const allClasses = [{ id: 'none', name: 'No Class', glyph: '—', blurb: 'You are wearing pajamas.' }, ...CLASSES, ...(player.customClasses || [])];
  const race = allRaces.find(r => r.id === player.race) || allRaces[0];
  const cls = allClasses.find(c => c.id === player.class) || allClasses[0];

  const pad = density === 'compact' ? 12 : 16;
  const gearGap = density === 'compact' ? 4 : 6;

  return (
    <div style={{
      position: 'relative',
      background: isActive ? theme.panelAlt : theme.panel,
      border: `${isActive ? 3 : 2}px solid ${won ? theme.accent3 : isActive ? theme.accent : theme.border}`,
      borderRadius: theme.radius,
      boxShadow: isActive ? theme.shadow : theme.shadowSm,
      padding: pad,
      display: 'flex', flexDirection: 'column', gap: gearGap + 4,
      transition: 'all 0.15s',
      overflow: 'visible',
    }}>
      {/* Active flag */}
      {isActive && (
        <div style={{
          position: 'absolute', top: -14, left: 12,
          background: theme.accent, color: '#fff',
          fontFamily: theme.fontDisplay,
          fontSize: 13, padding: '3px 10px',
          border: `2px solid ${theme.border}`,
          borderRadius: theme.radius,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          zIndex: 2,
        }}>On Turn</div>
      )}
      {won && (
        <div style={{
          position: 'absolute', top: -14, right: 12,
          background: theme.accent3, color: '#fff',
          fontFamily: theme.fontDisplay, fontSize: 14, padding: '3px 10px',
          border: `2px solid ${theme.border}`, borderRadius: theme.radius,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>👑 Winner</div>
      )}

      {/* Name + remove */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: player.color,
          border: `2px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: theme.fontDisplay, color: '#fff', fontSize: 18,
          flexShrink: 0,
        }}>{player.name[0]?.toUpperCase()}</div>
        {editingName ? (
          <input
            autoFocus
            value={player.name}
            onChange={e => onChange({ ...player, name: e.target.value })}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
            style={{
              flex: 1, font: 'inherit',
              fontFamily: theme.fontDisplay, fontSize: 22,
              border: 'none', borderBottom: `2px dashed ${theme.border}`,
              background: 'transparent', color: theme.ink, padding: '2px 0',
              outline: 'none',
            }}
          />
        ) : (
          <div onClick={() => setEditingName(true)} style={{
            flex: 1,
            fontFamily: theme.fontDisplay, fontSize: 22,
            color: theme.ink, cursor: 'text', lineHeight: 1.05,
            letterSpacing: theme.pattern === 'comic' ? '0.02em' : 0,
          }}>{player.name}</div>
        )}
        <button onClick={onRemove} style={{
          background: 'transparent', border: 'none', color: theme.inkSoft,
          cursor: 'pointer', fontSize: 16, padding: 4, lineHeight: 1,
        }}>✕</button>
      </div>

      {/* Race / Class chips */}
      <div style={{ display: 'flex', gap: 6, position: 'relative' }}>
        <button onClick={() => setShowPicker(showPicker === 'race' ? null : 'race')} style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 6,
          background: theme.panelAlt,
          border: `2px solid ${theme.border}`,
          borderRadius: theme.radius,
          padding: '6px 10px',
          fontFamily: theme.fontUI, fontSize: 13, color: theme.ink,
          cursor: 'pointer', textAlign: 'left',
        }}>
          <span style={{ fontSize: 16 }}>{race.glyph}</span>
          <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: 1 }}>{race.name}</span>
          <span style={{ marginLeft: 'auto', opacity: 0.4, fontSize: 10 }}>▾</span>
        </button>
        <button onClick={() => setShowPicker(showPicker === 'class' ? null : 'class')} style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 6,
          background: theme.panelAlt,
          border: `2px solid ${theme.border}`,
          borderRadius: theme.radius,
          padding: '6px 10px',
          fontFamily: theme.fontUI, fontSize: 13, color: theme.ink,
          cursor: 'pointer', textAlign: 'left',
        }}>
          <span style={{ fontSize: 16 }}>{cls.glyph}</span>
          <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: 1 }}>{cls.name}</span>
          <span style={{ marginLeft: 'auto', opacity: 0.4, fontSize: 10 }}>▾</span>
        </button>

        {showPicker && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
            background: theme.panel,
            border: `2px solid ${theme.border}`,
            borderRadius: theme.radius,
            boxShadow: theme.shadow,
            padding: 6, zIndex: 10,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {(showPicker === 'race' ? allRaces : allClasses).map(opt => (
                <button key={opt.id} onClick={() => {
                  onChange({ ...player, [showPicker]: opt.id });
                  setShowPicker(null);
                }} style={{
                  background: player[showPicker] === opt.id ? theme.accent : theme.panelAlt,
                  color: player[showPicker] === opt.id ? '#fff' : theme.ink,
                  border: `1px solid ${theme.border}`,
                  borderRadius: theme.radius,
                  padding: '6px 8px',
                  fontFamily: theme.fontUI, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span>{opt.glyph}</span><span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.name}</span>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6, paddingTop: 6, borderTop: `1px dashed ${theme.border}55` }}>
              <input value={customInput} onChange={e => setCustomInput(e.target.value)}
                placeholder={`Custom ${showPicker}…`}
                onKeyDown={e => {
                  if (e.key === 'Enter' && customInput.trim()) {
                    const id = `custom-${Date.now()}`;
                    const entry = { id, name: customInput.trim(), glyph: '✨', blurb: 'Custom.' };
                    const key = showPicker === 'race' ? 'customRaces' : 'customClasses';
                    onChange({ ...player, [key]: [...(player[key] || []), entry], [showPicker]: id });
                    setCustomInput(''); setShowPicker(null);
                  }
                }}
                style={{ flex: 1, fontFamily: theme.fontUI, fontSize: 11,
                  border: `1px solid ${theme.border}`, borderRadius: theme.radius,
                  padding: '4px 6px', background: theme.panelAlt, color: theme.ink, outline: 'none' }}
              />
              <RandomBtn theme={theme} onClick={() => {
                setCustomInput(pick(showPicker === 'race' ? RANDOM_RACES : RANDOM_CLASSES));
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Stat Block: Level / Gear / Total */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        gap: 6, alignItems: 'stretch',
      }}>
        <StatBlock theme={theme} label="Level" value={player.level} max={10}
          onInc={() => onChange({ ...player, level: Math.min(10, player.level + 1) })}
          onDec={() => onChange({ ...player, level: Math.max(1, player.level - 1) })}
        />
        <StatBlock theme={theme} label="Gear" value={totalGear} readOnly
          accent={theme.accent2} />
        <StatBlock theme={theme} label="Power" value={total} readOnly
          accent={theme.accent3} big />
      </div>

      {/* Gear list */}
      <div style={{
        background: theme.panelAlt,
        border: `1.5px solid ${theme.border}`,
        borderRadius: theme.radius,
        padding: '6px 8px',
        display: 'flex', flexDirection: 'column', gap: gearGap,
        minHeight: 60,
      }}>
        {player.gear.length === 0 && (
          <div style={{
            fontFamily: theme.fontUI, fontSize: 11, color: theme.inkSoft,
            fontStyle: 'italic', textAlign: 'center', padding: '8px 0',
          }}>No gear. You’re basically naked.</div>
        )}
        {player.gear.map((g, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: theme.fontUI, fontSize: 12, color: theme.ink,
          }}>
            <span style={{ fontSize: 13 }}>{g.icon || '🎒'}</span>
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
            {g.slot && <span style={{ fontSize: 9, color: theme.inkSoft, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{g.slot}</span>}
            <span style={{
              fontFamily: theme.fontMono, fontWeight: 700,
              color: g.bonus >= 0 ? theme.accent3 : theme.danger,
            }}>{g.bonus >= 0 ? '+' : ''}{g.bonus}</span>
            <button onClick={() => onChange({
              ...player, gear: player.gear.filter((_, j) => j !== i)
            })} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: theme.inkSoft, fontSize: 12, padding: 0, lineHeight: 1,
            }}>✕</button>
          </div>
        ))}
        {!showGearForm ? (
          <button onClick={() => setShowGearForm(true)} style={{
            background: 'transparent', border: `1px dashed ${theme.border}`,
            borderRadius: theme.radius, padding: '4px',
            fontFamily: theme.fontUI, fontSize: 11, color: theme.inkSoft,
            cursor: 'pointer', marginTop: 2,
          }}>+ Add Gear</button>
        ) : (
          <GearForm theme={theme} onAdd={(g) => {
            onChange({ ...player, gear: [...player.gear, g] });
            setShowGearForm(false);
          }} onCancel={() => setShowGearForm(false)} />
        )}
      </div>

      <button onClick={onSetActive} style={{
        background: isActive ? theme.accent : 'transparent',
        color: isActive ? '#fff' : theme.ink,
        border: `2px solid ${theme.border}`,
        borderRadius: theme.radius,
        padding: '5px 10px',
        fontFamily: theme.fontUI, fontWeight: 600, fontSize: 11,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        cursor: 'pointer',
      }}>{isActive ? '★ active turn' : 'set active'}</button>
    </div>
  );
}

function GearForm({ theme, onAdd, onCancel }) {
  const [name, setName] = useState('');
  const [bonus, setBonus] = useState(1);
  const [slot, setSlot] = useState('hand');
  const [icon, setIcon] = useState(GEAR_SLOTS[0].icons[0]);
  const [customIcon, setCustomIcon] = useState('');

  const slotDef = GEAR_SLOTS.find(s => s.id === slot) || GEAR_SLOTS[0];

  return (
    <div style={{
      background: theme.panel, border: `1.5px solid ${theme.border}`,
      borderRadius: theme.radius, padding: 8, marginTop: 4,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', gap: 4 }}>
        <input value={name} onChange={e => setName(e.target.value)} autoFocus
          placeholder="Item name…"
          style={{ flex: 1, fontFamily: theme.fontUI, fontSize: 11,
            border: `1px solid ${theme.border}`, borderRadius: theme.radius,
            padding: '4px 6px', background: theme.panelAlt, color: theme.ink, outline: 'none' }}
        />
        <RandomBtn theme={theme} onClick={() => setName(pick(RANDOM_GEAR))} />
        <input type="number" value={bonus} onChange={e => setBonus(parseInt(e.target.value) || 0)}
          style={{ width: 40, fontFamily: theme.fontMono, fontSize: 11, fontWeight: 700,
            border: `1px solid ${theme.border}`, borderRadius: theme.radius,
            padding: '4px', background: theme.panelAlt, color: theme.ink, textAlign: 'center', outline: 'none' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {GEAR_SLOTS.map(s => (
          <button key={s.id} onClick={() => { setSlot(s.id); setIcon(s.icons[0]); setCustomIcon(''); }}
            style={{
              flex: '1 1 auto', fontSize: 9,
              background: slot === s.id ? theme.accent : theme.panelAlt,
              color: slot === s.id ? '#fff' : theme.ink,
              border: `1px solid ${theme.border}`, borderRadius: theme.radius,
              padding: '3px 6px', cursor: 'pointer',
              fontFamily: theme.fontUI, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>{s.name}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        {slotDef.icons.map(g => (
          <button key={g} onClick={() => { setIcon(g); setCustomIcon(''); }}
            style={{
              width: 24, height: 24, padding: 0,
              background: icon === g && !customIcon ? theme.accent : theme.panelAlt,
              border: `1px solid ${theme.border}`, borderRadius: theme.radius,
              cursor: 'pointer', fontSize: 13, lineHeight: 1,
            }}>{g}</button>
        ))}
        <input value={customIcon} onChange={e => { setCustomIcon(e.target.value); if (e.target.value) setIcon(e.target.value); }}
          placeholder="🎯"
          style={{ width: 32, textAlign: 'center', fontSize: 13,
            border: `1px dashed ${theme.border}`, borderRadius: theme.radius,
            padding: '2px', background: theme.panelAlt, color: theme.ink, outline: 'none' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={onCancel} style={{
          flex: 1, background: 'transparent', border: `1px solid ${theme.border}`,
          borderRadius: theme.radius, padding: '4px',
          fontFamily: theme.fontUI, fontSize: 10, color: theme.inkSoft,
          cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>Cancel</button>
        <button onClick={() => name.trim() && onAdd({
          name: name.trim(), bonus, slot: slotDef.name, icon: customIcon || icon,
        })} disabled={!name.trim()} style={{
          flex: 2, background: name.trim() ? theme.accent : theme.panelAlt,
          color: name.trim() ? '#fff' : theme.inkSoft,
          border: `1px solid ${theme.border}`, borderRadius: theme.radius,
          padding: '4px', cursor: name.trim() ? 'pointer' : 'not-allowed',
          fontFamily: theme.fontUI, fontWeight: 700, fontSize: 10,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>Add</button>
      </div>
    </div>
  );
}

function pickIcon(name) {
  const n = name.toLowerCase();
  if (/sword|blade|knife|dagger/.test(n)) return '⚔️';
  if (/bow|arrow/.test(n)) return '🏹';
  if (/shield|armor|mail/.test(n)) return '🛡️';
  if (/helm|hat|hood/.test(n)) return '🪖';
  if (/boot|shoe|sandal/.test(n)) return '🥾';
  if (/wand|staff|rod/.test(n)) return '🪄';
  if (/potion|elixir/.test(n)) return '🧪';
  if (/ring/.test(n)) return '💍';
  if (/cloak|cape/.test(n)) return '🧥';
  if (/hireling|servant/.test(n)) return '🧑‍🌾';
  return '🎒';
}

function StatBlock({ theme, label, value, max, onInc, onDec, readOnly, accent, big }) {
  return (
    <div style={{
      background: accent || theme.panel,
      border: `2px solid ${theme.border}`,
      borderRadius: theme.radius,
      padding: '6px 4px 4px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      color: accent ? '#fff' : theme.ink,
      minWidth: 0, overflow: 'hidden',
    }}>
      <div style={{
        fontFamily: theme.fontUI, fontSize: 9,
        textTransform: 'uppercase', letterSpacing: '0.12em',
        opacity: 0.85,
      }}>{label}</div>
      <div style={{
        fontFamily: theme.fontDisplay,
        fontSize: big ? 26 : 22,
        lineHeight: 1, marginTop: 2,
        whiteSpace: 'nowrap',
      }}>{value}{max && label === 'Level' ? <span style={{ fontSize: 12, opacity: 0.6 }}>/{max}</span> : null}</div>
      {!readOnly && (
        <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
          <button onClick={onDec} style={miniBtn(theme)}>−</button>
          <button onClick={onInc} style={miniBtn(theme)}>+</button>
        </div>
      )}
    </div>
  );
}

const miniBtn = (theme) => ({
  width: 22, height: 22,
  background: theme.panel, color: theme.ink,
  border: `1.5px solid ${theme.border}`,
  borderRadius: theme.radius,
  fontFamily: theme.fontDisplay, fontSize: 14, lineHeight: 1,
  cursor: 'pointer', padding: 0,
});

// ────────────────────────────────────────────────────────────
// Monster Panel (combat)
// ────────────────────────────────────────────────────────────
function MonsterPanel({ theme, monster, onChange, onClear, players, activePlayerId, onLog, onPlayerChange }) {
  const [showPicker, setShowPicker] = useState(false);
  const [showHelper, setShowHelper] = useState(false);
  const [showRun, setShowRun] = useState(false);
  const [showBadStuff, setShowBadStuff] = useState(false);
  const active = players.find(p => p.id === activePlayerId);
  const helperId = monster?.helperId;
  const helper = helperId ? players.find(p => p.id === helperId) : null;
  const helperPower = helper
    ? helper.level + helper.gear.reduce((a, g) => a + g.bonus, 0) + (helper.race === 'elf' ? 1 : 0)
    : 0;
  const playerPower = (active ? active.level + active.gear.reduce((a, g) => a + g.bonus, 0) : 0) + helperPower;
  const monsterPower = monster ? monster.level + (monster.bonus || 0) : 0;
  const winning = playerPower > monsterPower;

  if (!monster) {
    return (
      <Panel theme={theme} title="Combat" right={
        <button onClick={() => setShowPicker(true)} style={{
          background: theme.accent, color: '#fff',
          border: `2px solid ${theme.border}`, borderRadius: theme.radius,
          padding: '4px 12px', cursor: 'pointer',
          fontFamily: theme.fontUI, fontWeight: 700, fontSize: 12,
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>+ Kick Door</button>
      }>
        <div style={{
          padding: '24px 16px', textAlign: 'center',
          fontFamily: theme.fontUI, fontSize: 13, color: theme.inkSoft,
          fontStyle: 'italic',
        }}>
          The dungeon is suspiciously quiet. Kick down a door and start trouble.
        </div>
        {showPicker && <MonsterPicker theme={theme} onClose={() => setShowPicker(false)} onPick={(m) => {
          onChange(m); setShowPicker(false);
          onLog(`A ${m.name} (Lv ${m.level}) appears!`);
        }} />}
      </Panel>
    );
  }

  return (
    <Panel theme={theme} title="Combat" right={
      <span style={{
        fontFamily: theme.fontMono, fontSize: 11, fontWeight: 700,
        color: winning ? theme.accent3 : theme.danger,
        textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>{winning ? '▲ Winning' : '▼ Losing'}</span>
    }>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, padding: 14, alignItems: 'stretch' }}>
        {/* Player side */}
        <div style={{
          background: theme.panelAlt, border: `2px solid ${theme.border}`,
          borderRadius: theme.radius, padding: 10,
          display: 'flex', flexDirection: 'column', gap: 4,
          minHeight: 130,
        }}>
          <div style={{
            fontFamily: theme.fontUI, fontSize: 10,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: theme.inkSoft,
          }}>You</div>
          <div style={{ fontFamily: theme.fontDisplay, fontSize: 18, lineHeight: 1.1, color: theme.ink }}>
            {active ? active.name : '— pick a player —'}
            {helper && (
              <span style={{
                fontFamily: theme.fontUI, fontSize: 11, color: theme.accent2,
                marginLeft: 6, fontWeight: 700,
              }}>+ {helper.name}</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 'auto' }}>
            <div style={{
              fontFamily: theme.fontDisplay, fontSize: 36,
              color: winning ? theme.accent3 : theme.ink, lineHeight: 1,
            }}>{playerPower + (active?.combatBonus || 0)}</div>
            <span style={{ fontFamily: theme.fontUI, fontSize: 10, color: theme.inkSoft, lineHeight: 1.2 }}>
              Lv{active?.level || 0} + {active ? active.gear.reduce((a, g) => a + g.bonus, 0) : 0} gear
              {active?.combatBonus ? ` ${active.combatBonus >= 0 ? '+' : ''}${active.combatBonus}` : ''}
              {helper && <><br/>+ {helper.name} (Lv {helper.level}+{helper.gear.reduce((a,g)=>a+g.bonus,0)}{helper.race==='elf'?' +1':''})</>}
            </span>
            {active && (
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                <button onClick={() => onPlayerChange(active.id, { ...active, combatBonus: (active.combatBonus || 0) - 1 })} style={{
                  flex: 1, height: 22, padding: 0,
                  background: theme.panel, color: theme.ink,
                  border: `1.5px solid ${theme.border}`, borderRadius: theme.radius,
                  fontFamily: theme.fontDisplay, fontSize: 14, lineHeight: 1, cursor: 'pointer',
                }}>−</button>
                <button onClick={() => onPlayerChange(active.id, { ...active, combatBonus: (active.combatBonus || 0) + 1 })} style={{
                  flex: 1, height: 22, padding: 0,
                  background: theme.accent3, color: '#fff',
                  border: `1.5px solid ${theme.border}`, borderRadius: theme.radius,
                  fontFamily: theme.fontDisplay, fontSize: 14, lineHeight: 1, cursor: 'pointer',
                }}>+</button>
              </div>
            )}
          </div>
        </div>

        {/* VS */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: theme.fontDisplay, fontSize: 24,
          color: theme.accent,
          padding: '0 4px',
        }}>VS</div>

        {/* Monster side */}
        <div style={{
          background: theme.danger, color: '#fff',
          border: `2px solid ${theme.border}`,
          borderRadius: theme.radius, padding: 10,
          display: 'flex', flexDirection: 'column', gap: 4,
          position: 'relative',
          minHeight: 130,
        }}>
          <div style={{
            fontFamily: theme.fontUI, fontSize: 10,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            opacity: 0.85,
          }}>Monster</div>
          <div style={{ fontFamily: theme.fontDisplay, fontSize: 18, lineHeight: 1.1 }}>
            {monster.name}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 'auto' }}>
            <div style={{ fontFamily: theme.fontDisplay, fontSize: 36, lineHeight: 1 }}>{monsterPower}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => onChange({ ...monster, bonus: (monster.bonus || 0) - 1 })} style={{
                flex: 1, height: 22, padding: 0,
                background: 'rgba(255,255,255,0.15)', color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: theme.radius,
                fontFamily: theme.fontDisplay, fontSize: 14, lineHeight: 1, cursor: 'pointer',
              }}>−</button>
              <button onClick={() => onChange({ ...monster, bonus: (monster.bonus || 0) + 1 })} style={{
                flex: 1, height: 22, padding: 0,
                background: 'rgba(255,255,255,0.3)', color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: theme.radius,
                fontFamily: theme.fontDisplay, fontSize: 14, lineHeight: 1, cursor: 'pointer',
              }}>+</button>
            </div>
          </div>
        </div>
      </div>

      {monster.badStuff && (
        <div style={{
          margin: '0 14px 10px', padding: '8px 10px',
          background: theme.panelAlt,
          border: `2px dashed ${theme.danger}`,
          borderRadius: theme.radius,
          fontFamily: theme.fontUI, fontSize: 11, color: theme.ink, lineHeight: 1.35,
        }}>
          <span style={{
            fontFamily: theme.fontDisplay, fontSize: 11, color: theme.danger,
            textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: 6,
          }}>Bad Stuff:</span>
          {monster.badStuff}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, padding: '0 14px 14px', position: 'relative', alignItems: 'stretch' }}>
        <div style={{ position: 'relative', display: 'flex' }}>
          <IconBtn theme={theme} primary={!helper}
            onClick={() => setShowHelper(s => !s)}
            style={{ width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: helper ? theme.accent3 : undefined, color: helper ? '#fff' : undefined }}>
            {helper ? `✓ ${helper.name}` : '+ Get Help'}
          </IconBtn>
          {showHelper && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 0, marginBottom: 6,
              background: theme.panel, border: `2px solid ${theme.border}`,
              borderRadius: theme.radius, boxShadow: theme.shadow,
              padding: 6, zIndex: 20, minWidth: 180,
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{
                fontFamily: theme.fontUI, fontSize: 9, color: theme.inkSoft,
                textTransform: 'uppercase', letterSpacing: '0.1em', padding: '2px 4px',
              }}>Who helps?</div>
              {players.filter(p => p.id !== activePlayerId).length === 0 && (
                <div style={{ fontFamily: theme.fontUI, fontSize: 11, color: theme.inkSoft,
                  fontStyle: 'italic', padding: '6px 4px' }}>No one else to ask. Awkward.</div>
              )}
              {players.filter(p => p.id !== activePlayerId).map(p => {
                const pp = p.level + p.gear.reduce((a,g)=>a+g.bonus,0) + (p.race==='elf'?1:0);
                return (
                  <button key={p.id} onClick={() => {
                    onChange({ ...monster, helperId: p.id });
                    onLog(`${p.name} helps ${active?.name} (+${pp})`);
                    setShowHelper(false);
                  }} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: theme.panelAlt, border: `1.5px solid ${theme.border}`,
                    borderRadius: theme.radius, padding: '5px 8px',
                    fontFamily: theme.fontUI, fontSize: 12, color: theme.ink,
                    cursor: 'pointer', textAlign: 'left',
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', background: p.color,
                      border: `1.5px solid ${theme.border}`, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: theme.fontDisplay, fontSize: 12, flexShrink: 0,
                    }}>{p.name[0]?.toUpperCase()}</div>
                    <span style={{ flex: 1, fontWeight: 600 }}>{p.name}</span>
                    <span style={{ fontFamily: theme.fontMono, fontWeight: 700, color: theme.accent3 }}>+{pp}</span>
                  </button>
                );
              })}
              {helper && (
                <button onClick={() => {
                  onChange({ ...monster, helperId: null });
                  onLog(`${helper.name} backed out. Cowards.`);
                  setShowHelper(false);
                }} style={{
                  background: 'transparent', border: 'none', color: theme.danger,
                  fontFamily: theme.fontUI, fontSize: 11, fontWeight: 600,
                  padding: '4px', cursor: 'pointer', textAlign: 'left',
                }}>✕ Cancel help</button>
              )}
            </div>
          )}
        </div>
        <IconBtn theme={theme} onClick={() => setShowRun(true)} style={{ width: '100%', whiteSpace: 'nowrap' }}>🏃 Run</IconBtn>
        <IconBtn theme={theme} onClick={() => {
          if (active) {
            onPlayerChange(active.id, { ...active, combatBonus: 0 });
            onLog(`${active.name} defeated ${monster.name}! +${monster.treasure} treasure, +1 level.`);
          }
          onClear();
        }} style={{ width: '100%', background: theme.accent3, color: '#fff', whiteSpace: 'nowrap' }}>
          ⚔️ Slain!
        </IconBtn>
      </div>

      {showRun && (
        <RunPrompt theme={theme}
          onCancel={() => setShowRun(false)}
          onEscape={() => {
            if (active) onPlayerChange(active.id, { ...active, combatBonus: 0 });
            onLog(`${active?.name || 'Player'} escaped the ${monster.name}.`);
            setShowRun(false);
            onClear();
          }}
          onCaught={() => {
            onLog(`${active?.name || 'Player'} was caught by the ${monster.name}!`);
            setShowRun(false);
            setShowBadStuff(true);
          }}
        />
      )}

      {showBadStuff && active && (
        <BadStuffDialog theme={theme} monster={monster} player={active}
          onClose={() => setShowBadStuff(false)}
          onApply={(updates, summary) => {
            onPlayerChange(active.id, { ...active, ...updates, combatBonus: 0 });
            onLog(`${active.name} suffered Bad Stuff: ${summary}`);
            setShowBadStuff(false);
            onClear();
          }}
        />
      )}
    </Panel>
  );
}

function RunPrompt({ theme, onCancel, onEscape, onCaught }) {
  return (
    <div onClick={onCancel} style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: theme.panel,
        border: `3px solid ${theme.border}`, borderRadius: theme.radius,
        boxShadow: theme.shadow, width: '92%', maxWidth: 360,
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          padding: '10px 14px', borderBottom: `2px solid ${theme.border}`,
          fontFamily: theme.fontDisplay, fontSize: 18, color: theme.ink,
          textTransform: 'uppercase', letterSpacing: '0.06em',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>🏃</span><span>Run Away</span>
        </div>
        <div style={{
          padding: '14px', fontFamily: theme.fontUI, fontSize: 13,
          color: theme.ink, lineHeight: 1.4,
        }}>
          Roll your die. Did you escape?
          <div style={{
            fontFamily: theme.fontUI, fontSize: 11, color: theme.inkSoft,
            fontStyle: 'italic', marginTop: 4,
          }}>(Card determines threshold &amp; bonuses. We just track outcome.)</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: '0 14px 14px' }}>
          <button onClick={onEscape} style={{
            background: theme.accent3, color: '#fff',
            border: `2px solid ${theme.border}`, borderRadius: theme.radius,
            padding: '10px', cursor: 'pointer',
            fontFamily: theme.fontDisplay, fontSize: 14, letterSpacing: '0.06em',
          }}>✓ Got Away</button>
          <button onClick={onCaught} style={{
            background: theme.danger, color: '#fff',
            border: `2px solid ${theme.border}`, borderRadius: theme.radius,
            padding: '10px', cursor: 'pointer',
            fontFamily: theme.fontDisplay, fontSize: 14, letterSpacing: '0.06em',
          }}>✗ Caught</button>
        </div>
        <button onClick={onCancel} style={{
          margin: '0 14px 14px', background: 'transparent',
          border: `1.5px solid ${theme.border}`, borderRadius: theme.radius,
          padding: '6px', cursor: 'pointer',
          fontFamily: theme.fontUI, fontSize: 11, color: theme.inkSoft,
        }}>Cancel</button>
      </div>
    </div>
  );
}

function BadStuffDialog({ theme, monster, player, onClose, onApply }) {
  const [chosen, setChosen] = useState(new Set());
  const [levels, setLevels] = useState(1);
  const [gearIds, setGearIds] = useState(new Set());

  const toggle = (id) => {
    const n = new Set(chosen);
    if (n.has(id)) n.delete(id); else n.add(id);
    if (id === 'death') {
      // Death subsumes the others — clear them
      if (n.has('death')) {
        n.clear(); n.add('death');
      }
    } else {
      n.delete('death');
    }
    setChosen(n);
  };
  const toggleGear = (idx) => {
    const n = new Set(gearIds);
    if (n.has(idx)) n.delete(idx); else n.add(idx);
    setGearIds(n);
  };

  const apply = () => {
    let updates = {};
    let parts = [];
    if (chosen.has('death')) {
      // Death: lose all levels (back to 1) and all items. Keep race/class.
      updates.level = 1;
      updates.gear = [];
      parts.push('DEATH (back to Lv 1, lost all gear)');
    } else {
      if (chosen.has('levels')) {
        const newLevel = Math.max(1, player.level - levels);
        updates.level = newLevel;
        parts.push(`−${levels} level${levels > 1 ? 's' : ''}`);
      }
      if (chosen.has('gear') && gearIds.size > 0) {
        const lostNames = [];
        const remaining = (player.gear || []).filter((g, i) => {
          if (gearIds.has(i)) { lostNames.push(g.name); return false; }
          return true;
        });
        updates.gear = remaining;
        parts.push(`lost ${lostNames.join(', ')}`);
      }
      if (chosen.has('race')) { updates.race = 'none'; updates.customRaces = []; parts.push('lost Race'); }
      if (chosen.has('class')) { updates.class = 'none'; updates.customClasses = []; parts.push('lost Class'); }
    }
    if (parts.length === 0) return;
    onApply(updates, parts.join('; '));
  };

  const opts = [
    { id: 'death',  label: '☠ Death',          hint: 'Reset to Lv 1, lose all gear' },
    { id: 'levels', label: '↓ Lose Levels',    hint: 'Subtract levels' },
    { id: 'gear',   label: '✕ Lose Items',     hint: 'Pick which items are lost' },
    { id: 'race',   label: '✕ Lose Race',      hint: 'Race becomes None' },
    { id: 'class',  label: '✕ Lose Class',     hint: 'Class becomes None' },
  ];

  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: theme.panel,
        border: `3px solid ${theme.danger}`, borderRadius: theme.radius,
        boxShadow: theme.shadow, width: '94%', maxWidth: 420,
        maxHeight: '92%', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          padding: '10px 14px', borderBottom: `2px solid ${theme.border}`,
          fontFamily: theme.fontDisplay, fontSize: 18, color: theme.danger,
          textTransform: 'uppercase', letterSpacing: '0.06em',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>💀</span><span>Bad Stuff — {player.name}</span>
          <button onClick={onClose} style={{
            marginLeft: 'auto', background: 'transparent', border: 'none',
            cursor: 'pointer', fontSize: 18, color: theme.ink, padding: 0, lineHeight: 1,
          }}>✕</button>
        </div>

        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
          {monster.badStuff && (
            <div style={{
              padding: '8px 10px',
              background: theme.panelAlt,
              border: `1.5px solid ${theme.border}`,
              borderRadius: theme.radius,
              fontFamily: theme.fontUI, fontSize: 12, color: theme.ink, lineHeight: 1.4,
              fontStyle: 'italic',
            }}>“{monster.badStuff}”</div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {opts.map(o => {
              const on = chosen.has(o.id);
              return (
                <button key={o.id} onClick={() => toggle(o.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px',
                  background: on ? theme.danger : theme.panelAlt,
                  color: on ? '#fff' : theme.ink,
                  border: `2px solid ${theme.border}`, borderRadius: theme.radius,
                  cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{
                    width: 18, height: 18, flexShrink: 0,
                    border: `2px solid ${on ? '#fff' : theme.border}`,
                    borderRadius: 4,
                    background: on ? '#fff' : 'transparent',
                    color: theme.danger, fontFamily: theme.fontDisplay, fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                  }}>{on ? '✓' : ''}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: theme.fontDisplay, fontSize: 14 }}>{o.label}</div>
                    <div style={{ fontFamily: theme.fontUI, fontSize: 10, opacity: 0.8 }}>{o.hint}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {chosen.has('levels') && !chosen.has('death') && (
            <div style={{
              padding: '8px 10px', background: theme.panelAlt,
              border: `2px solid ${theme.border}`, borderRadius: theme.radius,
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: theme.fontUI, fontSize: 12, color: theme.ink,
            }}>
              <span>Lose</span>
              <button onClick={() => setLevels(Math.max(1, levels - 1))} style={miniBtn(theme)}>−</button>
              <span style={{ fontFamily: theme.fontDisplay, fontSize: 16, minWidth: 20, textAlign: 'center' }}>{levels}</span>
              <button onClick={() => setLevels(Math.min(player.level - 1 || 1, levels + 1))} style={miniBtn(theme)}>+</button>
              <span>level{levels > 1 ? 's' : ''} (now Lv {Math.max(1, player.level - levels)})</span>
            </div>
          )}

          {chosen.has('gear') && !chosen.has('death') && (
            <div style={{
              padding: '8px 10px', background: theme.panelAlt,
              border: `2px solid ${theme.border}`, borderRadius: theme.radius,
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ fontFamily: theme.fontUI, fontSize: 10, color: theme.inkSoft, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pick items lost</div>
              {(player.gear || []).length === 0 && (
                <div style={{ fontFamily: theme.fontUI, fontSize: 11, color: theme.inkSoft, fontStyle: 'italic' }}>No gear to lose. Lucky.</div>
              )}
              {(player.gear || []).map((g, i) => {
                const on = gearIds.has(i);
                return (
                  <button key={i} onClick={() => toggleGear(i)} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '4px 6px',
                    background: on ? theme.danger : 'transparent',
                    color: on ? '#fff' : theme.ink,
                    border: `1.5px solid ${theme.border}`, borderRadius: theme.radius,
                    cursor: 'pointer', textAlign: 'left',
                    fontFamily: theme.fontUI, fontSize: 12,
                  }}>
                    <span style={{ fontSize: 14 }}>{g.icon}</span>
                    <span style={{ flex: 1 }}>{g.name}</span>
                    <span style={{ fontFamily: theme.fontMono, opacity: 0.85 }}>+{g.bonus}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, padding: 14, borderTop: `2px solid ${theme.border}` }}>
          <button onClick={onClose} style={{
            flex: 1, background: 'transparent',
            border: `2px solid ${theme.border}`, borderRadius: theme.radius,
            padding: '8px', cursor: 'pointer',
            fontFamily: theme.fontUI, fontSize: 12, color: theme.ink,
          }}>Cancel</button>
          <button onClick={apply}
            disabled={chosen.size === 0 || (chosen.has('gear') && gearIds.size === 0 && !chosen.has('death') && !chosen.has('levels') && !chosen.has('race') && !chosen.has('class'))}
            style={{
              flex: 2, background: theme.danger, color: '#fff',
              border: `2px solid ${theme.border}`, borderRadius: theme.radius,
              padding: '8px', cursor: chosen.size > 0 ? 'pointer' : 'not-allowed',
              fontFamily: theme.fontDisplay, fontSize: 14,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              opacity: chosen.size === 0 ? 0.5 : 1,
            }}>Apply</button>
        </div>
      </div>
    </div>
  );
}

function MonsterPicker({ theme, onClose, onPick }) {
  const [custom, setCustom] = useState({ name: '', level: 5, treasure: 1, badStuff: '' });

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: theme.panel,
        border: `3px solid ${theme.border}`,
        borderRadius: theme.radius,
        boxShadow: theme.shadow,
        width: '92%', maxWidth: 420,
        maxHeight: '90%', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          padding: '10px 14px',
          borderBottom: `2px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: theme.fontDisplay, fontSize: 18, color: theme.ink,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          <span>👹</span><span>Add Monster</span>
          <button onClick={onClose} style={{
            marginLeft: 'auto', background: 'transparent', border: 'none',
            cursor: 'pointer', fontSize: 18, color: theme.ink, padding: 0, lineHeight: 1,
          }}>✕</button>
        </div>

        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Field theme={theme} label="Name (from your card)">
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={custom.name} onChange={e => setCustom({ ...custom, name: e.target.value })}
                placeholder="e.g. Squidzilla" autoFocus
                style={inputStyle(theme)} />
              <button onClick={() => setCustom({ ...custom, name: pick(RANDOM_MONSTERS) })}
                title="Random" style={{
                  width: 36, padding: 0, flexShrink: 0,
                  background: theme.panelAlt, color: theme.ink,
                  border: `2px solid ${theme.border}`, borderRadius: theme.radius,
                  cursor: 'pointer', fontSize: 16,
                }}>🎲</button>
            </div>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field theme={theme} label="Level">
              <input type="number" value={custom.level} onChange={e => setCustom({ ...custom, level: parseInt(e.target.value) || 1 })}
                style={inputStyle(theme)} />
            </Field>
            <Field theme={theme} label="Treasures">
              <input type="number" value={custom.treasure} onChange={e => setCustom({ ...custom, treasure: parseInt(e.target.value) || 1 })}
                style={inputStyle(theme)} />
            </Field>
          </div>
          <Field theme={theme} label="Bad Stuff (mechanical summary)">
            <textarea value={custom.badStuff}
              onChange={e => setCustom({ ...custom, badStuff: e.target.value })}
              placeholder="e.g. Lose 2 levels. Lose 1 small item."
              rows={2}
              style={{ ...inputStyle(theme), resize: 'vertical', fontFamily: theme.fontUI, lineHeight: 1.35 }} />
          </Field>
          <button onClick={() => custom.name && onPick(custom)} disabled={!custom.name} style={{
            background: custom.name ? theme.accent : theme.panelAlt,
            color: custom.name ? '#fff' : theme.inkSoft,
            border: `2px solid ${theme.border}`, borderRadius: theme.radius,
            padding: '10px', cursor: custom.name ? 'pointer' : 'not-allowed',
            fontFamily: theme.fontDisplay, fontSize: 16,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>Summon It</button>
          <div style={{
            fontFamily: theme.fontUI, fontSize: 10, color: theme.inkSoft,
            fontStyle: 'italic', textAlign: 'center', lineHeight: 1.4,
          }}>Read details from your physical card. This tool only tracks numbers.</div>
        </div>
      </div>
    </div>
  );
}

function Field({ theme, label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{
        fontFamily: theme.fontUI, fontSize: 10,
        textTransform: 'uppercase', letterSpacing: '0.12em',
        color: theme.inkSoft,
      }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = (theme) => ({
  fontFamily: theme.fontUI, fontSize: 13,
  padding: '6px 10px',
  border: `2px solid ${theme.border}`, borderRadius: theme.radius,
  background: theme.panelAlt, color: theme.ink, outline: 'none',
  width: '100%', boxSizing: 'border-box',
});

// ────────────────────────────────────────────────────────────
// Game Log
// ────────────────────────────────────────────────────────────
function GameLog({ theme, log }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [log]);
  return (
    <Panel theme={theme} title="Log">
      <div ref={ref} style={{
        maxHeight: 140, overflowY: 'auto',
        padding: '10px 14px',
        fontFamily: theme.fontMono, fontSize: 11, color: theme.ink,
        display: 'flex', flexDirection: 'column',
      }}>
        {log.map((entry, i) => (
          <div key={i} style={{
            padding: '4px 0',
            borderBottom: i < log.length - 1 ? `1px dashed ${theme.border}33` : 'none',
            color: i === log.length - 1 ? theme.ink : theme.inkSoft,
            fontWeight: i === log.length - 1 ? 600 : 400,
          }}>
            <span style={{ color: theme.accent, marginRight: 6 }}>›</span>
            {entry.text}
          </div>
        ))}
        {log.length === 0 && (
          <div style={{ color: theme.inkSoft, fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>
            Nothing happened yet. Disappointing.
          </div>
        )}
      </div>
    </Panel>
  );
}

// ────────────────────────────────────────────────────────────
// Setup Screen
// ────────────────────────────────────────────────────────────
function SetupScreen({ theme, onStart, maxPlayers }) {
  const [n, setN] = useState(4);
  const [names, setNames] = useState(['Aldric', 'Mirabelle', 'Grog', 'Pip', 'Vex', 'Tunk', 'Bork', 'Zella', 'Mungo', 'Fenra']);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 30,
      background: theme.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <ThemeBackdrop theme={theme} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 460,
        background: theme.panel,
        border: `3px solid ${theme.border}`,
        borderRadius: theme.radius,
        boxShadow: theme.shadow,
        padding: 24,
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: theme.fontDisplay,
            fontSize: 44, lineHeight: 1, color: theme.accent,
            letterSpacing: theme.pattern === 'comic' ? '0.04em' : '0.02em',
            transform: theme.pattern === 'comic' ? 'rotate(-2deg)' : 'none',
            display: 'inline-block',
          }}>DUNGEON TRACKER</div>
          <div style={{
            fontFamily: theme.fontUI, fontSize: 12, color: theme.inkSoft,
            marginTop: 4, fontStyle: 'italic',
          }}>A physical-game companion. Kill stuff, steal stuff, betray friends.</div>
        </div>

        <div>
          <div style={{
            fontFamily: theme.fontUI, fontSize: 11,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: theme.inkSoft, marginBottom: 6,
          }}>How many adventurers?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4 }}>
            {Array.from({ length: maxPlayers - 2 }, (_, i) => i + 3).map(num => (
              <button key={num} onClick={() => setN(num)} style={{
                padding: '10px 0',
                background: n === num ? theme.accent : theme.panelAlt,
                color: n === num ? '#fff' : theme.ink,
                border: `2px solid ${theme.border}`,
                borderRadius: theme.radius,
                fontFamily: theme.fontDisplay, fontSize: 20,
                cursor: 'pointer',
                boxShadow: n === num ? theme.shadowSm : 'none',
              }}>{num}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{
            fontFamily: theme.fontUI, fontSize: 11,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: theme.inkSoft,
          }}>Name your victims</div>
          {Array.from({ length: n }, (_, i) => (
            <input key={i} value={names[i] || ''}
              onChange={e => {
                const nm = [...names]; nm[i] = e.target.value; setNames(nm);
              }}
              placeholder={`Player ${i + 1}`}
              style={{ ...inputStyle(theme), padding: '8px 10px' }}
            />
          ))}
        </div>

        <button onClick={() => onStart(n, names.slice(0, n))} style={{
          background: theme.accent3, color: '#fff',
          border: `3px solid ${theme.border}`, borderRadius: theme.radius,
          padding: '12px',
          fontFamily: theme.fontDisplay, fontSize: 22,
          letterSpacing: '0.06em', cursor: 'pointer',
          boxShadow: theme.shadow,
          textTransform: 'uppercase',
        }}>Kick Down the Door →</button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Win Celebration
// ────────────────────────────────────────────────────────────
function WinCelebration({ theme, winner, onReset }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 40,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: theme.panel,
        border: `4px solid ${theme.accent3}`,
        borderRadius: theme.radius,
        boxShadow: theme.shadow,
        padding: 28, maxWidth: 360, textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Confetti */}
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: -10, left: `${(i * 4.3) % 100}%`,
            width: 8, height: 14,
            background: [theme.accent, theme.accent2, theme.accent3, '#FFD700'][i % 4],
            transform: `rotate(${i * 17}deg)`,
            animation: `fall ${2 + (i % 3)}s linear ${i * 0.1}s infinite`,
          }} />
        ))}
        <style>{`@keyframes fall { to { transform: translateY(500px) rotate(720deg); } }`}</style>

        <div style={{
          fontFamily: theme.fontDisplay, fontSize: 48,
          color: theme.accent3, lineHeight: 1,
          letterSpacing: '0.04em',
          textShadow: theme.pattern === 'comic' ? `4px 4px 0 ${theme.border}` : 'none',
        }}>VICTORY!</div>
        <div style={{
          fontFamily: theme.fontDisplay, fontSize: 24,
          marginTop: 10, color: theme.ink,
        }}>{winner.name} hit Level 10</div>
        <div style={{
          fontFamily: theme.fontUI, fontSize: 13, color: theme.inkSoft,
          fontStyle: 'italic', marginTop: 6,
        }}>The rest of you can stop now. It’s embarrassing.</div>
        <button onClick={onReset} style={{
          marginTop: 20,
          background: theme.accent, color: '#fff',
          border: `2px solid ${theme.border}`, borderRadius: theme.radius,
          padding: '10px 24px',
          fontFamily: theme.fontDisplay, fontSize: 16,
          letterSpacing: '0.08em', cursor: 'pointer',
        }}>Play Again</button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main Dashboard
// ────────────────────────────────────────────────────────────
const PLAYER_COLORS = ['#E63946', '#3A86FF', '#06A77D', '#FFB703', '#8338EC', '#FB5607', '#0EA5E9', '#EC4899', '#84CC16', '#F43F5E'];

// ────────────────────────────────────────────────────────────
// Random suggestion banks (snarky, irreverent — not from any card)
// ────────────────────────────────────────────────────────────
const RANDOM_RACES = [
  'Barbarian', 'High Schooler', 'Tired Parent', 'Tax Auditor', 'Pirate', 'Ghoul',
  'Robot', 'Yeti', 'Vampire', 'Cyborg', 'Goblin', 'Centaur', 'Mermaid', 'Lizardfolk',
  'Cherub', 'Plant Person', 'Cloud Giant', 'Swamp Hag', 'Time Traveler', 'Influencer',
];
const RANDOM_CLASSES = [
  'Bard', 'Necromancer', 'Paladin', 'Druid', 'Ranger', 'Monk', 'Sorcerer',
  'Knight', 'Assassin', 'Witch', 'Pirate', 'Berserker', 'Alchemist', 'Diplomat',
  'Tax Lawyer', 'Influencer', 'Yoga Instructor', 'Chef', 'Janitor', 'Pyromaniac',
];
const RANDOM_MONSTERS = [
  'Squidzilla', 'Killer Stapler', 'Dread Hamster', 'Disco Skeleton', 'Goblin King',
  'Slime Lord', 'Carnivorous Couch', 'Tax Demon', 'HOA President', 'Mall Cop Lich',
  'Coffee Dragon', 'Sentient Mold', 'DMV Wraith', 'Karen of the Abyss', 'Three Goblins in a Trench Coat',
  'Office Hydra', 'Vampire Toddler', 'Existential Dread', 'Talking Cabinet', 'Bog Lawyer',
];
const RANDOM_GEAR = [
  'Sword of Mild Inconvenience', 'Helm of Bedhead', 'Boots of Squelching', 'Cloak of Static',
  'Ring of Thumbs', 'Wand of Pointing', 'Shield of Excuses', 'Mug of Bravery',
  'Spoon of Smiting', 'Trousers of Power', 'Bag of Receipts', 'Stick + 1', 'Bigger Stick',
  'Cursed Lunchbox', 'Confidence Hat', 'Goggles of Side-Eye', 'Lute of Annoyance',
  'Belt of Many Loops', 'Pants of Plus One', 'Slightly Damp Towel',
];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function RandomBtn({ theme, onClick, title }) {
  return (
    <button onClick={onClick} title={title || 'Random'} style={{
      width: 22, height: 22, padding: 0, flexShrink: 0,
      background: theme.panelAlt, color: theme.ink,
      border: `1px solid ${theme.border}`, borderRadius: theme.radius,
      cursor: 'pointer', fontSize: 11, lineHeight: 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>🎲</button>
  );
}

function MunchkinDashboard({ theme: themeId = 'comic', density = 'comfortable', showLog = true, maxPlayers = 6, fixedSize, initialState }) {
  const theme = THEMES[themeId];
  const [phase, setPhase] = useState(initialState ? 'play' : 'setup');
  const [players, setPlayers] = useState(initialState?.players || []);
  const [activeId, setActiveId] = useState(initialState?.activeId || null);
  const [monster, setMonster] = useState(initialState?.monster || null);
  const [round, setRound] = useState(initialState?.round || 1);
  const [log, setLog] = useState(initialState?.log || []);
  const [won, setWon] = useState(false);

  const [time, resetTime] = useTimer(phase === 'play' && !won);

  const addLog = (text) => setLog(l => [...l, { text, t: Date.now() }]);

  // Win detection
  useEffect(() => {
    const winner = players.find(p => p.level >= 10);
    if (winner && !won) {
      setWon(true);
      addLog(`🏆 ${winner.name} reached Level 10. Game over.`);
    }
  }, [players, won]);

  const startGame = (n, names) => {
    const newPlayers = Array.from({ length: n }, (_, i) => ({
      id: `p${i}`,
      name: names[i] || `Player ${i + 1}`,
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      race: 'none',
      class: 'none',
      level: 1,
      gear: [],
    }));
    setPlayers(newPlayers);
    setActiveId('p0');
    setPhase('play');
    setLog([{ text: `Game start. ${n} adventurers enter the dungeon.`, t: Date.now() }]);
  };

  const updatePlayer = (id, updated) => setPlayers(ps => ps.map(p => p.id === id ? updated : p));
  const removePlayer = (id) => setPlayers(ps => ps.filter(p => p.id !== id));
  const advanceTurn = () => {
    const idx = players.findIndex(p => p.id === activeId);
    const next = players[(idx + 1) % players.length];
    if (idx === players.length - 1) {
      setRound(r => r + 1);
      addLog(`Round ${round + 1} begins.`);
    }
    setActiveId(next?.id);
  };

  // Responsive container query — measure self width and pick layout breakpoints
  const rootRef = useRef(null);
  const [w, setW] = useState(1200);
  useEffect(() => {
    if (!rootRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setW(e.contentRect.width);
    });
    ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, []);

  const isCompact = density === 'compact';
  const tip = useMemo(() => SNARK[Math.floor(Math.random() * SNARK.length)], [round]);

  // Breakpoints (container, not viewport)
  const stackSide = w < 820;          // monster + log drop below player grid
  const minCard = isCompact ? 200 : 240;
  const sideW = w < 1000 ? 280 : 300;
  const showTip = w >= 720;

  return (
    <div ref={rootRef} style={{
      width: fixedSize?.width || '100%',
      height: fixedSize?.height || '100%',
      background: theme.bg,
      color: theme.ink,
      fontFamily: theme.fontUI,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <ThemeBackdrop theme={theme} />

      {phase === 'setup' && <SetupScreen theme={theme} onStart={startGame} maxPlayers={maxPlayers} />}

      {phase === 'play' && (
        <>
          {/* Header */}
          <div style={{
            position: 'relative', zIndex: 2,
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '14px 20px',
            borderBottom: `2px solid ${theme.border}`,
            background: theme.panel,
          }}>
          <div style={{
            fontFamily: theme.fontDisplay,
            fontSize: 30, lineHeight: 1, color: theme.accent,
            letterSpacing: theme.pattern === 'comic' ? '0.04em' : '0.02em',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}>DUNGEON TRACKER</div>
            {showTip && <div style={{
              fontFamily: theme.fontUI, fontSize: 11,
              color: theme.inkSoft, fontStyle: 'italic',
              borderLeft: `2px solid ${theme.border}`,
              paddingLeft: 14, marginLeft: 14, lineHeight: 1.3,
              minWidth: 0, flex: 1,
              maxWidth: 260,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{tip}</div>}

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
              <Stat theme={theme} label="Round" value={round} />
              <Stat theme={theme} label="Time" value={fmtTime(time)} mono />
              <button onClick={advanceTurn} style={{
                background: theme.accent2, color: '#fff',
                border: `2px solid ${theme.border}`,
                borderRadius: theme.radius,
                padding: '8px 14px',
                fontFamily: theme.fontDisplay, fontSize: 14,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: theme.shadowSm,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>Next Turn →</button>
            </div>
          </div>

          {/* Body */}
          <div style={{
            position: 'relative', zIndex: 1,
            flex: 1, minHeight: 0,
            overflow: stackSide ? 'auto' : 'hidden',
            display: 'grid',
            gridTemplateColumns: stackSide ? '1fr' : `1fr ${sideW}px`,
            gap: 14, padding: 14,
            minWidth: 0,
          }}>
            {/* Players grid */}
            <div style={{
              overflow: stackSide ? 'visible' : 'auto',
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fit, minmax(${minCard}px, 1fr))`,
              gap: isCompact ? 14 : 20,
              padding: '10px 4px 4px',
              alignContent: 'start',
            }}>
              {players.map(p => (
                <PlayerCard key={p.id} theme={theme} player={p}
                  isActive={p.id === activeId}
                  onChange={(np) => updatePlayer(p.id, np)}
                  onRemove={() => removePlayer(p.id)}
                  onSetActive={() => setActiveId(p.id)}
                  density={density}
                />
              ))}
              {players.length < maxPlayers && (
                <button onClick={() => {
                  const id = `p${Date.now()}`;
                  setPlayers(ps => [...ps, {
                    id, name: `Player ${ps.length + 1}`,
                    color: PLAYER_COLORS[ps.length % PLAYER_COLORS.length],
                    race: 'none', class: 'none',
                    level: 1, gear: [],
                  }]);
                }} style={{
                  background: 'transparent',
                  border: `2px dashed ${theme.border}`,
                  borderRadius: theme.radius,
                  minHeight: 200,
                  fontFamily: theme.fontUI, fontSize: 13, color: theme.inkSoft,
                  cursor: 'pointer',
                }}>＋ Add Player</button>
              )}
            </div>

            {/* Side: Monster + Log */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 14,
              minHeight: 0,
            }}>
              <MonsterPanel theme={theme} monster={monster}
                onChange={setMonster}
                onClear={() => setMonster(null)}
                players={players} activePlayerId={activeId}
                onLog={addLog}
                onPlayerChange={(id, p) => setPlayers(ps => ps.map(x => x.id === id ? p : x))}
              />
              {showLog && <GameLog theme={theme} log={log} />}
            </div>
          </div>
        </>
      )}

      {won && players.find(p => p.level >= 10) && (
        <WinCelebration theme={theme} winner={players.find(p => p.level >= 10)}
          onReset={() => { setPhase('setup'); setPlayers([]); setMonster(null); setLog([]); setRound(1); setWon(false); resetTime(); }}
        />
      )}
    </div>
  );
}

function Stat({ theme, label, value, mono }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
      paddingRight: 12, borderRight: `2px solid ${theme.border}33`,
    }}>
      <span style={{
        fontFamily: theme.fontUI, fontSize: 9,
        textTransform: 'uppercase', letterSpacing: '0.12em',
        color: theme.inkSoft,
      }}>{label}</span>
      <span style={{
        fontFamily: mono ? theme.fontMono : theme.fontDisplay,
        fontSize: 20, lineHeight: 1, color: theme.ink, marginTop: 2,
      }}>{value}</span>
    </div>
  );
}

Object.assign(window, { MunchkinDashboard, THEMES });
