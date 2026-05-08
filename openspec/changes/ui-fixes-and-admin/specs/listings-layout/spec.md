## MODIFIED Requirements

### Requirement: Listings page uses full viewport width

The listings page container SHALL span the full available viewport width. The layout MUST NOT impose a fixed maximum width constraint (such as max-w-[1440px]).

#### Scenario: Wide screen display
- **WHEN** the listings page is displayed on a screen wider than 1440px
- **THEN** the content area SHALL expand to fill the full viewport width without horizontal whitespace gaps on either side

#### Scenario: Standard screen display
- **WHEN** the listings page is displayed on a screen 1440px or narrower
- **THEN** the content area SHALL fill the available width as before
