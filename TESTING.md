# PurpleOS Manual Testing Checklist

## Setup

1. Run `npm install`
2. Run `npm run dev`
3. Open `http://localhost:3000`

## Boot and Stability

1. Confirm the desktop loads (no `PurpleOS Recovery` screen).
2. Refresh the page and confirm it still loads.
3. Open browser console and verify there are no red runtime errors during idle.

## Window Manager

1. Open at least 3 apps from Start menu.
2. Verify open, close, minimize, maximize all work.
3. Verify focus and z-index change when clicking different windows.
4. Drag a window to left, right, and top edges:
   - left edge snaps to left half
   - right edge snaps to right half
   - top edge maximizes
5. Confirm snap overlay appears while dragging near edges.

## Start Menu and System Panel

1. Open Start menu, type a search query, confirm app list filters.
2. Press `Enter` in Start menu and confirm first filtered app opens.
3. Press `Esc` and confirm Start menu closes.
4. Open Notification Center and Quick Settings from taskbar.
5. Click outside the panel and confirm it closes.
6. Press `Esc` and confirm open overlays close.

## Notifications

1. Trigger notifications from Explorer (`Notify`) or Terminal (`notify`).
2. Confirm toast appears.
3. Open Notification Center and confirm history is listed.
4. Dismiss a single notification from history.
5. Click `Clear all` and confirm list is empty.

## Sound System

1. Open Settings -> Sounds.
2. Change sound pack (`classic`, `aero`, `purple`) and test event buttons.
3. Adjust volume slider and confirm volume changes.
4. Toggle mute and verify test sounds are silent.
5. Toggle `ClickSoft for major buttons` and verify click sounds on major UI actions.
6. Click `Test all sounds`:
   - sequence runs with delays
   - `Stop test all` interrupts sequence
7. Import invalid JSON in Sounds:
   - app should not crash
   - error notification appears
8. Upload custom sound for an event and click `Test`.
9. Export JSON mapping, then import it back.
10. Reset sounds to defaults and confirm prompt appears.

## Soundboard

1. Open Soundboard app.
2. Click multiple event buttons quickly and confirm no crashes.
3. Start `Random demo mode`, then stop it.
4. If sound file is missing, app should continue running without crashing.

## Keyboard UX

1. Open multiple windows.
2. Press and hold `Alt`, press `Tab` to cycle, release `Alt` to focus selection.
3. Confirm Alt+Tab overlay appears and selection updates.

## Lock Flow

1. Click taskbar lock button.
2. Confirm lock screen shows clock/date.
3. Click anywhere to unlock.
4. Lock again and unlock via button.

## Credits Integrity

1. Open Settings -> About/Credits and verify exact lines:
   - `Developed by Ysf (Lone wolf developer).`
   - `Without vibe coding.`
2. Open Terminal, run `about`, and verify the exact same lines.
