/**
 * Maps earthquake magnitude and tsunami potential to a severity level.
 *
 * CRITICAL — tsunami potential exists OR magnitude >= 6.5
 * HIGH     — magnitude >= 5.0
 * MEDIUM   — magnitude >= 4.0
 * LOW      — everything else
 */
function mapSeverity(magnitude, tsunamiPotential) {
  if (tsunamiPotential || magnitude >= 6.5) return 'CRITICAL';
  if (magnitude >= 5.0) return 'HIGH';
  if (magnitude >= 4.0) return 'MEDIUM';
  return 'LOW';
}

/**
 * Returns a recommended action string based on severity and tsunami potential.
 */
function recommendedAction(severity, tsunamiPotential) {
  if (tsunamiPotential) {
    return 'Move to higher ground immediately. Tsunami warning in effect.';
  }
  switch (severity) {
    case 'CRITICAL':
      return 'Seek open space immediately. Avoid buildings and bridges.';
    case 'HIGH':
      return 'Seek open space immediately. Stay away from tall structures.';
    case 'MEDIUM':
      return 'Stay alert. Move away from glass windows and heavy objects.';
    default:
      return 'Stay calm and be prepared for aftershocks.';
  }
}

module.exports = { mapSeverity, recommendedAction };
