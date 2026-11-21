# Score interaction maintenance

For touch or pointer score placement, derive the target from the current
press. Never rely on a preceding hover event. This applies to notes,
accidentals, dynamics, wedges and barlines. Reuse the same coordinates for
preview and committed placement, including both endpoints of a wedge.

Keep barline click targets stable during pointer sequences. Decorative
previews must not intercept input. Preserve existing limits on bars and
systems. Use `shared/hub-input.js` for shared input behavior and
`shared/shared-notation-config.js` for notation configuration.

Run relevant interaction regressions and `pnpm test:desktop-layout` after
changes. Browser simulation does not establish physical-device coverage.
