# Visual Enhancements - Sistema Judiciário

## Implemented Features

### 1. Multiple High-Contrast Themes

Added 5 professional, accessible themes optimized for visual impairment:

1. **Padrão Claro** (Default Light)
   - Background: White (255, 255, 255)
   - Text: Black (0, 0, 0)
   - Accent: Blue (0, 120, 215)
   - Use case: Standard lighting conditions

2. **Alto Contraste Escuro** (High Contrast Dark)
   - Background: Black (0, 0, 0)
   - Text: Yellow (255, 255, 0)
   - Accent: Cyan (0, 255, 255)
   - Use case: Low light environments, reduced eye strain

3. **Ciano Suave** (Soft Cyan)
   - Background: Dark Cyan (0, 60, 80)
   - Text: Bright Cyan (150, 255, 255)
   - Accent: Yellow (255, 255, 100)
   - Use case: Cool color preference, comfortable for extended use

4. **Verde Conforto** (Comfort Green)
   - Background: Dark Green (20, 60, 40)
   - Text: Bright Green (150, 255, 150)
   - Accent: Light Yellow (255, 255, 180)
   - Use case: Reduced eye fatigue, nature-inspired

5. **Azul Noturno** (Night Blue)
   - Background: Dark Blue (20, 30, 50)
   - Text: Light Blue (180, 200, 255)
   - Accent: Bright Cyan (100, 255, 255)
   - Use case: Night work, blue light reduction

### 2. Dynamic Font Sizing

- **A- Button**: Decrease font size (minimum 50%)
- **A Button**: Reset to default size (100%)
- **A+ Button**: Increase font size (maximum 300%)

Font scales apply to:

- Table content
- Form labels
- Input fields
- Buttons
- Headers

### 3. Improved Typography

- Changed from Arial to **Verdana** font family
- Better readability for visual impairment
- Clear distinction between similar characters (0/O, 1/I/l)

### 4. Enhanced UI Elements

#### Styled Components:

- Rounded buttons with 5px border radius
- Bold text for better visibility
- 2px borders with accent colors
- Hover effects with color inversion
- Grid lines in tables with accent color

#### Control Bar:

- Theme selector dropdown at top
- Font size controls (A-, A, A+)
- Always visible and accessible

### 5. Theme System Architecture

```python
class Theme:
    - name: Theme identifier
    - bg: Background color
    - text: Text color
    - button_bg: Button background
    - button_text: Button text color
    - accent: Accent/highlight color
    - table_alt: Alternate row color

class AccessibleConfig:
    - THEMES: Dictionary of all available themes
    - _font_scale: Current font multiplier
    - get_font(): Dynamic font generation
    - set_theme(): Switch active theme
    - set_font_scale(): Adjust font size
    - apply_theme(): Apply to widgets with CSS stylesheets
```

### 6. Refresh Mechanism

All widget classes now include `refresh_theme()` method:

- ClientListWidget
- CaseListWidget
- NoticeListWidget

Updates are propagated from main window to all tabs automatically.

## User Benefits

1. **Accessibility**: High contrast themes for low vision users
2. **Customization**: 5 theme options to match preference/environment
3. **Flexibility**: Font scaling for different screen sizes/distances
4. **Comfort**: Reduced eye strain with optimized color combinations
5. **Professionalism**: Modern, polished interface

## Technical Implementation

- PySide6 QPalette for system-level theming
- CSS-like stylesheets for enhanced styling
- Dynamic font generation with QFont
- Reactive UI updates without restart
- Stateful theme/font preferences (can be persisted)

## Future Enhancements

- [ ] Save theme preference to database
- [ ] Save font scale preference
- [ ] Add keyboard shortcuts for theme/font changes
- [ ] Add custom theme creator
- [ ] Export/import theme configurations
- [ ] Add color blindness modes (Protanopia, Deuteranopia, Tritanopia)
