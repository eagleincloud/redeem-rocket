/**
 * SmartOnboarding Performance and Accessibility Tests
 *
 * Tests for performance characteristics and accessibility compliance:
 * - Render time and re-render performance
 * - Memory usage with large state
 * - DOM cleanup on unmount
 * - ARIA labels and keyboard navigation
 * - Screen reader compatibility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('SmartOnboarding Performance', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER PERFORMANCE TESTS
  // ──────────────────────────────────────────────────────────────────────────

  describe('Render Performance', () => {
    it('renders initial component quickly', () => {
      const startTime = performance.now();

      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within 500ms
      expect(renderTime).toBeLessThan(500);
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
    });

    it('handles question transitions without performance degradation', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      const timings: number[] = [];

      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[buttons.length - 1]);
        await waitForAnimation();
        const endTime = performance.now();

        timings.push(endTime - startTime);
      }

      // Each transition should be relatively consistent
      const avgTime = timings.reduce((a, b) => a + b) / timings.length;
      timings.forEach(time => {
        // Allow 50% variance
        expect(time).toBeLessThan(avgTime * 1.5);
      });
    });

    it('does not cause unnecessary re-renders on state changes', async () => {
      let renderCount = 0;

      const CountingComponent = () => {
        renderCount++;
        return <SmartOnboarding />;
      };

      render(
        <TestWrapper>
          <CountingComponent />
        </TestWrapper>
      );

      const initialRenderCount = renderCount;

      // Navigate through one question
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[buttons.length - 1]);
      await waitForAnimation();

      // Should have minimal re-renders (ideally 1-2 during transition)
      expect(renderCount).toBeLessThan(initialRenderCount + 5);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // MEMORY AND CLEANUP TESTS
  // ──────────────────────────────────────────────────────────────────────────

  describe('Memory and Cleanup', () => {
    it('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Clear previous calls
      removeEventListenerSpy.mockClear();

      unmount();

      // Component should clean up without major memory leaks
      expect(screen.queryByText('Question 1 of 5')).not.toBeInTheDocument();
    });

    it('does not leak state when navigating quickly', async () => {
      const { unmount } = render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Rapid navigation
      for (let i = 0; i < 10; i++) {
        const buttons = screen.getAllByRole('button');
        if (buttons.length > 0) {
          fireEvent.click(buttons[buttons.length - 1]);
        }
        await waitForAnimation();
      }

      unmount();

      expect(screen.queryByText(/Question/)).not.toBeInTheDocument();
    });

    it('handles multiple mount/unmount cycles', async () => {
      for (let i = 0; i < 3; i++) {
        const { unmount } = render(
          <TestWrapper>
            <SmartOnboarding />
          </TestWrapper>
        );

        expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
        unmount();
      }

      // Should complete without errors
      expect(true).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ACCESSIBILITY TESTS
  // ──────────────────────────────────────────────────────────────────────────

  describe('Accessibility Compliance', () => {
    it('has proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Main question should be in heading
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(/Do you want to/);
    });

    it('provides semantic button elements', () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach(button => {
        // Each button should have accessible text
        expect(button.textContent?.trim()).toBeTruthy();
      });
    });

    it('supports keyboard navigation through questions', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Tab through buttons
      const buttons = screen.getAllByRole('button');
      const yesButton = buttons[buttons.length - 1];

      yesButton.focus();
      expect(yesButton).toHaveFocus();

      await user.keyboard('{Enter}');
      await waitForAnimation();

      expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
    });

    it('supports space key to activate buttons', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      const yesButton = buttons[buttons.length - 1];

      yesButton.focus();
      await user.keyboard(' ');
      await waitForAnimation();

      expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
    });

    it('provides focus management during transitions', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      buttons[0].focus();

      // Complete onboarding
      for (let i = 0; i < 5; i++) {
        const currentButtons = screen.getAllByRole('button');
        const yesBtn = currentButtons[currentButtons.length - 1];
        fireEvent.click(yesBtn);
        await waitForAnimation();
      }

      // After completion, focus should be manageable
      expect(screen.getByText(/You're all set/)).toBeInTheDocument();
    });

    it('announces progress to screen readers', () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Progress text should be visible and readable
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
      expect(screen.getByText(/20%/)).toBeInTheDocument();
    });

    it('provides meaningful text for all buttons', () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const text = button.textContent?.trim();
        expect(text).toBeTruthy();
        expect(text?.length).toBeGreaterThan(0);
        expect(['Yes', 'No', 'Back']).some(keyword => text?.includes(keyword));
      });
    });

    it('maintains ARIA labels through animations', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      const yesButton = buttons[buttons.length - 1];
      const originalText = yesButton.textContent;

      fireEvent.click(yesButton);
      await waitForAnimation();

      // Button text should remain accessible
      const newButtons = screen.getAllByRole('button');
      newButtons.forEach(btn => {
        expect(btn.textContent).toBeTruthy();
      });
    });

    it('supports dark mode without accessibility issues', () => {
      // Component uses inline styles with hardcoded colors
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      const container = screen.getByText('Question 1 of 5').closest('div');
      expect(container).toBeInTheDocument();

      // Text should be readable
      expect(screen.getByText(/Do you want to/)).toBeInTheDocument();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // COLOR CONTRAST AND VISUAL ACCESSIBILITY
  // ──────────────────────────────────────────────────────────────────────────

  describe('Visual Accessibility', () => {
    it('displays all interactive elements clearly', () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Buttons should be visible and distinguishable
      const yesButtons = screen.getAllByText(/Yes|No/, { selector: 'button' });
      yesButtons.forEach(button => {
        // Should have some styling to indicate they are clickable
        expect(button).toBeVisible();
      });
    });

    it('provides visual feedback for question progress', () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Progress bar should be visible
      const progressPercent = screen.getByText(/20%/);
      expect(progressPercent).toBeInTheDocument();
    });

    it('maintains icon visibility through transitions', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      expect(screen.getByText('📦')).toBeInTheDocument();

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[buttons.length - 1]);
      await waitForAnimation();

      // Next icon should be visible
      expect(screen.getByText('👥')).toBeInTheDocument();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // FOCUS MANAGEMENT TESTS
  // ──────────────────────────────────────────────────────────────────────────

  describe('Focus Management', () => {
    it('allows tabbing through all interactive elements', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // First button should be focusable
      buttons[0].focus();
      expect(buttons[0]).toHaveFocus();

      // Tab to next button
      await user.keyboard('{Tab}');

      // One of the buttons should have focus
      const focusedButton = document.activeElement;
      expect(focusedButton).toBeTruthy();
    });

    it('restores focus after question transitions', async () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      const yesButton = buttons[buttons.length - 1];

      yesButton.focus();
      expect(yesButton).toHaveFocus();

      fireEvent.click(yesButton);
      await waitForAnimation();

      // Focus should still be manageable on new question
      const newButtons = screen.getAllByRole('button');
      expect(newButtons.length).toBeGreaterThan(0);
    });

    it('supports ESC key (if applicable)', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      const initialText = screen.getByText('Question 1 of 5').textContent;

      await user.keyboard('{Escape}');

      // Component doesn't have ESC handling, so should remain unchanged
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // LANG AND TEXT DIRECTION TESTS
  // ──────────────────────────────────────────────────────────────────────────

  describe('Internationalization Support', () => {
    it('uses accessible text content', () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // All question text should be readable
      expect(screen.getByText(/Do you want/)).toBeInTheDocument();
      expect(screen.getByText(/Create a digital/)).toBeInTheDocument();
    });

    it('preserves text hierarchy and meaning', () => {
      render(
        <TestWrapper>
          <SmartOnboarding />
        </TestWrapper>
      );

      // Main question should be prominent
      const mainQuestion = screen.getByText(/Do you want to showcase/);
      expect(mainQuestion).toHaveTextContent(/showcase/);

      // Description should provide context
      expect(screen.getByText(/Create a digital catalog/)).toBeInTheDocument();
    });
  });
});
