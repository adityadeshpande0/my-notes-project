import { ScopeVars, type RoomTint, type ScopeVar } from './ScopeRoom';

/**
 * The 🎒 backpack a function carries: the variables from the scope it was
 * created in. Important: these are LIVE links to those variables, not copies.
 * If the variable changes, the function sees the change. `linkTo` draws a
 * thread (with RefArrows) to the scope room the variables belong to.
 */
export function Backpack({
  label = 'backpack',
  vars,
  tint = 'amber',
  linkTo,
  owner,
  searching,
}: {
  label?: string;
  vars: ScopeVar[];
  tint?: RoomTint;
  /** The id of the ScopeRoom (or card) these variables live in. */
  linkTo?: string;
  /** Used to make the link's id unique. */
  owner?: string;
  /** A lookup that reached into the backpack. */
  searching?: string;
}) {
  return (
    <div className={`sr-backpack is-${tint} ${searching ? 'is-searching' : ''}`}>
      <div className="sr-backpack-head">
        <span aria-hidden="true">🎒</span>
        <span>{label}</span>
        {searching && <span className="sr-lens is-found">🔍 {searching} ✓</span>}
        {linkTo && (
          <span
            className="mem-ref sr-thread"
            data-ref-from={`${owner ?? label}-pack`}
            data-ref-to={linkTo}
          >
            <span className="sr-small">linked to its scope</span>
            <span className="mem-ref-dot" aria-hidden="true" />
          </span>
        )}
      </div>
      {vars.length === 0 ? <span className="sr-note">empty</span> : <ScopeVars vars={vars} />}
    </div>
  );
}
