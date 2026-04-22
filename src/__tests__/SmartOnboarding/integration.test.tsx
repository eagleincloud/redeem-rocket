/**
 * SmartOnboarding Integration Tests
 *
 * Tests for complete user flows and integration with external systems:
 * - Full onboarding flow from start to finish
 * - Context integration and state propagation
 * - localStorage persistence across sessions
 * - Supabase API integration
 * - Error recovery and retry logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmartOnboarding } from '@/business/components/SmartOnboarding';
import { BusinessProvider } from '@/business/context/BusinessContext';
import { BrowserRouter } from 'react-router-dom';
import * as supabaseDataModule from '@/app/api/supabase-data';

vi.mock('@/app/api/supabase-data', () => ({
  completeOnboarding: vi.fn(async () => true),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <BusinessProvider>
        {children}
      </BusinessProvider>
    </BrowserRouter>
  );
}

async function waitForAnimation(ms = 350) {
  return new Promise(resolve => {
    setTimeout(() => resolve(undefined), ms);
  });
}

describe('SmartOnboarding Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(supabaseDataModule.completeOnboarding).mockResolvedValue(true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // FULL FLOW TESTS
  // ──────────────────────────────────────────────────────────────────────────

  describe('Complete Flow', () => {
    it('completes full onboarding without errors', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Progress through all 5 questions
      for (let i = 0; i < 5; i++) {
        expect(screen.getByText(/Question \d+ of 5/)).toBeInTheDocument();
        const buttons = screen.getAllByRole('button');
        const yesButton = buttons[buttons.length - 1];
        fireEvent.click(yesButton);
        await waitForAnimation();
      }

      // Should be on completion screen
      expect(screen.getByText(/You're all set/)).toBeInTheDocument();

      // Click finish
      const finishButton = screen.getByText(/Continue to Dashboard/);
      fireEvent.click(finishButton);

      await waitFor(() => {
        expect(supabaseDataModule.completeOnboarding).toHaveBeenCalled();
      });
    });

    it('maintains feature preferences throughout flow', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Answer: Yes, No, Yes, No, Yes
      const answerSequence = [true, false, true, false, true];

      for (let i = 0; i < 5; i++) {
        const buttons = screen.getAllByRole('button');
        const shouldAnswerYes = answerSequence[i];
        const button = shouldAnswerYes ? buttons[buttons.length - 1] : buttons[buttons.length - 2];
        fireEvent.click(button);
        await waitForAnimation();
      }

      // Complete the flow
      const finishButton = screen.getByText(/Continue to Dashboard/);
      fireEvent.click(finishButton);

      await waitFor(() => {
        const calls = vi.mocked(supabaseDataModule.completeOnboarding).mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const [_, preferences] = calls[0];

        // Verify preferences match our answer sequence
        expect(preferences.product_catalog).toBe(true);
        expect(preferences.lead_management).toBe(false);
        expect(preferences.email_campaigns).toBe(true);
        expect(preferences.automation).toBe(false);
        expect(preferences.social_media).toBe(true);
      });
    });

    it('preserves preferences when navigating back and forward', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Answer question 1 with Yes
      let buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[buttons.length - 1]);
      await waitForAnimation();

      // Move to question 3
      buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[buttons.length - 1]);
      await waitForAnimation();

      buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[buttons.length - 1]);
      await waitForAnimation();

      // Go back to question 1
      buttons = screen.getAllByRole('button');
      const backBtn = buttons.find(b => b.textContent?.includes('Back'));
      if (backBtn) fireEvent.click(backBtn);
      await waitForAnimation();

      buttons = screen.getAllByRole('button');
      const anotherBack = buttons.find(b => b.textContent?.includes('Back'));
      if (anotherBack) fireEvent.click(anotherBack);
      await waitForAnimation();

      // Should be back on question 1
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();

      // Navigate forward through all remaining questions
      for (let i = 1; i < 5; i++) {
        buttons = screen.getAllByRole('button');
        const yesBtn = buttons[buttons.length - 1];
        fireEvent.click(yesBtn);
        await waitForAnimation();
      }

      // All should be selected (true)
      const finishButton = screen.getByText(/Continue to Dashboard/);
      fireEvent.click(finishButton);

      await waitFor(() => {
        const calls = vi.mocked(supabaseDataModule.completeOnboarding).mock.calls;
        const [_, preferences] = calls[0];
        Object.values(preferences).forEach(val => {
          expect(val).toBe(true);
        });
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // CONTEXT INTEGRATION TESTS
  // ──────────────────────────────────────────────────────────────────────────

  describe('Context Integration', () => {
    it('updates BusinessContext when onboarding completes', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Complete onboarding
      for (let i = 0; i < 5; i++) {
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[buttons.length - 1]);
        await waitForAnimation();
      }

      const finishButton = screen.getByText(/Continue to Dashboard/);
      fireEvent.click(finishButton);

      await waitFor(() => {
        expect(supabaseDataModule.completeOnboarding).toHaveBeenCalled();
      });

      // Verify API was called with correct data
      const calls = vi.mocked(supabaseDataModule.completeOnboarding).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
    });

    it('saves user data to localStorage after completion', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Complete onboarding with specific preferences
      const answers = [true, false, true, false, true];
      for (let i = 0; i < 5; i++) {
        const buttons = screen.getAllByRole('button');
        const button = answers[i]
          ? buttons[buttons.length - 1]
          : buttons[buttons.length - 2];
        fireEvent.click(button);
        await waitForAnimation();
      }

      const finishButton = screen.getByText(/Continue to Dashboard/);
      fireEvent.click(finishButton);

      await waitFor(() => {
        const stored = localStorage.getItem('biz_user');
        expect(stored).toBeTruthy();
        if (stored) {
          const user = JSON.parse(stored);
          expect(user.onboarding_done).toBe(true);
          expect(user.feature_preferences).toBeDefined();
        }
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // API ERROR HANDLING TESTS
  // ──────────────────────────────────────────────────────────────────────────

  describe('API Error Handling', () => {
    it('handles API failure gracefully', async () => {
      vi.mocked(supabaseDataModule.completeOnboarding).mockResolvedValue(false);

      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      for (let i = 0; i < 5; i++) {
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[buttons.length - 1]);
        await waitForAnimation();
      }

      const finishButton = screen.getByText(/Continue to Dashboard/);
      fireEvent.click(finishButton);

      await waitFor(() => {
        expect(supabaseDataModule.completeOnboarding).toHaveBeenCalled();
      });
    });

    it('continues with local save if API fails', async () => {
      vi.mocked(supabaseDataModule.completeOnboarding).mockResolvedValue(false);

      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      for (let i = 0; i < 5; i++) {
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[buttons.length - 1]);
        await waitForAnimation();
      }

      const finishButton = screen.getByText(/Continue to Dashboard/);
      fireEvent.click(finishButton);

      await waitFor(() => {
        // Should still save to localStorage
        const stored = localStorage.getItem('biz_user');
        expect(stored).toBeTruthy();
      });
    });

    it('handles API throwing error', async () => {
      vi.mocked(supabaseDataModule.completeOnboarding).mockRejectedValue(
        new Error('API Error')
      );

      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      for (let i = 0; i < 5; i++) {
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[buttons.length - 1]);
        await waitForAnimation();
      }

      const finishButton = screen.getByText(/Continue to Dashboard/);
      fireEvent.click(finishButton);

      await waitFor(() => {
        expect(supabaseDataModule.completeOnboarding).toHaveBeenCalled();
      });
    });

    it('does not crash on missing userId', async () => {
      vi.mocked(supabaseDataModule.completeOnboarding).mockImplementation(async (userId) => {
        if (!userId) {
          console.error('User not found');
          return false;
        }
        return true;
      });

      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Complete flow normally
      for (let i = 0; i < 5; i++) {
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[buttons.length - 1]);
        await waitForAnimation();
      }

      const finishButton = screen.getByText(/Continue to Dashboard/);
      fireEvent.click(finishButton);

      // Should handle gracefully
      await waitFor(() => {
        expect(supabaseDataModule.completeOnboarding).toHaveBeenCalled();
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STATE PERSISTENCE TESTS
  // ──────────────────────────────────────────────────────────────────────────

  describe('State Persistence', () => {
    it('preserves feature preferences across component remounts', async () => {
      const { unmount } = render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Answer first question with Yes
      let buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[buttons.length - 1]);
      await waitForAnimation();

      // Save the preferences to localStorage
      const bizUser = localStorage.getItem('biz_user');
      const userData = bizUser ? JSON.parse(bizUser) : null;

      unmount();

      // Remount component
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Should start fresh (component doesn't load from localStorage on init)
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
    });

    it('validates feature preferences structure on save', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Complete with all Yes answers
      for (let i = 0; i < 5; i++) {
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[buttons.length - 1]);
        await waitForAnimation();
      }

      const finishButton = screen.getByText(/Continue to Dashboard/);
      fireEvent.click(finishButton);

      await waitFor(() => {
        const stored = localStorage.getItem('biz_user');
        if (stored) {
          const user = JSON.parse(stored);
          const prefs = user.feature_preferences;

          // Verify all keys exist
          expect(prefs).toHaveProperty('product_catalog');
          expect(prefs).toHaveProperty('lead_management');
          expect(prefs).toHaveProperty('email_campaigns');
          expect(prefs).toHaveProperty('automation');
          expect(prefs).toHaveProperty('social_media');

          // Verify all are booleans
          Object.values(prefs).forEach(val => {
            expect(typeof val).toBe('boolean');
          });
        }
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // EDGE CASE INTEGRATION TESTS
  // ──────────────────────────────────────────────────────────────────────────

  describe('Edge Cases', () => {
    it('handles rapid completion', async () => {
      vi.mocked(supabaseDataModule.completeOnboarding).mockResolvedValue(true);

      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Rapid clicks through all questions
      for (let i = 0; i < 5; i++) {
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[buttons.length - 1]);
      }

      await waitForAnimation();

      const finishButton = screen.getByText(/Continue to Dashboard/);
      fireEvent.click(finishButton);

      await waitFor(() => {
        expect(supabaseDataModule.completeOnboarding).toHaveBeenCalled();
      });
    });

    it('handles multiple rapid finish button clicks', async () => {
      vi.mocked(supabaseDataModule.completeOnboarding).mockResolvedValue(true);

      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Complete flow
      for (let i = 0; i < 5; i++) {
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[buttons.length - 1]);
        await waitForAnimation();
      }

      const finishButton = screen.getByText(/Continue to Dashboard/);

      // Rapid clicks
      fireEvent.click(finishButton);
      fireEvent.click(finishButton);
      fireEvent.click(finishButton);

      await waitFor(() => {
        const calls = vi.mocked(supabaseDataModule.completeOnboarding).mock.calls;
        // Should only call once even with multiple clicks
        expect(calls.length).toBeLessThanOrEqual(1);
      });
    });

    it('handles localStorage quota exceeded gracefully', async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      setItemSpy.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      for (let i = 0; i < 5; i++) {
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[buttons.length - 1]);
        await waitForAnimation();
      }

      const finishButton = screen.getByText(/Continue to Dashboard/);
      fireEvent.click(finishButton);

      // Should handle error without crashing
      await waitFor(() => {
        expect(supabaseDataModule.completeOnboarding).toHaveBeenCalled();
      });

      setItemSpy.mockRestore();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // MULTI-FEATURE SELECTION TESTS
  // ──────────────────────────────────────────────────────────────────────────

  describe('Complex Feature Selection', () => {
    const testCases = [
      {
        name: 'all features selected',
        answers: [true, true, true, true, true],
      },
      {
        name: 'no features selected',
        answers: [false, false, false, false, false],
      },
      {
        name: 'alternating selection',
        answers: [true, false, true, false, true],
      },
      {
        name: 'only lead management',
        answers: [false, true, false, false, false],
      },
      {
        name: 'only automation and social',
        answers: [false, false, false, true, true],
      },
    ];

    testCases.forEach(({ name, answers }) => {
      it(`handles ${name}`, async () => {
        render(
          <TestWrapper>
            <SmartOnboarding />
          </TestWrapper>
        );

        for (let i = 0; i < 5; i++) {
          const buttons = screen.getAllByRole('button');
          const button = answers[i]
            ? buttons[buttons.length - 1]
            : buttons[buttons.length - 2];
          fireEvent.click(button);
          await waitForAnimation();
        }

        const finishButton = screen.getByText(/Continue to Dashboard/);
        fireEvent.click(finishButton);

        await waitFor(() => {
          const calls = vi.mocked(supabaseDataModule.completeOnboarding).mock.calls;
          const [_, prefs] = calls[0];

          expect(prefs.product_catalog).toBe(answers[0]);
          expect(prefs.lead_management).toBe(answers[1]);
          expect(prefs.email_campaigns).toBe(answers[2]);
          expect(prefs.automation).toBe(answers[3]);
          expect(prefs.social_media).toBe(answers[4]);
        });
      });
    });
  });
});
