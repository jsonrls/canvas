# Screenshots Documentation

This directory contains screenshots and visual assets for the MyBoardPrep Collaborative Learning Suite documentation.

## Screenshot Guidelines

### Purpose

Screenshots are used to:
- Illustrate user interfaces
- Document features visually
- Guide users through workflows
- Show design implementations
- Support documentation content

### Screenshot Standards

#### Technical Specifications

- **Format**: PNG (lossless) or WebP (modern)
- **Resolution**: Minimum 1920x1080 (Full HD)
- **DPI**: 150-300 for print, 72 for web
- **File Size**: Under 2MB for web use
- **Color Profile**: sRGB

#### Content Guidelines

- Show relevant context
- Include current UI state
- Use realistic data
- Avoid sensitive information
- Show consistent branding

### Naming Convention

Use descriptive, consistent naming:

```
feature-action-state.png
authentication-login-form.png
collaboration-document-editing.png
room-creation-success.png
```

### Screenshot Categories

#### User Interface

- Login and registration screens
- Dashboard views
- Room interfaces
- Document editors
- Settings pages

#### Features

- Collaborative notes editing
- PDF annotation
- Whiteboard interface
- Case discussions
- Flashcard management
- AI assistant interactions

#### Workflows

- Step-by-step processes
- User journey flows
- Error states
- Success states
- Loading states

#### Responsive Design

- Desktop views
- Tablet views
- Mobile views
- Different screen sizes

## Taking Screenshots

### Browser Screenshots

#### Chrome DevTools

```bash
# Open DevTools
Cmd+Option+I (Mac)
Ctrl+Shift+I (Windows/Linux)

# Capture screenshot
Cmd+Shift+P (Mac)
Ctrl+Shift+P (Windows/Linux)
Type "screenshot"
```

#### Full Page Screenshots

Use browser extensions or tools:
- Full Page Screen Capture (Chrome)
- FireShot (Firefox)
- GoFullPage (Chrome)

### App Screenshots

#### macOS

```bash
# Capture entire screen
Cmd+Shift+3

# Capture selected area
Cmd+Shift+4

# Capture specific window
Cmd+Shift+4, then Space
```

#### Windows

```bash
# Capture entire screen
Win+PrintScreen

# Capture active window
Alt+PrintScreen

# Capture selected area
Win+Shift+S
```

## Editing Screenshots

### Recommended Tools

- **Figma**: For annotations and overlays
- **Sketch**: For Mac users
- **Adobe Photoshop**: For advanced editing
- **GIMP**: Free alternative
- **Preview**: Basic editing on Mac

### Editing Guidelines

- Crop to relevant content
- Add annotations when helpful
- Highlight important elements
- Maintain consistent style
- Use brand colors for annotations

### Privacy Considerations

- Remove personal information
- Blur sensitive data
- Hide API keys and tokens
- Anonymize user data
- Remove test account details

## Screenshot Organization

### Directory Structure

```
screenshots/
├── ui/
│   ├── authentication/
│   ├── dashboard/
│   ├── rooms/
│   └── settings/
├── features/
│   ├── collaboration/
│   ├── annotation/
│   ├── whiteboard/
│   └── ai-assistant/
├── workflows/
│   ├── onboarding/
│   ├── document-creation/
│   └── room-management/
└── responsive/
    ├── desktop/
    ├── tablet/
    └── mobile/
```

### File Management

- Use descriptive filenames
- Organize by feature/area
- Keep original and edited versions
- Delete outdated screenshots
- Maintain directory structure

## Using Screenshots in Documentation

### Markdown Syntax

```markdown
![Screenshot description](path/to/screenshot.png)

*Figure 1: Description of what the screenshot shows*
```

### Best Practices

- Place screenshots near relevant text
- Provide clear descriptions
- Use figure numbers for reference
- Include captions explaining context
- Reference screenshots in text

### Image Optimization

- Compress images for web
- Use appropriate formats
- Consider lazy loading
- Provide alt text for accessibility
- Use responsive images

## Screenshot Maintenance

### Regular Updates

- Update when UI changes
- Review for outdated images
- Remove unused screenshots
- Add new feature screenshots
- Maintain consistency

### Version Control

- Commit screenshots with code changes
- Use descriptive commit messages
- Track screenshot updates
- Document significant changes
- Use git LFS for large files

## Accessibility

### Alt Text

Provide descriptive alt text:

```markdown
![Collaborative editing interface showing multiple users](screenshots/collaboration-editing.png)
```

### High Contrast

- Ensure screenshots are readable
- Check color contrast
- Avoid low-quality images
- Test with screen readers
- Provide text alternatives

## Screenshot Templates

### UI Screenshots

Standard UI screenshot template:
- Full window view
- Show navigation
- Include relevant controls
- Display realistic data
- Show current state

### Feature Screenshots

Feature-specific template:
- Focus on feature area
- Show feature in use
- Include user interactions
- Display feedback states
- Show related elements

### Workflow Screenshots

Workflow template:
- Show step sequence
- Include progress indicators
- Display current step
- Show completion states
- Include error handling

## Current Screenshots

### Authentication
- [ ] Login form
- [ ] Registration form
- [ ] Password reset
- [ ] Email verification

### Core Features
- [ ] Document editor
- [ ] PDF annotation
- [ ] Whiteboard interface
- [ ] Chat interface
- [ ] User presence

### Rooms
- [ ] Room creation
- [ ] Room list
- [ ] Room settings
- [ ] Participant management

### AI Features
- [ ] AI assistant interface
- [ ] Quiz generation
- [ ] Content summarization
- [ ] Study recommendations

## Legal Considerations

### Copyright

- Ensure proper licensing
- Credit third-party assets
- Document image sources
- Respect copyright laws
- Use original screenshots

### User Privacy

- Obtain consent for user data
- Anonymize personal information
- Follow privacy policies
- Comply with GDPR/CCPA
- Document data usage

## Tools and Resources

### Screenshot Tools

- **Browser DevTools**: Built-in screenshot tools
- **Snagit**: Professional screenshot tool
- **CleanShot X**: Mac screenshot tool
- **ShareX**: Free Windows tool
- **Droplr**: Cloud-based screenshot tool

### Image Editing

- **Figma**: Design and annotation
- **Canva**: Online image editing
- **Photopea**: Free online Photoshop alternative
- **TinyPNG**: Image compression
- **Squoosh**: Image optimization

## Contributing

When adding screenshots:

1. Follow naming conventions
2. Use appropriate resolution
3. Edit for clarity
4. Remove sensitive information
5. Organize in correct directory
6. Update this README
7. Document in relevant files

## Quality Checklist

Before committing screenshots:

- [ ] Appropriate resolution
- [ ] Clear and readable
- [ ] No sensitive information
- [ ] Properly named
- [ ] Organized correctly
- [ ] Optimized for web
- [ ] Include alt text
- [ ] Documented in files

## Questions or Issues

For questions about screenshots:
- Check existing screenshots for patterns
- Consult with the design team
- Use recommended tools
- Follow established conventions
- Ensure privacy and compliance
