# $GRID Testing Guide

## Test Status

| Program | Tests | Coverage |
|---------|-------|----------|
| grid-fee-sweep | 🟡 Scaffold | 0% (needs implementation) |
| grid-transfer-hook | 🟡 Exists | Unknown |

## Running Tests

```bash
cd systems/token

# Install dependencies
npm install

# Build programs
anchor build

# Run all tests
anchor test

# Run specific test file
anchor test --skip-local-validator tests/grid-fee-sweep.ts
```

## Test Requirements

### Minimum Coverage Before Mainnet
- [ ] All instructions tested
- [ ] Error conditions tested
- [ ] Edge cases (overflow, underflow)
- [ ] Integration with Token-2022
- [ ] Permissionless access verified

## Adding New Tests

1. Create file in `tests/` directory
2. Import program types from `target/types/`
3. Use Anchor testing framework
4. Run with `anchor test`

## CI/CD Integration

Add to GitHub Actions:
```yaml
- name: Run Anchor Tests
  run: |
    cd systems/token
    anchor test
```
