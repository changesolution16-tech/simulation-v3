import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSimulationStore } from '../../store';
import { SimulationService } from '../../lib/simulations';
import { SimulationWithScenarios } from '../../types';
import { supabase } from '../../lib/supabase';
import { validateSession } from '../../lib/queryHelpers';

const SimulationPlayer: React.FC = () => {
  const { simulationId } = useParams<{ simulationId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, initializeSession } = useSimulationStore();

  const [simulation, setSimulation] = useState<SimulationWithScenarios | null>(null);
  const [loading, setLoading] = useState(true);

  // Get assignment ID from URL if present
  const assignmentLearnerId = searchParams.get('assignmentId');

  useEffect(() => {
    if (!simulationId || !currentUser) {
      navigate('/learner');
      return;
    }

    loadAndStartSimulation();
  }, [simulationId, currentUser, navigate]);

  const loadAndStartSimulation = async () => {
    if (!simulationId) return;

    setLoading(true);
    try {
      const sessionCheck = await validateSession();
      if (!sessionCheck.isValid) {
        console.error('[SimulationPlayer] Session validation failed:', sessionCheck.error);
        alert('Your session has expired. Please log in again.');
        navigate('/login');
        return;
      }

      const data = await SimulationService.getSimulation(simulationId);
      if (data) {
        setSimulation(data);
        await handleStartSimulation(data);
      } else {
        console.error('[SimulationPlayer] Simulation not found');
        alert('Simulation not found. Returning to dashboard.');
        navigate('/learner');
      }
    } catch (error) {
      console.error('[SimulationPlayer] Error loading simulation:', error);
      alert(`Failed to load simulation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      navigate('/learner');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSimulation = async (sim: SimulationWithScenarios) => {
    if (!simulationId || !currentUser) return;

    let instanceId: string | null = null;

    console.log('[SimulationPlayer] Starting simulation:', {
      simulationId,
      userId: currentUser.id,
      difficulty: sim.difficulty
    });

    try {
      const { data, error } = await supabase
        .from('simulation_instances')
        .insert({
          learner_id: currentUser.id,
          simulation_id: simulationId,
          difficulty: sim.difficulty || 'beginner',
          topic_id: null,
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[SimulationPlayer] Error creating simulation instance:', error);
        throw error;
      }

      if (data) {
        instanceId = data.id;
        console.log('[SimulationPlayer] Created simulation instance:', instanceId);

        // Link assignment to instance using database function
        if (assignmentLearnerId) {
          console.log('[SimulationPlayer] Linking assignment to instance via database function');
          try {
            const { error: linkError } = await supabase
              .rpc('link_assignment_to_instance', {
                p_assignment_learner_id: assignmentLearnerId,
                p_instance_id: instanceId
              });

            if (linkError) {
              console.error('[SimulationPlayer] Error linking assignment via function:', linkError);
              // Fall back to direct update
              const { error: directError } = await supabase
                .from('assignment_learners')
                .update({ current_instance_id: instanceId })
                .eq('id', assignmentLearnerId);

              if (directError) {
                console.error('[SimulationPlayer] Error with direct assignment link:', directError);
              } else {
                console.log('[SimulationPlayer] ✓ Assignment linked directly');
              }
            } else {
              console.log('[SimulationPlayer] ✓ Assignment linked via database function');
            }
          } catch (error) {
            console.error('[SimulationPlayer] Exception linking assignment:', error);
          }
        } else {
          // Try to find and link any unlinked in-progress assignment for this user and simulation
          try {
            const { data: assignmentLearner, error: assignmentError } = await supabase
              .from('assignment_learners')
              .select('id, assignment:training_assignments!assignment_learners_assignment_id_fkey(simulation_id)')
              .eq('learner_id', currentUser.id)
              .is('current_instance_id', null)
              .eq('status', 'in_progress')
              .limit(1)
              .maybeSingle();

            if (assignmentLearner && !assignmentError && assignmentLearner.assignment?.simulation_id === simulationId) {
              console.log('[SimulationPlayer] Found matching unlinked assignment:', assignmentLearner.id);

              const { error: updateError } = await supabase
                .from('assignment_learners')
                .update({ current_instance_id: instanceId })
                .eq('id', assignmentLearner.id);

              if (updateError) {
                console.error('[SimulationPlayer] Error linking instance to assignment:', updateError);
              } else {
                console.log('[SimulationPlayer] ✓ Successfully linked instance to assignment');
              }
            }
          } catch (assignmentError) {
            console.warn('[SimulationPlayer] Could not auto-link to assignment:', assignmentError);
          }
        }
      }
    } catch (error) {
      console.error('[SimulationPlayer] Failed to create simulation instance:', error);
    }

    initializeSession(simulationId, instanceId);

    if (sim.introduction_page_enabled) {
      navigate(`/simulation/${simulationId}/intro`);
    } else if (sim.scenarios && sim.scenarios.length > 0) {
      const entryScenario = sim.scenarios.find(s => s.is_entry_point);
      const entryIndex = entryScenario ? sim.scenarios.indexOf(entryScenario) : 0;
      navigate(`/simulation/${simulationId}/scenario/${entryIndex}/introduction`);
    } else {
      alert('This simulation has no scenarios configured.');
      navigate('/learner');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Starting simulation...</p>
        </div>
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Simulation not found</p>
          <button
            onClick={() => navigate('/learner')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Simulations
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default SimulationPlayer;
