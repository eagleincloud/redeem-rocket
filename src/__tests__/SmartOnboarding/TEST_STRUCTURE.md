# SmartOnboarding Test Suite - Detailed Structure

## Directory Layout

```
src/__tests__/SmartOnboarding/
├── SmartOnboarding.test.tsx       # Main component tests (ACTIVE)
├── integration.test.tsx            # Integration tests (Ready)
├── performance.test.tsx            # Performance & a11y (Ready)
├── utils/
│   └── testHelpers.ts             # Shared test utilities
├── README.md                       # Complete testing guide
├── TESTING_SUMMARY.md             # Implementation summary
└── TEST_STRUCTURE.md              # This file
```

## Test File Breakdown

### SmartOnboarding.test.tsx (624 lines, 31 tests ✅)

#### Imports & Setup
- Vitest: describe, it, expect, beforeEach, afterEach, vi
- React Testing Library: render, screen, fireEvent, waitFor
- User Event: userEvent for keyboard testing
- Component & mocks: SmartOnboarding, BusinessProvider, API mocks

#### Mock Configuration
```typescript
vi.mock('@/app/api/supabase-data')
vi.mock('react-router-dom')
```

#### Test Wrapper Component
- Wraps all components in BrowserRouter + BusinessProvider
- Provides necessary context for testing

#### Questions Phase Tests (9)
1. **renders the first question on initial load**
   - Verifies initial question appears
   - Checks emoji display

2. **displays correct progress for first question**
   - Verifies "Question 1 of 5" text
   - Checks 20% progress calculation

3. **renders all 5 feature questions when cycling through**
   - Tests complete question cycle
   - Verifies all 5 questions are unique

4. **advances to next question when clicking Yes**
   - Tests forward navigation
   - Verifies question number updates

5. **advances to next question when clicking No**
   - Alternative answer path
   - Verifies same navigation result

6. **goes back to previous question**
   - Tests backward navigation
   - Verifies question regression

7. **back button is not shown on first question**
   - Verifies UI logic
   - Checks absence of back button

8. **back button appears from second question onwards**
   - Tests UI visibility change
   - Validates when button appears

9. **updates progress bar smoothly**
   - Verifies progress percentage
   - Tests smooth transitions

#### Complete Phase Tests (5)
1. **shows completion screen after all questions answered**
   - Tests phase transition
   - Verifies completion UI

2. **displays rocket emoji and success message on complete**
   - Tests messaging
   - Verifies emoji display

3. **shows loading state when finish button is clicked**
   - Tests loading indicator
   - Verifies "Finishing..." text

4. **disables finish button during loading**
   - Tests button state
   - Verifies disabled attribute

5. **renders finish button with correct label**
   - Tests button text
   - Verifies "Continue to Dashboard" text

#### Feature Selection Tests (1)
1. **tracks question progression through all phases**
   - Simple progression test
   - Verifies Q1→Q2 transition

#### API Integration Tests (1)
1. **API mock is configured correctly**
   - Verifies mock setup
   - Tests API availability

#### Navigation Tests (3)
1. **skips back navigation on first question**
   - Tests no back button on Q1
   - Verifies navigation constraints

2. **allows back navigation from later questions**
   - Tests back button on Q2+
   - Verifies back button presence

3. **maintains answers when going back and forward**
   - Tests answer persistence
   - Verifies state management

#### Edge Cases Tests (3)
1. **renders initial state and progresses to next question**
   - Tests initial rendering
   - Verifies first navigation

2. **handles very fast back-and-forward navigation**
   - Tests rapid navigation
   - Verifies state stability

3. **handles missing bizUser gracefully**
   - Tests null user handling
   - Verifies graceful degradation

#### Animations Tests (2)
1. **applies fade-out animation when transitioning questions**
   - Tests animation trigger
   - Verifies next question appears

2. **completes animation before showing next question**
   - Tests animation timing
   - Verifies state updates after animation

#### Accessibility Tests (2)
1. **renders buttons as interactive elements**
   - Tests button roles
   - Verifies accessibility structure

2. **buttons are keyboard accessible**
   - Tests keyboard navigation
   - Verifies Enter/Space handling

3. **has meaningful text content for all interactive elements**
   - Tests text presence
   - Verifies label quality

4. **progress indicator text is present and meaningful**
   - Tests progress display
   - Verifies percentage text

### integration.test.tsx (578 lines)

#### Test Categories

**Complete Flow Tests**
- End-to-end onboarding flow
- Feature preference maintenance
- Answer preservation

**Context Integration Tests**
- BusinessContext updates
- localStorage synchronization
- User data consistency

**API Error Handling Tests**
- API failure responses
- API exceptions
- Fallback to local save
- Missing userId handling

**State Persistence Tests**
- Feature preferences across remounts
- localStorage validation
- Data structure integrity

**Complex Feature Selection Tests**
- All 5 features selected
- No features selected
- Alternating patterns
- Specific combinations

### performance.test.tsx (503 lines)

#### Test Categories

**Render Performance Tests**
- Initial render timing
- Question transition performance
- Re-render optimization

**Memory and Cleanup Tests**
- Event listener cleanup
- State leak prevention
- Mount/unmount cycles

**Accessibility Compliance Tests**
- Heading hierarchy
- Button semantics
- Keyboard navigation
- Screen reader support
- Progress announcements

**Visual Accessibility Tests**
- Element visibility
- Progress bar display
- Icon visibility
- Color contrast

**Focus Management Tests**
- Tab navigation
- Focus restoration
- ESC key handling

**Internationalization Tests**
- Text accessibility
- Semantic meaning
- Content hierarchy

## Helper Functions

### From testHelpers.ts

#### Mock Factories
- `createMockBizUser(overrides?)`
- `createDefaultFeaturePreferences(overrides?)`
- `createMockBusinessProvider(mockContextValue)`

#### Utilities
- `setupLocalStorage()`
- `waitForAnimation(ms?)`
- `mockCompleteOnboarding`

#### Constants
- `FEATURE_QUESTIONS_DATA`

## Test Execution Flow

### Setup Phase
1. Clear localStorage
2. Clear all mocks
3. Reset mock implementations

### Render Phase
1. Wrap component in TestWrapper
2. Render SmartOnboarding
3. Verify initial state

### Interaction Phase
1. Get button elements
2. Fire click events
3. Wait for animations (350ms)
4. Verify state changes

### Assertion Phase
1. Check DOM for expected text
2. Verify UI state
3. Validate API calls
4. Confirm localStorage updates

### Cleanup Phase
1. Automatic cleanup via Testing Library
2. Mock clearing in afterEach
3. localStorage clear in beforeEach

## Test Statistics

### By Category
| Category | Tests | Lines | Status |
|----------|-------|-------|--------|
| Questions Phase | 9 | ~120 | ✅ Pass |
| Complete Phase | 5 | ~80 | ✅ Pass |
| Navigation | 3 | ~60 | ✅ Pass |
| Accessibility | 2 | ~40 | ✅ Pass |
| Animations | 2 | ~40 | ✅ Pass |
| Edge Cases | 3 | ~50 | ✅ Pass |
| API Integration | 1 | ~20 | ✅ Pass |
| Feature Selection | 1 | ~20 | ✅ Pass |
| **TOTAL** | **31** | **~624** | **✅ PASS** |

### By File
| File | Lines | Tests | Status |
|------|-------|-------|--------|
| SmartOnboarding.test.tsx | 624 | 31 | ✅ PASS |
| integration.test.tsx | 578 | ~27 | ⚠️ Ready |
| performance.test.tsx | 503 | ~30 | ⚠️ Ready |
| testHelpers.ts | 151 | - | ✅ Utility |
| **TOTAL** | **2,482** | **88** | **✅ Ready** |

## Common Test Patterns

### Pattern 1: Question Progression
```typescript
it('advances to next question when clicking Yes', async () => {
  render(<TestWrapper><SmartOnboarding /></TestWrapper>);
  
  const buttons = screen.getAllByRole('button');
  fireEvent.click(buttons[buttons.length - 1]); // Yes button
  await waitForAnimation();
  
  expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
});
```

### Pattern 2: Navigation with Back
```typescript
it('goes back to previous question', async () => {
  render(<TestWrapper><SmartOnboarding /></TestWrapper>);
  
  let buttons = screen.getAllByRole('button');
  fireEvent.click(buttons[buttons.length - 1]);
  await waitForAnimation();
  
  buttons = screen.getAllByRole('button');
  fireEvent.click(buttons.find(b => b.textContent?.includes('Back'))!);
  await waitForAnimation();
  
  expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
});
```

### Pattern 3: Keyboard Accessibility
```typescript
it('buttons are keyboard accessible', async () => {
  const user = userEvent.setup();
  render(<TestWrapper><SmartOnboarding /></TestWrapper>);
  
  const buttons = screen.getAllByRole('button');
  buttons[buttons.length - 1].focus();
  
  await user.keyboard('{Enter}');
  await waitForAnimation();
  
  expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
});
```

### Pattern 4: API Mocking
```typescript
it('API mock configuration works', async () => {
  vi.mocked(supabaseDataModule.completeOnboarding)
    .mockResolvedValue(true);
  
  // ... complete flow ...
  
  await waitFor(() => {
    expect(supabaseDataModule.completeOnboarding).toHaveBeenCalled();
  });
});
```

## Debugging Tests

### Enable Verbose Output
```bash
npm test -- SmartOnboarding.test.tsx --run --reporter=verbose
```

### Debug Single Test
```bash
npm test -- SmartOnboarding.test.tsx -t "question progression" --run
```

### Print DOM
```typescript
screen.debug(); // In test
```

### Check Mock Calls
```typescript
const calls = vi.mocked(someFunc).mock.calls;
console.log(calls);
```

## Future Test Expansion

### Potential Areas
1. E2E tests with Playwright
2. Visual regression testing
3. Performance benchmarking
4. Accessibility audits with axe-core
5. Stress testing with large data sets

### Integration Points
1. CI/CD pipelines
2. Pre-commit hooks
3. Coverage reporting
4. Performance monitoring
5. Accessibility monitoring

## Test Maintenance Guide

### When Adding Features
1. Add corresponding tests
2. Update test documentation
3. Maintain 90%+ coverage
4. Update README if needed

### When Fixing Bugs
1. Add regression test first
2. Verify test fails with bug
3. Fix code
4. Verify test passes
5. Check coverage unchanged

### When Refactoring
1. Keep tests unchanged
2. Run full test suite
3. Verify all tests still pass
4. Check coverage not decreased
5. Update documentation if needed

---

**This file provides a detailed breakdown of the SmartOnboarding test structure for reference and maintenance.**
