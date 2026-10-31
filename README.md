## Setup

```bash
npm install
npm test
npm run build
npm run demo
```

## Project layout

- `src/models.ts` contains the main billing types and status values.
- `src/services/` contains the invoice, payment, and receipt operations.
- `src/utils/` contains shared errors and money helpers.
- `tests/` contains unit tests for the main business rules.

Money values are handled in cents during calculations to reduce floating-point rounding issues.

