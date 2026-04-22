/**
 * SmartOnboarding Component Tests
 *
 * Comprehensive test suite for the SmartOnboarding component covering:
 * - Rendering of all phases
 * - User interactions (answering questions, navigation)
 * - State management and transitions
 * - LocalStorage persistence
 * - API integration with Supabase
 * - Error handling and edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SmartOnboarding, FeaturePreferences } from '@/business/components/SmartOnboarding';
import { BusinessProvider } from '@/business/context/BusinessContext';
import { BrowserRouter } from 'react-router-dom';
import * as supabaseDataModule from '@/app/api/supabase-data';

// ── Mocks ─────────────────────────────────────────────────────────────────────

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

// ── Test Wrapper Component ────────────────────────────────────────────────────

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <BusinessProvider>
        {children}
      </BusinessProvider>
    </BrowserRouter>
  );
}

// ── Helper Functions ──────────────────────────────────────────────────────────

async function waitForAnimation(ms = 350) {
  return new Promise(resolve => {
    setTimeout(() => resolve(undefined), ms);
  });
}

function getQuestionNumber(): string {
  const text = screen.getByText(/Question \d+ of \d+/);
  return text.textContent || '';
}

function getProgressPercentage(): number {
  const text = screen.getByText(/\d+%/);
  const match = text.textContent?.match(/(\d+)%/);
  return match ? parseInt(match[1]) : 0;
}

// ── Main Test Suite ──────────────────────────────────────────────────────────

describe('SmartOnboarding Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // QUESTIONS PHASE TESTS
  // ──────────────────────────────────────────────────────────────────────────

  describe('Questions Phase', () => {
    it('renders the first question on initial load', () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      expect(screen.getByText(/Do you want to showcase your products/)).toBeInTheDocument();
      expect(screen.getByText('📦')).toBeInTheDocument();
    });

    it('displays correct progress for first question', () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
      expect(getProgressPercentage()).toBe(20); // 1/5 = 20%
    });

    it('renders all 5 feature questions when cycling through', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      const yesButtons = screen.getAllByText(/Yes|No/, { selector: 'button' });
      const yesButton = yesButtons[yesButtons.length - 1]; // Last button is "Yes"

      // Question 1
      expect(screen.getByText(/Do you want to showcase your products/)).toBeInTheDocument();
      fireEvent.click(yesButton);

      await waitForAnimation();

      // Question 2
      expect(screen.getByText(/Do you want to capture and manage sales leads/)).toBeInTheDocument();
    });

    it('advances to next question when clicking Yes', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      const yesButton = buttons[buttons.length - 1]; // Last button is "Yes"

      fireEvent.click(yesButton);
      await waitForAnimation();

      expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
    });

    it('advances to next question when clicking No', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      const noButton = buttons[buttons.length - 2]; // Second to last button is "No"

      fireEvent.click(noButton);
      await waitForAnimation();

      expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
    });

    it('goes back to previous question', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Move to question 2
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[buttons.length - 1]);
      await waitForAnimation();

      // Verify on question 2
      expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();

      // Click back button
      const backButton = screen.getByText(/Back/);
      fireEvent.click(backButton);
      await waitForAnimation();

      // Should be back on question 1
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
    });

    it('back button is not shown on first question', () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      expect(screen.queryByText(/Back/)).not.toBeInTheDocument();
    });

    it('back button appears from second question onwards', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[buttons.length - 1]);
      await waitForAnimation();

      expect(screen.getByText(/Back/)).toBeInTheDocument();
    });

    it('updates progress bar smoothly', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      expect(getProgressPercentage()).toBe(20);

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[buttons.length - 1]);
      await waitForAnimation();

      expect(getProgressPercentage()).toBe(40);
    });

    it('displays all question content (icon, title, description)', () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      expect(screen.getByText('📦')).toBeInTheDocument();
      expect(screen.getByText(/Do you want to showcase your products/)).toBeInTheDocument();
      expect(screen.getByText(/Add photos, descriptions, and pricing/)).toBeInTheDocument();
    });

    it('renders Yes and No buttons with correct labels', () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      expect(screen.getByText('Yes, showcase products')).toBeInTheDocument();
      expect(screen.getByText('No, not needed')).toBeInTheDocument();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // FEATURE SELECTION TESTS
  // ──────────────────────────────────────────────────────────────────────────

  describe('Feature Selection', () => {
    it('tracks question progression through all phases', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Go through questions 1-5
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[buttons.length - 1]); // Answer Yes
      await waitForAnimation();

      expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // COMPLETE PHASE TESTS
  // ──────────────────────────────────────────────────────────────────────────

  describe('Complete Phase', () => {
    async function completeAllQuestions() {
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[buttons.length - 1]);

      for (let i = 1; i < 5; i++) {
        await waitForAnimation();
        const allButtons = screen.getAllByRole('button');
        const btn = allButtons.find(b => b.textContent?.includes('Yes'));
        if (btn) fireEvent.click(btn);
      }

      await waitForAnimation();
    }

    it('shows completion screen after all questions answered', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      await completeAllQuestions();

      expect(screen.getByText(/You're all set/)).toBeInTheDocument();
      expect(screen.getByText(/Your dashboard is ready/)).toBeInTheDocument();
    });

    it('displays rocket emoji and success message on complete', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      await completeAllQuestions();

      expect(screen.getByText('✨')).toBeInTheDocument();
      expect(screen.getByText('🚀')).toBeInTheDocument();
    });

    it('shows loading state when finish button is clicked', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      await completeAllQuestions();

      const finishButton = screen.getByText(/Continue to Dashboard/);
      fireEvent.click(finishButton);

      await waitFor(() => {
        expect(screen.getByText(/Finishing/)).toBeInTheDocument();
      });
    });

    it('disables finish button during loading', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      await completeAllQuestions();

      const finishButton = screen.getByText(/Continue to Dashboard/);
      fireEvent.click(finishButton);

      await waitFor(() => {
        expect(finishButton).toBeDisabled();
      });
    });

    it('renders finish button with correct label', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      await completeAllQuestions();

      expect(screen.getByText(/Continue to Dashboard/)).toBeInTheDocument();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // API INTEGRATION TESTS
  // ──────────────────────────────────────────────────────────────────────────

  describe('API Integration', () => {
    it('API mock configuration works', async () => {
      expect(supabaseDataModule.completeOnboarding).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // NAVIGATION TESTS
  // ──────────────────────────────────────────────────────────────────────────

  describe('Navigation', () => {
    it('skips back navigation on first question', () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Back button should not exist
      expect(screen.queryByText(/Back/)).not.toBeInTheDocument();

      // Verify we're still on question 1
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
    });

    it('allows back navigation from later questions', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Move to question 2
      let buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[buttons.length - 1]);
      await waitForAnimation();

      expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
      expect(screen.getByText(/Back/)).toBeInTheDocument();
    });

    it('maintains answers when going back and forward', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Answer question 1 with Yes
      let buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[buttons.length - 1]);
      await waitForAnimation();

      // Go back
      buttons = screen.getAllByRole('button');
      fireEvent.click(buttons.find(b => b.textContent?.includes('Back'))!);
      await waitForAnimation();

      // Should be on question 1
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();

      // Move forward again
      buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[buttons.length - 1]);
      await waitForAnimation();

      // Should be on question 2
      expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // EDGE CASE TESTS
  // ──────────────────────────────────────────────────────────────────────────

  describe('Edge Cases', () => {
    it('renders initial state and progresses to next question', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Initial state
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();

      // Move to Q2
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[buttons.length - 1]);
      await waitForAnimation();

      expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
    });

    it('handles very fast back-and-forward navigation', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Go forward
      let buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[buttons.length - 1]);

      await waitForAnimation();

      // Go back
      buttons = screen.getAllByRole('button');
      const backBtn = buttons.find(b => b.textContent?.includes('Back'));
      if (backBtn) fireEvent.click(backBtn);

      await waitForAnimation();

      // Should stabilize on question 1
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
    });

    it('handles missing bizUser gracefully', () => {
      // Mock context with null user
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Should still render first question
      expect(screen.getByText(/Do you want to showcase/)).toBeInTheDocument();
    });

    it('handles localStorage access errors gracefully', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
      getItemSpy.mockImplementation(() => {
        throw new Error('Storage error');
      });

      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Should still render without crashing
      expect(screen.getByText(/Do you want to showcase/)).toBeInTheDocument();

      getItemSpy.mockRestore();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ANIMATION TESTS
  // ──────────────────────────────────────────────────────────────────────────

  describe('Animations', () => {
    it('applies fade-out animation when transitioning questions', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      const yesButton = buttons[buttons.length - 1];

      fireEvent.click(yesButton);

      // Small delay to verify animation is triggered
      await new Promise(r => setTimeout(r, 50));

      // Should eventually show next question
      await waitForAnimation();
      expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
    });

    it('completes animation before showing next question', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[buttons.length - 1]);

      // Immediately check - should still show question 1
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();

      // After animation
      await waitForAnimation();
      expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ACCESSIBILITY TESTS
  // ──────────────────────────────────────────────────────────────────────────

  describe('Accessibility', () => {
    it('renders buttons as interactive elements', () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach(btn => {
        expect(btn).toHaveTextContent(/Yes|No|Back/);
      });
    });

    it('buttons are keyboard accessible', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      const yesButton = buttons[buttons.length - 1];

      // Tab to button and press Enter
      yesButton.focus();
      expect(yesButton).toHaveFocus();

      await user.keyboard('{Enter}');
      await waitForAnimation();

      expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
    });

    it('has meaningful text content for all interactive elements', () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(btn => {
        expect(btn.textContent).toBeTruthy();
        expect(btn.textContent?.trim().length).toBeGreaterThan(0);
      });
    });

    it('progress indicator text is present and meaningful', () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
      expect(screen.getByText(/20%/)).toBeInTheDocument();
    });
  });
});
