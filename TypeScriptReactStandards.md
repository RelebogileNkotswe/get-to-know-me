# TypeScript/React Standards

This style guide is for TypeScript/React code developed internally at Singular, and is the default style for TypeScript/React code at Singular.

# TypeScript/React Style Guidelines

- Please not that most of the standards were developed with Singular Systems' Neo Libraries in mind so not all will apply across every typescript project.

## Formatting Guidelines

### File Organization

- **One class/component per file** - Each file should contain a single primary class or component
- **File naming conventions**:
  - Components/Views: PascalCase (e.g., `HeaderPanel.tsx`, `ManageDealersView.tsx`)
  - Models: PascalCase (e.g., `BankFile.ts`, `AppConfig.ts`)
  - Services: PascalCase (e.g., `AppService.ts`, `RouteService.ts`)
  - Utilities: PascalCase (e.g., `ClientUtils.ts`)

### Import Organization

Imports should be organized in the following order:
1. External React libraries
2. Neo framework imports
3. Third-party libraries
4. Local types and models
5. Local components
6. Local services
7. Local styles

**Example:**
```typescript
import React from 'react';
import { observer } from 'mobx-react';
import { Neo, NeoGrid } from '@singularsystems/neo-react';
import { Model, Validation } from '@singularsystems/neo-core';
import { CatalogueColumn } from '@singularsystems/neo-react-services';
import Dealer from '../../../Models/Dealers/Dealer';
import ManageDealersVM from '../ManageDealersVM';
import ClientModals from '../../Modals/ClientModals';
```

### Whitespace and Indentation

- **Indentation**: Use 4 spaces (configured in the .code-workspace file)
- **Line breaks**: Use single blank lines to separate logical sections
- **No trailing whitespace**
- **End files with a newline**

### Code Structure

- **JSX Formatting**: 
  - Self-closing tags for components without children: `<Component />`
  - Multi-line JSX should be wrapped in parentheses
  - Properly indent nested elements

**Example:**
```tsx
return (
    <div>
        {!isTerminalSelected ?
            <TerminalSearchComponent viewTerminal={viewTerminal} /> :
            <TerminalComponent
                viewModel={viewModel.terminalComponentVM}
                backToSearch={viewModel.backToSearch}
            />
        }
    </div>
)
```

### String Formatting

- **Use double quotes** for strings in JSX attributes
- **Omit parentheses** for string JSX attribute values
- **Template literals** preferred for string interpolation

### Comments

- **JSDoc comments** for public methods and classes
- **Inline comments** for complex logic explanation
- **TODO comments** should include context

## TypeScript Coding Guidelines

### TypeScript Configuration

The project uses strict TypeScript settings:
- `strict: true` - Enable all strict type checking options
- `noImplicitAny: true` - Raise error on expressions with implied 'any' type
- `noImplicitThis: true` - Raise error on 'this' with implied 'any' type
- `noImplicitReturns: true` - Report error when not all code paths return a value
- `strictNullChecks: true` - Enable strict null checks
- `forceConsistentCasingInFileNames: true` - Enforce consistent file name casing

### Type Annotations

- **Explicit types** for class properties
- **Type inference** acceptable for simple variable assignments
- **Nullable properties** - use `type | null` syntax.

**Example:**
```typescript
public bankFileId: number = 0;

@Attributes.Integer()
public genNo: number = 0;

@Rules.StringLength(100)
public header: string | null = null;
```

### Type Mapping

Neo requires type decorators on properties for most data types. This is required for deserialising (e.g. converting JSON strings to date instances), and for some UI components (e.g. should a number allow decimals or not).

Here are some examples (mapping from c# types):
- `int id` property - no annotation required.
- `string` - no annotation required.
- `int` - number with `@Attributes.Integer()` decorator.
- `decimal` - number with `@Attributes.Float()` decorator.
- `DateTime` - Date with `@Attributes.Date()` decorator
    - Use `@Attributes.Date(Misc.TimeZoneFormat.None)` for properties that are stored as `date` (without time) in the database.
- `Nested types` - Use `@Attributes.ChildObject(Type)` to specify the type.

### Classes and Interfaces

#### Class Definition

- **Default exports** for models and main components
- **Named exports** for utilities and services
- **PascalCase** for class names
- **Static typeName** property for models extending ModelBase

**Example:**
```typescript
export default class BankFile extends ModelBase {
    static typeName = "BankFile";

    constructor() {
        super();
        this.makeObservable();
    }
}
```

#### React Components

- **Class components** extending `React.Component` or `Views.ViewBase`
- **Observer decorator** from mobx-react for components using observables
- **Props interfaces** prefixed with 'I' (e.g., `IDealerComponentProps`)

**Example:**
```tsx
interface IDealerComponentProps {
    viewModel: ManageDealersVM;
}

@observer
export default class DealerComponent extends React.Component<IDealerComponentProps> {
    constructor(props: IDealerComponentProps) {
        super(props);
    }

    public render() {
        // Implementation
    }
}
```

#### View Components

- Extend `Views.ViewBase<TViewModel, TParams>`
- Define static params property
- Implement `viewParamsUpdated()` method

**Example:**
```tsx
class TerminalsParams {
    // Params definition
}

@observer
export default class TerminalsView extends Views.ViewBase<ManageTerminalsVM, TerminalsParams> {
    public static params = new TerminalsParams();

    constructor(props: unknown) {
        super("Terminals", ManageTerminalsVM, props);
    }

    protected viewParamsUpdated() { }

    public render() {
        // Implementation
    }
}
```

### Decorators

The codebase extensively uses decorators for:

- **Property validation**: `@Rules.StringLength()`, `@Rules.Required()`
- **Reactive components**: `@observer`

**Example:**
```typescript
export class AppConfig extends AppServices.ConfigModel {
    @Rules.StringLength(100)
    @Rules.Required()
    public apiPath: string = "";

    @Attributes.Integer()
    public genNo: number = 0;
}
```

### Null and Undefined Handling

- Use optional chaining `?.` for potentially undefined values
- Use nullish coalescing `??` for default values

**Example:**
```typescript
const authStatus = dealer?.lookup.dealerAuthStatus;
const name = dealer.dealerName ?? "Unknown";
```

### Module System

- **ES6 modules**: Use `import`/`export`
- **Module resolution**: Node-style (`moduleResolution: "node"`)
- **Absolute imports** for cross-module dependencies
- **Relative imports** for local files

### Dependency Injection

- Define types in dedicated `*Types.ts` files
- Bind services in `*Module.ts` files
- Use singleton scope for services: `.inSingletonScope()`

**Example:**
```typescript
const AppModule = new AppServices.Module("App", container => {
    container.bind(Types.App.Config).to(AppConfig).inSingletonScope();
    container.bind(Types.App.Services.AppLayout).to(AppLayout).inSingletonScope();
});
```

### Async/Await

- **Prefer async/await** over promise chains

**Example:**
```typescript
(async function init() {
    const config = await AppService.get(Types.Neo.Config.ConfigService).loadConfig();
    // Additional async operations
})();
```

### Access Modifiers

- **Public** for component methods and properties (can be explicit or implicit)
- **Private** for internal component state and helpers
- **Protected** for methods intended for override in subclasses

### Naming Conventions

- **Variables**: camelCase (e.g., `selectedDealer`, `isTerminalSelected`)
- **Functions/Methods**: camelCase (e.g., `saveDealer()`, `backToSearch()`)
- **Classes**: PascalCase (e.g., `BankFile`, `AppService`)
- **Constants**: camelCase or UPPER_SNAKE_CASE for true constants
- **Interfaces**: PascalCase with 'I' prefix (e.g., `IDealerComponentProps`)
- **Type aliases**: PascalCase
- **Enums**: PascalCase for enum name, PascalCase for members

### Variable Declarations

- **const** for immutable bindings (preferred)
- **let** for mutable variables
- **Never use var**

### Arrow Functions vs Regular Functions

- **Arrow functions** for callbacks and short inline functions
- **Regular functions** for component methods
- **Avoid arrow functions in JSX** when configured

### Loops

Use `for x of` style loops instead of `ForEach` callback style loops.

### Boolean Logic

- Use **explicit boolean checks** for clarity when appropriate
- **Truthiness checks** acceptable for null/undefined checking

**Example:**
```typescript
if (!isTerminalSelected) { }
if (dealer?.isInactive) { }
```

### Model Validation

- Extend `ModelBase` for domain models
- Override `addBusinessRules()` for custom validation
- Implement `toString()` for meaningful object representation

**Example:**
```typescript
protected static addBusinessRules(rules: Validation.Rules<BankFile>) {
    super.addBusinessRules(rules);
}

public toString(): string {
    if (this.isNew || !this.header) {
        return "New bank file";
    } else {
        return this.header;
    }
}
```

### Error Handling

- Avoid try-catch blocks in domain code.
- Do not use console.log.
- `TaskRunner` handles exceptions from api clients, and displays them for you.

### Calling the API

- All HTTP calls should use axios.
- All HTTP calls should be done in methods of an `ApiClient` class.
- Use `TaskRunner` to wrap calls to the api.
- Do not check for a 200 response when using axios or `TaskRunner`, non 200 responses throw an exception.
- Wrap api calls with `AxiosUtils.catchErrors` if custom error handling is required.

### React Best Practices

- **Avoid inline styles** - use CSS/SCSS classes
- **Inline styles** may be used for specific values like widths. 
- **Extract complex JSX** into separate components, or separate methods within the class.
- **Prefer functional composition** over inheritance where appropriate

### Service Access Pattern

- Access services via `AppService.get(Types....)` pattern.
- For services or viewmodels:
    - Store service references in private class properties for services or viewmodels.
    - Initialize services in constructor or component lifecycle methods
- For Domain models:
    - Do not store service references in class properties.
    - Access services in methods of the class.


### Type Safety

- **No explicit any** unless absolutely necessary (enforced by `noImplicitAny`)
- Use **generic types** for reusable components
- Define **proper return types** for functions
- Use **union types** for multiple possible types
- Use **type guards** for runtime type checking

### Code Comments and Documentation

- Document **public APIs** with JSDoc comments
- Add **inline comments** for complex business logic
- Keep comments **up-to-date** with code changes
