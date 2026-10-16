import { getSupabaseClient } from '../config/supabase.ts';
import { AppError } from '../middleware/errorHandler.ts';

export interface TransactionStep<T = any> {
  name: string;
  execute: () => Promise<T>;
  rollback?: (result: T) => Promise<void>;
}

/**
 * TransactionCoordinator handles multi-step database mutations with automatic compensation rollback.
 * If any step fails, all preceding executed steps are rolled back in reverse order.
 */
export class TransactionCoordinator {
  private steps: TransactionStep[] = [];

  addStep<T>(step: TransactionStep<T>): this {
    this.steps.push(step);
    return this;
  }

  async run(): Promise<any[]> {
    const executed: { step: TransactionStep; result: any }[] = [];

    for (const step of this.steps) {
      try {
        const result = await step.execute();
        executed.push({ step, result });
      } catch (error: any) {
        console.error(`[TransactionCoordinator] Step "${step.name}" failed:`, error?.message || error);

        // Rollback completed steps in reverse order
        for (let i = executed.length - 1; i >= 0; i--) {
          const { step: execStep, result } = executed[i];
          if (execStep.rollback) {
            try {
              console.warn(`[TransactionCoordinator] Rolling back step "${execStep.name}"`);
              await execStep.rollback(result);
            } catch (rbError: any) {
              console.error(`[TransactionCoordinator] Rollback failed for "${execStep.name}":`, rbError?.message);
            }
          }
        }

        throw AppError.badRequest(
          `Transaction aborted at step "${step.name}": ${error?.message || 'Database mutation failed'}`
        );
      }
    }

    return executed.map((e) => e.result);
  }
}

/**
 * Helper to perform atomic tournament data reset
 */
export async function atomicTournamentReset(tournamentId: string): Promise<void> {
  const supabase = getSupabaseClient();

  // Protect primary tournament default records
  if (tournamentId === 'sci_cup_main') {
    // Only reset scores, preserve teams
    const { error: resetScoresError } = await supabase
      .from('matches')
      .update({
        home_score: null,
        away_score: null,
        home_penalty_score: null,
        away_penalty_score: null,
        status: 'SCHEDULED',
      })
      .eq('tournament_id', tournamentId);

    if (resetScoresError) throw resetScoresError;

    const { error: deleteEventsError } = await supabase
      .from('match_events')
      .delete()
      .eq('tournament_id', tournamentId);

    if (deleteEventsError) throw deleteEventsError;
    return;
  }

  // For other tournaments, reset events, matches, and teams
  const tx = new TransactionCoordinator();

  tx.addStep({
    name: 'delete_events',
    execute: async () => {
      const { error } = await supabase.from('match_events').delete().eq('tournament_id', tournamentId);
      if (error) throw error;
    },
  });

  tx.addStep({
    name: 'delete_matches',
    execute: async () => {
      const { error } = await supabase.from('matches').delete().eq('tournament_id', tournamentId);
      if (error) throw error;
    },
  });

  tx.addStep({
    name: 'delete_teams',
    execute: async () => {
      const { error } = await supabase.from('teams').delete().eq('tournament_id', tournamentId);
      if (error) throw error;
    },
  });

  await tx.run();
}

export const deleteTournamentCascade = atomicTournamentReset;

