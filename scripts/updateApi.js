const { spawnSync } = require('child_process');

const commands = [
  ['python', ['scripts/update_skins.py', '--apply']],
  ['py', ['scripts/update_skins.py', '--apply']],
  ['python3', ['scripts/update_skins.py', '--apply']],
];

for (const [cmd, args] of commands) {
  const result = spawnSync(cmd, args, { stdio: 'inherit' });
  if (!result.error && result.status === 0) {
    process.exit(0);
  }
}

console.error('Failed to run updater. Install Python 3 and ensure python/py is available in PATH.');
process.exit(1);
