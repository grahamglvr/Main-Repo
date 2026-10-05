import { useGame } from '../game/store';

export function Settings({ onClose }: { onClose: () => void }) {
  const debugEnabled = useGame((s) => s.debugEnabled);
  const setDebugEnabled = useGame((s) => s.setDebugEnabled);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="Settings" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <strong>Settings</strong>
          <button className="btn btn-small" onClick={onClose}>
            Close
          </button>
        </div>
        <label className="switch-row" htmlFor="debug-switch">
          <span>
            Debug tools
            <span className="small muted">
              Shows a DEBUG button with cheats and drop pyramid checks. Leave off to test real pacing.
            </span>
          </span>
          <input
            id="debug-switch"
            type="checkbox"
            role="switch"
            checked={debugEnabled}
            onChange={(e) => setDebugEnabled(e.target.checked)}
          />
        </label>
        <p className="small muted">Build step 1 · Scrapper stage, zones 1–10. Progress isn't saved yet.</p>
      </div>
    </div>
  );
}
