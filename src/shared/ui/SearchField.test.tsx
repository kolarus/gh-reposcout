import { fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, TextInput } from 'react-native';

import { ThemeProvider } from '@/shared/theme';

import { SearchField } from './SearchField';

// The Jest preset's TextInput is a mock class whose instance methods, such as
// focus(), are shared mocks on its prototype.
const mockedFocus = () => {
  const prototype: unknown = Reflect.get(TextInput, 'prototype');
  const focus =
    typeof prototype === 'object' && prototype !== null && 'focus' in prototype
      ? prototype.focus
      : undefined;
  if (!jest.isMockFunction(focus)) {
    throw new Error("The Jest preset's TextInput mock has no focus().");
  }
  return focus;
};

const renderField = (loading: boolean, onChangeText = jest.fn()) => (
  <ThemeProvider>
    <SearchField
      value="react"
      onChangeText={onChangeText}
      onSubmit={jest.fn()}
      placeholder="Search repositories"
      clearLabel="Clear search"
      loading={loading}
      loadingLabel="Loading results"
    />
  </ThemeProvider>
);

describe('SearchField', () => {
  it('shows a labelled spinner while loading, and announces it once', async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => undefined);
    const { rerender } = await render(renderField(false));
    expect(screen.queryByLabelText('Loading results')).not.toBeOnTheScreen();

    await rerender(renderField(true));
    expect(screen.getByLabelText('Loading results')).toBeOnTheScreen();
    await rerender(renderField(true));

    await rerender(renderField(false));
    expect(screen.queryByLabelText('Loading results')).not.toBeOnTheScreen();
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('Loading results');
    announce.mockRestore();
  });

  it('clears the text and focuses the field for the next query', async () => {
    const onChangeText = jest.fn();
    const focus = mockedFocus();
    await render(renderField(false, onChangeText));

    await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));

    expect(onChangeText).toHaveBeenCalledWith('');
    expect(focus).toHaveBeenCalledTimes(1);
  });
});
