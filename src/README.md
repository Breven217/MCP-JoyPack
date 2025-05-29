# MCP-JoyPack Frontend

This directory contains the frontend code for the MCP-JoyPack application, a tool for managing and configuring Model Context Protocol (MCP) servers.

## Project Structure

The project follows a modular architecture with clear separation of concerns:

```
src/
├── components/        # React components
├── hooks/             # Custom React hooks
├── reducers/          # State management reducers
├── setups/            # Server setup logic
├── styles/            # CSS styles and modules
│   ├── tokens.css     # Design tokens
│   └── *.module.css   # CSS modules
├── utils/             # Utility functions
│   ├── eventBus.ts    # Event system
│   ├── errorTypes.ts  # Error handling
│   └── installUtils.ts # Installation utilities
└── types.tsx          # TypeScript type definitions
```

## Key Features

### Event System

The application uses a centralized event bus system for tracking installation progress and other events:

```typescript
// Emitting events
eventBus.updateInstallationProgress({
  server: serverName,
  step: 'Repository Clone',
  status: 'in-progress',
  message: 'Cloning repository...',
});

// Subscribing to events
const unsubscribe = eventBus.on(EventTypes.INSTALLATION_PROGRESS, handleProgress);
```

### Installation Progress Tracking

The `InstallationProgress` component displays real-time progress during server setup:

- Shows status of each installation step
- Provides visual feedback with icons and colors
- Automatically updates as steps complete

### State Management

The application uses React's built-in state management with hooks and reducers:

- `useReducer` for complex state logic
- Custom hooks for reusable business logic
- CSS modules for style encapsulation

## Development Guidelines

### Adding New Components

1. Create a new file in the `components/` directory
2. Use TypeScript for type safety
3. Consider using CSS modules for styling
4. Use React.memo for performance optimization

### Error Handling

Use the `createAppError` utility for consistent error handling:

```typescript
try {
  // Code that might throw
} catch (error: unknown) {
  const appError = createAppError(error, 'ERROR_CODE');
  // Handle the error
}
```

### Installation Steps

To add a new installation step:

1. Create a function in the appropriate setup file
2. Use the `executeInstallStep` utility for consistent progress tracking
3. Add proper error handling

### Styling

The project uses a design token system for consistent styling:

- Use CSS variables from `tokens.css` for colors, spacing, etc.
- Use CSS modules for component-specific styles
- Follow the BEM naming convention for CSS classes

## Performance Considerations

- Use React.memo for pure components
- Use useCallback for event handlers
- Use useMemo for computed values
- Avoid unnecessary re-renders
