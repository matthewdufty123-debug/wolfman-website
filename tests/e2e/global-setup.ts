import { execFileSync } from 'node:child_process'

/**
 * Brings up the throwaway database before the E2E run: start the server, wipe
 * the database, push the current Drizzle schema, seed test users and rituals.
 *
 * Every run starts from the same known state, so tests never inherit anything
 * from the run before them.
 */
export default async function globalSetup() {
  const env = { ...process.env }
  const run = (cmd: string, args: string[]) =>
    execFileSync(cmd, args, { stdio: 'inherit', env, cwd: process.cwd() })

  console.log('\n── E2E harness ──────────────────────────────')
  run('bash', ['scripts/test-db.sh', 'start'])
  run('bash', ['scripts/test-db.sh', 'reset'])

  console.log('pushing schema…')
  execFileSync('npx', ['drizzle-kit', 'push', '--force'], {
    stdio: ['ignore', 'ignore', 'inherit'],
    env,
    cwd: process.cwd(),
  })

  run('npx', ['tsx', 'scripts/seed-test-db.ts'])
  console.log('─────────────────────────────────────────────\n')
}
