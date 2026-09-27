import {
  isHiddenFromAccessibility,
  screen,
  type RenderResult,
} from '@testing-library/react-native';

type HostElement = RenderResult['container'];
type HostNode = HostElement['children'][number];

const prop = (element: HostElement, name: string): unknown =>
  element.props[name];

const textOf = (node: HostNode): string =>
  typeof node === 'string' ? node : node.children.map(textOf).join('');

// Pressable and the Touchables attach React Native's press handling to their
// host view, which includes `onClick`; pressable Text keeps its `onPress`.
// Text inputs are named by their label or placeholder, so they're left out.
const isPressable = (element: HostElement): boolean =>
  element.type !== 'TextInput' &&
  (typeof prop(element, 'onClick') === 'function' ||
    typeof prop(element, 'onPress') === 'function');

const roleOf = (element: HostElement): unknown =>
  prop(element, 'accessibilityRole') ?? prop(element, 'role');

const nameOf = (element: HostElement): string => {
  const label =
    prop(element, 'accessibilityLabel') ?? prop(element, 'aria-label');
  return typeof label === 'string' ? label : textOf(element);
};

const summarize = (element: HostElement): string =>
  JSON.stringify({
    type: element.type,
    role: roleOf(element),
    name: nameOf(element),
    testID: prop(element, 'testID'),
  });

/**
 * The accessibility floor (ADR-0013): every pressable a screen reader can
 * reach has a role and a non-empty name (its label, or its text). Call it in
 * a screen test once the state under test is rendered.
 */
export function expectAccessiblePressables(): void {
  const pressables = screen.container
    .queryAll(isPressable)
    .filter(element => !isHiddenFromAccessibility(element));
  // Guards the check itself: finding nothing means the detection broke.
  expect(pressables.length).toBeGreaterThan(0);

  const failing = pressables
    .filter(element => {
      const role = roleOf(element);
      return (
        typeof role !== 'string' ||
        role === 'none' ||
        nameOf(element).trim() === ''
      );
    })
    .map(summarize);
  expect(failing).toEqual([]);
}
