# Storybook State

An extension for [Storybook](https://storybook.js.org/) that manages the state of a stateless
component. This makes it easier to write stories for stateless components.

## Getting Started

### Add @versafleet/storybook

```sh
npm install --save-dev @versafleet/storybook-state
```

Register the extension in `addons.js`.

```javascript
import '@versafleet/storybook-state/register';
```

### Create a Story

Use the extension to create a story.

```javascript
import React from 'react';
import { storiesOf } from '@storybook/react';
import { withState } from '@versafleet/storybook-state';

storiesOf('Checkbox', module)
.addDecorator(withState({ checked: false }))
.add('with check', ({ store }) => (
  <Checkbox
    checked={store.state.checked}
    label="Test Checkbox"
    onChange={(checked) => store.set({ checked: !checked })}
  />
));
```

## Store API

### `store.state`

Object that contains the current state.

### `store.set(state)`

Set the given state keys. The `state` parameter is an object with the keys and values to set.

This only sets/overwrites the specific keys provided.

### `store.reset()`

Reset the store to the initial state.

## Panel

This project includes a storybook panel that displays the current state and allows
for resetting the state.

![Panel Screenshot](panel-screenshot.png?raw=true&v=2 "Panel")
